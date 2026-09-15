import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/tx/AppShell";
import { FootballCrest } from "@/components/tx/FootballCrest";
import { Card, Disclaimer, Empty, ErrorNote, Loading, PageHead, Pill, Scroller, Seg, Table, Td } from "@/components/tx/ui";
import { useCrests } from "@/lib/footballCrests";
import { teamSlug } from "@/lib/footballTeams";
import { teamZh } from "@/lib/teamZh";
import type { LeaguePayload } from "@/lib/footballTeams";

export const Route = createFileRoute("/football/standings")({
  head: () => ({
    meta: [
      { title: "五大聯賽積分榜 · 天喜足球ELO 一欄 · 天喜 TIANXI" },
      {
        name: "description",
        content:
          "英超、德甲、西甲、意甲、法甲本季積分榜，附天喜足球ELO（自建、賽前 as-of，非 FIFA 排名）、主客攻防分拆同近五場走勢；撳隊名入球隊資料頁。",
      },
      { property: "og:title", content: "五大聯賽積分榜 · 天喜 TIANXI" },
      { property: "og:description", content: "積分榜＋天喜足球ELO＋主客攻防分拆，撳隊名睇逐場凍結預測對帳。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StandingsPage,
});

const LEAGUES = [
  { value: "E0", label: "英超" },
  { value: "D1", label: "德甲" },
  { value: "SP1", label: "西甲" },
  { value: "I1", label: "意甲" },
  { value: "F1", label: "法甲" },
] as const;

const per = (v: number, n: number) => (n > 0 ? (v / n).toFixed(2) : "—");

function FormRow({ form }: { form: ("W" | "D" | "L")[] }) {
  if (form.length === 0) return <span className="text-ink-3">—</span>;
  return (
    <span className="inline-flex gap-[3px]">
      {form.map((f, i) => (
        <span
          key={i}
          className={`inline-flex h-[15px] w-[15px] items-center justify-center rounded-[3px] text-[9px] font-bold ${
            f === "W" ? "bg-win/15 text-win" : f === "L" ? "bg-lose/15 text-lose" : "bg-paper text-ink-2"
          }`}
        >
          {f === "W" ? "勝" : f === "L" ? "負" : "和"}
        </span>
      ))}
    </span>
  );
}

function StandingsPage() {
  const [div, setDiv] = useState<string>("E0");
  const q = useQuery({
    queryKey: ["footballLeague", div],
    queryFn: async (): Promise<LeaguePayload> => {
      const res = await fetch(`/api/public/football-league?div=${encodeURIComponent(div)}`);
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as LeaguePayload;
    },
    staleTime: 600_000,
  });
  const crestOf = useCrests([div]);
  const rows = q.data?.table ?? [];

  return (
    <AppShell page="football" ticker="五大聯賽積分榜 · 天喜足球ELO 為自建賽前 as-of 評分 · 唔係 FIFA 排名 · 賠率零權重">
      <PageHead
        en="League Tables"
        title="五大聯賽積分榜"
        desc={
          <>
            本季積分榜由已落地嘅賽果即場派生，同凍結預測軌分開；「天喜分」＝天喜足球ELO，
            自建、賽前 as-of、跨季回歸 25%、主場 +60，唔係 FIFA 排名。撳隊名入球隊資料頁。
          </>
        }
      />

      <div className="px-4 pt-3">
        <Seg options={LEAGUES.map((l) => ({ value: l.value as string, label: l.label }))} value={div} onChange={setDiv} />
      </div>

      <Card
        title={`${q.data?.league_zh ?? "聯賽"}積分榜`}
        en={`${q.data?.season ?? ""} Season`}
        action={<Pill tone="ink">{rows.length} 隊</Pill>}
      >
        {q.isLoading ? (
          <Loading label="讀取賽果…" />
        ) : q.error ? (
          <ErrorNote error={q.error} />
        ) : rows.length === 0 ? (
          <Empty label="本季暫未有完場賽果" />
        ) : (
          <Scroller>
            <Table head={["#　球隊", "場", "勝", "和", "負", "入", "失", "分", "天喜分", "近五場"]}>
              {rows.map((t, i) => (
                <tr key={t.team} className="border-b border-hairline/60 last:border-0">
                  <Td first>
                    <Link
                      to="/football/team/$div/$slug"
                      params={{ div, slug: teamSlug(t.team) }}
                      className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-gold"
                    >
                      <span className="tabnum w-4 font-mono-tx text-[10px] text-ink-3">{i + 1}</span>
                      <FootballCrest name={teamZh(div, t.team)} src={crestOf(div, t.team)} size={18} />
                      <span>{teamZh(div, t.team)}</span>
                    </Link>
                  </Td>
                  <Td>{t.played}</Td>
                  <Td>{t.win}</Td>
                  <Td>{t.draw}</Td>
                  <Td>{t.loss}</Td>
                  <Td>{t.gf}</Td>
                  <Td>{t.ga}</Td>
                  <Td className="font-bold text-ink">{t.pts}</Td>
                  <Td className="text-gold">{t.elo}</Td>
                  <Td>
                    <FormRow form={t.form} />
                  </Td>
                </tr>
              ))}
            </Table>
          </Scroller>
        )}
      </Card>

      <Card title="主客攻防分拆" en="Home / Away Split">
        <p className="mb-2 text-[11px] leading-relaxed text-ink-2">
          每隊主場同客場嘅每場入球／失球分開列。呢個結構係研究軌唯一過三閘嘅一刀（主客分拆攻防），
          正準備移植入生產模型；未過逐季生產閘門之前，凍結預測一分不改。
        </p>
        {rows.length === 0 ? null : (
          <Scroller>
            <Table head={["球隊", "主·場", "主·入/場", "主·失/場", "客·場", "客·入/場", "客·失/場"]}>
              {rows.map((t) => (
                <tr key={t.team} className="border-b border-hairline/60 last:border-0">
                  <Td first>
                    <Link
                      to="/football/team/$div/$slug"
                      params={{ div, slug: teamSlug(t.team) }}
                      className="font-medium text-ink hover:text-gold"
                    >
                      {teamZh(div, t.team)}
                    </Link>
                  </Td>
                  <Td>{t.home.played}</Td>
                  <Td>{per(t.home.gf, t.home.played)}</Td>
                  <Td>{per(t.home.ga, t.home.played)}</Td>
                  <Td>{t.away.played}</Td>
                  <Td>{per(t.away.gf, t.away.played)}</Td>
                  <Td>{per(t.away.ga, t.away.played)}</Td>
                </tr>
              ))}
            </Table>
          </Scroller>
        )}
      </Card>

      <Disclaimer extra="積分榜同天喜足球ELO由已完場賽果派生，只作分析參考；賽前凍結預測見「預測 vs 賽果」頁。" />
    </AppShell>
  );
}
