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
} from "@/components/tx/ui";
import { HitStrip, KpiTile, KV } from "@/components/tx/viz";
import { fmtMeetingDate, num, txApi } from "@/lib/tx-api";
import { meetingCancellationForDate } from "@/lib/meeting-status";

type Search = { date?: string | undefined };

export const Route = createFileRoute("/results")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    date: typeof search["date"] === "string" ? (search["date"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "賽果核對 · 天喜 TIANXI" },
      { name: "description", content: "每個賽馬日逐場核對引擎凍結預測與官方賽果，計算命中率與交集。" },
      { property: "og:title", content: "賽果核對 · 天喜 TIANXI" },
      { property: "og:description", content: "引擎預測 vs 官方賽果逐場核對。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { date } = Route.useSearch();
  const navigate = Route.useNavigate();

  const list = useQuery({ queryKey: ["meetings", 12], queryFn: () => txApi.meetings("?limit=12") });
  const meetings = (list.data?.meetings || []).filter((meeting) => !meetingCancellationForDate(meeting.date));
  const activeDate = date || meetings[1]?.date || meetings[0]?.date;

  const hr = useQuery({
    queryKey: ["hitRate", activeDate],
    queryFn: () => txApi.hitRate(activeDate!),
    enabled: !!activeDate,
  });

  const s = hr.data?.summary;
  const races: any[] = hr.data?.races || [];

  return (
    <AppShell page="" ticker={activeDate ? `${fmtMeetingDate(activeDate)} 賽果核對` : "載入賽事…"}>
      <PageHead en="Results Audit" title="賽果核對" desc="引擎預測在賽前凍結，賽後與官方賽果逐場比對。" />

      <div className="no-scrollbar mx-4 flex gap-1 overflow-x-auto">
        {meetings.map((m) => {
          const on = m.date === activeDate;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => navigate({ search: { date: m.date } })}
              className={`tabnum shrink-0 rounded-[4px] border px-2 py-1 font-mono-tx text-[10px] font-bold ${
                on ? "border-gold-strong bg-gold-bg text-gold" : "border-hairline bg-paper text-ink-2"
              }`}
            >
              {m.date.slice(5)} {m.venue}
            </button>
          );
        })}
      </div>

      <Card title="當日命中率" en="Hit Rate">
        {hr.isLoading ? (
          <Loading />
        ) : hr.error ? (
          <ErrorNote error={hr.error} />
        ) : s ? (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <KpiTile
                label="四揀平均中"
                en="Top4 Avg"
                value={num(s.top4AvgIntersect, 2)}
                unit="／4"
                ratio={s.top4AvgIntersect != null ? Number(s.top4AvgIntersect) / 4 : null}
                tone={Number(s.top4AvgIntersect) >= 3 ? "win" : "gold"}
                sub={`${races.length} 場已評核`}
                trend={races.map((r: any) => r.top4IntersectCount)}
              />
              <KpiTile
                label="前三平均中"
                en="Top3 Avg"
                value={num(s.top3AvgIntersect, 2)}
                unit="／3"
                ratio={s.top3AvgIntersect != null ? Number(s.top3AvgIntersect) / 3 : null}
                sub={`三甲任中 ${num(s.top3AnyHitRate)}% · ${s.top3AnyHits} 場`}
                trend={races.map((r: any) => r.top3IntersectCount)}
              />
            </div>
            <div className="rounded-[10px] border border-hairline bg-paper p-2.5">
              <p className="mb-1.5 text-[10px] font-bold text-ink-3">逐場四揀達標（≥3 匹）</p>
              <HitStrip hits={races.map((r: any) => (r.top4IntersectCount == null ? null : r.top4IntersectCount >= 3))} />
            </div>
            <div className="rounded-[10px] border border-hairline bg-paper px-2.5 py-1.5">
              <KV k="三重彩（頭三名複式）" v={`${num(s.trioHitRate)}% · ${s.trioHits} 場`} />
              <KV k="四重彩（頭四名複式）" v={`${num(s.first4HitRate)}% · ${s.first4Hits} 場`} />
              <KV k="凍結模型" v={races[0]?.scoreSource === "lgb" ? "天喜LGB" : races[0]?.scoreSource || "—"} />
              <KV k="集成比重" v={typeof races[0]?.ensembleAlpha === "number" ? `α=${Number(races[0].ensembleAlpha).toFixed(2)}` : "—"} />
            </div>
          </div>
        ) : (
          <Empty label="此日尚未核對" />
        )}
      </Card>

      <Card title="逐場核對" en="Per Race">
        {hr.isLoading ? (
          <Loading />
        ) : races.length ? (
          <div className="divide-y divide-hairline">
            {races.map((r) => (
              <details key={r.raceNumber} open={Number(r.raceNumber) === 1} className="py-2.5">
                <summary className="flex cursor-pointer list-none items-center gap-2">
                  <span className="tabnum w-7 font-mono-tx text-[13px] font-bold text-gold">R{r.raceNumber}</span>
                  <span className="tabnum font-mono-tx text-[10px] text-ink-3">
                    {r.distance}m · {r.going}
                  </span>
                  <span className="ml-auto flex gap-1">
                    <Pill tone={(r.top4IntersectCount ?? 0) >= 3 ? "win" : "ink"}>
                      四揀中 {r.top4IntersectCount ?? "—"}
                    </Pill>
                    <Pill tone={r.top3AnyHit ? "win" : "ink"}>入頭三 {r.top3IntersectCount}</Pill>
                  </span>
                  <span className="text-[10px] text-ink-3">▼</span>
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-[8px] border border-hairline bg-paper p-2">
                    <p className="mb-1 text-[10px] font-bold text-ink-3">引擎凍結四揀</p>
                    {(r.predictedTop4 || []).map((p: any) => (
                      <div key={p.horseNumber} className="flex items-center gap-1.5 py-0.5">
                        <span className="tabnum w-4 font-mono-tx text-[10px] font-bold text-gold">#{p.rank}</span>
                        <span className="tabnum w-5 rounded-[3px] bg-deep px-0.5 text-center font-mono-tx text-[10px] font-bold text-deep-fg">
                          {p.horseNumber}
                        </span>
                        {p.horseId ? <Link to="/horse" search={{ id: p.horseId }} className={`min-w-0 flex-1 truncate font-serif-tc text-[11px] ${p.hit ? "font-bold text-win" : "text-ink-2"}`}>{p.nameCh}</Link> : <span className={`min-w-0 flex-1 truncate font-serif-tc text-[11px] ${p.hit ? "font-bold text-win" : "text-ink-2"}`}>{p.nameCh}</span>}
                        <span className="shrink-0 font-mono-tx text-[10px]">{p.hit ? "✓" : "·"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[8px] border border-hairline bg-paper p-2">
                    <p className="mb-1 text-[10px] font-bold text-ink-3">官方頭四名</p>
                    {(r.actualTop4 || []).map((a: any) => (
                      <div key={a.horseNumber} className="flex items-center gap-1.5 py-0.5">
                        <span className="tabnum w-4 font-mono-tx text-[10px] font-bold text-ink-3">{a.position}</span>
                        <span className="tabnum w-5 rounded-[3px] bg-deep px-0.5 text-center font-mono-tx text-[10px] font-bold text-deep-fg">
                          {a.horseNumber}
                        </span>
                        {a.horseId ? <Link to="/horse" search={{ id: a.horseId }} className={`min-w-0 flex-1 truncate font-serif-tc text-[11px] ${a.hit ? "font-bold text-win" : "text-ink-2"}`}>{a.nameCh}</Link> : <span className={`min-w-0 flex-1 truncate font-serif-tc text-[11px] ${a.hit ? "font-bold text-win" : "text-ink-2"}`}>{a.nameCh}</span>}
                        <span className="tabnum shrink-0 font-mono-tx text-[10px] text-ink-3">{a.winOdds ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <Pill tone={r.trioHit ? "win" : "ink"}>三重彩</Pill>
                  <Pill tone={r.first4Hit ? "win" : "ink"}>四重彩</Pill>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Card>

      <details className="mx-4 my-3 rounded-[10px] border border-hairline bg-paper-2">
        <summary className="cursor-pointer px-3 py-2.5 font-serif-tc text-[12px] font-bold text-ink">點樣讀賽果核對</summary>
        <div className="space-y-1 border-t border-hairline px-3 py-2.5 text-[10.5px] leading-relaxed text-ink-2">
          <p><b className="text-ink">四揀平均命中</b>：每場模型頭四匹，有幾多匹出現在官方頭四名，再取全日平均。</p>
          <p><b className="text-ink">三重彩</b>：模型排名頭三匹，複式覆蓋官方頭三名。</p>
          <p><b className="text-ink">四重彩</b>：模型排名頭四匹，複式覆蓋官方頭四名。</p>
        </div>
      </details>

      <Disclaimer />
    </AppShell>
  );
}
