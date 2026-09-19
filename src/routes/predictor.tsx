import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/tx/AppShell";
import { MeetingCancellationNotice } from "@/components/tx/MeetingCancellationNotice";
import { PredictionStatusLight } from "@/components/tx/PredictionStatusLight";
import { WeatherPanel } from "@/components/tx/WeatherPanel";
import { WhyPicked } from "@/components/tx/WhyPicked";
import { Card, Disclaimer, Empty, ErrorNote, Loading, PageHead, Pill, Scroller, Silks, Table, Td } from "@/components/tx/ui";
import { getFeatureRace, listFeatureRaces } from "@/lib/features.functions";
import { meetingLockMinutes, raceStatus } from "@/lib/prediction-status";
import { useScarceStarts } from "@/lib/use-scarce-starts";
import { FEATURE_MAP, type FeatureId, type Horse } from "@/lib/race-data";
import { cleanTime, countdown, fmtMeetingDate, pct, txApi } from "@/lib/tx-api";
import { useTodayPicks } from "@/lib/use-today-picks";



export const Route = createFileRoute("/predictor")({
  head: () => ({
    meta: [
      { title: "選馬神器 · 天喜 TIANXI" },
      { name: "description", content: "逐場引擎首選、勝算機率、賠率對照與可自選特徵的綜合排序工具。" },
      { property: "og:title", content: "選馬神器 · 天喜 TIANXI" },
      { property: "og:description", content: "逐場引擎首選與自選特徵綜合排序。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PredictorPage,
});

function PredictorPage() {
  const [raceNo, setRaceNo] = useState(1);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tp = useTodayPicks();

  // 鎖點狀態：首場開跑前 90 分鐘鎖死全日四揀（只作展示，唔改任何預測數值）
  const lockQ = useQuery({
    queryKey: ["lockState"],
    queryFn: async () => {
      const res = await fetch("/api/public/lock-state");
      if (!res.ok) return null;
      return (await res.json()) as { lockAt?: string | null; locked?: boolean } | null;
    },
    refetchInterval: 120_000,
  });
  const lockClock = (() => {
    const iso = lockQ.data?.lockAt;
    if (!iso) return null;
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return null;
    const hk = new Date(t.getTime() + 8 * 3600_000).toISOString();
    return `${hk.substring(11, 16)}`;
  })();

  const races = tp.races;
  const race = races.find((r: any) => Number(r.raceNumber) === raceNo) || races[0];
  const start = cleanTime(race?.startTime);
  const venueName = tp.meeting?.venueName || (tp.venue === "HV" ? "跑馬地" : tp.venue === "ST" ? "沙田" : tp.venue || "");

  const oddsQ = useQuery({
    queryKey: ["odds", tp.date, tp.venue, race?.raceNumber],
    queryFn: () => txApi.odds(tp.date!, tp.venue!, Number(race.raceNumber)).catch(() => null),
    enabled: !!tp.date && !!tp.venue && !!race?.raceNumber,
    refetchInterval: 60_000,
  });
  const winOddsMap: Record<string, number> = oddsQ.data?.winOdds || {};
  const liveOdds = (n: unknown) => {
    const v = winOddsMap[String(n).padStart(2, "0")];
    return typeof v === "number" ? v : null;
  };

  const dayLockMinutes = meetingLockMinutes(races);
  const scarce = useScarceStarts(races, tp.date);
  const raceLight = race
    ? raceStatus(race, {
        ...(tp.date ? { date: tp.date } : {}),
        now,
        lockMinutes: dayLockMinutes,
        scarceStarts: scarce.scarceByRace[Number(race.raceNumber)] ?? 0,
      })
    : null;
  const locked = raceLight?.color === "green" || tp.frozen;

  const picks: any[] = race?.picks || [];
  const withOdds = picks.map((p) => {
    const od = liveOdds(p.horseNumber) ?? (typeof p.winOdds === "number" ? p.winOdds : null);
    const implied = od && od > 0 ? 1 / od : null;
    const edge = implied != null && p.pWin != null ? p.pWin - implied : null;
    return { ...p, od, implied, edge };
  });
  const modelCol = withOdds.slice().sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)).slice(0, 5);
  const marketCol = withOdds
    .filter((p) => p.od != null)
    .sort((a, b) => (a.od as number) - (b.od as number))
    .slice(0, 5);
  const cov = race?.expectedBoxCoverage;

  // 逐匹解釋：借用特徵排序引擎（該場之前嘅歷史資料）計出邊幾項推高／拉低
  const listFn = useServerFn(listFeatureRaces);
  const raceFn = useServerFn(getFeatureRace);
  const featList = useQuery({
    queryKey: ["whyFeatureRaces", tp.date ?? "latest"],
    queryFn: () => listFn({ data: tp.date ? { date: tp.date } : {} }),
    enabled: !!tp.date,
  });
  const featRaceId =
    (featList.data?.races ?? []).find((r: any) => Number(r.raceNumber) === Number(race?.raceNumber))?.id ?? null;
  const featRace = useQuery({
    queryKey: ["whyFeatureRace", featRaceId],
    queryFn: () => raceFn({ data: { raceId: featRaceId! } }),
    enabled: !!featRaceId,
  });
  const featHorses = featRace.data?.horses ?? [];
  const evidenceIds: FeatureId[] = ["distance", "draw", "jt", "time", "finish", "form"];
  const evidence = evidenceIds.map((id) => {
    const ranked = (featHorses as Horse[])
      .filter((h) => h.stats?.[id])
      .slice()
      .sort((a, b) => (b.stats[id]?.score ?? 0) - (a.stats[id]?.score ?? 0));
    const leader = ranked[0];
    return { id, label: FEATURE_MAP[id].shortLabel, leader, stat: leader?.stats[id] };
  });

  if (tp.cancellation) {
    return (
      <AppShell page="predictor" ticker={`${fmtMeetingDate(tp.cancellation.date)} · 今日賽事停賽`}>
        <PageHead
          en="Predictor"
          title="選馬神器"
          desc="今日不提供預測；恢復賽事後，四揀會按既定鎖點重新提供。"
        />
        <MeetingCancellationNotice cancellation={tp.cancellation} />
        <Disclaimer />
      </AppShell>
    );
  }


  return (
    <AppShell
      page="predictor"
      ticker={
        tp.date
          ? `${fmtMeetingDate(tp.date)} · ${venueName} · ${races.length} 場${
              start ? ` · R${raceNo} 倒數 ${countdown(start, now, tp.date)}` : ""
            }`
          : "載入中…"
      }
    >
      <PageHead
        en="Predictor"
        title="選馬神器"
        desc="先睇四揀結論，再逐層核對同程、檔位、騎練、時間、末段與近況證據；市場賠率只作對照，不會改動引擎排名。"
      />

      <div className="mx-4 mt-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono-tx text-[9px] font-bold uppercase tracking-[0.14em] ${
              tp.frozen
                ? "border-gold-strong bg-gold-bg text-gold"
                : "border-hairline bg-paper text-ink-3"
            }`}
          >
            {tp.frozen ? "最終版 · 已鎖" : "初版 · 未鎖"}
          </span>
          <span className="text-[10px] leading-snug text-ink-3">
            {tp.frozen
              ? "已鎖定四揀，同對賬、賽果頁用同一套，唔會再改。"
              : `未鎖定：刷新有機會改四揀；${
                  lockClock ? `${lockClock}（首場開跑前 90 分鐘）自動鎖死全日` : "首場開跑前 90 分鐘自動鎖死全日"
                }，只有鎖定後嘅最終版會入戰績。`}
          </span>
        </div>

        <p className="mb-1.5 font-mono-tx text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3">全日場次</p>
        <div className="no-scrollbar flex gap-1 overflow-x-auto pb-1">
          {races.map((r: any) => {
            const on = Number(r.raceNumber) === Number(race?.raceNumber);
            return (
              <button
                key={r.raceNumber}
                type="button"
                onClick={() => setRaceNo(Number(r.raceNumber))}
                className={`shrink-0 rounded-[6px] border px-2.5 py-1.5 text-left ${
                  on ? "border-gold-strong bg-gold-bg text-gold" : "border-hairline bg-paper text-ink-2"
                }`}
              >
                <span className="block font-mono-tx text-[11px] font-bold">R{r.raceNumber}</span>
                <span className="mt-0.5 block font-mono-tx text-[8px] text-ink-3">{cleanTime(r.startTime) || "—"} · {r.distance || "—"}m</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-4 mb-2.5 mt-2">
        <label
          htmlFor="tp-race-select"
          className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3"
        >
          揀場次
        </label>
        <div className="relative">
          <select
            id="tp-race-select"
            value={String(race?.raceNumber ?? raceNo)}
            onChange={(e) => setRaceNo(Number(e.target.value))}
            className="w-full appearance-none rounded-[10px] border border-hairline bg-paper-2 py-[11px] pl-3 pr-9 font-sans-tc text-[13px] font-semibold text-ink"
          >
            {races.length === 0 ? <option>載入中…</option> : null}
            {races.map((r: any) => {
              const cls = r.class ? ` · ${r.class}` : "";
              const dist = r.distance ? ` · ${r.distance}m` : "";
              const q = r.raceQuality?.tier ? ` · 場質${r.raceQuality.tier}` : "";
              return (
                <option key={r.raceNumber} value={String(r.raceNumber)}>
                  R{r.raceNumber}
                  {cls}
                  {dist}
                  {q}
                </option>
              );
            })}
          </select>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {race && raceLight ? (
        <div className="mx-4 mb-3">
          <PredictionStatusLight status={raceLight} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill tone="gold">R{race.raceNumber} · {race.distance || "—"}m</Pill>
            <Pill>{race.going || "地質待公布"}</Pill>
            <Pill>第 {String(race.class).replace(/[^0-9]/g, "") || "?"} 班</Pill>
            <Pill tone={race.scoreSource === "lgb" ? "win" : "ink"}>{race.scoreSource === "lgb" ? "天喜LGB" : "天喜ELO 基準"}</Pill>
            {typeof race.ensembleAlpha === "number" ? <Pill>α={race.ensembleAlpha.toFixed(2)}</Pill> : null}
            {start ? <Pill>{start} 開跑</Pill> : null}
          </div>
        </div>
      ) : null}

      {race ? (
        <div className="mx-4 mb-3 grid grid-cols-2 items-stretch gap-2">
          <div
            className={`flex h-full flex-col rounded-[10px] border p-2.5 transition-colors duration-500 ${
              locked ? "tx-beam-card tx-beam-line tx-beam-win border-win/45 bg-win/[0.06]" : "border-hairline bg-paper"
            }`}
          >
            <p className="mb-2 flex min-h-[18px] items-center gap-1 font-serif-tc text-[12px] font-bold text-ink">
              天喜預測 <span className="font-mono-tx text-[9px] font-normal text-ink-3">TIANXI</span>
              {locked ? (
                <span className="ml-auto shrink-0 rounded-[3px] border border-win/45 bg-win/10 px-1 font-mono-tx text-[8px] font-bold text-win">
                  已鎖定
                </span>
              ) : null}
            </p>
            <div className="flex flex-1 flex-col divide-y divide-hairline">
              {modelCol.length ? (
                modelCol.map((p: any, i: number) => (
                  <div
                    key={p.horseNumber}
                    className="min-h-[74px] py-2"
                  >
                    <div className="grid grid-cols-[16px_24px_minmax(0,1fr)] items-center gap-1.5">
                      <span className={`tabnum text-center font-mono-tx text-[11px] font-bold ${i === 0 ? "text-gold" : "text-ink-3"}`}>
                        {i + 1}
                      </span>
                      <span className="tabnum grid h-6 w-6 place-items-center rounded-[4px] border border-gold-strong/45 bg-paper-2 font-mono-tx text-[10px] font-bold text-ink">
                        {p.horseNumber}
                      </span>
                      <div className="min-w-0">
                        {p.horseId ? (
                          <Link to="/horse" search={{ id: p.horseId }} className="block truncate font-serif-tc text-[12px] font-bold text-ink">
                            {p.nameCh}
                          </Link>
                        ) : (
                          <span className="block truncate font-serif-tc text-[12px] font-bold text-ink">{p.nameCh}</span>
                        )}
                        <p className="tabnum mt-0.5 truncate font-mono-tx text-[9px] text-ink-3">檔 {p.draw ?? "—"} · 三甲 {pct(p.pTop3)}</p>
                      </div>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-[4px] bg-paper-2 px-1.5 py-1">
                      <span className="text-[8px] text-ink-3">引擎勝算 <b className="tabnum ml-0.5 font-mono-tx text-[10px] text-ink">{pct(p.pWin)}</b></span>
                      <span className="text-right text-[8px] text-ink-3">即時獨贏 <b className="tabnum ml-0.5 font-mono-tx text-[10px] text-gold">{p.od != null ? Number(p.od).toFixed(1) : "—"}</b></span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-3 text-[10px] text-ink-3">此場整備中</p>
              )}
            </div>
          </div>

          <div
            className={`flex h-full flex-col rounded-[10px] border p-2.5 transition-colors duration-500 ${
              locked ? "tx-beam-card tx-beam-line tx-beam-gold border-gold-strong/45 bg-gold-bg" : "border-hairline bg-paper"
            }`}
          >
            <p className="mb-2 flex min-h-[18px] items-center gap-1 font-serif-tc text-[12px] font-bold text-ink">
              市場穩陣 <span className="font-mono-tx text-[9px] font-normal text-ink-3">MARKET</span>
              {locked ? (
                <span className="ml-auto shrink-0 rounded-[3px] border border-gold-strong/45 bg-gold-bg px-1 font-mono-tx text-[8px] font-bold text-gold">
                  已鎖定
                </span>
              ) : null}
            </p>
            <div className="flex flex-1 flex-col divide-y divide-hairline">
              {marketCol.length ? (
                marketCol.map((p: any, i: number) => (
                  <div key={p.horseNumber} className="min-h-[74px] py-2">
                    <div className="grid grid-cols-[16px_24px_minmax(0,1fr)] items-center gap-1.5">
                      <span className="tabnum text-center font-mono-tx text-[11px] font-bold text-ink-3">{i + 1}</span>
                      <span className="tabnum grid h-6 w-6 place-items-center rounded-[4px] border border-gold-strong/45 bg-paper-2 font-mono-tx text-[10px] font-bold text-ink">
                        {p.horseNumber}
                      </span>
                      <div className="min-w-0">
                        {p.horseId ? (
                          <Link to="/horse" search={{ id: p.horseId }} className="block truncate font-serif-tc text-[12px] font-bold text-ink">
                            {p.nameCh}
                          </Link>
                        ) : (
                          <span className="block truncate font-serif-tc text-[12px] font-bold text-ink">{p.nameCh}</span>
                        )}
                        <p className="tabnum mt-0.5 truncate font-mono-tx text-[9px] text-ink-3">檔 {p.draw ?? "—"} · 三甲 {pct(p.pTop3)}</p>
                      </div>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-[4px] bg-paper-2 px-1.5 py-1">
                      <span className="text-[8px] text-ink-3">引擎勝算 <b className="tabnum ml-0.5 font-mono-tx text-[10px] text-ink">{pct(p.pWin)}</b></span>
                      <span className="text-right text-[8px] text-ink-3">即時獨贏 <b className="tabnum ml-0.5 font-mono-tx text-[10px] text-gold">{p.od != null ? Number(p.od).toFixed(1) : "—"}</b></span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-3 text-[10px] leading-relaxed text-ink-3">等臨場盤口，賽日近開賽前自動更新</p>
              )}
            </div>
          </div>
        </div>
      ) : null}


      {featHorses.length ? (
        <section className="mx-4 mb-3 rounded-[10px] border border-hairline bg-paper-2 px-2.5 py-2.5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="font-serif-tc text-[13px] font-bold text-ink">六項賽前證據</h2>
            <Link to="/features" className="text-[10px] font-bold text-gold">完整排序 →</Link>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[7px] border border-hairline bg-hairline">
            {evidence.map(({ id, label, leader, stat }) => (
              <div key={id} className="min-w-0 bg-paper px-2 py-2">
                <p className="text-[9px] font-bold text-ink-3">{label}</p>
                {leader && stat ? (
                  <>
                    <p className="mt-1 truncate font-serif-tc text-[11px] font-bold text-ink">#{leader.no} {leader.name}</p>
                    <p className="tabnum mt-0.5 truncate font-mono-tx text-[9px] text-gold">{stat.metric}</p>
                  </>
                ) : <p className="mt-1 text-[10px] text-ink-3">資料未齊</p>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-ink-3">每格顯示該項目前列馬匹；完整名次、樣本與自選組合請開啟特徵排序表。</p>
        </section>
      ) : null}

      {cov ? (
        <div className="mx-4 mb-3 rounded-[10px] border border-hairline bg-paper p-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="font-serif-tc text-[12px] font-bold text-ink">箱形覆蓋率估算</p>
            {race?.raceQuality?.tier ? (
              <Pill tone="gold">
                同日 #{race.raceQuality.rank}/{race.raceQuality.total} · 場質{race.raceQuality.tier}
              </Pill>
            ) : null}
          </div>
          <div className="tabnum grid grid-cols-4 gap-y-1 font-mono-tx text-[11px]">
            <span />
            <span className="text-center text-[9px] text-ink-3">揀4</span>
            <span className="text-center text-[9px] text-ink-3">揀5</span>
            <span className="text-center text-[9px] text-ink-3">揀6</span>
            <span className="text-[10px] text-ink-2">三重彩（頭三名複式）</span>
            <span className="text-center font-bold text-ink">{pct(cov.trio_n4)}</span>
            <span className="text-center text-ink-2">{pct(cov.trio_n5)}</span>
            <span className="text-center text-ink-2">{pct(cov.trio_n6)}</span>
            <span className="text-[10px] text-ink-2">四重彩（頭四名複式）</span>
            <span className="text-center font-bold text-ink">{pct(cov.first4_n4)}</span>
            <span className="text-center text-ink-2">{pct(cov.first4_n5)}</span>
            <span className="text-center text-ink-2">{pct(cov.first4_n6)}</span>
          </div>
          <p className="mt-1.5 text-[9px] leading-relaxed text-ink-3">
            「揀N」＝取模型前 N 名落箱；數值為模型估算命中機率，只作同日相對比較揀場之用，非投注建議。
          </p>
        </div>
      ) : null}



      <Card
        title={race ? `第 ${race.raceNumber} 場 引擎首選` : "引擎首選"}
        en="Engine Picks"
        action={
          race?.raceId ? (
            <Link to="/race" search={{ id: race.raceId }} className="text-[11px] font-bold text-gold">
              排位表 →
            </Link>
          ) : null
        }
      >
        {tp.isLoading ? (
          <Loading />
        ) : tp.error ? (
          <ErrorNote error={tp.error} />
        ) : race ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">

              <Pill tone="gold">{race.distance}m</Pill>
              <Pill>{race.going || "—"}</Pill>
              <Pill>第 {String(race.class).replace(/[^0-9]/g, "") || "?"} 班</Pill>
              <Pill tone={race.scoreSource === "lgb" ? "win" : "ink"}>
                {race.scoreSource === "lgb" ? "天喜LGB 模型" : "基準模型"}
              </Pill>
              {race.raceQuality?.tier ? <Pill>賽事質素 {race.raceQuality.tier}</Pill> : null}
              {start ? <Pill>{start}</Pill> : null}
            </div>
            <Scroller>
              <Table head={["馬匹", "檔", "負磅", "勝算", "前三", "前四", "賠率"]}>
                {(race.picks || []).map((p: any, i: number) => {
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
                      <Td>{liveOdds(p.horseNumber) ?? p.winOdds ?? "—"}</Td>
                    </tr>
                  );
                })}
              </Table>
            </Scroller>
            {race.expectedBoxCoverage ? (
              <p className="tabnum font-mono-tx text-[10px] leading-relaxed text-ink-3">
                期望覆蓋率 · 三重彩 N4 {pct(race.expectedBoxCoverage.trio_n4)} / N5 {pct(race.expectedBoxCoverage.trio_n5)} /
                N6 {pct(race.expectedBoxCoverage.trio_n6)} · 四重彩 N6 {pct(race.expectedBoxCoverage.first4_n6)}
              </p>
            ) : null}
          </div>
        ) : (
          <Empty label="今日尚無預測" />
        )}
      </Card>

      <Card title="點解揀佢" en="Why These Picks">
        <p className="mb-2 text-[11px] leading-relaxed text-ink-2">
          逐匹列出邊幾項特徵推高、邊幾項拉低佢喺本場嘅排名，權重取自天喜LGB 特徵重要度。
        </p>
        {featList.isLoading || featRace.isLoading ? (
          <Loading />
        ) : featHorses.length ? (
          <div className="space-y-1.5">
            {(race?.picks || []).slice(0, 4).map((p: any) => (
              <WhyPicked
                key={p.horseNumber}
                horses={featHorses as any}
                horseNo={Number(p.horseNumber)}
                name={`#${p.horseNumber} ${p.nameCh}`}
              />
            ))}
          </div>
        ) : (
          <Empty label="等排位表特徵資料" />
        )}
      </Card>

      <Card title="特徵排序實驗室" en="Feature Lab">
        <p className="mb-2 text-[11px] leading-relaxed text-ink-2">
          十項特徵（同場對賽、同程、檔位、最快時間、最快末段、騎練合作等）逐項排名，並可自選組合運算綜合排序，全部由歷史賽事資料實時計算。屬研究輔助，非預測模型。
        </p>
        <Link
          to="/features"
          className="inline-block rounded-[8px] border border-gold-strong/50 bg-gold-bg px-3 py-2 text-[12px] font-bold text-gold"
        >
          打開特徵排序表 →
        </Link>
      </Card>

      <details className="mx-4 my-3 rounded-[10px] border border-hairline bg-paper-2">
        <summary className="cursor-pointer px-3 py-2.5 font-serif-tc text-[12px] font-bold text-ink">馬場即時天氣與跑道狀況</summary>
        <div className="border-t border-hairline pb-1 pt-3"><WeatherPanel venue={tp.venue ?? undefined} /></div>
      </details>

      <Disclaimer />
    </AppShell>
  );
}
