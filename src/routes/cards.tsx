import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/tx/AppShell";
import { MeetingCancellationNotice } from "@/components/tx/MeetingCancellationNotice";
import { Card, Disclaimer, Empty, ErrorNote, Loading, PageHead, Pill, Scroller, Silks, Table, Td } from "@/components/tx/ui";
import { cleanTime, fmtMeetingDate, pct } from "@/lib/tx-api";
import { useTodayPicks } from "@/lib/use-today-picks";

export const Route = createFileRoute("/cards")({
  head: () => ({
    meta: [
      { title: "逐場預測 · 天喜 TIANXI" },
      { name: "description", content: "一頁瀏覽全日每場引擎預測卡：首選次序、勝算、綵衣、實時賠率與賽事質素。" },
      { property: "og:title", content: "逐場預測 · 天喜 TIANXI" },
      { property: "og:description", content: "全日逐場引擎預測卡。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CardsPage,
});

function CardsPage() {
  const tp = useTodayPicks();
  const races = tp.races;
  const venueName = tp.meeting?.venueName || (tp.venue === "HV" ? "跑馬地" : tp.venue === "ST" ? "沙田" : tp.venue || "");

  return (
    <AppShell
      page="predictor"
      ticker={
        tp.cancellation
          ? `${fmtMeetingDate(tp.cancellation.date)} · 今日賽事停賽`
          : tp.date
            ? `${fmtMeetingDate(tp.date)} · ${venueName} · ${races.length} 場預測`
            : "載入預測…"
      }
    >
      <PageHead
        en="Race Cards"
        title="逐場預測"
        desc="全日每場首選次序、綵衣、檔位、負磅、實時賠率，附賽事質素分級與投注組合期望覆蓋率。"
      />

      {tp.cancellation ? <MeetingCancellationNotice cancellation={tp.cancellation} /> : null}

      {tp.cancellation ? null : tp.isLoading ? (
        <Loading />
      ) : tp.error ? (
        <div className="px-4">
          <ErrorNote error={tp.error} />
        </div>
      ) : races.length ? (
        races.map((r: any) => {
          const start = cleanTime(r.startTime);
          return (
            <Card
              key={r.raceNumber}
              title={`第 ${r.raceNumber} 場`}
              en={`${r.distance}m${start ? ` · ${start}` : ""}`}
              action={
                r.raceId ? (
                  <Link to="/race" search={{ id: r.raceId }} className="text-[11px] font-bold text-gold">
                    排位表 →
                  </Link>
                ) : null
              }
            >
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Pill>{r.going || "—"}</Pill>
                <Pill>第 {String(r.class).replace(/[^0-9]/g, "") || "?"} 班</Pill>
                <Pill tone={r.scoreSource === "lgb" ? "win" : "ink"}>
                  {r.scoreSource === "lgb" ? "天喜LGB" : "基準"}
                </Pill>
                {r.raceQuality?.tier ? <Pill tone="gold">質素 {r.raceQuality.tier}</Pill> : null}
              </div>
              <Scroller>
                <Table head={["馬匹", "檔", "負磅", "勝算", "前三", "前四", "賠率"]}>
                  {(r.picks || []).slice(0, 6).map((p: any, i: number) => {
                    return (
                      <tr key={p.horseNumber} className={`border-b border-hairline ${i === 0 ? "bg-gold-bg/50" : ""}`}>
                        <Td first>
                          <div className="flex items-center gap-1.5">
                            <Silks source={p} size={26} />
                            <span className="tabnum w-6 rounded-[4px] bg-deep px-1 py-0.5 text-center font-mono-tx text-[11px] font-bold text-deep-fg">
                              {p.horseNumber}
                            </span>
                            {p.horseId ? (
                              <Link to="/horse" search={{ id: p.horseId }} className="font-serif-tc text-[12px] font-bold">
                                {p.nameCh}
                              </Link>
                            ) : (
                              <span className="font-serif-tc text-[12px] font-bold">{p.nameCh}</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[10px] text-ink-3">
                            {p.jockeyCh || "—"} / {p.trainerCh || "—"}
                          </p>
                        </Td>
                        <Td>{p.draw ?? "—"}</Td>
                        <Td>{p.weight ?? p.declaredWeight ?? "—"}</Td>
                        <Td>{pct(p.pWin)}</Td>
                        <Td>{pct(p.pTop3)}</Td>
                        <Td>{pct(p.pTop4)}</Td>
                        <Td>{p.winOdds ?? "—"}</Td>
                      </tr>
                    );
                  })}
                </Table>
              </Scroller>
              {r.expectedBoxCoverage ? (
                <p className="tabnum mt-2 font-mono-tx text-[10px] leading-relaxed text-ink-3">
                  期望覆蓋率 · 三重彩 N4 {pct(r.expectedBoxCoverage.trio_n4)} / N6 {pct(r.expectedBoxCoverage.trio_n6)} · 四重彩 N6{" "}
                  {pct(r.expectedBoxCoverage.first4_n6)}
                </p>
              ) : null}
            </Card>
          );
        })
      ) : (
        <Empty label="今日尚無預測" />
      )}

      <Disclaimer />
    </AppShell>
  );
}
