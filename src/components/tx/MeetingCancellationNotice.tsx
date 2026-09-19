import { Pill } from "./ui";

import type { MeetingCancellation } from "@/lib/meeting-status";
import { fmtMeetingDate } from "@/lib/tx-api";

export function MeetingCancellationNotice({ cancellation }: { cancellation: MeetingCancellation }) {
  return (
    <section className="mx-4 my-3 border-y-2 border-lose bg-lose/[0.06] px-3 py-3" role="status">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-serif-tc text-[17px] font-bold text-lose">{cancellation.label}</p>
          <p className="tabnum mt-0.5 font-mono-tx text-[10px] text-ink-3">
            {fmtMeetingDate(cancellation.date)}
          </p>
        </div>
        <Pill tone="lose">停賽</Pill>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-2">{cancellation.reason}</p>
    </section>
  );
}