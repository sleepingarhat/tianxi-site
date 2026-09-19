// 天喜 · 全日預測 hook：合併引擎預測（全部場次）與排位表資料（賠率、負磅、綵衣代碼）
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getTodayPicksAll } from "./picks.functions";
import { todayMeetingCancellation } from "./meeting-status";
import { txApi } from "./tx-api";

export type MergedPick = {
  horseNumber: number;
  nameCh?: string;
  nameEn?: string;
  jockeyCh?: string | null;
  trainerCh?: string | null;
  draw?: number | null;
  pWin?: number | null;
  pTop3?: number | null;
  pTop4?: number | null;
  rank?: number;
  horseId?: string;
  winOdds?: number | null;
  weight?: number | null;
  declaredWeight?: number | null;
  rating?: number | null;
  code?: string | null;
  gear?: string | null;
};

export function useTodayPicks() {
  const cancellation = todayMeetingCancellation();
  const fetchAll = useServerFn(getTodayPicksAll);
  const picks = useQuery({
    queryKey: ["todayPicksAll"],
    queryFn: () => fetchAll(),
    staleTime: 60_000,
    enabled: !cancellation,
  });
  const date: string | undefined = picks.data?.date;
  const meeting = useQuery({
    queryKey: ["meeting", date],
    queryFn: () => txApi.meeting(date!),
    enabled: !!date && !cancellation,
    refetchInterval: 60_000,
  });

  const entryIndex = new Map<string, any>();
  for (const r of meeting.data?.races || []) {
    for (const h of (r as any).horses || []) {
      entryIndex.set(`${r.raceNumber}-${h.horseNumber}`, h);
    }
  }

  const races = (picks.data?.races || []).map((r: any) => {
    const info = (meeting.data?.races || []).find((x: any) => Number(x.raceNumber) === Number(r.raceNumber));
    return {
      ...r,
      raceId: r.raceId || (date ? `race_${date}_${picks.data.venue}_${r.raceNumber}` : ""),
      title: r.title || (info as any)?.title || `第 ${r.raceNumber} 場`,
      startTime: (info as any)?.startTime ?? null,
      picks: (r.picks || []).map((p: any): MergedPick => {
        const e = entryIndex.get(`${r.raceNumber}-${p.horseNumber}`) || {};
        return {
          ...p,
          winOdds: p.winOdds ?? e.winOdds ?? null,
          weight: p.weight ?? e.weight ?? null,
          declaredWeight: p.declaredWeight ?? e.declaredWeight ?? null,
          rating: p.rating ?? e.rating ?? null,
          code: e.code ?? null,
          gear: e.gear ?? null,
          nameCh: p.nameCh || e.nameCh || e.name,
          jockeyCh: p.jockeyCh ?? e.jockeyCh ?? null,
          trainerCh: p.trainerCh ?? e.trainerCh ?? null,
          draw: p.draw ?? e.draw ?? null,
        };
      }),
    };
  });

  return {
    date: cancellation?.date ?? date,
    venue: picks.data?.venue as string | undefined,
    trackCondition: picks.data?.trackCondition as string | undefined,
    generatedAt: picks.data?.generatedAt as string | undefined,
    // 版本：後端 edition/frozen；未鎖一律當初版。
    frozen: picks.data?.frozen === true,
    edition: (picks.data?.frozen === true ? "final" : "draft") as "final" | "draft",

    engine: (picks.data?.engine ?? picks.data?.meta ?? picks.data) as any,
    races: cancellation ? [] : races,
    meeting: meeting.data,
    cancellation,
    isLoading: cancellation ? false : picks.isLoading,
    error: picks.error,
  };
}
