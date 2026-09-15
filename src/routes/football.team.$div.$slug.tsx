import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/tx/AppShell";
import { FootballCrest } from "@/components/tx/FootballCrest";
import {
  Card,
  Disclaimer,
  Empty,
  ErrorNote,
  Loading,
  PageHead,
  Pill,
  Scroller,
  Stat,
  StatGrid,
  Table,
  Td,
} from "@/components/tx/ui";
import { useCrests } from "@/lib/footballCrests";
import { LEAGUE_ZH, teamSlug } from "@/lib/footballTeams";
import { teamZh } from "@/lib/teamZh";
import type { LeaguePayload, LeagueTeam } from "@/lib/footballTeams";

export const Route = createFileRoute("/football/team/$div/$slug")({
  head: ({ params }) => {
    const league = LEAGUE_ZH[params.div] ?? "五大聯賽";
    const name = params.slug.replace(/-/g, " ");
    return {
      meta: [
        { title: `${name} 球隊資料 · ${league} · 天喜 TIANXI` },
        {
          name: "description",
          content: `${name}（${league}）球隊資料頁：天喜足球ELO 走勢、近況、主客攻防分拆、逐場凍結預測 vs 賽果，賠率零權重。`,
        },
        { property: "og:title", content: `${name} 球隊資料 · 天喜 TIANXI` },
        { property: "og:description", content: `${league} ${name}：天喜分走勢、主客攻防、逐場凍結預測對帳。` },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: TeamPage,
});

type LogMatch = {
  match_key: string;
  div: string;
  league_zh: string;
  home: string;
  away: string;
  kickoff_utc: string;
  status?: string;
  track?: string;
  fingerprint?: string;
  p?: [number, number, number];
  lambda?: [number, number];
  cs?: { top8?: { score: string; p: number; res: string }[] } | null;
  result?: { hg: number; ag: number; ftr?: string } | null;
};

const p1 = (v: number) => `${(v * 100).toFixed(1)}%`;
const per = (v: number, n: number) => (n > 0 ? (v / n).toFixed(2) : "—");

function monthKeys() {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 0; i < 2; i += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function EloSpark({ points }: { points: { date: string; elo: number }[] }) {
  if (points.length < 2) return <p className="text-[11px] text-ink-3">賽果不足，未有走勢。</p>;
  const vals = points.map((p) => p.elo);
  const min = Math.min(...vals) - 8;
  const max = Math.max(...vals) + 8;
  const w = 300;
  const h = 62;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p.elo - min) / (max - min)) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[62px] w-full" role="img" aria-label="天喜足球ELO 走勢">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" className="text-gold" />
      {points.map((p, i) => (
        <circle
          key={p.date + i}
          cx={(i / (points.length - 1)) * w}
          cy={h - ((p.elo - min) / (max - min)) * h}
          r="2.4"
          className="fill-gold"
        />
      ))}
    </svg>
  );
}

function TeamPage() {
  const { div, slug } = Route.useParams();
  const league = LEAGUE_ZH[div] ?? div;

  const q = useQuery({
    queryKey: ["footballLeague", div],
    queryFn: async (): Promise<LeaguePayload> => {
      const res = await fetch(`/api/public/football-league?div=${encodeURIComponent(div)}`);
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as LeaguePayload;
    },
    staleTime: 600_000,
  });

  const rows: LeagueTeam[] = q.data?.table ?? [];
  const team = rows.find((t) => teamSlug(t.team) === slug);
  const rank = team ? rows.findIndex((t) => t.team === team.team) + 1 : 0;
  const crestOf = useCrests([div]);

  const logs = useQuery({
    queryKey: ["footballTeamLog", div, slug],
    enabled: Boolean(team),
    queryFn: async (): Promise<LogMatch[]> => {
      const out: LogMatch[] = [];
      for (const month of monthKeys()) {
        const res = await fetch(`/api/public/football-predictions?file=log&month=${month}`);
        if (!res.ok) continue;
        const data = (await res.json()) as { matches?: Record<string, LogMatch> };
        for (const m of Object.values(data.matches ?? {})) {
          if (m.div === div && (m.home === team?.team || m.away === team?.team)) out.push(m);
        }
      }
      out.sort((a, b) => (a.kickoff_utc < b.kickoff_utc ? 1 : -1));
      return out;
    },
    staleTime: 300_000,
  });

  return (
    <AppShell
      page="football"
      ticker={`${team ? teamZh(div, team.team) : slug} · ${league} · 天喜分為自建賽前 as-of 評分 · 凍結預測只讀、賽後只補賽果欄`}
    >
      <PageHead
        en="Team Profile"
        title={team ? teamZh(div, team.team) : slug.replace(/-/g, " ")}
        desc={
          <>
            {league}本季資料：天喜足球ELO 走勢、近況、主客攻防分拆，同逐場已鎖凍結預測對賽果。
            全部由已落地賽果同凍結帳讀出，唔會重跑模型。
          </>
        }
      />

      <div className="px-4 pt-3">
        <Link
          to="/football/standings"
          className="inline-flex items-center gap-1 rounded-[6px] border border-hairline bg-paper px-2.5 py-1.5 text-[11px] font-bold text-ink"
        >
          ← 返{league}積分榜
        </Link>
      </div>

      {q.isLoading ? (
        <Card>
          <Loading label="讀取賽果…" />
        </Card>
      ) : q.error ? (
        <Card>
          <ErrorNote error={q.error} />
        </Card>
      ) : !team ? (
        <Card title="搵唔到呢隊" en="Not Found">
          <p className="text-[11px] leading-relaxed text-ink-2">
            {league}本季名單內冇對應球隊（可能係代號改動或者未有本季賽果）。
          </p>
        </Card>
      ) : (
        <>
          <Card
            title="本季概況"
            en="Season Summary"
            action={
              <span className="flex items-center gap-1.5">
                <FootballCrest name={teamZh(div, team.team)} src={crestOf(div, team.team)} size={22} />
                <Pill tone="gold">排名 {rank}</Pill>
              </span>
            }
          >
            <StatGrid cols={3}>
              <Stat label="積分" value={team.pts} sub={`${team.played} 場`} />
              <Stat label="入球 / 失球" value={`${team.gf} / ${team.ga}`} sub={`淨 ${team.gf - team.ga >= 0 ? "+" : ""}${team.gf - team.ga}`} />
              <Stat label="天喜足球ELO" value={team.elo} sub="自建 · 賽前 as-of" />
            </StatGrid>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <Stat label="勝 / 和 / 負" value={`${team.win} / ${team.draw} / ${team.loss}`} sub="本季聯賽" />
              <Stat label="主場天喜分" value={team.eloHome} sub="含主場 +60" />
              <Stat label="客場天喜分" value={team.eloAway} sub="不含主場加成" />
            </div>
          </Card>

          <Card title="天喜分走勢" en="Tianxi Elo Trend">
            <EloSpark points={team.eloTrend} />
            <p className="mt-1 text-[10px] leading-relaxed text-ink-3">
              最近 {team.eloTrend.length} 場之後嘅評分。天喜足球ELO 係自建評分（跨季回歸 25%、主場 +60），唔係 FIFA 排名，亦唔等於預測機率。
            </p>
          </Card>

          <Card title="主客攻防分拆" en="Home / Away Split">
            <Scroller>
              <Table head={["場地", "場", "入/場", "失/場", "分/場"]}>
                {([
                  { label: "主場", s: team.home },
                  { label: "客場", s: team.away },
                ] as const).map((r) => (
                  <tr key={r.label} className="border-b border-hairline/60 last:border-0">
                    <Td first>{r.label}</Td>
                    <Td>{r.s.played}</Td>
                    <Td>{per(r.s.gf, r.s.played)}</Td>
                    <Td>{per(r.s.ga, r.s.played)}</Td>
                    <Td>{per(r.s.pts, r.s.played)}</Td>
                  </tr>
                ))}
              </Table>
            </Scroller>
          </Card>

          <Card title="近況" en="Recent Results">
            {team.matches.length === 0 ? (
              <Empty label="本季暫未有完場賽果" />
            ) : (
              <Scroller>
                <Table head={["日期", "主客", "對手", "對手天喜分", "比分", "結果"]}>
                  {team.matches.map((m) => (
                    <tr key={`${m.date}-${m.opp}`} className="border-b border-hairline/60 last:border-0">
                      <Td first>{m.date.slice(5)}</Td>
                      <Td>{m.venue === "H" ? "主" : "客"}</Td>
                      <Td className="text-left">
                        <Link
                          to="/football/team/$div/$slug"
                          params={{ div, slug: teamSlug(m.opp) }}
                          className="text-ink hover:text-gold"
                        >
                          {teamZh(div, m.opp)}
                        </Link>
                      </Td>
                      <Td>{m.oppEloBefore}</Td>
                      <Td>
                        {m.gf}–{m.ga}
                      </Td>
                      <Td>
                        <Pill tone={m.res === "W" ? "win" : m.res === "L" ? "lose" : "ink"}>
                          {m.res === "W" ? "勝" : m.res === "L" ? "負" : "和"}
                        </Pill>
                      </Td>
                    </tr>
                  ))}
                </Table>
              </Scroller>
            )}
          </Card>

          <Card
            title="逐場凍結預測 vs 賽果"
            en="Frozen vs Result"
            action={
              <Link to="/football/prediction-vs-result" className="text-[10px] font-bold text-gold">
                全站對帳 →
              </Link>
            }
          >
            {logs.isLoading ? (
              <Loading label="讀取凍結帳…" />
            ) : logs.error ? (
              <ErrorNote error={logs.error} />
            ) : (logs.data ?? []).length === 0 ? (
              <Empty label="凍結帳暫未有呢隊嘅場次" />
            ) : (
              <div className="flex flex-col gap-2">
                {(logs.data ?? []).map((m) => {
                  const p = m.p ?? [0, 0, 0];
                  const top = m.cs?.top8?.[0];
                  const settled = m.result && Number.isFinite(m.result.hg);
                  const score = settled ? `${m.result?.hg}-${m.result?.ag}` : null;
                  const hit = settled && top ? top.score === score : null;
                  return (
                    <div key={m.match_key} className="rounded-[8px] border border-hairline bg-paper px-2.5 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold text-ink">
                          {teamZh(m.div, m.home)} vs {teamZh(m.div, m.away)}
                        </p>
                        <Pill tone={settled ? "gold" : "ink"}>{settled ? `完場 ${score}` : "已鎖定 · 待完場"}</Pill>
                      </div>
                      <p className="tabnum mt-1 font-mono-tx text-[10px] text-ink-2">
                        凍結機率 主 {p1(p[0])} · 和 {p1(p[1])} · 客 {p1(p[2])}
                        {m.lambda ? ` · 預期入球 ${m.lambda[0].toFixed(2)}–${m.lambda[1].toFixed(2)}` : ""}
                      </p>
                      {top ? (
                        <p className="tabnum mt-0.5 font-mono-tx text-[10px] text-ink-3">
                          最可能波膽 {top.score}（{p1(top.p)}）
                          {hit === null ? "" : hit ? " · 眾數中" : " · 眾數唔中"}
                        </p>
                      ) : null}
                      {m.fingerprint ? (
                        <p className="mt-0.5 font-mono-tx text-[9px] text-ink-3">指紋 {m.fingerprint}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-2 text-[10px] leading-relaxed text-ink-3">
              呢區只讀凍結帳：預測欄開賽前 60 分鐘鎖死，賽後只補 90 分鐘賽果，唔重跑模型。波膽眾數命中率只作展示，唔會回寫調參。
            </p>
          </Card>
        </>
      )}

      <Disclaimer extra="球隊頁數字由已落地賽果同凍結帳派生，唔涉賠率、唔改凍結預測。" />
    </AppShell>
  );
}
