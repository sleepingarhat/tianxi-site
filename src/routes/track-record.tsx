import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

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
  Seg,
  Table,
  Td,
} from "@/components/tx/ui";
import { HitStrip, KpiTile, KV, Spark } from "@/components/tx/viz";
import { fmtMeetingDate, num, txApi } from "@/lib/tx-api";

export const Route = createFileRoute("/track-record")({
  head: () => ({
    meta: [
      { title: "公開戰績 · 天喜 TIANXI" },
      { name: "description", content: "每個賽日模型命中率全數公開，賽果以香港賽馬會官方為準，指標只計最終版凍結四揀。" },
      { property: "og:title", content: "公開戰績 · 天喜 TIANXI" },
      { property: "og:description", content: "永久公開對賬：四揀平均中匹數、三甲任中、位置Q、三重彩、四重彩命中率。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackRecordPage,
});

function TrackRecordPage() {
  const [days, setDays] = useState<30 | 60 | 90 | 180>(90);
  const roll = useQuery({ queryKey: ["hitRateRollup", days], queryFn: () => txApi.hitRateRollup(days) });
  const s = roll.data?.summary || roll.data;
  const meetings: any[] = (roll.data?.perMeeting || roll.data?.meetings || roll.data?.byMeeting || [])
    .slice()
    .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));
  const chrono = meetings.slice().reverse();
  const trend = chrono.map((m: any) => m.top4AvgIntersect);
  const hits = chrono.map((m: any) => (m.top4AvgIntersect == null ? null : m.top4AvgIntersect >= 3));

  return (
    <AppShell page="engine" ticker="公開戰績 · 只計最終版 · 官方賽果對賬">
      <PageHead
        en="Verified Track Record"
        title="公開戰績"
        desc="每一個賽日，模型命中率全數公開 —— 唔撿靚數，賽果以 HKJC 官方為準。指標只計最終版。"
      />

      <div className="mx-4">
        <Seg
          value={days}
          onChange={setDays}
          options={[
            { value: 30, label: "近 30 日" },
            { value: 60, label: "近 60 日" },
            { value: 90, label: "近 90 日" },
            { value: 180, label: "近半年" },
          ]}
        />
      </div>

      <Card title={`滾動統計 · 近 ${days} 日`} en="Rollup">
        {roll.isLoading ? (
          <Loading />
        ) : roll.error ? (
          <ErrorNote error={roll.error} />
        ) : (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <KpiTile
                label="四揀平均中"
                en="Top4 Avg"
                value={num(s?.top4AvgIntersect, 2)}
                unit="／4"
                ratio={s?.top4AvgIntersect != null ? Number(s.top4AvgIntersect) / 4 : null}
                tone={Number(s?.top4AvgIntersect) >= 3 ? "win" : "gold"}
                sub={`目標 3.00 · ${s?.racesEvaluated ?? 0} 場 / ${s?.meetingsEvaluated ?? 0} 日`}
                trend={trend}
                target={3}
              />
              <KpiTile
                label="前三平均中"
                en="Top3 Avg"
                value={num(s?.top3AvgIntersect, 2)}
                unit="／3"
                ratio={s?.top3AvgIntersect != null ? Number(s.top3AvgIntersect) / 3 : null}
                sub={`三甲任中 ${num(s?.top3AnyHitRate) + "%"}`}
                trend={chrono.map((m: any) => m.top3AvgIntersect)}
              />
            </div>
            <div className="rounded-[10px] border border-hairline bg-paper p-2.5">
              <p className="mb-1 text-[10px] font-bold text-ink-3">四揀平均中匹數走勢（虛線＝目標 3）</p>
              <Spark values={trend} height={46} tone={Number(s?.top4AvgIntersect) >= 3 ? "win" : "gold"} />
              <p className="mb-1.5 mt-2 text-[10px] font-bold text-ink-3">逐日達標</p>
              <HitStrip hits={hits} max={40} />
            </div>
            <div className="rounded-[10px] border border-hairline bg-paper px-2.5 py-1.5">
              <KV k="位置Q（頭兩名不計次序）" v={`${num(s?.qpHitRate) + "%"} · ${s?.qpHits ?? 0} 次`} />
              <KV k="連贏（頭兩名順序）" v={num(s?.quinellaHitRate) + "%"} />
              <KV k="三重彩（頭三名複式）" v={`${num(s?.trioHitRate) + "%"} · ${s?.trioHits ?? 0} 次`} />
              <KV k="四重彩（頭四名複式）" v={`${num(s?.first4HitRate) + "%"} · ${s?.first4Hits ?? 0} 次`} />
            </div>
          </div>
        )}
      </Card>

      <Card
        title="逐賽日對賬"
        en="By Meeting"
        action={
          <Link to="/freeze-ledger" className="font-mono-tx text-[10px] font-bold text-gold">
            凍結對帳表 →
          </Link>
        }
      >
        {roll.isLoading ? (
          <Loading />
        ) : meetings.length ? (
          <Scroller><Table head={["賽日", "場", "四揀中", "前三", "三甲", "位置Q", "三重彩", "四重彩"]}>
            {meetings.map((m: any) => (
              <tr key={`${m.date}-${m.venue}`} className={`border-b border-hairline ${(m.top4AvgIntersect ?? 0) >= 3 ? "bg-win/5" : ""}`}>
                <Td first>
                  <Link to="/results" search={{ date: m.date }} className="font-serif-tc text-[12px] font-bold">
                    {fmtMeetingDate(m.date)}
                  </Link>
                  <span className="ml-1 font-mono-tx text-[9px] text-ink-3">{m.venue === "HV" ? "跑馬地" : "沙田"}</span>
                </Td>
                <Td>{m.racesEvaluated ?? m.races ?? "—"}</Td>
                <Td className={(m.top4AvgIntersect ?? 0) >= 3 ? "font-bold text-win" : "font-bold"}>
                  {num(m.top4AvgIntersect, 2)}
                </Td>
                <Td>{num(m.top3AvgIntersect, 2)}</Td>
                <Td>{num(m.top3AnyHitRate) + "%"}</Td>
                <Td>{num(m.qpHitRate) + "%"}</Td>
                <Td>{num(m.trioHitRate) + "%"}</Td>
                <Td>{num(m.first4HitRate) + "%"}</Td>
              </tr>
            ))}
          </Table></Scroller>
        ) : (
          <Empty label="此窗口暫無已完場賽日" />
        )}
      </Card>

      <Card title="睇完成績，試一日先" en="Upgrade">
        <p className="mb-2 text-[12px] text-ink-2">
          免費對賬永久公開。想要賽前全卡預測、模型搏冷 + 市場穩陣雙欄、pWin 信心分？
        </p>
        <div className="flex items-center gap-2">
          <Link
            to="/membership"
            className="rounded-[6px] border border-gold-strong/60 bg-gold-bg px-3 py-2 text-[12px] font-bold text-gold"
          >
            升級 Pro →
          </Link>
          <Pill tone="gold">HK$38 試一日</Pill>
        </div>
      </Card>

      <Disclaimer extra="戰績只對最終版凍結四揀，「三重彩」＝以模型首三匹打複式，實際頭三名全中即算命中；「四重彩」＝以模型首四匹打複式，實際頭四名全中即算命中。主指標為四揀平均命中匹數。" />
    </AppShell>
  );
}
