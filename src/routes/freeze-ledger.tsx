import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/tx/AppShell";
import {
  Card,
  Disclaimer,
  Empty,
  ErrorNote,
  Loading,
  PageHead,
  Pill,
  Scroller,
  Table,
  Td,
} from "@/components/tx/ui";
import { KV } from "@/components/tx/viz";
import { fmtMeetingDate, num } from "@/lib/tx-api";

type LedgerRace = {
  raceNumber: number;
  runners: number;
  predictedTop4: number[];
  actualTop4: number[];
  top4Intersect: number | null;
  top3Intersect: number | null;
  placeHits: number | null;
  placeSlots: number;
  winnerHit: boolean | null;
  modelWinLogloss: number | null;
  marketWinLogloss: number | null;
  flatWinPnl: number | null;
};

type LedgerMeeting = {
  date: string;
  venue: string | null;
  locked: boolean;
  source: string;
  racesEvaluated: number;
  top4AvgIntersect: number | null;
  top4CoveragePct: number | null;
  top4FullHits: number;
  top3AvgIntersect: number | null;
  top3AnyHitPct: number | null;
  placeHitPct: number | null;
  winnerHitPct: number | null;
  modelWinLogloss: number | null;
  marketWinLogloss: number | null;
  favouriteHitPct: number | null;
  flatWinRoiPct: number | null;
  races: LedgerRace[];
};

type Ledger = {
  engine?: string;
  policy?: string;
  meetings?: LedgerMeeting[];
  season?: Omit<LedgerMeeting, "date" | "venue" | "locked" | "source" | "races"> & { meetings: number };
};

const SOURCE_LABEL: Record<string, string> = {
  prediction_log: "已鎖凍結",
  "not-locked": "未鎖（唔入表）",
  "missing-log": "凍結底未齊",
  "no-results": "未有賽果",
};

export const Route = createFileRoute("/freeze-ledger")({
  head: () => ({
    meta: [
      { title: "凍結對帳表 · 天喜 TIANXI" },
      {
        name: "description",
        content: "只讀已鎖凍結四揀，逐場量四揀入圍、頭四覆蓋、平均相交同位置命中；獨贏與市場隱含只作旁註。",
      },
      { property: "og:title", content: "凍結對帳表 · 天喜 TIANXI" },
      { property: "og:description", content: "先量後改：主尺四揀相交，副尺位置命中，市場隱含 logloss 只旁註，唔回寫模型。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FreezeLedgerPage,
});

function FreezeLedgerPage() {
  const q = useQuery<Ledger>({
    queryKey: ["freezeLedger"],
    queryFn: async () => {
      const res = await fetch("/api/public/freeze-ledger?since=2026-09-01");
      if (!res.ok) throw new Error(`對帳表暫時讀唔到（${res.status}）`);
      return (await res.json()) as Ledger;
    },
    staleTime: 120_000,
  });

  const meetings = q.data?.meetings ?? [];
  const graded = meetings.filter((m) => m.racesEvaluated > 0);
  const season = q.data?.season;

  return (
    <AppShell page="engine" ticker="凍結對帳表 · 只讀已鎖凍結 · 先量、唔改模型">
      <PageHead
        en="Freeze Ledger"
        title="凍結對帳表"
        desc="只讀已鎖 prediction_log —— 禁回測、禁 live 重算。主尺係四揀（入圍數／頭四覆蓋／平均相交），Top3 旁註；副尺係位置命中。獨贏頭馬同市場隱含 logloss、模擬 EV 只作旁註，用嚟知市場有幾硬，唔會回寫模型或指紋。"
      />

      <Card title="開季累積" en="Season">
        {q.isLoading ? (
          <Loading />
        ) : q.error ? (
          <ErrorNote error={q.error} />
        ) : !graded.length ? (
          <Empty label="暫未有已鎖並完場嘅賽日 —— 表殼已起好，數等賽果入庫後自動填" />
        ) : (
          <div className="space-y-2.5">
            <div className="rounded-[10px] border border-hairline bg-paper px-2.5 py-1.5">
              <p className="mb-1 font-mono-tx text-[9px] font-bold uppercase tracking-[0.2em] text-ink-3">主尺 · 四揀</p>
              <KV k="平均相交（四揀入實際頭四）" v={`${num(season?.top4AvgIntersect, 2)}／4`} />
              <KV k="頭四覆蓋" v={num(season?.top4CoveragePct) + "%"} />
              <KV k="四揀全中場數" v={`${season?.top4FullHits ?? 0} 場`} />
              <KV k="評核樣本" v={`${season?.racesEvaluated ?? 0} 場 / ${season?.meetings ?? 0} 日`} />
            </div>
            <div className="rounded-[10px] border border-hairline bg-paper px-2.5 py-1.5">
              <p className="mb-1 font-mono-tx text-[9px] font-bold uppercase tracking-[0.2em] text-ink-3">旁註 · Top3 ／ 副尺 · 位置</p>
              <KV k="Top3 平均相交" v={`${num(season?.top3AvgIntersect, 2)}／3`} />
              <KV k="Top3 任中" v={num(season?.top3AnyHitPct) + "%"} />
              <KV k="位置命中（四揀入位置）" v={num(season?.placeHitPct) + "%"} />
            </div>
            <div className="rounded-[10px] border border-hairline bg-paper px-2.5 py-1.5">
              <p className="mb-1 font-mono-tx text-[9px] font-bold uppercase tracking-[0.2em] text-ink-3">旁註 · 市場硬度（唔用嚟改模型）</p>
              <KV k="獨贏頭馬命中" v={num(season?.winnerHitPct) + "%"} />
              <KV k="市場大熱命中" v={num(season?.favouriteHitPct) + "%"} />
              <KV k="模型獨贏 logloss" v={num(season?.modelWinLogloss, 3)} />
              <KV k="扣水隱含 logloss" v={num(season?.marketWinLogloss, 3)} />
              <KV k="模擬平注 EV（首選獨贏）" v={num(season?.flatWinRoiPct) + "%"} />
            </div>
            <p className="text-[11px] leading-relaxed text-ink-3">
              樣本仍然細，呢張表只出數、唔下「有邊／冇邊」結論。四選才係主尺；獨贏欄係量市場硬度，唔係優化目標。
            </p>
          </div>
        )}
      </Card>

      <Card title="逐賽日" en="By Meeting">
        {q.isLoading ? (
          <Loading />
        ) : meetings.length ? (
          <Scroller>
            <Table head={["賽日", "狀態", "場", "平均相交", "頭四覆蓋", "全中", "Top3", "位置", "頭馬", "模型LL", "市場LL", "EV"]}>
              {meetings.map((m) => (
                <tr key={`${m.date}-${m.venue ?? ""}`} className="border-b border-hairline">
                  <Td first>
                    <Link to="/results" search={{ date: m.date }} className="font-serif-tc text-[12px] font-bold">
                      {fmtMeetingDate(m.date)}
                    </Link>
                    <span className="ml-1 font-mono-tx text-[9px] text-ink-3">
                      {m.venue === "HV" ? "跑馬地" : m.venue === "ST" ? "沙田" : "—"}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-mono-tx text-[9px] text-ink-3">{SOURCE_LABEL[m.source] ?? m.source}</span>
                  </Td>
                  <Td>{m.racesEvaluated || "—"}</Td>
                  <Td className="font-bold">{num(m.top4AvgIntersect, 2)}</Td>
                  <Td>{num(m.top4CoveragePct) + "%"}</Td>
                  <Td>{m.racesEvaluated ? m.top4FullHits : "—"}</Td>
                  <Td>{num(m.top3AvgIntersect, 2)}</Td>
                  <Td>{num(m.placeHitPct) + "%"}</Td>
                  <Td>{num(m.winnerHitPct) + "%"}</Td>
                  <Td>{num(m.modelWinLogloss, 3)}</Td>
                  <Td>{num(m.marketWinLogloss, 3)}</Td>
                  <Td>{num(m.flatWinRoiPct) + "%"}</Td>
                </tr>
              ))}
            </Table>
          </Scroller>
        ) : (
          <Empty label="暫無已鎖賽日" />
        )}
      </Card>

      {graded.map((m) => (
        <Card key={`races-${m.date}`} title={`逐場明細 · ${fmtMeetingDate(m.date)}`} en="Per Race">
          <Scroller>
            <Table head={["場", "四揀", "實際頭四", "相交", "位置", "頭馬", "模型LL", "市場LL", "平注"]}>
              {m.races.map((r) => (
                <tr key={r.raceNumber} className={`border-b border-hairline ${(r.top4Intersect ?? 0) >= 3 ? "bg-win/5" : ""}`}>
                  <Td first>{r.raceNumber}</Td>
                  <Td>
                    <span className="font-mono-tx text-[10px]">{r.predictedTop4.join(" · ")}</span>
                  </Td>
                  <Td>
                    <span className="font-mono-tx text-[10px] text-ink-2">{r.actualTop4.join(" · ") || "—"}</span>
                  </Td>
                  <Td className={(r.top4Intersect ?? 0) >= 3 ? "font-bold text-win" : "font-bold"}>
                    {r.top4Intersect == null ? "—" : `${r.top4Intersect}／4`}
                  </Td>
                  <Td>{r.placeHits == null ? "—" : `${r.placeHits}／${r.placeSlots}`}</Td>
                  <Td>{r.winnerHit == null ? "—" : r.winnerHit ? "中" : "—"}</Td>
                  <Td>{num(r.modelWinLogloss, 3)}</Td>
                  <Td>{num(r.marketWinLogloss, 3)}</Td>
                  <Td>{r.flatWinPnl == null ? "—" : `${r.flatWinPnl > 0 ? "+" : ""}${num(r.flatWinPnl, 1)}`}</Td>
                </tr>
              ))}
            </Table>
          </Scroller>
        </Card>
      ))}

      <Card title="呢張表唔做嘅事" en="Out of Scope">
        <div className="space-y-1.5 text-[12px] leading-relaxed text-ink-2">
          <p>· 唔做 α／τ refit、唔加特徵、唔換模型（CatBoost 等）。</p>
          <p>· 模擬 EV 永不寫入健康頁當 PASS —— 健康頁只守結構閘。</p>
          <p>· 未鎖賽日一律唔入表（標「未鎖」）；完場只 join 名次，凍結欄唔改。</p>
          <p>· 鎖後變更 overlay 同少仗紅燈規則繼續待辦，等呢張表有數先決定開唔開。</p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Link
            to="/track-record"
            className="rounded-[6px] border border-hairline bg-paper px-3 py-2 text-[12px] font-bold text-ink"
          >
            公開戰績 →
          </Link>
          <Pill tone="gold">先量、唔改模型</Pill>
        </div>
      </Card>

      <Disclaimer extra="本頁全部數字來自已鎖凍結預測（prediction_log，variant=baseline）對官方賽果，未經任何賽後重算。市場欄用最終獨贏賠率計扣水後隱含機率，只作市場硬度旁註。" />
    </AppShell>
  );
}
