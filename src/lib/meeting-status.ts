export type MeetingCancellation = {
  date: string;
  label: string;
  reason: string;
};

const MEETING_CANCELLATIONS: Record<string, MeetingCancellation> = {
  "2026-09-19": {
    date: "2026-09-19",
    label: "今日賽事停賽",
    reason: "因董建華離世，今日賽事停賽；不會生成或鎖定預測，亦不會計入戰績。",
  },
};

export function hkDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : "";
}

export function meetingCancellationForDate(date?: string | null): MeetingCancellation | null {
  if (!date) return null;
  return MEETING_CANCELLATIONS[date] ?? null;
}

export function todayMeetingCancellation(now = new Date()): MeetingCancellation | null {
  return meetingCancellationForDate(hkDate(now));
}