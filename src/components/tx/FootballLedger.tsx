import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { Card, Empty, ErrorNote, Loading, Pill, Scroller, Stat, StatGrid, Table, Td } from "@/components/tx/ui";

/** S13 逐場凍結帳：一場一條，鎖後預測欄永不改；完場只 join 賽果，禁止用最新模型重打。 */

type Agg = {
  n: number;
  rps_avg: number;
  argmax_hit_rate: number;
  ece: number;
  cs_top1: number;
  cs_top3: number;
  cs_top8: number;
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

type LogRec = {
  match_key: string;
  div: string;
  league_zh?: string;
  home: string;
  away: string;
  kickoff_utc?: string;
  locked_at?: string | null;
  status?: string;
  fingerprint?: string;
  p?: number[];
  cs?: { top8?: { score: string; p: number }[] };
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

export function FootballLedger() {
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

  const done = useMemo(
    () =>
      (log.data ?? [])
        .filter((r) => r.result)
        .sort((a, b) => (b.kickoff_utc ?? "").localeCompare(a.kickoff_utc ?? "")),
    [log.data],
  );
  const pending = (log.data ?? []).filter((r) => !r.result);
  const lockedCount = (log.data ?? []).filter((r) => r.locked_at).length;

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
                label="校準偏差 ECE"
                value={green ? pc(green.ece, 2) : "—"}
                sub="模型講幾成，實際幾成"
              />
              <Stat
                label="入帳樣本"
                value={green ? green.n.toLocaleString() : "0"}
                sub={green?.fingerprints?.length ? `指紋 ${green.fingerprints.join("、")}` : "指紋：待綠燈"}
              />
            </StatGrid>
            <p className="mt-2 text-[10px] leading-relaxed text-ink-2">
              入帳範圍：五大聯賽（{(hit.data?.scope.big5 ?? []).join("、")}）、綠燈且已鎖場次。逐場鎖定＝
              <b className="text-deep">開賽前 60 分鐘</b>；黃燈可刷新、綠燈已鎖、紅燈退回基準軌。
              每日凍結軌已接入 S5 三軌集成（S4 天喜足球LGB ＋ S3 入球模型 ＋ S2 天喜足球ELO），過三項閘門先算綠燈；
              熱身場數不足嘅場次維持紅燈基準軌，只作診斷。上面三格要等綠燈場次有咗完場賽果才會出實數，
              喺此之前一律寫「未開帳」，唔會借回測數字充當實戰成績。
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <Stat label="帳內場次" value={(log.data?.length ?? 0).toLocaleString()} sub={`已鎖 ${lockedCount}`} />
              <Stat label="已完場對帳" value={done.length.toLocaleString()} sub={`未開賽 ${pending.length}`} />
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
        ) : done.length === 0 ? (
          <Empty label="帳內尚無已完場對帳（結算器每日跑，賽果入庫後補）" />
        ) : (
          <Scroller>
            <Table head={["賽事", "凍結機率 主／和／客", "傾向", "賽果", "RPS ↓", "首選", "波膽格"]}>
              {done.slice(0, 40).map((r) => {
                const p = r.p ?? [];
                const lean = p.length === 3 ? ["home", "draw", "away"][p.indexOf(Math.max(...p))]! : "";
                const res = r.result!;
                return (
                  <tr key={r.match_key} className="border-t border-hairline">
                    <Td className="whitespace-normal">
                      <span className="font-bold text-ink">
                        {r.home} <span className="text-ink-3">對</span> {r.away}
                      </span>
                      <span className="ml-1.5">
                        <Pill tone="ink">{r.league_zh ?? r.div}</Pill>
                      </span>
                      <span className="block text-[10px] text-ink-3">
                        {(r.kickoff_utc ?? "").slice(0, 10)}｜{r.locked_at ? "已鎖" : "未鎖"}
                      </span>
                    </Td>
                    <Td className="tabnum font-mono-tx">
                      {p.length === 3 ? p.map((v) => `${(v * 100).toFixed(0)}%`).join(" / ") : "—"}
                    </Td>
                    <Td>{RES_ZH[lean] ?? "—"}</Td>
                    <Td className="tabnum font-mono-tx font-bold text-deep">
                      {res.ft_h}-{res.ft_a}
                      <span className="ml-1 text-[10px] font-normal text-ink-3">{RES_ZH[res.ftr]}</span>
                    </Td>
                    <Td className="tabnum font-mono-tx">{res.rps?.toFixed(4) ?? "—"}</Td>
                    <Td>
                      <Pill tone={res.argmax_hit ? "win" : "lose"}>{res.argmax_hit ? "中" : "唔中"}</Pill>
                      <span className="ml-1 text-[10px] text-ink-3">報 {pc(res.p_actual, 0)}</span>
                    </Td>
                    <Td className="text-[10px]">
                      {res.cs_rank ? `第 ${res.cs_rank} 格` : "跌出頭八格"}
                    </Td>
                  </tr>
                );
              })}
            </Table>
          </Scroller>
        )}
        <p className="mt-2 text-[10px] leading-relaxed text-ink-3">
          呢張表只 join 凍結列，唔會用最新模型重打已完場；差預測同虧損期一律不刪不改。主指標係實際賽果落咗幾多機率
          同該場 RPS，首選中唔中只係次指標；波膽以「實際比分排第幾格」對帳，唔用眾數打 ✓／✗。加時同點球另計，唔入
          90 分鐘對帳。市場去水賠率只作診斷對照，永不入模（market_beta = 0）。
        </p>
      </Card>
    </>
  );
}
