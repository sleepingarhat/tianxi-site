import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/tx/AppShell";
import { MeetingCancellationNotice } from "@/components/tx/MeetingCancellationNotice";
import { Card, Disclaimer, Empty, ErrorNote, Loading, PageHead, Pill } from "@/components/tx/ui";
import { WeatherPanel } from "@/components/tx/WeatherPanel";
import { fmtMeetingDate, txApi } from "@/lib/tx-api";
import { todayMeetingCancellation } from "@/lib/meeting-status";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "賽馬日程 · 天喜 TIANXI" },
      { name: "description", content: "按月瀏覽香港賽馬日程：日期、馬場、場地狀況與場次，並直接進入排位表。" },
      { property: "og:title", content: "賽馬日程 · 天喜 TIANXI" },
      { property: "og:description", content: "按月瀏覽賽馬日程與排位表。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const cancellation = todayMeetingCancellation();
  const smart = useQuery({ queryKey: ["smartCurrent"], queryFn: () => txApi.smartCurrent() });
  const baseMonth = (smart.data?.date || new Date().toISOString().slice(0, 10)).slice(0, 7);
  const [month, setMonth] = useState<string | null>(null);
  const ym = month || baseMonth;

  const list = useQuery({
    queryKey: ["meetingsByMonth", ym],
    queryFn: () => txApi.meetingsByMonth(ym),
  });
  const [openDate, setOpenDate] = useState<string | null>(null);
  const detail = useQuery({
    queryKey: ["meeting", openDate],
    queryFn: () => txApi.meeting(openDate!),
    enabled: !!openDate,
    refetchInterval: 60_000,
  });

  function shiftMonth(delta: number) {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1 + delta, 1));
    setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  const meetings = list.data?.meetings || [];

  return (
    <AppShell
      page="schedule"
      ticker={cancellation ? `${fmtMeetingDate(cancellation.date)} · 今日賽事停賽` : `${ym} · ${meetings.length} 個賽馬日`}
    >
      <PageHead en="Fixtures" title="賽馬日程" desc="按月查看賽馬日，點擊展開當日場次並前往排位表。" />

      {cancellation ? <MeetingCancellationNotice cancellation={cancellation} /> : null}

      <WeatherPanel />


      <div className="mx-4 flex items-center justify-between rounded-[8px] border border-hairline bg-paper-2 px-3 py-2">
        <button type="button" onClick={() => shiftMonth(-1)} className="text-[12px] font-bold text-ink-2">
          ← 上月
        </button>
        <span className="tabnum font-mono-tx text-[13px] font-bold text-ink">{ym}</span>
        <button type="button" onClick={() => shiftMonth(1)} className="text-[12px] font-bold text-ink-2">
          下月 →
        </button>
      </div>

      <Card title="賽馬日" en="Meetings">
        {list.isLoading ? (
          <Loading />
        ) : list.error ? (
          <ErrorNote error={list.error} />
        ) : meetings.length ? (
          <div className="divide-y divide-hairline">
            {meetings.map((m) => {
              const open = openDate === m.date;
              return (
                <div key={m.id}>
                  <button
                    type="button"
                    onClick={() => setOpenDate(open ? null : m.date)}
                    className="flex w-full items-center gap-2 py-2.5 text-left"
                  >
                    <span className="tabnum font-mono-tx text-[12px] font-bold text-gold">{m.date.slice(5)}</span>
                    <span className="flex-1 font-serif-tc text-[13px] font-bold">{m.venueName}</span>
                    <Pill>{m.trackCondition || "—"}</Pill>
                    <span className="tabnum font-mono-tx text-[10px] text-ink-3">{m.totalRaces} 場</span>
                  </button>
                  {open ? (
                    <div className="pb-3 pl-4">
                      {detail.isLoading ? (
                        <Loading />
                      ) : (
                        <div className="divide-y divide-hairline border-l border-hairline pl-3">
                          {(detail.data?.races || []).map((r) => (
                            <Link
                              key={r.id}
                              to="/race"
                              search={{ id: r.id }}
                              className="flex items-center gap-2 py-1.5"
                            >
                              <span className="tabnum w-7 font-mono-tx text-[11px] font-bold text-gold">
                                R{r.raceNumber}
                              </span>
                              <span className="flex-1 truncate text-[12px]">{r.title || `第 ${r.raceNumber} 場`}</span>
                              <span className="tabnum font-mono-tx text-[10px] text-ink-3">
                                {r.distance || r.distanceM}m
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <Empty label="此月份沒有賽馬日" />
        )}
      </Card>

      {smart.data && !cancellation ? (
        <Card title="當前賽事" en="Current">
          <p className="text-[12px] text-ink-2">
            {fmtMeetingDate(smart.data.date)} · {smart.data.venueName} · {smart.data.totalRaces} 場
          </p>
        </Card>
      ) : null}

      <Disclaimer />
    </AppShell>
  );
}
