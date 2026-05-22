# 天喜前端 · tianxi-site

  Cloudflare Pages 純靜態前端，HKJC 3 層賽馬導航。**唯一用途係生成買馬報告**——所有頁面都係讀後端 R5 引擎嘅 production output。

  ## 技術棧

  - **100% Vanilla HTML/CSS/JS** — 無 build step，無框架
  - **部署**：Cloudflare Pages（`wrangler pages deploy .`）
  - **Backend API**：`https://tianxi-backend.tianxi-entertainment.workers.dev`

  ## 生態系統

  | Repo | 角色 |
  |------|------|
  | **tianxi-database**（public） | 數據爬取 · CSV · GHA 調度 |
  | **tianxi-backend**（private） | D1 API + R5 預測引擎 (ELO + 檔位 + 負磅) |
  | **tianxi-site**（本 repo · public） | CF Pages 前端（report UI） |

  ---

  ## 頁面清單（全部 in production）

  | 頁面 | 路徑 | 用途 | 主要 API |
  |------|------|------|---------|
  | 賽馬日列表 | `/` | 入口：今日/下一賽馬日場次 | `smartCurrent` · `nextMeeting` |
  | 排位表 | `/race/?raceId=` | 場次馬匹清單 + R5 Top picks | `raceEntries` · `topPicks` |
  | 馬匹詳情 | `/horse/?id=` | 馬匹 KV + R5 因子分解 | `horseDetail` · `explain` |
  | 日程 | `/schedule/` | 月曆 + 月份賽馬日索引 | `meetings` · `meeting` |
  | 我的儀表板 | `/dashboard/` | 個人化 next-meeting overview | `smartCurrent` · `meeting` · `countdown` |
  | 選馬工具 | `/predictor/` | 17-因子權重探索（**唔係**生產公式，純調校用） | `factors` · `analyze` |
  | 組合分析 | `/combo/` | 多 P / Q / 三重彩組合估算 | `raceEntries` |
  | 彩池賠率 | `/pool-odds/` | 賠率快照 | `raceEntries` |
  | 聊天室 | `/lounge/` | 全局單一聊天室 | `lounge.chat` |
  | 登入 | `/login/` | Anon identity | — |

  > 2026-05-12 已移除 4 個未使用 stub 頁面（flow / live / value-heatmap / watchlist）— 從來未接通數據，亦未有任何頁面 link 到佢哋。

  ---

  ## R5 生產引擎喺前端嘅顯示位

  - **`/race/`** — Top picks 表，每匹顯示 `finalScore`、`pWin`、score breakdown（綜合 ELO + 因子）
  - **`/horse/`** — 個別馬匹卡 + score breakdown 標 "R5 因子 (檔位+負磅)"
  - **`/encyclopedia/`** — 「預測引擎 R5」live card：
    - mono-font 公式：`finalScore = 0.7×馬匹ELO + 0.2×騎師ELO + 0.1×練馬師ELO + 檔位 + 負磅`
    - 入分因子 vs telemetry-only 因子分欄
  - **`/predictor/`** — 標題下金邊 banner 提示：「生產引擎係 R5，本頁可調 17 因子權重做探索」

  > Predictor 嘅 17 個因子（檔位、場地、節奏、近績、血統、晨操、騎練、配備、賠率…）係**探索工具**，用 `POST /api/analyze` runtime 計分；生產 `/api/analyze/top-picks` 只用 R5 公式（ELO + 檔位 + 負磅）。

  ---

  ## API helpers (`assets/api.js`)

  ```js
  TX_API.smartCurrent()                // 入口場次
  TX_API.raceEntries(raceId)           // 排位 + 馬匹列表
  TX_API.horseDetail(id)               // 馬匹卡
  TX_API.topPicks(raceId)              // R5 複合預測 ⭐ production
  TX_API.explain(raceId, horseId)      // 因子分解 + 解釋
  TX_API.horseLeaderboard(by, lim)
  TX_API.horseSearch(q)
  TX_API.lounge.chat(since, lim)
  ```

  ## 設計系統

  - **字體**：Noto Serif TC（標題）· Noto Sans TC（正文）· JetBrains Mono（數字 / 賠率）
  - **主色**：綠 `#00843D` · 紅 `#C8102E` · 棕 `#5C3A1E`（HKJC 配色）
  - **Dark mode**：`:root[data-theme="dark"]`，對比度 ≥ 4.5:1（AA）
  - **佈局**：手機優先，440px 最大寬

  ## 本地開發

  ```bash
  python3 -m http.server 8080
  # 或
  wrangler pages dev .
  ```

  ## 部署

  ```bash
  wrangler pages deploy . --project-name=tianxi-site --branch=main
  ```

  ## 設計規範

  - 本平台**不是**投注平台。展示賠率 / 分布 / 概率符合規定；不得提供投注籃、注額計算或派彩估算。
  - 界面語言：繁體中文（香港）
  - 不使用斜體展示字體
  