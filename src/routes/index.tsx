import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { CourseMapButton } from "@/components/tx/CourseMapButton";
import { AppShell } from "@/components/tx/AppShell";
import { EnginePipeline } from "@/components/tx/EnginePipeline";
import { MeetingCancellationNotice } from "@/components/tx/MeetingCancellationNotice";
import { DayStatusLight, LightLegend, PredictionStatusLight } from "@/components/tx/PredictionStatusLight";
import { Card, Disclaimer, Empty, ErrorNote, Loading, PageHead, Pill, Silks } from "@/components/tx/ui";
import { BarRow, HitStrip, KpiTile, KV, Spark } from "@/components/tx/viz";
import { dayStatus, meetingLockMinutes, raceStatus } from "@/lib/prediction-status";
import { fmtMeetingDate, num, pct, txApi } from "@/lib/tx-api";
import { useScarceStarts } from "@/lib/use-scarce-starts";
import { useTodayPicks } from "@/lib/use-today-picks";

/** 2026/27 馬季開季日（本季凍結對帳窗起點，同歷史窗分開計） */
const SEASON_START = "2026-09-01";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "預測與賽果 · 天喜 TIANXI 香港賽馬分析" },
      {
        name: "description",
        content: "天喜 TIANXI：香港賽馬 TX-Oracle 引擎預測、排位表、賽果核對、馬匹研究與六合彩統計。",
      },
      { property: "og:title", content: "預測與賽果 · 天喜 TIANXI" },
      { property: "og:description", content: "TX-Oracle 引擎預測、賽果核對與馬匹研究平台。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const meeting = useQuery({ queryKey: ["nextMeeting"], queryFn: () => txApi.nextMeeting() });
  const rollup = useQuery({ queryKey: ["rollup", 90], queryFn: () => txApi.hitRateRollup(90) });
  const long = useQuery({ queryKey: ["rollup", 365], queryFn: () => txApi.hitRateRollup(365) });
  const tp = useTodayPicks();

  const m = meeting.data;
  const per: any[] = (long.data?.perMeeting || []).slice().sort((a: any, b: any) => (a.date < b.date ? -1 : 1));
  const trend = per.map((p) => p.top4AvgIntersect);
  const hits = per.map((p) => (p.top4AvgIntersect == null ? null : p.top4AvgIntersect >= 3));
  const avg4 = rollup.data?.top4AvgIntersect;
  const best = per.length ? Math.max(...per.map((p) => p.top4AvgIntersect || 0)) : null;
  const reached = hits.filter(Boolean).length;

  // 開季窗：只計 2026/27 馬季已凍結賽日，同近 90 日歷史窗分開標
  const seasonMeetings = per.filter((p: any) => String(p.date) >= SEASON_START);
  const seasonRaces = seasonMeetings.reduce((s: number, p: any) => s + (Number(p.racesEvaluated) || 0), 0);
  const seasonAvg4 = seasonRaces
    ? seasonMeetings.reduce(
        (s: number, p: any) => s + (Number(p.top4AvgIntersect) || 0) * (Number(p.racesEvaluated) || 0),
        0,
      ) / seasonRaces
    : null;

  const races = tp.races;
  const dayLockMinutes = meetingLockMinutes(races);
  const scarce = useScarceStarts(races, tp.date);
  const listRaces: any[] = (m?.races || []).length
    ? (m!.races as any[])
    : races.map((r: any) => ({ id: r.raceId, raceNumber: r.raceNumber, title: r.title, distanceM: r.distance }));

  return (
    <AppShell
      page=""
      ticker={
        tp.cancellation
          ? `${fmtMeetingDate(tp.cancellation.date)} · 今日賽事停賽`
          : m
            ? `下一賽事 ${fmtMeetingDate(m.date)} · ${m.venueName} · ${m.totalRaces} 場`
            : "載入賽事資料…"
      }
    >
      <PageHead
        en="Predictions & Results"
        title="預測與賽果"
        desc="TX-Oracle v3 每個賽馬日凍結預測，賽後自動核對。主指標：四揀平均命中匹數。"
      />

      {tp.cancellation ? <MeetingCancellationNotice cancellation={tp.cancellation} /> : null}

      {!tp.cancellation ? <Card
        title="預測狀態"
        en="Prediction Status"
        action={
          <Link to="/engine/features" className="text-[11px] font-bold text-gold">
            特徵選取表 →
          </Link>
        }
      >
        {tp.isLoading ? (
          <Loading />
        ) : (
          <>
            <DayStatusLight status={dayStatus(races, tp.date, undefined, scarce.scarceByRace)} />
            {races.length ? (
              <div className="mt-2 grid gap-1.5 grid-cols-2 sm:grid-cols-3">
                {races.map((r: any) => {
                  const s = raceStatus(r, {
                    ...(tp.date ? { date: tp.date } : {}),
                    lockMinutes: dayLockMinutes,
                    scarceStarts: scarce.scarceByRace[Number(r.raceNumber)] ?? 0,
                  });
                  return (
                    <Link
                      key={r.raceNumber}
                      to="/predictor"
                      className="flex items-center gap-1.5 rounded-[6px] border border-hairline bg-paper px-2 py-1.5"
                    >
                      <span className="tabnum font-mono-tx text-[10px] font-bold text-ink-3">
                        第{r.raceNumber}場
                      </span>
                      <PredictionStatusLight status={s} compact />
                    </Link>
                  );
                })}
              </div>
            ) : null}
            <div className="mt-2 border-t border-hairline pt-2">
              <LightLegend />
            </div>
          </>
        )}
      </Card> : null}

      <Card title="引擎出預測流程" en="How It Works">
        <p className="mb-2 text-[11px] leading-relaxed text-ink-2">
          由排位表收料到首場開跑前 90 分鐘鎖全日共八步，逐步展開睇白話解釋；每步標明會唔會改動最終版四揀。
        </p>
        <EnginePipeline />
      </Card>

      <Card title="核心指標" en="Core KPI" action={
        <Link to="/track-record" className="text-[11px] font-bold text-gold">
          完整戰績 →
        </Link>
      }>

        {rollup.isLoading ? (
          <Loading />
        ) : rollup.error ? (
          <ErrorNote error={rollup.error} />
        ) : (
          <div className="space-y-2.5">
            <div className="rounded-[10px] border border-gold-strong/45 bg-gold-bg px-2.5 py-2">
              <div className="flex items-baseline gap-2">
                <p className="font-mono-tx text-[9px] font-bold uppercase tracking-[0.16em] text-gold">
                  本季開季窗 · Season To Date
                </p>
                <span className="tabnum ml-auto font-mono-tx text-[16px] font-extrabold text-ink">
                  {seasonAvg4 == null ? "—" : num(seasonAvg4, 2)}
                  <span className="text-[10px] font-bold text-ink-3">／4</span>
                </span>
              </div>
              <p className="tabnum mt-1 font-mono-tx text-[10px] leading-relaxed text-ink-2">
                2026/27 開季已凍結 {seasonMeetings.length} 個賽日 · {seasonRaces} 場入帳
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-ink-3">
                開季樣本少，同下面近 90 日歷史窗分開睇；只計最終版凍結四揀，少仗紅燈場次唔入帳。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <KpiTile
                label="四揀平均中"
                en="Top4 Avg"
                value={num(avg4, 2)}
                unit="／4"
                ratio={avg4 != null ? Number(avg4) / 4 : null}
                tone={avg4 != null && Number(avg4) >= 3 ? "win" : "gold"}
                sub={`近 90 日 ${rollup.data?.racesEvaluated ?? 0} 場`}
                trend={trend}
              />
              <KpiTile
                label="前三平均中"
                en="Top3 Avg"
                value={num(rollup.data?.top3AvgIntersect, 2)}
                unit="／3"
                ratio={rollup.data?.top3AvgIntersect != null ? Number(rollup.data.top3AvgIntersect) / 3 : null}
                sub={`前三任一 ${num(rollup.data?.top3AnyHitRate)}%`}
                trend={per.map((p) => p.top3AvgIntersect)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[10px] border border-hairline bg-paper p-2.5">
                <p className="mb-1 text-[10px] font-bold text-ink-3">近 12 個月走勢</p>
                <Spark values={trend} />
                <p className="tabnum mt-1 font-mono-tx text-[9px] text-ink-3">
                  最佳 {num(best, 2)} · 賽馬日 {per.length}
                </p>
              </div>
              <div className="rounded-[10px] border border-hairline bg-paper p-2.5">
                <p className="mb-1.5 text-[10px] font-bold text-ink-3">表現較佳賽馬日</p>
                <HitStrip hits={hits} max={24} />
                <p className="tabnum mt-1.5 font-mono-tx text-[9px] text-ink-3">
                  {reached}／{per.length} 日達標
                </p>
              </div>
            </div>
            <div className="rounded-[10px] border border-hairline bg-paper px-2.5 py-1.5">
              <KV k="位置Q（頭兩名不計次序）" v={`${num(rollup.data?.qpHitRate)}% · ${rollup.data?.qpHits ?? 0} 次`} />
              <KV k="連贏（頭兩名順序）" v={`${num(rollup.data?.quinellaHitRate)}%`} />
              <KV k="三重彩（頭三名複式）" v={`${num(rollup.data?.trioHitRate)}%`} />
              <KV k="四重彩（頭四名複式）" v={`${num(rollup.data?.first4HitRate)}%`} />
            </div>
          </div>
        )}
      </Card>

      <Card title="下一個賽馬日" en="Next Meeting">
        {tp.cancellation ? (
          <p className="text-[12px] leading-relaxed text-ink-2">
            今日賽事已停賽；下一個賽馬日有待官方公布後更新。
          </p>
        ) : meeting.isLoading ? (
          <Loading />
        ) : meeting.error ? (
          <ErrorNote error={meeting.error} />
        ) : m ? (
          <div className="space-y-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-2">
              <div className="min-w-0">
                <p className="truncate font-serif-tc text-[18px] font-bold text-ink">{m.venueName}</p>
                <p className="tabnum mt-0.5 font-mono-tx text-[11px] text-ink-2">{fmtMeetingDate(m.date)}</p>
              </div>
              <div className="-ml-3">
                <CourseMapButton venue={m.venue ?? undefined} going={m.trackCondition ?? undefined} />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Pill tone="gold">{m.trackCondition || "場地待定"}</Pill>
                <Pill>{m.totalRaces} 場</Pill>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/predictor"
                className="rounded-[8px] border border-gold-strong/50 bg-gold-bg px-3 py-2 text-center text-[12px] font-bold text-gold"
              >
                查看選馬建議
              </Link>
              <Link
                to="/cards"
                className="rounded-[8px] border border-hairline bg-paper px-3 py-2 text-center text-[12px] font-bold text-ink"
              >
                逐場預測卡
              </Link>
            </div>
            <div className="divide-y divide-hairline border-t border-hairline">
              {listRaces.map((r: any) => {
                const rp = races.find((x: any) => Number(x.raceNumber) === Number(r.raceNumber));
                const top = rp?.picks?.[0];
                return (
                  <Link
                    key={r.id}
                    to="/race"
                    search={{ id: r.id }}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-2"
                  >
                    <span className="tabnum w-7 shrink-0 font-mono-tx text-[13px] font-bold text-gold">
                      R{r.raceNumber}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-serif-tc text-[13px] text-ink">
                        {r.title || `第 ${r.raceNumber} 場`}
                      </span>
                      {top ? (
                        <span className="mt-0.5 flex items-center gap-1">
                          <Silks source={top} size={18} />
                          <span className="tabnum font-mono-tx text-[9px] text-ink-3">
                            首選 #{top.horseNumber} {top.nameCh} · {pct(top.pWin)}
                          </span>
                        </span>
                      ) : null}
                    </span>
                    <span className="tabnum shrink-0 text-right font-mono-tx text-[10px] text-ink-3">
                      {r.distanceM || r.distance || "—"}m
                      {rp?.raceQuality?.tier ? <><br />場質{rp.raceQuality.tier}</> : null}
                    </span>
                  </Link>
                );
              })}
              {!listRaces.length ? <Empty label="排位表尚未公布" /> : null}
            </div>
          </div>
        ) : null}
      </Card>

      <Card title="最近已完成賽馬日表現" en="Completed Meetings">
        {long.isLoading ? (
          <Loading />
        ) : per.length ? (
          <div>
            {per
              .slice(-8)
              .reverse()
              .map((p: any) => (
                <BarRow
                  key={`${p.date}-${p.venue}`}
                  label={`${fmtMeetingDate(p.date)} · ${p.venue === "HV" ? "跑馬地" : "沙田"}`}
                  value={p.top4AvgIntersect || 0}
                  max={4}
                  tone={(p.top4AvgIntersect || 0) >= 3 ? "win" : "gold"}
                  right={`${num(p.top4AvgIntersect, 2)}／4 · ${p.racesEvaluated} 場`}
                />
              ))}
          </div>
        ) : (
          <Empty />
        )}
      </Card>

      <Card title="快速入口" en="Shortcuts">
        <div className="grid grid-cols-2 gap-2 text-[12px] font-bold">
          {[
            { to: "/results", label: "預測與賽果" },
            { to: "/pool-odds", label: "彩池賠率" },
            { to: "/encyclopedia", label: "馬匹百科" },
            { to: "/schedule", label: "賽馬日程" },
            { to: "/strategy-pnl", label: "策略累計盈虧" },
            { to: "/track-record", label: "公開戰績" },

            { to: "/manual", label: "引擎說明書" },
            { to: "/marksix", label: "六合彩" },
          ].map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="rounded-[8px] border border-hairline bg-paper px-3 py-2 text-center text-ink"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </Card>

      <Disclaimer />
    </AppShell>
  );
}
