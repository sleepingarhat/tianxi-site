import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Card, Empty, ErrorNote, Loading, Pill, Seg, Stat, StatGrid } from "@/components/tx/ui";
import { SECOND_LAYER, legOutcome, recommend } from "@/lib/footballSecondLayer";
import { explainMatch, EXPLAIN } from "@/lib/footballExplain";
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

const pc = (v: number | undefined, d = 1) => (v == null ? "\u2014" : `${(v * 100).toFixed(d)}%`);
const RES_ZH: Record<string, string> = { home: "\u4e3b\u52dd", draw: "\u548c\u5c40", away: "\u5ba2\u52dd" };
const BIG5 = ["E0", "D1", "SP1", "I1", "F1"];
const isGreen = (r: LogRec) => r.status !== "fallback" && !!r.locked_at;

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
    : "\u2014";

function monthKey(offset = 0) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + offset);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function readJson<T>(query: string): Promise<T> {
  const res = await fetch(`/api/public/football-predictions?${query}`);
  if (!res.ok) throw new Error(`\u8f09\u5165\u5931\u6557 ${res.status}`);
  return (await res.json()) as T;
}

function MatchCard({ r }: { r: LogRec }) {
  const res = r.result ?? null;
  const phase = phaseOf(r);
  const p = r.p ?? [];
  const green = isGreen(r);
  const inLedger = green && BIG5.includes(r.div);
  const actualIdx = res ? ({ home: 0, draw: 1, away: 2 }[res.ftr] ?? -1) : -1;
  const predIdx = p.length === 3 ? argmaxSide(p) : -1;
  const lam = r.lambda ?? [];
  const rec =
    p.length === 3 && lam.length === 2
      ? recommend([lam[0]!, lam[1]!], [p[0]!, p[1]!, p[2]!])
      : null;
  const legRes = rec && res ? legOutcome(res.ft_h, res.ft_a, rec.sideHome, rec.line) : null;
  const actualScore = res ? `${res.ft_h}-${res.ft_a}` : "";
  const expl = explainMatch({
    p,
    lambda: lam,
    exp: r.cs?.exp ?? r.lambda,
    status: r.status,
    lockedAt: r.locked_at,
    track: r.track,
    inLedger,
    result: res,
  });
  const top8 = r.cs?.top8 ?? [];
  const hitCell = top8.find((c) => c.score === actualScore);
  const topCell = top8[0] ?? null;
  const modeHit = !!res && !!topCell && topCell.score === actualScore;
  const phasePill =
    phase === "done"
      ? { tone: "gold" as const, label: "\u5df2\u7d50\u7b97" }
      : phase === "live"
        ? { tone: "gold" as const, label: "\u9032\u884c\u4e2d \u00b7 \u9810\u6e2c\u5df2\u9396\u5b9a" }
        : { tone: "ink" as const, label: `\u672a\u958b\u8cfd \u00b7 ${hkTime(r.kickoff_utc)}` };

  return (
    <article className="rounded-[10px] border border-hairline bg-paper px-2.5 py-2.5">
      <header className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className="font-serif-tc text-[13px] font-bold text-ink">
          {teamZh(r.div, r.home)} <span className="text-ink-3">\u5c0d</span> {teamZh(r.div, r.away)}
        </span>
        <Pill tone="ink">{r.league_zh ?? r.div}</Pill>
        <Pill tone={green ? "win" : "lose"}>{green ? "\u7da0\u71c8 \u00b7 \u5df2\u9396" : "\u7d05\u71c8 \u00b7 \u71b1\u8eab\u4e0d\u8db3"}</Pill>
        <Pill tone={phasePill.tone}>{phasePill.label}</Pill>
        {inLedger ? null : <Pill tone="ink">\u5514\u5165\u6230\u7e3e</Pill>}
      </header>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded-[8px] border border-hairline bg-paper-2 px-2 py-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3">\u51cd\u7d50\u9810\u6e2c\uff08\u958b\u6ce2\u524d\u5df2\u9396\uff09</p>
          <div className="mt-1.5 space-y-1">
            {["home", "draw", "away"].map((k, i) => {
              const v = p[i] ?? 0;
              const hit = i === actualIdx;
              return (
                <div key={k} className="flex items-center gap-1.5">
                  <span className={`w-8 text-[10px] font-bold ${hit ? "text-win" : "text-ink-2"}`}>{RES_ZH[k]}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-[2px] bg-hairline">
                    <span className={`block h-full ${hit ? "bg-win" : "bg-ink-3/50"}`} style={{ width: `${Math.round(v * 100)}%` }} />
                  </span>
                  <span className="tabnum w-10 text-right font-mono-tx text-[10px] text-ink">{pc(v, 0)}</span>
                  <span className="w-3 text-[10px] text-win">{hit ? "\u25cf" : ""}</span>
                </div>
              );
            })}
          </div>
          {predIdx >= 0 ? (
            <div className="mt-2 rounded-[7px] border border-hairline bg-paper px-2 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3">\u5c0d\u5916\u9810\u6e2c\uff08\u4e09\u683c\u6700\u9ad8\u8005\uff09</p>
              <p className="mt-0.5 font-serif-tc text-[20px] font-bold leading-none text-deep">
                {RES_ZH[["home", "draw", "away"][predIdx]!]}
                <span className="tabnum ml-1.5 font-mono-tx text-[10px] font-normal text-ink-2">{pc(p[predIdx] ?? 0, 1)}</span>
                {res ? (
                  <span className={`ml-1.5 text-[11px] ${predIdx === actualIdx ? "text-win" : "text-ink-3"}`}>
                    {predIdx === actualIdx ? "\u25cf \u4e2d" : "\u25cb \u5514\u4e2d"}
                  </span>
                ) : null}
              </p>
              <p className="tabnum mt-1 font-mono-tx text-[9px] text-ink-3">{expl.why}</p>
              {expl.closeTag ? (
                <p className="mt-1 rounded-[5px] border border-deep/20 bg-paper-2 px-1.5 py-1 text-[9px] leading-relaxed text-ink-2">
                  {expl.closeTag}
                  <span className="mt-0.5 block text-ink-3">\u6a19\u7c64\u5514\u6539\u9810\u6e2c\u5b57\u3001\u5514\u5165\u5c0d\u5e33\u3002</span>
                </p>
              ) : null}
              {top8.length > 0 ? (
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-[9px] font-bold text-ink-3">\u5c55\u958b\u6ce2\u81bd\u683c\uff08\u53ea\u4f5c\u8a3a\u65b7\uff0c\u5c0d\u5e33\u8207\u8a13\u7df4\u4e00\u5f8b\u7528\u5168\u683c\uff09</summary>
                  <p className="tabnum mt-1 font-mono-tx text-[10px] text-ink-2">
                    \u6700\u9ad8\u683c {topCell ? topCell.score.replace("-", ":") : "\u2014"}
                    {topCell ? `（${pc(topCell.p, 1)}）` : ""}
                    {res ? (modeHit ? " \u00b7 \u773e\u6578\u4e2d" : " \u00b7 \u773e\u6578\u5514\u4e2d") : ""}
                  </p>
                  <ul className="mt-1 grid grid-cols-4 gap-1">
                    {top8.map((c) => (
                      <li key={c.score} className={`rounded-[5px] border px-1 py-1 text-center ${c.score === actualScore ? "border-win/60 bg-win/10" : "border-hairline bg-paper-2"}`}>
                        <p className="tabnum font-mono-tx text-[10px] font-bold text-ink">{c.score.replace("-", ":")}</p>
                        <p className="tabnum font-mono-tx text-[9px] text-ink-3">{pc(c.p, 1)}</p>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              <p className="mt-1.5 text-[9px] leading-relaxed text-ink-3">\u4e3b／\u548c／\u5ba2\u4fc2\u540c\u4e00\u5f35\u51cd\u7d50\u77e9\u9663\u52a0\u7e3d\uff08P_H\u3001P_D\u3001P_A\uff09，\u9810\u6e2c\u5b57\u53d6\u6700\u9ad8\u8005\uff1b\u6ce2\u81bd\u53ea\u4fc2\u540c\u4e00\u5f35\u77e9\u9663\u5605\u55ae\u683c，\u6536\u8d77\u5514\u5c0d\u5916\u5831\u3002</p>
              {rec ? (
                <div className="mt-1.5 rounded-[6px] border border-deep/25 bg-paper-2 px-2 py-1.5">
                  <p className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3">
                    <span>\u7b2c\u4e8c\u5c64 \u00b7 \u63a8\u85a6\u7d50\u7b97</span>
                    <span className="tabnum font-mono-tx normal-case tracking-normal">{rec.bucketZh}</span>
                  </p>
                  <p className="mt-0.5 font-serif-tc text-[13px] font-bold leading-none text-deep">
                    {rec.label(teamZh(r.div, r.home), teamZh(r.div, r.away))}
                    {legRes ? (
                      <span className={`ml-1.5 font-mono-tx text-[10px] font-normal ${legRes === "win" ? "text-win" : legRes === "push" ? "text-ink-2" : "text-ink-3"}`}>
                        {legRes === "win" ? "\u25cf \u8d0f" : legRes === "push" ? "\u25d0 \u8d70\u6c34" : "\u25cb \u8f38"}
                      </span>
                    ) : null}
                  </p>
                  <p className="tabnum mt-1 font-mono-tx text-[9px] text-ink-3">
                    \u77e9\u9663\u52a0\u7e3d\uff1a\u8d0f {pc(rec.leg.win, 1)}
                    {rec.line !== 0 ? ` \u00b7 \u8d70\u6c34 ${pc(rec.leg.push, 1)}` : ""} \u00b7 \u8f38 {pc(rec.leg.lose, 1)}
                  </p>
                  <p className="mt-1 text-[9px] leading-relaxed text-ink-3">\u7b2c\u4e8c\u5c64\u7368\u7acb\u4e00\u6b04\u8a08\u6578\uff1a\u22121／+1 \u8d0f\u5514\u7576 1X2 中，1X2 中亦\u5514\u7576\u7b2c\u4e8c\u5c64\u8d0f\u3002\u7b2c\u4e8c\u5c64\u5514\u6703\u51fa\u548c\u3002</p>
                </div>
              ) : null}
            </div>
          ) : null}
          <p className="mt-1 break-all font-mono-tx text-[9px] text-ink-3">\u6307\u7d0b {r.fingerprint ?? "\u2014"}\uff5c\u8ecc {r.track ?? "\u2014"}</p>
        </div>
        <div className="rounded-[8px] border border-hairline bg-paper-2 px-2 py-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3">90 \u5206\u9418\u8cfd\u679c\uff08\u52a0\u6642／\u9ede\u7403\u53e6\u8a08\uff09</p>
          {res ? (
            <>
              <p className="tabnum mt-1.5 font-mono-tx text-[20px] font-bold leading-none text-deep">
                {actualScore}
                <span className="ml-1.5 text-[10px] font-normal text-ink-2">{RES_ZH[res.ftr]}</span>
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono-tx text-[10px]">
                <span className="text-ink-3">\u672c\u5834 RPS \u2193</span>
                <span className="tabnum text-right text-ink">{res.rps?.toFixed(4) ?? "\u2014"}</span>
                <span className="text-ink-3">\u8cfd\u679c\u843d\u5497\u5e7e\u591a\u6a5f\u7387</span>
                <span className="tabnum text-right text-ink">{pc(res.p_actual, 1)}</span>
                <span className="text-ink-3">\u6ce2\u81bd\u7b2c\u5e7e\u683c</span>
                <span className="tabnum text-right text-ink">{res.cs_rank ? `\u7b2c ${res.cs_rank} \u683c` : "\u8dcc\u51fa\u982d\u516b\u683c"}</span>
                <span className="text-ink-3">\u8a72\u683c\u51cd\u7d50\u6a5f\u7387</span>
                <span className="tabnum text-right text-ink">{hitCell ? pc(hitCell.p, 1) : "\u2014"}</span>
              </div>
              <p className="mt-1.5">
                <Pill tone={res.cs_rank ? "win" : "ink"}>{res.cs_rank ? `\u982d\u516b\u683c\u5167\u4e2d\uff08\u7b2c ${res.cs_rank}\uff09` : "\u982d\u516b\u683c\u5916"}</Pill>
              </p>
              {expl.settled ? (
                <p className="tabnum mt-1.5 font-mono-tx text-[9px] leading-relaxed text-ink-3">{expl.settled}</p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-1.5 font-serif-tc text-[15px] font-bold leading-tight text-ink-2">{phase === "live" ? "\u9032\u884c\u4e2d \u00b7 \u9810\u6e2c\u5df2\u9396\u5b9a" : "\u672a\u958b\u8cfd"}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-ink-3">
                {phase === "live"
                  ? "\u6bd4\u8cfd\u9032\u884c\u671f\u9593\u5514\u986f\u793a\u5373\u6642\u6bd4\u5206\uff1a\u5c0d\u5e33\u55ae\u4f4d\u4fc2 90 \u5206\u9418\u5b8c\u5834\u8cfd\u679c，\u51cd\u7d50\u6a5f\u7387\u6c38\u9060\u5514\u6703\u8cfd\u4e2d\u66f4\u65b0\u3002\u5b8c\u5834\u4e26\u7d50\u7b97\u5f8c，\u5462\u5f35\u5361\u6703\u81ea\u52d5\u8f49\u300c\u5df2\u7d50\u7b97\u300d\u3002"
                  : `\u958b\u8cfd\u6642\u9593 ${hkTime(r.kickoff_utc)}\uff08\u9999\u6e2f\uff09\u3002${r.locked_at ? "\u5df2\u9396\u5b9a，\u958b\u8cfd\u524d 60 \u5206\u9418\u5b9a\u6848\u3002" : "\u958b\u8cfd\u524d 60 \u5206\u9418\u9396\u5b9a，\u9396\u5b9a\u524d\u4ecd\u53ef\u5237\u65b0\u3002"}`}
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
  const hit = useQuery<HitRate>({ queryKey: ["footballHitRate"], queryFn: () => readJson<HitRate>("file=hit_rate"), staleTime: 300_000 });
  const months = [monthKey(0), monthKey(-1)];
  const log = useQuery<LogRec[]>({
    queryKey: ["footballLedger", months.join(",")],
    queryFn: async () => {
      const files = await Promise.all(
        months.map(async (m) => {
          try { return await readJson<LogFile>(`file=log&month=${m}`); }
          catch { return { matches: {} } as LogFile; }
        }),
      );
      return files.flatMap((f) => Object.values(f.matches ?? {}));
    },
    staleTime: 300_000,
  });
  const all = useMemo(() => (log.data ?? []).slice().sort((a, b) => (b.kickoff_utc ?? "").localeCompare(a.kickoff_utc ?? "")), [log.data]);
  const done = useMemo(() => all.filter((r) => r.result), [all]);
  const live = useMemo(() => all.filter((r) => phaseOf(r) === "live"), [all]);
  const pending = all.filter((r) => !r.result);
  const lockedCount = all.filter((r) => r.locked_at).length;
  const days = useMemo(() => Array.from(new Set(all.map((r) => (r.kickoff_utc ?? "").slice(0, 10)).filter(Boolean))), [all]);
  const leagues = useMemo(() => {
    const m = new Map<string, string>();
    all.forEach((r) => m.set(r.div, r.league_zh ?? r.div));
    return Array.from(m, ([value, label]) => ({ value, label }));
  }, [all]);
  const shown = all.filter((r) => (day === "all" || (r.kickoff_utc ?? "").slice(0, 10) === day) && (lg === "all" ? true : lg === "big5" ? BIG5.includes(r.div) : r.div === lg) && (ph === "all" || phaseOf(r) === ph));
  const secondLayer = useMemo(() => {
    let n = 0, win = 0, push = 0, lose = 0, predWin = 0;
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
      if (o === "win") win += 1; else if (o === "push") push += 1; else lose += 1;
    }
    return { n, win, push, lose, cov, predWin: n ? predWin / n : 0, actWin: n ? win / n : 0 };
  }, [all]);
  const green = hit.data?.green ?? null;
  const diag = hit.data?.diagnostic_big5_all_lights ?? null;
  return (
    <>
      <Card title="\u9010\u5834\u51cd\u7d50\u5e33\uff08S13\uff09" en="Frozen Ledger">
        {hit.isLoading ? <Loading label="\u8b80\u53d6\u51cd\u7d50\u5e33" /> : hit.error ? <ErrorNote error={hit.error} /> : (
          <>
            <StatGrid cols={3}>
              <Stat label="\u5e73\u5747 RPS \u2193\uff08\u5165\u5e33\u5834\u6b21\uff09" value={green ? green.rps_avg.toFixed(4) : "\u672a\u958b\u5e33"} sub={`\u57fa\u6e96 ${hit.data?.baselines.prior_asof ?? 0.2261}\uff0f\u5e02\u5834\u53bb\u6c34 ${hit.data?.baselines.market_devig ?? 0.2047}`} />
              <Stat label="1X2 \u6821\u6e96" value={green ? pc(green.ece, 2) : "\u672a\u958b\u5e33"} sub="\u6a21\u578b\u8b1b\u5e7e\u6210，\u5be6\u969b\u5e7e\u6210" />
              <Stat label="\u5165\u5e33\u6a23\u672c" value={green ? green.n.toLocaleString() : "0"} sub={green?.fingerprints?.length ? `\u6307\u7d0b ${green.fingerprints.join("\u3001")}` : "\u6307\u7d0b\uff1a\u5f85\u7da0\u71c8"} />
            </StatGrid>
            <div className="mt-2 rounded-[8px] border border-deep/25 bg-paper px-2.5 py-2">
              <p className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3">
                <span>\u7b2c\u4e8c\u5c64 \u00b7 \u63a8\u85a6\u7d50\u7b97\u6230\u7e3e\uff08\u7368\u7acb\u4e00\u6b04\uff09</span>
                <span className="tabnum font-mono-tx normal-case tracking-normal">τ={SECOND_LAYER.tau.toFixed(2)} δ={SECOND_LAYER.delta.toFixed(2)}</span>
              </p>
              <div className="mt-1.5 grid gap-1 font-mono-tx text-[10px] sm:grid-cols-2">
                <span className="text-ink-3">\u8d0f <b className="tabnum text-ink">{secondLayer.n ? secondLayer.win : "\u2014"}</b>\uff0f\u8d70\u6c34 <b className="tabnum text-ink">{secondLayer.n ? secondLayer.push : "\u2014"}</b>\uff0f\u8f38 <b className="tabnum text-ink">{secondLayer.n ? secondLayer.lose : "\u2014"}</b></span>
                <span className="text-ink-3">\u7d50\u7b97\u6a23\u672c <b className="tabnum text-ink">{secondLayer.n}</b> \u5834\uff08\u7da0\u71c8\u5df2\u9396 \u00b7 \u4e94\u5927\uff09</span>
                <span className="text-ink-3">\u77e9\u9663\u96b1\u542b\u8d0f\u7387 <b className="tabnum text-ink">{secondLayer.n ? pc(secondLayer.predWin, 1) : "\u2014"}</b></span>
                <span className="text-ink-3">\u5be6\u969b\u8d0f\u7387 <b className="tabnum text-ink">{secondLayer.n ? pc(secondLayer.actWin, 1) : "\u2014"}</b></span>
                <span className="text-ink-3">\u8986\u84cb \u4e00\u9762\u5012 <b className="tabnum text-ink">{secondLayer.cov[0]}</b>\uff0f\u8fd1\u76e4 <b className="tabnum text-ink">{secondLayer.cov[1]}</b>\uff0f\u5176\u9918 <b className="tabnum text-ink">{secondLayer.cov[2]}</b></span>
              </div>
              <p className="mt-1 text-[9px] leading-relaxed text-ink-3">\u7b2c\u4e8c\u5c64\u53ea\u51fa\u4e00\u53e5\u7d50\u7b97，\u5514\u6539\u4e0a\u9762\u4e09\u683c\u3001\u5514\u6539\u77e9\u9663\u3001\u5514\u5347\u6307\u7d0b，\u76e4\u53e3\u6b0a\u91cd\u6c38\u9060 0\u3002\u89e3\u91cb\u53e5\u7531\u51cd\u7d50\u5217\u52a0\u7e3d，\u5514\u53e6\u958b\u6a21\u578b\uff1b\u8fd1\u76e4\u6a19\u7c64\u9598 |P_H\u2212P_A|\uff1c{EXPLAIN.closeGap}\u3002</p>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-ink-2">\u5165\u5e33\u7bc4\u570d\uff1a\u4e94\u5927\u806f\u8cfd\u3001\u7da0\u71c8\u4e14\u5df2\u9396\u5834\u6b21\u3002\u9010\u5834\u9396\u5b9a\uff1d\u958b\u8cfd\u524d 60 \u5206\u9418\u3002\u5df2\u9396\u5834\u6b21\u6c38\u9060\u8ddf\u7576\u6642\u6307\u7d0b\u3002\u5e02\u5834\u53bb\u6c34\u8ce0\u7387\u53ea\u4f5c\u8a3a\u65b7\u5c0d\u7167，\u6c38\u4e0d\u5165\u6a21\uff08market_beta = 0\uff09\u3002</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <Stat label="\u5e33\u5167\u5834\u6b21" value={(log.data?.length ?? 0).toLocaleString()} sub={`\u5df2\u9396 ${lockedCount}`} />
              <Stat label="\u5df2\u5b8c\u5834\u5c0d\u5e33" value={done.length.toLocaleString()} sub={`\u9032\u884c\u4e2d ${live.length}\uff5c\u672a\u958b\u8cfd ${pending.length - live.length}`} />
              <Stat label="\u8a3a\u65b7\u8ecc RPS\uff08\u7d05\u71c8\u4e94\u5927\uff09" value={diag ? diag.rps_avg.toFixed(4) : "\u2014"} sub={diag ? `${diag.n} \u5834 \u00b7 \u9996\u9078\u4e2d ${pc(diag.argmax_hit_rate)}` : "\u5c1a\u7121\u5b8c\u5834\u6a23\u672c"} />
            </div>
          </>
        )}
      </Card>
      <Card title="\u9810\u6e2c vs \u8cfd\u679c\uff08\u53ea\u8b80\u51cd\u7d50\u5217\uff09" en="Prediction vs Result">
        {log.isLoading ? <Loading label="\u8b80\u53d6\u9010\u5834\u5c0d\u5e33" /> : log.error ? <ErrorNote error={log.error} /> : all.length === 0 ? <Empty label="\u5e33\u5167\u5c1a\u7121\u5834\u6b21\uff08\u51cd\u7d50\u5668\u6bcf\u65e5\u8dd1，\u8cfd\u7a0b\u5165\u5eab\u5f8c\u88dc\uff09" /> : (
          <>
            <div className="space-y-1.5">
              <Seg value={lg} onChange={setLg} options={[{ value: "big5", label: "\u4e94\u5927\u806f\u8cfd" }, { value: "all", label: "\u5168\u90e8\u806f\u8cfd" }, ...leagues]} />
              <Seg value={day} onChange={setDay} options={[{ value: "all", label: "\u5168\u90e8\u65e5\u671f" }, ...days.map((d) => ({ value: d, label: d.slice(5) }))]} />
              <Seg value={ph} onChange={setPh} options={[{ value: "all" as const, label: "\u5168\u90e8\u72c0\u614b" }, { value: "done" as const, label: `\u5df2\u7d50\u7b97 ${done.length}` }, { value: "live" as const, label: `\u9032\u884c\u4e2d ${live.length}` }, { value: "upcoming" as const, label: `\u672a\u958b\u8cfd ${pending.length - live.length}` }]} />
            </div>
            {shown.length === 0 ? <div className="mt-2"><Empty label="\u5462\u500b\u7be9\u9078\u5187\u5834\u6b21" /></div> : (
              <div className="mt-2 space-y-2">{shown.slice(0, 40).map((r) => <MatchCard key={r.match_key} r={r} />)}</div>
            )}
          </>
        )}
        <p className="mt-2 text-[10px] leading-relaxed text-ink-3">\u5462\u5f35\u5e33\u53ea join \u51cd\u7d50\u5217，\u5514\u6703\u7528\u6700\u65b0\u6a21\u578b\u91cd\u6253\u5df2\u5b8c\u5834\u3002\u7d05\u71c8\u5834\u6b21\u7167\u986f\u793a\u8cfd\u679c\u4f46\u6a19\u300c\u5514\u5165\u6230\u7e3e\u300d\u3002market_beta = 0\u3002</p>
      </Card>
    </>
  );
}
