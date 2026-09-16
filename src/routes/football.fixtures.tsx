import { useQuery } from "@tanstack/react-query";
import { useCrests } from "@/lib/footballCrests";
import { argmaxSide, haGap } from "@/lib/footballTeams";
import { SECOND_LAYER, recommend } from "@/lib/footballSecondLayer";
import { teamZh } from "@/lib/teamZh";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/tx/AppShell";
import { FootballCrest } from "@/components/tx/FootballCrest";
import { Card, Disclaimer, PageHead, Pill, Stat, StatGrid } from "@/components/tx/ui";
import { TxBar } from "@/components/tx/viz";

export const Route = createFileRoute("/football/fixtures")({
  head: () => ({
    meta: [
      { title: "足球賽前預測 · 凍結機率與版本指紋 · 天喜 TIANXI" },
      {
        name: "description",
        content:
          "天喜足球逐場賽前凍結預測：主客和機率、預期入球、每場一個最可能波膽（附四球以上合計機率）、大細與兩隊入球，附三軌引擎口徑同市場去水對照，賠率零權重。",
      },
      { property: "og:title", content: "足球賽前預測 · 天喜 TIANXI" },
      { property: "og:description", content: "逐場機率賽前凍結，附版本指紋，賽後全部公開對帳。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FootballFixturesPage,
});

type Match = {
  match_key: string;
  div: string;
  league_zh: string;
  home: string;
  away: string;
  kickoff_utc: string;
  time_uk: string;
  track: string;
  status: string;
  locked: boolean;
  p: [number, number, number];
  p_dc?: [number, number, number];
  p_elo?: [number, number, number];
  lambda: [number, number];
  over25: number;
  btts: number;
  top_score: { score: string; p: number };
  scores?: { score: string; p: number; res: "home" | "draw" | "away" }[];
  p_s5?: [number, number, number] | null;
  p_lgb?: [number, number, number] | null;
  s5_warm?: boolean;
  cs?: {
    top8: { score: string; p: number; res: "home" | "draw" | "away" }[];
    cond: Partial<Record<"home" | "draw" | "away", { score: string; p: number; p_cond: number }>>;
    exp: [number, number];
    tails: { win_by_3plus: number; home_4plus: number; away_clean_sheet: number };
  } | null;
  elo_diff: number;
  market: [number, number, number] | null;
  edge: [number, number, number] | null;
  warm: { home: number; away: number };
};

type Payload = {
  meta: {
    generated_at: string;
    engine: string;
    fingerprint: string;
    history_matches: number;
    history_last_date: string;
    fixtures_count: number;
    fixtures_stale: boolean;
    weights: { dc: number; elo: number };
    lock_minutes: number;
    status_note: string;
    s5?: {
      ready: boolean;
      reason: string | null;
      fingerprint: string | null;
      trained_at: string | null;
      alpha: { lgb: number; dc: number; elo: number } | null;
      gate: { passed: boolean; checks: Record<string, boolean>; best_single_track_rps: number } | null;
      backtest: { n: number; rps: number; logloss: number; acc: number; ece: number } | null;
      green_matches: number;
    } | null;
  };
  matches: Match[];
};

const p1 = (v: number) => `${(v * 100).toFixed(1)}%`;

const SIDE_ZH: Record<"home" | "draw" | "away", string> = { home: "主勝", draw: "和局", away: "客勝" };

function hk(iso: string) {
  const t = Date.parse(iso.endsWith("Z") ? iso : `${iso.replace("+00:00", "")}Z`);
  if (Number.isNaN(t)) return "—";
  const d = new Date(t + 8 * 3600 * 1000);
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(
    d.getHours(),
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function kickoffMs(iso: string) {
  const t = Date.parse(iso.endsWith("Z") ? iso : `${iso.replace("+00:00", "")}Z`);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * 比分矩陣以球隊實力為主：先由 λ 派生 0-0 至 8-8 格，
 * 再按三軌集成（Elo 實力 + 入球模型）嘅主／和／客機率，逐個賽果分區重新加權，
 * 令矩陣嘅主／和／客邊際等於引擎實力判斷，然後才揀最可能一格。
 */
function scoreTop(lambda: [number, number], p: [number, number, number]) {
  const RES: ("home" | "draw" | "away")[] = ["home", "draw", "away"];
  const MAX = 8;
  const pois = (lam: number, k: number) => {
    let f = 1;
    for (let i = 2; i <= k; i += 1) f *= i;
    return (Math.exp(-lam) * lam ** k) / f;
  };
  const hp = Array.from({ length: MAX + 1 }, (_, k) => pois(lambda[0], k));
  const ap = Array.from({ length: MAX + 1 }, (_, k) => pois(lambda[1], k));
  const resOf = (a: number, b: number) => (a > b ? 0 : a === b ? 1 : 2);

  // 原始（純入球平均）邊際
  const raw: [number, number, number] = [0, 0, 0];
  for (let a = 0; a <= MAX; a += 1) {
    for (let b = 0; b <= MAX; b += 1) raw[resOf(a, b)] += (hp[a] ?? 0) * (ap[b] ?? 0);
  }
  // 實力權重：把每個賽果分區縮放到集成機率
  const w = raw.map((r, i) => (r > 1e-9 ? (p[i] ?? r) / r : 1)) as [number, number, number];

  let bigP = 0;
  let total = 0;
  const cells: { a: number; b: number; pr: number }[] = [];
  for (let a = 0; a <= MAX; a += 1) {
    for (let b = 0; b <= MAX; b += 1) {
      const pr = (hp[a] ?? 0) * (ap[b] ?? 0) * (w[resOf(a, b)] ?? 1);
      total += pr;
      cells.push({ a, b, pr });
    }
  }
  // 每個賽果分區各自最可能一格：主選＝三區之中機率最高者，其餘兩區做備選
  const zoneBest: { score: string; p: number; res: "home" | "draw" | "away"; cond: number }[] = RES.map((res) => ({
    score: "—",
    p: 0,
    res,
    cond: 0,
  }));
  // 尾部桶同期望比分：一律由同一張重新加權矩陣派生，唔另開公式
  let egH = 0;
  let egA = 0;
  let winBy3 = 0;
  let h4plus = 0;
  let awayZero = 0;
  const norm: { score: string; p: number; res: "home" | "draw" | "away" }[] = [];
  for (const c of cells) {
    const pr = total > 0 ? c.pr / total : 0;
    if (c.a + c.b >= 4) bigP += pr;
    egH += pr * c.a;
    egA += pr * c.b;
    if (c.a - c.b >= 3) winBy3 += pr;
    if (c.a >= 4) h4plus += pr;
    if (c.b === 0) awayZero += pr;
    const zi = resOf(c.a, c.b);
    norm.push({ score: `${c.a}-${c.b}`, p: pr, res: RES[zi]! });
    const z = zoneBest[zi]!;
    if (pr > z.p) {
      z.score = `${c.a}-${c.b}`;
      z.p = pr;
    }
  }
  for (let i = 0; i < 3; i += 1) {
    const z = zoneBest[i]!;
    const zp = p[i] ?? 0;
    z.cond = zp > 1e-9 ? z.p / zp : 0; // 該賽果成立嘅前提下，呢個比分嘅機率
  }
  const top8 = [...norm].sort((a, b) => b.p - a.p).slice(0, 8);
  const sorted = [...zoneBest].sort((a, b) => b.p - a.p);
  const best = sorted[0]!;
  const alts = sorted.slice(1);
  return {
    ...best,
    bigP,
    zones: zoneBest,
    alts,
    top8,
    exp: [egH, egA] as [number, number],
    tails: { winBy3, h4plus, awayZero },
  };
}


function MatchCard({
  m,
  weights,
  crestOf,
}: {
  m: Match;
  weights: { dc: number; elo: number };
  crestOf: (div: string, name: string) => string | null;
}) {
  const [open, setOpen] = useState(false);
  const top = argmaxSide(m.p);
  // 第二層：由同一張凍結矩陣派生嘅推薦結算（唔改三格、唔改指紋）
  const rec = useMemo(() => recommend(m.lambda, m.p), [m.lambda, m.p]);
  const derived = useMemo(() => scoreTop(m.lambda, m.p), [m.lambda, m.p]);
  // 只讀凍結值：有凍結波膽（S5 分區重加權後嘅矩陣）就用凍結嗰張，冇才由 λ 同機率派生
  const csAll = useMemo(() => {
    const f = m.cs;
    if (!f) return derived;
    const RES: ("home" | "draw" | "away")[] = ["home", "draw", "away"];
    const zones = RES.map((res) => {
      const z = f.cond[res];
      return { score: z?.score ?? "—", p: z?.p ?? 0, res, cond: z?.p_cond ?? 0 };
    });
    const sorted = [...zones].sort((a, b) => b.p - a.p);
    return {
      ...sorted[0]!,
      bigP: f.top8.reduce((acc, c) => {
        const [a, b] = c.score.split("-").map(Number);
        return acc + ((a ?? 0) + (b ?? 0) >= 4 ? c.p : 0);
      }, 0),
      zones,
      alts: sorted.slice(1),
      top8: f.top8,
      exp: f.exp,
      tails: { winBy3: f.tails.win_by_3plus, h4plus: f.tails.home_4plus, awayZero: f.tails.away_clean_sheet },
    };
  }, [m.cs, derived]);
  // 波膽大字出全矩陣最可能一格，唔跟 1X2 傾向分區
  const cs = csAll.top8[0]
    ? { ...csAll.top8[0], bigP: csAll.bigP }
    : { score: "—", p: 0, res: "draw" as const, bigP: csAll.bigP };
  const edgeMax = m.edge ? Math.max(...m.edge) : null;
  const edgeIdx = m.edge ? m.edge.indexOf(Math.max(...m.edge)) : -1;
  const side = ["主勝", "和局", "客勝"];
  const eloRatio = Math.min(1, Math.abs(m.elo_diff) / 400);
  

  return (
    <article className="rounded-[10px] border border-hairline bg-paper px-2.5 py-2.5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="tabnum font-mono-tx text-[11px] font-bold text-ink">{hk(m.kickoff_utc)}</span>
          <Pill tone="ink">{m.league_zh}</Pill>
        </div>
        {m.status === "final" ? (
          <Pill tone="win">{m.locked ? "綠燈 · 已鎖定" : "綠燈 · 未鎖"}</Pill>
        ) : (
          <Pill tone="lose">{m.locked ? "紅燈 · 基準軌已鎖" : "紅燈 · 基準軌"}</Pill>
        )}
      </header>

      {/* 賽果預測：三條機率（主／和／客）齊列，最高者標金 */}
      <div className="mt-2 rounded-[8px] border border-gold-strong/40 bg-gold-bg px-2 py-1.5">
        <div className="space-y-1">
          {[0, 1, 2].map((i) => {
            const v = m.p[i] ?? 0;
            const lead = i === top;
            return (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`w-8 shrink-0 text-[10px] font-bold ${lead ? "text-ink" : "text-ink-2"}`}>
                  {side[i]}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-[2px] bg-hairline">
                  <span
                    className={`block h-full ${lead ? "bg-gold" : "bg-ink-3/45"}`}
                    style={{ width: `${Math.round(v * 100)}%` }}
                  />
                </span>
                <span
                  className={`tabnum w-10 shrink-0 text-right font-mono-tx text-[10px] ${lead ? "font-bold text-ink" : "text-ink-2"}`}
                >
                  {p1(v)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-1 text-[9px] leading-tight text-ink-3">
          和局歷史上只佔約四分一，三條機率齊列；預測字取三格最高者（同一張凍結矩陣加總），唔另訓分類器。
        </p>
      </div>

      {/* 對外只報一個賽果：主／和／客 argmax */}
      <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-[8px] border border-hairline bg-paper-2 px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <FootballCrest name={teamZh(m.div, m.home)} src={crestOf(m.div, m.home)} />
          <p className="truncate font-serif-tc text-[12px] font-bold text-ink">{teamZh(m.div, m.home)}</p>
        </div>
        <p className="shrink-0 text-center font-serif-tc text-[18px] font-bold leading-none text-gold">
          {side[top]}
          <span className="tabnum ml-1 font-mono-tx text-[11px] font-normal text-ink-2">{p1(m.p[top] ?? 0)}</span>
        </p>
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <p className="truncate text-right font-serif-tc text-[12px] font-bold text-ink">{teamZh(m.div, m.away)}</p>
          <FootballCrest name={teamZh(m.div, m.away)} src={crestOf(m.div, m.away)} />
        </div>
      </div>
      <p className="mt-1 tabnum font-mono-tx text-[9px] leading-tight text-ink-3">
        主客機率距離 {p1(haGap(m.p))} · 距離愈細和局機率愈高（獨立泊松本身已有），但預測字仍然取最高格
      </p>

      {/* 第二層：推薦結算（唔改三格、唔改矩陣、唔升指紋） */}
      <div className="mt-1.5 rounded-[8px] border border-deep/30 bg-paper-2 px-2.5 py-2">
        <p className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3">
          <span>第二層 · 推薦結算</span>
          <span className="tabnum font-mono-tx normal-case tracking-normal">
            τ={SECOND_LAYER.tau.toFixed(2)} δ={SECOND_LAYER.delta.toFixed(2)} · {rec.bucketZh}
          </span>
        </p>
        <p className="mt-0.5 font-serif-tc text-[17px] font-bold leading-none text-deep">
          {rec.label(teamZh(m.div, m.home), teamZh(m.div, m.away))}
        </p>
        <p className="tabnum mt-1 font-mono-tx text-[10px] text-ink-2">
          該結算由同一張矩陣加總：贏 {p1(rec.leg.win)}
          {rec.line !== 0 ? ` · 走水 ${p1(rec.leg.push)}` : ""} · 輸 {p1(rec.leg.lose)}
        </p>
        {rec.minus1 ? (
          <p className="tabnum mt-1 font-mono-tx text-[9px] leading-relaxed text-ink-3">
            旁註（未過閘、唔作推薦）：強隊 −1 隱含贏 {p1(rec.minus1.win)} · 走水 {p1(rec.minus1.push)}；
            凍結 walk-forward 顯示 −1 逐季一致高估 4.3–9.8 個百分點，超出 2 點校準閘。
          </p>
        ) : null}
        <p className="mt-1 text-[9px] leading-relaxed text-ink-3">
          第二層只出一句結算，唔改上面三格、唔改矩陣、唔升指紋，盤口權重永遠 0。
          「其餘」情況＝三格最高嗰邊（主或客）直勝，第二層唔會出和；戰績分兩欄，−1／+1 贏唔當 1X2 中。
        </p>
      </div>




      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Pill tone="ink">
          預期入球 {m.lambda[0].toFixed(2)} ／ {m.lambda[1].toFixed(2)}
        </Pill>
        <Pill tone="ink">大細 2.5 · 大 {p1(m.over25)}</Pill>
        <Pill tone="ink">兩隊入球 {p1(m.btts)}</Pill>
        {edgeMax !== null ? (
          <Pill tone={edgeMax >= 0.05 ? "win" : "ink"}>
            價值差 {side[edgeIdx]} {edgeMax >= 0 ? "+" : "−"}
            {(Math.abs(edgeMax) * 100).toFixed(1)} 個百分點
          </Pill>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 w-full rounded-[7px] border border-hairline bg-paper-2 px-2 py-1.5 text-[10px] font-bold text-ink-2"
      >
        {open ? "收起引擎口徑 ▲" : "睇引擎口徑同特徵 ▼"}
      </button>

      {open ? (
        <div className="mt-2 space-y-2 rounded-[8px] border border-hairline bg-paper-2 px-2 py-2">
          <div>
            <p className="flex items-center justify-between text-[10px] font-bold text-ink-2">
              <span>Elo 分差（主場視角）</span>
              <span className="tabnum font-mono-tx text-ink">
                {m.elo_diff >= 0 ? "+" : "−"}
                {Math.abs(m.elo_diff).toFixed(1)}
              </span>
            </p>
            <span className="mt-1 block">
              <TxBar ratio={eloRatio} tone={m.elo_diff >= 0 ? "gold" : "ink"} height={5} />
            </span>
            <p className="mt-1 text-[9px] leading-relaxed text-ink-3">
              主客獨立評分，逐場迭代、跨季回歸，只用開賽前已完成嘅場次。
            </p>
          </div>

          <div className="rounded-[7px] border border-hairline bg-paper px-2 py-1.5">
            <p className="mb-1 flex items-center justify-between text-[10px] font-bold text-ink-2">
              <span>整張比分矩陣 · 頭八格</span>
              <span className="tabnum font-mono-tx text-ink">
                期望比分 {csAll.exp[0].toFixed(2)} : {csAll.exp[1].toFixed(2)}
              </span>
            </p>
            <ul className="grid grid-cols-4 gap-1">
              {csAll.top8.map((c) => (
                <li
                  key={c.score}
                  className={`rounded-[5px] border px-1 py-1 text-center ${
                    c.score === cs.score ? "border-gold-strong/50 bg-gold-bg" : "border-hairline bg-paper-2"
                  }`}
                >
                  <p className="tabnum font-mono-tx text-[11px] font-bold text-ink">{c.score.replace("-", ":")}</p>
                  <p className="tabnum font-mono-tx text-[9px] text-ink-3">{p1(c.p)}</p>
                </li>
              ))}
            </ul>
            <ul className="mt-1.5 space-y-[3px] font-mono-tx text-[10px] text-ink-2">
              {csAll.zones.map((z) => (
                <li key={z.res} className="flex justify-between gap-2">
                  <span>{SIDE_ZH[z.res]}格內最可能比分</span>
                  <span className="tabnum">
                    {z.score.replace("-", ":")} · 該賽果成立下 {p1(z.cond)}
                  </span>
                </li>
              ))}
              <li className="flex justify-between gap-2 text-ink-3">
                <span>主隊贏三球或以上</span>
                <span className="tabnum">{p1(csAll.tails.winBy3)}</span>
              </li>
              <li className="flex justify-between gap-2 text-ink-3">
                <span>主隊入四球或以上</span>
                <span className="tabnum">{p1(csAll.tails.h4plus)}</span>
              </li>
              <li className="flex justify-between gap-2 text-ink-3">
                <span>客隊零封（零入球）</span>
                <span className="tabnum">{p1(csAll.tails.awayZero)}</span>
              </li>
            </ul>
            <p className="mt-1 text-[9px] leading-relaxed text-ink-3">
              公開波膽只出一格（全矩陣機率最高者），呢張表係同一張矩陣嘅完整分佈，唔係另一套預測。
              泊松方差等於均值，大比分先天偏瘦；肥尾同把 Elo 分差注入 λ 仍屬研究軌，未過三項閘唔會入凍結。
            </p>
          </div>


          <div className="rounded-[7px] border border-hairline bg-paper px-2 py-1.5">
            <p className="mb-1 text-[10px] font-bold text-ink-2">三軌各自口徑（主／和／客）</p>
            <ul className="space-y-[3px] font-mono-tx text-[10px] text-ink-2">
              <li className="flex justify-between gap-2">
                <span>天喜足球ELO（權重 {weights.elo.toFixed(2)}）</span>
                <span className="tabnum">{m.p_elo ? m.p_elo.map((v) => p1(v)).join(" / ") : "—"}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>入球模型 Dixon-Coles（權重 {weights.dc.toFixed(2)}）</span>
                <span className="tabnum">{m.p_dc ? m.p_dc.map((v) => p1(v)).join(" / ") : "—"}</span>
              </li>
              <li className="flex justify-between gap-2 font-bold text-ink">
                <span>對數空間加權集成（本頁採用）</span>
                <span className="tabnum">{m.p.map((v) => p1(v)).join(" / ")}</span>
              </li>
              <li className="flex justify-between gap-2 text-ink-3">
                <span>市場去水（權重 0，只作對照）</span>
                <span className="tabnum">{m.market ? m.market.map((v) => p1(v)).join(" / ") : "—"}</span>
              </li>
            </ul>
          </div>

          <p className="text-[9px] leading-relaxed text-ink-3">
            採用因子：Elo 主客評分同分差、入球模型 λ 與攻守係數、近十場滾動（得分／入失球／射門／角球／牌）、
            休息日與場次密度、對賽往績、聯賽同主場優勢基線。未採用：任何賠率、賽中統計、數據集自帶 ExpectedGoals。
          </p>
          <Link to="/football/engine" className="inline-block text-[10px] font-bold text-gold">
            睇完整八步流程同 54 項特徵 →
          </Link>
        </div>
      ) : null}
    </article>
  );
}

function FootballFixturesPage() {
  const q = useQuery<Payload>({
    queryKey: ["footballPredictions"],
    queryFn: async () => {
      const res = await fetch("/api/public/football-predictions");
      if (!res.ok) throw new Error(`載入失敗 ${res.status}`);
      return (await res.json()) as Payload;
    },
    staleTime: 300_000,
  });

  const [league, setLeague] = useState<string>("全部");
  const [onlyValue, setOnlyValue] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [sort, setSort] = useState<"time" | "value" | "conf">("time");

  const all = q.data?.matches ?? [];
  const now = Date.now();
  const matches = useMemo(
    () => (showPast ? all : all.filter((m) => kickoffMs(m.kickoff_utc) > now - 2 * 3600 * 1000)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, showPast],
  );
  const pastCount = all.length - all.filter((m) => kickoffMs(m.kickoff_utc) > now - 2 * 3600 * 1000).length;
  const leagues = useMemo(() => {
    const s = new Map<string, number>();
    for (const m of matches) s.set(m.league_zh, (s.get(m.league_zh) ?? 0) + 1);
    return [...s.entries()].sort((a, b) => b[1] - a[1]);
  }, [matches]);

  const rows = useMemo(() => {
    const list = matches
      .filter((m) => league === "全部" || m.league_zh === league)
      .filter((m) => !onlyValue || (m.edge ? Math.max(...m.edge) >= 0.05 : false));
    if (sort === "value") {
      return [...list].sort((a, b) => (b.edge ? Math.max(...b.edge) : -9) - (a.edge ? Math.max(...a.edge) : -9));
    }
    if (sort === "conf") return [...list].sort((a, b) => Math.max(...b.p) - Math.max(...a.p));
    return [...list].sort((a, b) => kickoffMs(a.kickoff_utc) - kickoffMs(b.kickoff_utc));
  }, [matches, league, onlyValue, sort]);

  /** 排序按時間時，逐日分組（香港日期）方便掃讀 */
  const groups = useMemo(() => {
    if (sort !== "time") return [{ day: "", items: rows }];
    const out: { day: string; items: Match[] }[] = [];
    for (const m of rows) {
      const day = hk(m.kickoff_utc).slice(0, 5);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(m);
      else out.push({ day, items: [m] });
    }
    return out;
  }, [rows, sort]);

  const crestOf = useCrests(matches.map((m) => m.div));

  const meta = q.data?.meta;
  const valueCount = matches.filter((m) => m.edge && Math.max(...m.edge) >= 0.05).length;
  const chip = (active: boolean, tone: "gold" | "win" = "gold") =>
    `rounded-[5px] border px-2 py-1 text-[10px] font-bold ${
      active
        ? tone === "win"
          ? "border-win/40 bg-win/10 text-win"
          : "border-gold-strong/40 bg-gold-bg text-gold"
        : "border-hairline bg-paper text-ink-2"
    }`;

  return (
    <AppShell
      page="football"
      ticker={
        meta
          ? `TX-Football 賽前預測 · ${meta.fixtures_count} 場 · 指紋 ${meta.fingerprint} · 歷史 ${meta.history_matches.toLocaleString()} 場前推 · 賠率零權重 · 現階段一律紅燈（退回基準）`
          : "TX-Football 賽前預測 · 載入中"
      }
    >
      <PageHead
        en="Pre-match Frozen Predictions"
        title="足球賽前預測"
        desc={
          <>
            每場開賽前出機率並保存版本指紋，賽後逐場公開對帳。所有輸入只用開賽前已存在嘅歷史賽果，
            賠率一項都冇入模——只放喺卡內做去水對照同價值判斷。
          </>
        }
      />

      {q.isPending ? (
        <Card title="載入中" en="Loading">
          <p className="text-[11px] text-ink-3">正在讀取已凍結嘅預測檔……</p>
        </Card>
      ) : q.isError || !meta ? (
        <Card title="讀唔到預測檔" en="Unavailable">
          <p className="text-[11px] leading-relaxed text-ink-2">
            暫時讀唔到已凍結嘅預測檔（{q.error instanceof Error ? q.error.message : "未知錯誤"}）。
            採集器每 6 小時重跑一次，過陣再睇。
          </p>
        </Card>
      ) : (
        <>
          <Card title="本批預測" en="This Batch">
            <StatGrid cols={3}>
              <Stat
                label="未開賽場次"
                value={String(matches.length)}
                sub={`${leagues.length} 個聯賽 · 本批共 ${meta.fixtures_count}`}
              />
              <Stat label="歷史前推" value={meta.history_matches.toLocaleString()} sub={`最後賽果 ${meta.history_last_date}`} />
              <Stat label="版本指紋" value={meta.fingerprint.slice(0, 8)} sub="腳本＋資料＋場次數" />
            </StatGrid>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {meta.s5?.ready ? (
                <Pill tone="win">綠燈 · S5 集成已接入（{meta.s5.green_matches} 場）</Pill>
              ) : (
                <Pill tone="lose">紅燈 · 退回基準軌</Pill>
              )}
              <Pill tone="ink">生成 {hk(meta.generated_at)}（香港時間）</Pill>
              <Pill tone={meta.fixtures_stale ? "lose" : "win"}>{meta.fixtures_stale ? "賽程係舊貨" : "賽程新鮮"}</Pill>
              <Pill tone="ink">
                混合權重 入球模型 {meta.weights.dc.toFixed(2)} ／ Elo {meta.weights.elo.toFixed(2)}
              </Pill>
              <Pill tone="ink">開賽前 {meta.lock_minutes} 分鐘鎖定</Pill>
            </div>
            {meta.s5?.ready ? (
              <p className="mt-2 rounded-[8px] border border-gold-strong/40 bg-gold-bg px-2.5 py-2 text-[10px] leading-relaxed text-ink-2">
                <b className="text-gold">照實講：</b>
                {meta.status_note}
                {meta.s5.backtest ? (
                  <>
                    {" "}呢個模型上線之前要過三項閘門：最近三個完整賽季共 {meta.s5.backtest.n.toLocaleString()} 場季外測試，
                    排序分數 RPS {meta.s5.backtest.rps.toFixed(4)}、校準偏差 {(meta.s5.backtest.ece * 100).toFixed(2)}%，
                    都要贏最佳單軌（RPS {meta.s5.gate?.best_single_track_rps.toFixed(4)}）先准入凍結軌。
                  </>
                ) : null}
                {" "}紅燈場次係熱身場數不足（雙方各要 40 場歷史）而退回基準軌，只作診斷，唔入公開帳。
              </p>
            ) : (
              <p className="mt-2 rounded-[8px] border border-lose/30 bg-lose/5 px-2.5 py-2 text-[10px] leading-relaxed text-ink-2">
                <b className="text-lose">照實講：</b>
                {meta.status_note}換句話講，呢批機率係 S2 天喜足球ELO 加 S3 入球模型嘅在線混合，未經 S5 校準，
                唔可以當最終預測用。{meta.s5?.reason ? `未就緒原因：${meta.s5.reason}。` : ""}
              </p>
            )}
          </Card>

          <Card title="逐場預測" en="Match List">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={() => setLeague("全部")} className={chip(league === "全部")}>
                全部 {matches.length}
              </button>
              {leagues.map(([name, n]) => (
                <button key={name} type="button" onClick={() => setLeague(name)} className={chip(league === name)}>
                  {name} {n}
                </button>
              ))}
              <button type="button" onClick={() => setOnlyValue((v) => !v)} className={chip(onlyValue, "win")}>
                只睇價值差 ≥5 個百分點 {valueCount}
              </button>
              {pastCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowPast((v) => !v);
                    setLeague("全部");
                  }}
                  className={chip(showPast)}
                >
                  {showPast ? "隱藏已開賽" : `連已開賽一齊睇 +${pastCount}`}
                </button>
              ) : null}
            </div>

            <div className="mb-2 flex flex-wrap items-center gap-1.5 border-t border-hairline pt-2">
              <span className="font-mono-tx text-[9px] font-bold uppercase tracking-[0.2em] text-ink-3">排序</span>
              {(
                [
                  ["time", "開賽時間"],
                  ["value", "價值差最大"],
                  ["conf", "引擎最有信心"],
                ] as const
              ).map(([k, label]) => (
                <button key={k} type="button" onClick={() => setSort(k)} className={chip(sort === k)}>
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {groups.map((g) => (
                <div key={g.day || "all"}>
                  {g.day ? (
                    <p className="mb-1.5 flex items-center gap-2 border-b border-hairline pb-1 font-mono-tx text-[10px] font-bold text-ink-2">
                      {g.day}
                      <span className="text-ink-3">{g.items.length} 場</span>
                    </p>
                  ) : null}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {g.items.map((m) => (
                      <MatchCard key={m.match_key} m={m} weights={meta.weights} crestOf={crestOf} />
                    ))}
                  </div>
                </div>
              ))}
            </div>


            {rows.length === 0 ? <p className="mt-2 text-[10px] text-ink-3">呢個篩選之下冇場次。</p> : null}
            <p className="mt-2 text-[10px] leading-relaxed text-ink-3">
              波膽點計出嚟（卜瓦松分佈 × 球隊實力）：第一步用五大聯賽實力模型（Dixon-Coles 攻守係數＋主場優勢，
              時間半衰期 180 日、每兩星期滾動重訓）算出雙方預期入球 λ，再以卜瓦松公式
              P(X=k) = λ^k · e^(−λ) ／ k! 分別計主客入 k 球機率，兩邊相乘派生 0-0 至 8-8 完整比分矩陣，
              並對低比分格（0-0／1-0／0-1／1-1）做 Dixon-Coles 相關修正。
              第二步，亦係決定性嘅一步，用三軌集成（天喜足球ELO 實力 ＋ 入球模型）嘅主／和／客機率，
              將矩陣按賽果分區重新加權，令主勝／和局／客勝三個區嘅合計機率同引擎嘅實力判斷完全一致，
              然後才揀格：主選＝三區之中機率最高一格，另外兩區各出一個分區備選（同時列全場機率同「該賽果成立之下」嘅條件機率），
              所以強隊唔會再因為「平均入球細」而被拉去和局格。
              比分本質仍然分散：兩隊 λ 多數落 1.0–1.8，低比分格最厚，所以主選通常仍係
              1-0／2-1／2-0；大比數（例如 4-1）單一機率一般只有 1%–2%。因此我哋同時列出
              「四球或以上合計機率」，等你睇到大比數整體幾大機會，唔會被單一比分誤導。
              賠率係唯一唔會用嚟校正模型嘅資料：市場只作對照線同價值判斷，權重永遠零。
              大細同兩隊入球同出一個矩陣，各盤口機率永遠互相一致。「市場去水」係賽前平均賠率去掉水錢後嘅隱含機率，
              權重零，只作對照；「價值差」＝模型機率減市場機率。隊徽係按隊名派生嘅識別標，唔係官方徽章；
              隊名用港式馬會譯名對照表；表外球隊原樣顯示英文短名，唔會亂譯。
            </p>

          </Card>

          <Card title="呢頁未有嘅嘢" en="Not Yet">
            <ul className="ml-4 list-disc space-y-1 text-[10px] leading-relaxed text-ink-2">
              <li>
                黃燈（開賽前刷新中）暫時未細分：現時只有綠燈（S5 集成、已過三項閘門）同紅燈（熱身不足退回基準軌）。
              </li>
              <li>機率區間（信賴帶）同逐場前幾大特徵貢獻（SHAP）未上線，已入路線圖。</li>
              <li>賽後逐場對帳紀錄要等呢批凍結預測有咗賽果之後才會出現。</li>
              <li>xG、官方首發陣容、傷停係 v1 特徵，未上線；官方球隊徽章需授權，暫用派生識別標。</li>
            </ul>
            <p className="mt-2">
              <Link
                to="/football/results"
                className="inline-flex items-center gap-1 rounded-[6px] border border-gold-strong/40 bg-gold-bg px-2.5 py-1.5 text-[11px] font-bold text-gold"
              >
                睇引擎公開對帳 →
              </Link>
            </p>
          </Card>
        </>
      )}

      <Disclaimer
        extra={
          meta?.s5?.ready
            ? "綠燈場次為 S5 集成校準後嘅賽前凍結機率，紅燈場次為未校準基準軌，全部僅作研究對照，不構成任何投注建議。"
            : "本頁機率為未校準嘅基準軌輸出，僅作研究對照，不構成任何投注建議。"
        }
      />
    </AppShell>
  );
}
