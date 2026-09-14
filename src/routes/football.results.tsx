import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/tx/AppShell";
import { FootballLedger } from "@/components/tx/FootballLedger";
import { Card, Disclaimer, PageHead, Pill, Scroller, Stat, StatGrid, Table, Td } from "@/components/tx/ui";
import {
  FB_CALIBRATION,
  FB_DRAW_RELIABILITY,
  FB_ECE_CALIBRATED,
  FB_SEASONS,
  FB_SNAPSHOT_DATE,
  FB_SPAN,
  FB_TOTAL_MATCHES,
  FB_TRACKS,
  FB_VALUE_KELLY,
  FB_VALUE_RUNS,
  FB_VALUE_SEASONS,
  pct,
} from "@/lib/football-snapshot";

export const Route = createFileRoute("/football/results")({
  head: () => ({
    meta: [
      { title: "足球公開對帳 · 逐季成績與校準表 · 天喜 TIANXI" },
      {
        name: "description",
        content:
          "天喜足球引擎公開對帳：14.99 萬場時序回測逐季成績、首選機率校準表、和局分區可靠度，連未過關項目一併公開，賠率零權重。",
      },
      { property: "og:title", content: "足球公開對帳 · 天喜 TIANXI" },
      { property: "og:description", content: "逐季 RPS、命中率、校準誤差 0.30%，好壞一齊公開。" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FootballResultsPage,
});

const CALIB_LABEL: Record<string, string> = { none: "免校準", vector: "向量標度", isotonic: "保序回歸" };

const best = FB_SEASONS.reduce((a, b) => (b.rps < a.rps ? b : a));
const worst = FB_SEASONS.reduce((a, b) => (b.rps > a.rps ? b : a));
const winSeasons = FB_SEASONS.filter((s) => s.rps < s.lgbRps).length;

function FootballResultsPage() {
  return (
    <AppShell
      page="football"
      ticker={`TX-Football 公開對帳 · ${FB_TOTAL_MATCHES.toLocaleString()} 場時序回測 · RPS 0.2098 · 命中率 49.04% · 校準誤差 0.30% · 賠率零權重`}
    >
      <PageHead
        en="Public Reconciliation"
        title="足球公開對帳"
        desc={
          <>
            引擎每一段成績逐季攤開，連未過關嘅項目一齊列。呢頁係 S5 凍結快照（{FB_SNAPSHOT_DATE}），
            全部數字用時序前推——每季只准用該季之前嘅資料，賠率一項都冇入模。
          </>
        }
      />

      <FootballLedger />

      <Card title="回測總成績（S5 現行採用）" en="Backtest Headline">
        <StatGrid cols={3}>
          <Stat label="回測場次" value={FB_TOTAL_MATCHES.toLocaleString()} sub={FB_SPAN} />
          <Stat label="排序分數 RPS ↓" value="0.2098" sub="市場去水線 0.2047" />
          <Stat label="校準誤差 ECE" value={pct(FB_ECE_CALIBRATED)} sub="S4 為 1.36%" />
        </StatGrid>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <Stat label="首選命中率" value="49.04%" sub="市場 50.10%" />
          <Stat label="跑贏 LGB 嘅賽季" value={`${winSeasons} / ${FB_SEASONS.length}`} sub="同批場次比較" />
          <Stat label="最差一季" value={String(worst.rps)} sub={`${worst.season} 季（空場）`} />
        </div>
      </Card>

      <Card title="各軌對照（同一批場次）" en="Tracks">
        <Scroller>
          <Table head={["軌", "RPS ↓", "Log-loss ↓", "命中率", "和局首選率"]}>
            {FB_TRACKS.map((t) => (
              <tr key={t.key} className="border-t border-hairline">
                <Td className="whitespace-normal">
                  <span className={`font-bold ${t.live ? "text-gold" : "text-ink"}`}>{t.name}</span>
                  <span className="ml-1.5">
                    <Pill tone={t.live ? "gold" : t.key === "market" ? "win" : "ink"}>{t.note}</Pill>
                  </span>
                </Td>
                <Td className="tabnum font-mono-tx">{t.rps.toFixed(4)}</Td>
                <Td className="tabnum font-mono-tx">{t.logloss.toFixed(4)}</Td>
                <Td className="tabnum font-mono-tx">{pct(t.acc)}</Td>
                <Td className="tabnum font-mono-tx">{pct(t.drawRecall, 1)}</Td>
              </tr>
            ))}
          </Table>
        </Scroller>
        <p className="mt-2 text-[10px] leading-relaxed text-ink-3">
          市場去水線只作對照，永不入模（market_beta = 0）。集成後和局首選率跌到 0.29%——正因為主客兩邊機率更尖銳；
          和局要睇下面嘅分區可靠度，唔係睇首選率。
        </p>
      </Card>

      <Card title="逐季成績（walk-forward）" en="Season by Season">
        <Scroller>
          <Table head={["賽季", "場次", "RPS ↓", "對 S4", "Log-loss", "命中率", "權重 LGB／入球／Elo", "校準"]}>
            {FB_SEASONS.map((s) => {
              const delta = s.rps - s.lgbRps;
              return (
                <tr key={s.season} className="border-t border-hairline">
                  <Td className="font-bold text-ink">
                    {s.season}
                    {s.season === best.season ? (
                      <span className="ml-1.5">
                        <Pill tone="win">最佳</Pill>
                      </span>
                    ) : null}
                  </Td>
                  <Td className="tabnum font-mono-tx">{s.n.toLocaleString()}</Td>
                  <Td className="tabnum font-mono-tx">{s.rps.toFixed(4)}</Td>
                  <Td className={`tabnum font-mono-tx ${delta < 0 ? "text-win" : delta > 0 ? "text-lose" : "text-ink-3"}`}>
                    {delta === 0 ? "±0" : `${delta < 0 ? "−" : "+"}${Math.abs(delta).toFixed(4)}`}
                  </Td>
                  <Td className="tabnum font-mono-tx">{s.logloss.toFixed(4)}</Td>
                  <Td className="tabnum font-mono-tx">{pct(s.acc)}</Td>
                  <Td className="tabnum font-mono-tx">{s.alpha.map((a) => a.toFixed(2)).join(" / ")}</Td>
                  <Td>
                    <Pill tone={s.calib === "none" ? "ink" : "gold"}>{CALIB_LABEL[s.calib]}</Pill>
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Scroller>
        <p className="mt-2 text-[10px] leading-relaxed text-ink-3">
          權重同校準器每季重新揀，只准用該季之前兩季嘅「季外」預測擬合，測試季賽果從未參與。三軌權重逐季浮動
          （LGB 0.40–0.70、入球模型 0.05–0.40、Elo 0.05–0.45），證明三軌都有貢獻，冇一軌係擺設。
        </p>
      </Card>

      <Card title="首選機率校準表" en="Calibration">
        <p className="mb-2 text-[11px] leading-relaxed text-ink-2">
          「講幾成就真係幾成」——每格係模型講嘅機率同實際命中率對照。整體誤差 {pct(FB_ECE_CALIBRATED)}。
        </p>
        <Scroller>
          <Table head={["機率區間", "場次", "模型講", "實際中", "偏差"]}>
            {FB_CALIBRATION.map((b) => {
              const d = b.act - b.pred;
              return (
                <tr key={b.bin} className="border-t border-hairline">
                  <Td className="font-bold text-ink">{b.bin}</Td>
                  <Td className="tabnum font-mono-tx">{b.n.toLocaleString()}</Td>
                  <Td className="tabnum font-mono-tx">{pct(b.pred, 1)}</Td>
                  <Td className="tabnum font-mono-tx">{pct(b.act, 1)}</Td>
                  <Td className={`tabnum font-mono-tx ${Math.abs(d) < 0.02 ? "text-win" : "text-lose"}`}>
                    {`${d >= 0 ? "+" : "−"}${(Math.abs(d) * 100).toFixed(1)}pt`}
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Scroller>
      </Card>

      <Card title="和局分區可靠度（和局主指標）" en="Draw Reliability">
        <p className="mb-2 text-[11px] leading-relaxed text-ink-2">
          和局佔實際賽果約 25%，但無論莊家定我哋，都幾乎唔會把和局列為首選。所以我哋唔用「和局召回率」做賣點，
          改用呢張表：只要模型講嘅和局機率同實際吻合，就可以同賠率比，喺市場低估和局嗰啲場次做價值注。
        </p>
        <Scroller>
          <Table head={["和局機率區間", "場次", "模型講", "實際和局", "偏差"]}>
            {FB_DRAW_RELIABILITY.map((b) => {
              const d = b.act - b.pred;
              const thin = b.n < 1000;
              return (
                <tr key={b.bin} className="border-t border-hairline">
                  <Td className="font-bold text-ink">
                    {b.bin}
                    {thin ? (
                      <span className="ml-1.5">
                        <Pill tone="lose">樣本少</Pill>
                      </span>
                    ) : null}
                  </Td>
                  <Td className="tabnum font-mono-tx">{b.n.toLocaleString()}</Td>
                  <Td className="tabnum font-mono-tx">{pct(b.pred, 1)}</Td>
                  <Td className="tabnum font-mono-tx">{pct(b.act, 1)}</Td>
                  <Td className={`tabnum font-mono-tx ${Math.abs(d) < 0.02 ? "text-win" : "text-lose"}`}>
                    {`${d >= 0 ? "+" : "−"}${(Math.abs(d) * 100).toFixed(1)}pt`}
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Scroller>
        <p className="mt-2 rounded-[8px] border border-lose/30 bg-lose/5 px-2.5 py-2 text-[10px] leading-relaxed text-ink-2">
          <b className="text-lose">照實講未過關嘅位：</b>
          最高兩格（30–35%、35–40%）模型高估和局——講 31.4% 實際 30.2%、講 36.3% 實際 27.2%（後者只有 541 場，樣本太少）。
          即係「模型覺得極可能和局」嗰批場次唔可信，價值注會封頂喺 30%。呢個限制會一路貼喺呢頁，直到修好為止。
        </p>
      </Card>

      <Card title="價值注盈虧回測（未過關）" en="Value Betting">
        <p className="mb-2 text-[11px] leading-relaxed text-ink-2">
          機率準唔等於贏錢。呢個回測係喺同一批 {FB_TOTAL_MATCHES.toLocaleString()} 場，把模型機率同賽前賠率比較，
          有優勢（機率 × 賠率 &gt; 1 加上門檻）就落一注，逐注結算。結論好直接：<b className="text-lose">八個方案全部蝕錢</b>
          ，所以價值注唔會上線，收費閘門亦未開。
        </p>
        <StatGrid cols={3}>
          <Stat label="最好方案每注回報" value="−2.24%" sub="全市場最佳價 · 門檻 0%" />
          <Stat label="最差方案每注回報" value="−9.90%" sub="單一莊家 · 冇比價" />
          <Stat label="定額凱利模擬" value="輸光" sub={`${FB_VALUE_KELLY.startBank} 起注 · 每注上限 ${FB_VALUE_KELLY.capPct}%`} />
        </StatGrid>
        <div className="mt-2">
          <Scroller>
            <Table head={["方案", "注數", "命中率", "平均賠率", "每注回報"]}>
              {FB_VALUE_RUNS.map((r) => (
                <tr key={r.key} className="border-t border-hairline">
                  <Td className="whitespace-normal font-bold text-ink">
                    {r.name}
                    {r.note ? (
                      <span className="ml-1.5">
                        <Pill tone={r.note === "主方案" ? "gold" : "ink"}>{r.note}</Pill>
                      </span>
                    ) : null}
                  </Td>
                  <Td className="tabnum font-mono-tx">{r.bets.toLocaleString()}</Td>
                  <Td className="tabnum font-mono-tx">{pct(r.hit, 1)}</Td>
                  <Td className="tabnum font-mono-tx">{r.avgOdds.toFixed(2)}</Td>
                  <Td className={`tabnum font-mono-tx ${r.yieldPct > 0 ? "text-win" : "text-lose"}`}>
                    {`${r.yieldPct > 0 ? "+" : "−"}${Math.abs(r.yieldPct).toFixed(2)}%`}
                  </Td>
                </tr>
              ))}
            </Table>
          </Scroller>
        </div>
        <div className="mt-2">
          <Scroller>
            <Table head={["賽季", "每注回報（主方案）"]}>
              {FB_VALUE_SEASONS.map((s) => (
                <tr key={s.season} className="border-t border-hairline">
                  <Td className="font-bold text-ink">{s.season}</Td>
                  <Td className={`tabnum font-mono-tx ${s.yieldPct > 0 ? "text-win" : "text-lose"}`}>
                    {`${s.yieldPct > 0 ? "+" : "−"}${Math.abs(s.yieldPct).toFixed(2)}%`}
                  </Td>
                </tr>
              ))}
            </Table>
          </Scroller>
        </div>
        <p className="mt-2 rounded-[8px] border border-lose/30 bg-lose/5 px-2.5 py-2 text-[10px] leading-relaxed text-ink-2">
          <b className="text-lose">照實講：</b>
          十五季只有兩季（2017、2019）僅僅正數，其餘全負，而且近幾季愈蝕愈多——市場效率提升，模型追唔上。
          唯一有意義嘅發現：跨莊比價把每注回報由 −9.9% 拉到 −2.2%，即係「攞最佳價」值七個百分點，比揀邊場落注重要。
          要翻正，欠嘅係 xG、賽前陣容同傷停，唔會靠把賠率加入模型去偷分。
        </p>
      </Card>

      <Card title="呢頁未有嘅嘢" en="Not Yet">
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            {
              t: "綠燈入帳",
              b: "逐場凍結帳（S13）已上線：一場一條、開賽前 60 分鐘鎖、賽果只補唔改。但每日凍結軌仍係 S3＋S2（紅燈），要等 S5 集成推論接入同一指紋才開綠燈入帳。",
            },
            {
              t: "可以賺錢嘅價值注",
              b: "回測已經做完（見上面一格）：八個方案全部蝕錢，所以唔上線。硬閘門係「排序分數過關＋回測正收益」，而家只過咗一半，未過之前唔會收費。",
            },
            {
              t: "xG／賽前陣容／傷停",
              b: "v1 特徵未上線。離市場去水線嘅 0.0051 差距要靠呢批資料追，唔會靠加賠率入模去偷分。",
            },
            {
              t: "港式譯名對照",
              b: "球隊球員顯示名以馬會譯名為準，對照表仍在建；撞唔到會標「待審」，唔會亂譯。",
            },
          ].map((x) => (
            <div key={x.t} className="rounded-[8px] border border-hairline bg-paper px-2.5 py-2">
              <p className="font-serif-tc text-[12px] font-bold text-deep">{x.t}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-ink-2">{x.b}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-ink-3">
          <Link to="/football" className="font-bold text-gold underline decoration-dotted">
            ← 返回足球引擎主頁
          </Link>
        </p>
      </Card>

      <Disclaimer extra="本頁為歷史時序回測結果（凍結快照），不構成任何投注建議；足球預測引擎仍在興建階段。" />
    </AppShell>
  );
}
