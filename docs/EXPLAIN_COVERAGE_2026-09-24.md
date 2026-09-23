# 2026-09-24 · 四揀覆蓋收口

## Done
- 09-23 賽果 109 行、場號 1–9 齊；hit-rate 9 場、`generatedAt=2026-09-23T20:17:36Z`、只中 2/1/1/2/1/3/2/2/1，平均 1.67
- 抓取 skip：`set(CSV placed race_no)==1..max` 且 HKJC R{max+1} 唔係真場。HTTP 核對：R9 有 `RACE 9` 標題；R10 無 `RACE 10` 標題 → 應 skip、唔好再數 14 條連結
- 後端 `src/lib/hit-rate-coverage-stale.ts` 已合 tianxi-backend main
- 本站新增 `/explain/`：即場讀 hit-rate，09-23 會出現。Lovable `tianxi.racing/explain` 窗口仲停 09-16／349 場

## Still blocked here
- `index.ts` GET overlay + cron `races_evaluated < finished` — 未 deploy。下一場半途入庫仍會停半截 cache，直至有人喺本機貼 `docs/HITRATE_STALE_CACHE.patch.md` 再 wrangler deploy
- 唔改凍結四揀
