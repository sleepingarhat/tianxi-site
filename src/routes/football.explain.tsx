import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/tx/AppShell";
import { Card, Disclaimer, ErrorNote, Loading, PageHead, Stat, StatGrid } from "@/components/tx/ui";

export const Route = createFileRoute("/football/explain")({
  head: () => ({
    meta: [
      { title: "足球覆蓋解釋 · 天喜 TIANXI" },
      { name: "description", content: "凍結 1X2 與頭八格波膽覆蓋統計。唔係勝出因果。" },
    ],
  }),
  component: FootballExplain,
});

type HitRate = {
  generated_at?: string;
  green?: { n: number; rps_avg: number; argmax_hit_rate: number; ece: number; cs_top8: number; cs_logloss: number };
  scope?: { note?: string };
};

function FootballExplain() {
  const q = useQuery({
    queryKey: ["footballHitRate"],
    queryFn: async (): Promise<HitRate> => {
      const res = await fetch("/api/public/football-predictions?file=hit_rate");
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as HitRate;
    },
    staleTime: 300_000,
  });
  const g = q.data?.green;
  return (
    <AppShell page="football" ticker="足球覆蓋解釋 · 唯讀凍結帳 · 唔講因果">
      <PageHead
        en="Coverage Explain"
        title="足球覆蓋解釋"
        desc="只讀綠燈完場凍結帳。1X2 argmax 與頭八格波膽重疊。唔改排名、唔重算、唔係 TreeSHAP。"
      />
      <div className="px-4 pt-3">
        <Link to="/football" className="text-[11px] font-bold text-gold">
          ← 返足球引擎
        </Link>
      </div>
      {q.isLoading ? (
        <Card>
          <Loading label="讀取戰績…" />
        </Card>
      ) : q.error ? (
        <Card>
          <ErrorNote error={q.error} />
        </Card>
      ) : !g ? (
        <Card title="未有綠燈樣本">
          <p className="text-[11px] text-ink-2">未有經過綠燈完場的凍結場，唔係故障。紅燈不入周期。</p>
        </Card>
      ) : (
        <Card title="綠燈窗" en="Green window">
          <StatGrid cols={3}>
            <Stat label="樣本" value={g.n} sub="五大 · 經過綠燈" />
            <Stat label="1X2 首選中" value={`${(g.argmax_hit_rate * 100).toFixed(1)}%`} sub="argmax 覆蓋" />
            <Stat label="頭八格覆蓋" value={`${(g.cs_top8 * 100).toFixed(1)}%`} sub="實際比分落入凍結 top8" />
          </StatGrid>
          <StatGrid cols={3}>
            <Stat label="RPS" value={g.rps_avg.toFixed(4)} sub="越低越好" />
            <Stat label="ECE" value={g.ece.toFixed(4)} sub="1X2 校準" />
            <Stat label="波膽 log-loss" value={g.cs_logloss.toFixed(3)} sub="實際格" />
          </StatGrid>
          <p className="mt-2 text-[10px] leading-relaxed text-ink-3">
            {q.data?.scope?.note} 更新 {q.data?.generated_at ?? "—"}。樣本少於 10 場唔好當結論。
          </p>
        </Card>
      )}
      <Disclaimer extra="釋義層用覆蓋／只中／凍結四擁口徑。「因果」只出現在否定句。LGB TreeSHAP 要同一版 booster 在研究倉跑完先顯示。" />
    </AppShell>
  );
}
