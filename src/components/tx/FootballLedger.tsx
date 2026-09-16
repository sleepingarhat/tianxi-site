import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Card, Empty, ErrorNote, Loading, Pill, Seg, Stat, StatGrid } from "@/components/tx/ui";
import { SECOND_LAYER, legOutcome, recommend } from "@/lib/footballSecondLayer";
import { argmaxSide } from "@/lib/footballTeams";
import { teamZh } from "@/lib/teamZh";

/** 比分字串 → 賽果分區 */
function resOfScore(score: string): "home" | "draw" | "away" {
  const [h, a] = score.split("-").map(Number);
  const hh = h ?? 0;
  const aa = a ?? 0;
  return hh > aa ? "home" : hh === aa ? "draw" : "away";
}

/** S13 逐場凍結帳：一場一條，鎖後預測欄永不改；完場只 join 賽果，禁止用最新模型重打。 */

type Agg = {
  n: number;
  rps_avg: number;
  argmax_hit_rate: number;
  ece: number;
  cs_top1: number;
  cs_top3: number;
  cs_top8: number;
  cs_logloss?: number | null;
  fingerprints: string[];
} | null;

type HitRate = {
  generated_at: string;
  scope: { big5: string[]; green_status: string[]; note: string };
  baselines: { prior_asof: number; market_devig: number; s5_backtest: number };
  green: Agg;
  diagnostic_big5_all_lights: Agg;
  diagnostic_all_leagues: Agg;
  unmatched_count: number;
};

type CsCell = { score: string; p: number; res?: string };

type LogRec = {
  match_key: string;
  div: string;
  league_zh?: string;
  home: string;
  away: string;
  kickoff_utc?: string;
  locked_at?: string | null;
  status?: string;
  track?: string;
  fingerprint?: string;
  p?: number[];
  lambda?: number[];
  cs?: { top8?: CsCell[]; exp?: number[] };
  result?: {
    ft_h: number;
    ft_a: number;
    ftr: string;
    rps?: number;
    argmax_hit?: number;
    p_actual?: number;
    cs_rank?: number | null;
  } | null;
};

type LogFile = { matches: Record<string, LogRec> };

const pc = (v: number | undefined, d = 1) => (v == null ? "—" : `${(v * 100).toFixed(d)}%`);
const RES_ZH: Record<string, string> = { home: "主勝", draw: "和局", away: "客勝" };
const BIG5 = ["E0", "D1", "SP1", "I1", "F1"];
const isGreen = (r: LogRec) => r.status !== "fallback" && !!r.locked_at;

/** 同一張卡三個狀態：未開賽 → 進行中（只顯示狀態，唔顯示即時比分）→ 已結算。 */
type Phase = "upcoming" | "live" | "done";
function phaseOf(r: LogRec): Phase {
  if (r.result) return "done";
  const ko = r.kickoff_utc ? Date.parse(r.kickoff_utc) : NaN;
  if (Number.isFinite(ko) && Date.now() >= ko) return "live";
  return "upcoming";
}
const hkTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("zh-HK", {
        timeZone: "Asia/Hong_Kong",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";

function monthKey(offset = 0) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + offset);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function readJson<T>(query: string): Promise<T> {
  const res = await fetch(`/api/public/football-predictions?${query}`);
  if (!res.ok) throw new Error(`載入失敗 ${res.status}`);
  return (await res.json()) as T;
}

/** 一場一卡：左邊凍結預測（已鎖），右邊 90 分鐘賽果，同一張矩陣出 1X2 同波膽。 */
function MatchCard({ r }: { r: LogRec }) {
  const res = r.result ?? null;
  const phase = phaseOf(r);
  const p = r.p ?? [];
  const green = isGreen(r);
  const inLedger = green && BIG5.includes(r.div);
  const actualIdx = res ? ({ home: 0, draw: 1, away: 2 }[res.ftr] ?? -1) : -1;
  const predIdx = p.length === 3 ? argmaxSide(p) : -1;
  // 第二層推薦結算：同一張凍結矩陣（λ + 三格）派生，獨立一欄對帳
  const lam = r.lambda ?? [];
  const rec =
    p.length === 3 && lam.length === 2
      ? recommend([lam[0]!, lam[1]!], [p[0]!, p[1]!, p[2]!])
      : null;
  const legRes = rec && res ? legOutcome(res.ft_h, res.ft_a, rec.sideHome, rec.line) : null;
  const actualScore = res ? `${res.ft_h}-${res.ft_a}` : "";
  const top8 = r.cs?.top8 ?? [];
  const hitCell = top8.find((c) => c.score === actualScore);
  const topCell = top8[0] ?? null;
  const modeHit = !!res && !!topCell && topCell.score === actualScore;
  const exp = r.cs?.exp ?? r.lambda ?? [];
  const phasePill =
    phase === "done"
      ? { tone: "gold" as const, label: "已結算" }
      : phase === "live"
        ? { tone: "gold" as const, label: "進行中 · 預測已鎖定" }
        : { tone: "ink" as const, label: `未開賽 · ${hkTime(r.kickoff_utc)}` };

  return (
    <article className="rounded-[10px] border border-hairline bg-paper px-2.5 py-2.5">
      <header className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className="font-serif-tc text-[13px] font-bold text-ink">
          {teamZh(r.div, r.home)} <span className="text-ink-3">對</span> {teamZh(r.div, r.away)}
        </span>
        <Pill tone="ink">{r.league_zh ?? r.div}</Pill>
        <Pill tone={green ? "win" : "lose"}>{green ? "綠燈 · 已鎖" : "紅燈 · 熱身不足"}</Pill>
        <Pill tone={phasePill.tone}>{phasePill.label}</Pill>
        {inLedger ? null : <Pill tone="ink">唔入戰績</Pill>}
      </header>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {/* 左：凍結預測 */}
        <div className="rounded-[8px] border border-hairline bg-paper-2 px-2 py-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3">
            凍結預測（開波前已鎖）
          </p>
          <div className="mt-1.5 space-y-1">
            {["home", "draw", "away"].map((k, i) => {
              const v = p[i] ?? 0;
              const hit = i === actualIdx;
              return (
                <div key={k} className="flex items-center gap-1.5">
                  <span className={`w-8 text-[10px] font-bold ${hit ? "text-win" : "text-ink-2"}`}>
                    {RES_ZH[k]}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-[2px] bg-hairline">
                    <span
                      className={`block h-full ${hit ? "bg-win" : "bg-ink-3/50"}`}
                      style={{ width: `${Math.round(v * 100)}%` }}
                    />
                  </span>
                  <span className="tabnum w-10 text-right font-mono-tx text-[10px] text-ink">
                    {pc(v, 0)}
                  </span>
                  <span className="w-3 text-[10px] text-win">{hit ? "●" : ""}</span>
                </div>
              );
            })}
          </div>
          {predIdx >= 0 ? (
            <div className="mt-2 rounded-[7px] border border-hairline bg-paper px-2 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3">
                對外預測（三格最高者）
              </p>
              <p className="mt-0.5 font-serif-tc text-[20px] font-bold leading-none text-deep">
                {RES_ZH[["home", "draw", "away"][predIdx]!]}
                <span className="tabnum ml-1.5 font-mono-tx text-[10px] font-normal text-ink-2">
                  {pc(p[predIdx] ?? 0, 1)}
                </span>
                {res ? (
                  <span className={`ml-1.5 text-[11px] ${predIdx === actualIdx ? "text-win" : "text-ink-3"}`}>
                    {predIdx === actualIdx ? "● 中" : "○ 唔中"}
                  </span>
                ) : null}
              </p>
              <p className="tabnum mt-1 font-mono-tx text-[9px] text-ink-3">
                主客機率距離 {pc(Math.abs((p[0] ?? 0) - (p[2] ?? 0)), 1)}
                {exp.length === 2 ? `｜預期入球 ${exp[0]!.toFixed(2)}–${exp[1]!.toFixed(2)}` : ""}
              </p>
              {top8.length > 0 ? (
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-[9px] font-bold text-ink-3">
                    展開波膽格（只作診斷，對帳與訓練一律用全格）
                  </summary>
                  <p className="tabnum mt-1 font-mono-tx text-[10px] text-ink-2">
                    最高格 {topCell ? topCell.score.replace("-", ":") : "—"}
                    {topCell ? `（${pc(topCell.p, 1)}）` : ""}
                    {res ? (modeHit ? " · 眾數中" : " · 眾數唔中") : ""}
                  </p>
                  <ul className="mt-1 grid grid-cols-4 gap-1">
                    {top8.map((c) => (
                      <li
                        key={c.score}
                        className={`rounded-[5px] border px-1 py-1 text-center ${
                          c.score === actualScore
                            ? "border-win/60 bg-win/10"
                            : "border-hairline bg-paper-2"
                        }`}
                      >
                        <p className="tabnum font-mono-tx text-[10px] font-bold text-ink">
                          {c.score.replace("-", ":")}
                        </p>
                        <p className="tabnum font-mono-tx text-[9px] text-ink-3">{pc(c.p, 1)}</p>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              <p className="mt-1.5 text-[9px] leading-relaxed text-ink-3">
                主／和／客係同一張凍結矩陣加總（P_H、P_D、P_A），預測字取最高者；波膽只係同一張矩陣嘅單格，收起唔對外報。
              </p>
              {rec ? (
                <div className="mt-1.5 rounded-[6px] border border-deep/25 bg-paper-2 px-2 py-1.5">
                  <p className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3">
                    <span>第二層 · 推薦結算</span>
                    <span className="tabnum font-mono-tx normal-case tracking-normal">{rec.bucketZh}</span>
                  </p>
                  <p className="mt-0.5 font-serif-tc text-[13px] font-bold leading-none text-deep">
                    {rec.label(teamZh(r.div, r.home), teamZh(r.div, r.away))}
                    {legRes ? (
                      <span
                        className={`ml-1.5 font-mono-tx text-[10px] font-normal ${
                          legRes === "win" ? "text-win" : legRes === "push" ? "text-ink-2" : "text-ink-3"
                        }`}
                      >
                        {legRes === "win" ? "● 贏" : legRes === "push" ? "◐ 走水" : "○ 輸"}
                      </span>
                    ) : null}
                  </p>
                  <p className="tabnum mt-1 font-mono-tx text-[9px] text-ink-3">
                    矩陣加總：贏 {pc(rec.leg.win, 1)}
                    {rec.line !== 0 ? ` · 走水 ${pc(rec.leg.push, 1)}` : ""} · 輸 {pc(rec.leg.lose, 1)}
                  </p>
                  <p className="mt-1 text-[9px] leading-relaxed text-ink-3">
                    第二層獨立一欄計數：−1／+1 贏唔當 1X2 中，1X2 中亦唔當第二層贏。第二層唔會出和。
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
          <p className="mt-1 break-all font-mono-tx text-[9px] text-ink-3">
            指紋 {r.fingerprint ?? "—"}｜軌 {r.track ?? "—"}
          </p>
        </div>

        {/* 右：90 分鐘賽果（未完場只顯示狀態，唔顯示即時比分） */}
        <div className="rounded-[8px] border border-hairline bg-paper-2 px-2 py-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3">
            90 分鐘賽果（加時／點球另計）
          </p>
          {res ? (
            <>
              <p className="tabnum mt-1.5 font-mono-tx text-[20px] font-bold leading-none text-deep">
                {actualScore}
                <span className="ml-1.5 text-[10px] font-normal text-ink-2">{RES_ZH[res.ftr]}</span>
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono-tx text-[10px]">
                <span className="text-ink-3">本場 RPS ↓</span>
                <span className="tabnum text-right text-ink">{res.rps?.toFixed(4) ?? "—"}</span>
                <span className="text-ink-3">賽果落咗幾多機率</span>
                <span className="tabnum text-right text-ink">{pc(res.p_actual, 1)}</span>
                <span className="text-ink-3">波膽第幾格</span>
                <span className="tabnum text-right text-ink">
                  {res.cs_rank ? `第 ${res.cs_rank} 格` : "跌出頭八格"}
                </span>
                <span className="text-ink-3">該格凍結機率</span>
                <span className="tabnum text-right text-ink">{hitCell ? pc(hitCell.p, 1) : "—"}</span>
              </div>
              <p className="mt-1.5">
                <Pill tone={res.cs_rank ? "win" : "ink"}>
                  {res.cs_rank ? `頭八格內中（第 ${res.cs_rank}）` : "頭八格外"}
                </Pill>
              </p>
            </>
          ) : (
            <>
              <p className="mt-1.5 font-serif-tc text-[15px] font-bold leading-tight text-ink-2">
                {phase === "live" ? "進行中 · 預測已鎖定" : "未開賽"}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-ink-3">
                {phase === "live"
                  ? "比賽進行期間唔顯示即時比分：對帳單位係 90 分鐘完場賽果，凍結機率永遠唔會賽中更新。完場並結算後，呢張卡會自動轉「已結算」。"
                  : `開賽時間 ${hkTime(r.kickoff_utc)}（香港）。${
                      r.locked_at ? "已鎖定，開賽前 60 分鐘定案。" : "開賽前 60 分鐘鎖定，鎖定前仍可刷新。"
                    }`}
              </p>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function FootballLedger() {
  const [day, setDay] = useState("all");
  const [lg, setLg] = useState("big5");
  const [ph, setPh] = useState<Phase | "all">("all");

  const hit = useQuery<HitRate>({
    queryKey: ["footballHitRate"],
    queryFn: () => readJson<HitRate>("file=hit_rate"),
    staleTime: 300_000,
  });

  const months = [monthKey(0), monthKey(-1)];
  const log = useQuery<LogRec[]>({
    queryKey: ["footballLedger", months.join(",")],
    queryFn: async () => {
      const files = await Promise.all(
        months.map(async (m) => {
          try {
            return await readJson<LogFile>(`file=log&month=${m}`);
          } catch {
            return { matches: {} } as LogFile;
          }
        }),
      );
      return files.flatMap((f) => Object.values(f.matches ?? {}));
    },
    staleTime: 300_000,
  });

  const all = useMemo(
    () =>
      (log.data ?? [])
        .slice()
        .sort((a, b) => (b.kickoff_utc ?? "").localeCompare(a.kickoff_utc ?? "")),
    [log.data],
  );
  const done = useMemo(() => all.filter((r) => r.result), [all]);
  const live = useMemo(() => all.filter((r) => phaseOf(r) === "live"), [all]);
  const pending = all.filter((r) => !r.result);
  const lockedCount = all.filter((r) => r.locked_at).length;

  const days = useMemo(
    () => Array.from(new Set(all.map((r) => (r.kickoff_utc ?? "").slice(0, 10)).filter(Boolean))),
    [all],
  );
  const leagues = useMemo(() => {
    const m = new Map<string, string>();
    all.forEach((r) => m.set(r.div, r.league_zh ?? r.div));
    return Array.from(m, ([value, label]) => ({ value, label }));
  }, [all]);

  const shown = all.filter(
    (r) =>
      (day === "all" || (r.kickoff_utc ?? "").slice(0, 10) === day) &&
      (lg === "all" ? true : lg === "big5" ? BIG5.includes(r.div) : r.div === lg) &&
      (ph === "all" || phaseOf(r) === ph),
  );

  // 第二層戰績：只讀綠燈已鎖、五大、已完場嘅凍結列，獨立一欄計，唔混入 1X2 命中
  const secondLayer = useMemo(() => {
    let n = 0;
    let win = 0;
    let push = 0;
    let lose = 0;
    let predWin = 0;
    const cov = [0, 0, 0];
    for (const r of all) {
      const pr = r.p ?? [];
      const lam = r.lambda ?? [];
      if (!r.result || pr.length !== 3 || lam.length !== 2) continue;
      if (!isGreen(r) || !BIG5.includes(r.div)) continue;
      const rc = recommend([lam[0]!, lam[1]!], [pr[0]!, pr[1]!, pr[2]!]);
      const o = legOutcome(r.result.ft_h, r.result.ft_a, rc.sideHome, rc.line);
      n += 1;
      cov[rc.bucket - 1] = (cov[rc.bucket - 1] ?? 0) + 1;
      predWin += rc.leg.win;
      if (o === "win") win += 1;
      else if (o === "push") push += 1;
      else lose += 1;
    }
    return { n, win, push, lose, cov, predWin: n ? predWin / n : 0, actWin: n ? win / n : 0 };
  }, [all]);

  const green = hit.data?.green ?? null;
  const diag = hit.data?.diagnostic_big5_all_lights ?? null;

  return (
    <>
      <Card title="逐場凍結帳（S13）" en="Frozen Ledger">
        {hit.isLoading ? (
          <Loading label="讀取凍結帳" />
        ) : hit.error ? (
          <ErrorNote error={hit.error} />
        ) : (
          <>
            <StatGrid cols={3}>
              <Stat
                label="平均 RPS ↓（入帳場次）"
                value={green ? green.rps_avg.toFixed(4) : "未開帳"}
                sub={`基準 ${hit.data?.baselines.prior_asof ?? 0.2261}／市場去水 ${
                  hit.data?.baselines.market_devig ?? 0.2047
                }`}
              />
              <Stat
                label="1X2 校準"
                value={green ? pc(green.ece, 2) : "未開帳"}
                sub="模型講幾成，實際幾成"
              />
              <Stat
                label="入帳樣本"
                value={green ? green.n.toLocaleString() : "0"}
                sub={green?.fingerprints?.length ? `指紋 ${green.fingerprints.join("、")}` : "指紋：待綠燈"}
              />
            </StatGrid>
            <div className="mt-2 rounded-[8px] border border-deep/25 bg-paper px-2.5 py-2">
              <p className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3">
                <span>第二層 · 推薦結算戰績（獨立一欄）</span>
                <span className="tabnum font-mono-tx normal-case tracking-normal">
                  τ={SECOND_LAYER.tau.toFixed(2)} δ={SECOND_LAYER.delta.toFixed(2)}
                </span>
              </p>
              <div className="mt-1.5 grid gap-1 font-mono-tx text-[10px] sm:grid-cols-2">
                <span className="text-ink-3">
                  贏 <b className="tabnum text-ink">{secondLayer.n ? secondLayer.win : "—"}</b>／走水{" "}
                  <b className="tabnum text-ink">{secondLayer.n ? secondLayer.push : "—"}</b>／輸{" "}
                  <b className="tabnum text-ink">{secondLayer.n ? secondLayer.lose : "—"}</b>
                </span>
                <span className="text-ink-3">
                  結算樣本 <b className="tabnum text-ink">{secondLayer.n}</b> 場（綠燈已鎖 · 五大）
                </span>
                <span className="text-ink-3">
                  矩陣隱含贏率{" "}
                  <b className="tabnum text-ink">{secondLayer.n ? pc(secondLayer.predWin, 1) : "—"}</b>
                </span>
                <span className="text-ink-3">
                  實際贏率 <b className="tabnum text-ink">{secondLayer.n ? pc(secondLayer.actWin, 1) : "—"}</b>
                </span>
                <span className="text-ink-3">
                  覆蓋 一面倒 <b className="tabnum text-ink">{secondLayer.cov[0]}</b>／近盤{" "}
                  <b className="tabnum text-ink">{secondLayer.cov[1]}</b>／其餘{" "}
                  <b className="tabnum text-ink">{secondLayer.cov[2]}</b>
                </span>
              </div>
              <p className="mt-1 text-[9px] leading-relaxed text-ink-3">
                第二層只出一句結算，唔改上面三格、唔改矩陣、唔升指紋，盤口權重永遠 0。主指標係結算校準（隱含贏率
                對實際贏率），副指標係三類覆蓋率。−1／+1 贏唔當 1X2 中。τ、δ 由凍結 walk-forward 揀（
                {SECOND_LAYER.gate.sample.toLocaleString()} 場，{SECOND_LAYER.gate.evalFrom} 季起），一季只准改一次；
                「強隊 −1」逐季一致高估 4.3–9.8 個百分點、超出 2 點校準閘，所以一面倒場暫時退回直勝，−1 只作旁註。
              </p>
            </div>
            <details className="mt-2 rounded-[8px] border border-hairline bg-paper px-2.5 py-2">
              <summary className="cursor-pointer text-[10px] font-bold text-ink-2">
                波膽對帳（眾數命中率＋頭八格覆蓋＋實際格 log-loss，摺疊）
              </summary>
              <div className="mt-1.5 grid gap-1 font-mono-tx text-[10px] sm:grid-cols-2">
                <span className="text-ink-3">
                  眾數命中率（展示用）{" "}
                  <b className="tabnum text-ink">{green ? pc(green.cs_top1, 1) : "未開帳"}</b>
                </span>
                <span className="text-ink-3">
                  頭三格中 <b className="tabnum text-ink">{green ? pc(green.cs_top3, 1) : "未開帳"}</b>
                </span>
                <span className="text-ink-3">
                  頭八格中 <b className="tabnum text-ink">{green ? pc(green.cs_top8, 1) : "未開帳"}</b>
                </span>
                <span className="text-ink-3">
                  實際格 log-loss ↓{" "}
                  <b className="tabnum text-ink">
                    {green?.cs_logloss != null ? green.cs_logloss.toFixed(3) : "未開帳"}
                  </b>
                </span>
              </div>
              <p className="mt-1 text-[9px] leading-relaxed text-ink-3">
                眾數命中率（我哋出嗰個最可能比分中唔中）只作展示戰績，永遠唔會回寫落模型參數；調參一律睇全格
                機率——「實際格 log-loss」同「頭八格覆蓋」。實際比分跌出頭八格時，以頭八格最細機率一半作罰分底。
              </p>
            </details>
            <p className="mt-2 text-[10px] leading-relaxed text-ink-2">
              入帳範圍：五大聯賽（{(hit.data?.scope.big5 ?? []).join("、")}）、綠燈且已鎖場次。逐場鎖定＝
              <b className="text-deep">開賽前 60 分鐘</b>；黃燈可刷新、綠燈已鎖、紅燈退回基準軌。已鎖場次
              <b className="text-deep">永遠跟當時指紋</b>，重訓只影響之後未鎖場次，新模型想改已鎖場只會寫入審計並被拒。
              每日凍結軌已接入 S5 三軌集成（S4 天喜足球LGB ＋ S3 入球模型 ＋ S2 天喜足球ELO），過三項閘門先算綠燈。
              權重唔係固定常數：當季約 LGB 0.65、入球模型 0.10、天喜ELO 0.25，每季用過去兩季季外預測重擬合；
              熱身場數不足嘅場次維持紅燈基準軌，只作診斷。上面三格要等綠燈場次有咗完場賽果才會出實數，
              喺此之前一律寫「未開帳」，唔會借回測數字充當實戰成績。
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <Stat label="帳內場次" value={(log.data?.length ?? 0).toLocaleString()} sub={`已鎖 ${lockedCount}`} />
              <Stat
                label="已完場對帳"
                value={done.length.toLocaleString()}
                sub={`進行中 ${live.length}｜未開賽 ${pending.length - live.length}`}
              />
              <Stat
                label="診斷軌 RPS（紅燈五大）"
                value={diag ? diag.rps_avg.toFixed(4) : "—"}
                sub={diag ? `${diag.n} 場 · 首選中 ${pc(diag.argmax_hit_rate)}` : "尚無完場樣本"}
              />
            </div>
          </>
        )}
      </Card>

      <Card title="預測 vs 賽果（只讀凍結列）" en="Prediction vs Result">
        {log.isLoading ? (
          <Loading label="讀取逐場對帳" />
        ) : log.error ? (
          <ErrorNote error={log.error} />
        ) : all.length === 0 ? (
          <Empty label="帳內尚無場次（凍結器每日跑，賽程入庫後補）" />
        ) : (
          <>
            <div className="space-y-1.5">
              <Seg
                value={lg}
                onChange={setLg}
                options={[{ value: "big5", label: "五大聯賽" }, { value: "all", label: "全部聯賽" }, ...leagues]}
              />
              <Seg
                value={day}
                onChange={setDay}
                options={[{ value: "all", label: "全部日期" }, ...days.map((d) => ({ value: d, label: d.slice(5) }))]}
              />
              <Seg
                value={ph}
                onChange={setPh}
                options={[
                  { value: "all" as const, label: "全部狀態" },
                  { value: "done" as const, label: `已結算 ${done.length}` },
                  { value: "live" as const, label: `進行中 ${live.length}` },
                  { value: "upcoming" as const, label: `未開賽 ${pending.length - live.length}` },
                ]}
              />
            </div>
            {shown.length === 0 ? (
              <div className="mt-2">
                <Empty label="呢個篩選冇場次" />
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {shown.slice(0, 40).map((r) => (
                  <MatchCard key={r.match_key} r={r} />
                ))}
              </div>
            )}
          </>
        )}
        <p className="mt-2 text-[10px] leading-relaxed text-ink-3">
          呢張帳只 join 凍結列，唔會用最新模型重打已完場；差預測同虧損期一律不刪不改。主數字係賽果落咗幾多機率
          同該場 RPS，首選中唔中只係次指標；波膽大字出一個最可能比分並標眾數中唔中，但對帳同調參一律用全格
          （實際格排第幾、實際格 log-loss），眾數命中率只讀、唔回寫參數。加時同點球另計，唔入
          90 分鐘對帳。紅燈（熱身不足）場次照顯示賽果但標「唔入戰績」，唔會同綠燈場合併計數。市場去水賠率只作診斷對照，
          永不入模（market_beta = 0）。同一張卡由「未開賽」→「進行中 · 預測已鎖定」→「已結算」，賽事進行期間唔顯示即時
          比分，亦唔會預先畫 ✓。
        </p>
      </Card>
    </>
  );
}
