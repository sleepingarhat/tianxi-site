# 天喜前端 · tianxi-site

Cloudflare Pages 純靜態前端，提供香港賽馬日程、排位、賽果、馬匹百科與公開分析結果。

## 技術棧

- **100% Vanilla HTML/CSS/JS** — 無 build step，無框架
- **部署**：Cloudflare Pages，經 tianxi-database `deploy_site.yml` 觸發（每賽日 results 落 D1 後 workflow_run 自動部署 + 可手動 dispatch）
- **Backend API**（canonical）：`https://tianxi.racing/api/*`（Worker direct：`tianxi-backend.tianxi-entertainment.workers.dev`，debug 用）

## 生態系統

| Repo | 角色 |
|------|------|
| **tianxi-database**（public） | 數據爬取 · CSV · GHA 調度 |
| **tianxi-backend**（public） | 賽事資料 API + TX-Oracle 分析服務 |
| **tianxi-site**（本 repo · public） | CF Pages 前端（report UI） |

---

## 頁面清單（全部 in production）

| 頁面 | 路徑 | 用途 | 主要 API |
|------|------|------|---------|
| 賽馬日入口 | `/` | 今日/下一場次列表 | `meetings` · `meeting` |
| 排位表 | `/race/?raceId=` | 場次馬匹清單 + Top picks | `raceEntries` · `topPicks` |
| 馬匹詳情 | `/horse/?id=` | 馬匹背景、往績與本場最終機率 | `horseDetail` · `explain` |
| 賽果 | `/results/?date=` | 已結算成績 + 派彩 + top-4 模型揀馬 | `meetings` · `meeting` |
| 日程 | `/schedule/` | 月曆 + 月份賽馬日索引 | `meetings` · `meeting` |
| 我的儀表板 | `/dashboard/` | 個人化 next-meeting overview | `smartCurrent` · `meeting` |
| 選馬工具 | `/predictor/` | 雙欄揀馬：模型排序 + 市場參考 | `todayPicks` |
| 彩池賠率 | `/pool-odds/` | 賠率快照 | `raceEntries` |
| 百科 | `/encyclopedia/` | 馬匹資料庫 · 搜尋 · Elo/勝場榜 · 最近賽日排位表 | `horseSearch` · `meeting` · `leaderboard` |
| 引擎 | `/engine/` | 預測方法概覽與公開實戰命中率 | `hitRateRollup` |
| 六合彩 | `/marksix/` | 上期攪珠結果 · 號碼冷熱統計 · 聰明組合 | 靜態 JSON（GitHub raw） |
| 登入 | `/login/` | Anon identity | — |

---

## 分析結果喺前端嘅顯示位

- **`/race/`** — 排位表、馬匹連結、跑法徽章與開跑時間
- **`/horse/`** — 個別馬匹檔案、歷史研究資料與本場最終機率
- **`/results/`** — 已結算場次 + **top-4 模型揀馬**
- **`/engine/`** — 分析方法與公開命中率概覽，其餘實作細節只供內部驗證
- **`/predictor/`** — 雙欄揀馬：**模型搏冷** + **市場穩陣**，只顯示最終排序與機率

---

## 共用 shell（2026-05-22 起）

導航 + 底部 nav 由 `assets/shell.js` 注入 `[data-tx-shell="brandbar"]` / `[data-tx-shell="botnav"]` mount point。
每頁淨係寫 `<body data-page="...">` + mount div，由 shell.js 統一渲染 + 設 active state。
新增 nav item 改 `assets/shell.js` 一個地方即可，13 頁自動同步。

## API helpers (`assets/api.js`)

```js
TX_API.meetings('?limit=20')       // 場次列表
TX_API.meeting(date)               // 場次詳情
TX_API.raceEntries(raceId)         // 排位 + 馬匹列表
TX_API.horseDetail(id)             // 馬匹卡
TX_API.topPicks(raceId)            // 公開預測排名與最終機率
TX_API.explain(raceId, horseId)    // 單馬公開排名與最終機率
```
