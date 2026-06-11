# 天喜前端 · tianxi-site

Cloudflare Pages 純靜態前端，HKJC 3 層賽馬導航。**唯一用途係生成買馬報告**——所有頁面都係讀後端 TX-Oracle v3 引擎嘅 production output。

## 技術棧

- **100% Vanilla HTML/CSS/JS** — 無 build step，無框架
- **部署**：Cloudflare Pages（auto-deploy on push）
- **Backend API**：`https://tianxi-backend.tianxi-entertainment.workers.dev`

## 生態系統

| Repo | 角色 |
|------|------|
| **tianxi-database**（public） | 數據爬取 · CSV · GHA 調度 |
| **tianxi-backend**（private） | D1 API + TX-Oracle v3 (LightGBM + ELO 概率 blend, α=0.62) |
| **tianxi-site**（本 repo · public） | CF Pages 前端（report UI） |

---

## 頁面清單（全部 in production）

| 頁面 | 路徑 | 用途 | 主要 API |
|------|------|------|---------|
| 賽馬日入口 | `/` | 今日/下一場次列表 | `meetings` · `meeting` |
| 排位表 | `/race/?raceId=` | 場次馬匹清單 + Top picks | `raceEntries` · `topPicks` |
| 馬匹詳情 | `/horse/?id=` | 馬匹 KV + 預測 explainer | `horseDetail` · `explain` |
| 賽果 | `/results/?date=` | 已結算成績 + 派彩 | `meetings` · `meeting` |
| 日程 | `/schedule/` | 月曆 + 月份賽馬日索引 | `meetings` · `meeting` |
| 我的儀表板 | `/dashboard/` | 個人化 next-meeting overview | `smartCurrent` · `meeting` |
| 選馬工具 | `/predictor/` | 因子權重探索（**唔係**生產公式） | `factors` · `analyze` |
| 彩池賠率 | `/pool-odds/` | 賠率快照 | `raceEntries` |
| 百科 | `/encyclopedia/` | 馬匹資料庫 · 搜尋 · Elo/勝場榜 · 今日出賽篩選 | `horseSearch` · `meeting` · `leaderboard` |
| 引擎 | `/engine/` | 預測引擎 TX-Oracle v3 詳解 · 實戰命中率 · 因子 | `hitRateRollup` · `factors` |
| 聊天室 | `/lounge/` | 全局單一聊天室 | `lounge.chat` |
| 登入 | `/login/` | Anon identity | — |

---

## TX-Oracle v3 喺前端嘅顯示位

- **`/race/`** — Top picks 表，每匹顯示 `finalScore`、`pWin`、score breakdown
- **`/horse/`** — 個別馬匹卡 + score breakdown（顯示 LightGBM 分 + ELO 因子）
- **`/engine/`** — 「TX-Oracle v3」引擎詳解頁：
  - 公式：`finalScore = 1500 + (α·lgb_z + (1−α)·elo_z + factor·0.5) · 100`
  - ELO 組合：`0.7×馬匹ELO + 0.2×騎師ELO + 0.1×練馬師ELO + 檔位 + 負磅`
- **`/predictor/`** — 探索工具，可調 17 個因子權重做 what-if 分析，唔影響生產

> Predictor 嘅 17 個因子（檔位、場地、節奏、近績、血統、晨操、騎練、配備、賠率…）係**探索工具**，用 `POST /api/analyze` runtime 計分；生產 `/api/analyze/top-picks` 直接行 TX-Oracle v3。

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
TX_API.topPicks(raceId)            // TX-Oracle v3 預測 ⭐ production
TX_API.explain(raceId, horseId)    // 因子分解 + 解釋
```
