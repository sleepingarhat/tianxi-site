# 天喜前端 · tianxi-site

Cloudflare Pages 靜態前端，HKJC 3 層賽馬導航佈局。

## 技術棧

- **100% Vanilla HTML/CSS/JS** — 無 build step，無框架
- **部署**：Cloudflare Pages（`wrangler pages deploy .`）
- **Backend API**：`https://tianxi-backend.tianxi-entertainment.workers.dev`

## 系統架構

**生態系統（3 repos）**

| Repo | 角色 |
|------|------|
| **tianxi-database**（public） | 數據爬取 · CSV · GHA 調度 |
| **tianxi-backend**（private） | API + ELO + 預測 |
| **tianxi-site**（本 repo · public） | CF Pages 前端 |

## 3 層導航結構

```
/ (index.html)
  賽馬日列表 → GET /api/meetings/smart/current
  
/race/?raceId=race_DATE_VV_N
  排位表 → GET /api/races/:id/entries
  
/horse/?id=HORSE_ID
  馬匹詳情 + ELO 預測 → GET /api/horses/:id/detail
                        GET /api/analyze/explain?raceId=&horseId=
```

## 頁面列表

| 頁面 | 路徑 | 狀態 |
|------|------|------|
| 賽馬日 | `/` | ✅ 接通 |
| 排位表 | `/race/` | ✅ 接通 |
| 馬匹詳情 | `/horse/` | ✅ 接通 |
| 日程 | `/schedule/` | ✅ 接通 |
| 選馬工具 | `/predictor/` | ✅ 接通 |
| 百科全書 | `/encyclopedia/` | ✅ 接通 |
| 聊天室 | `/lounge/` | ✅ 接通 |
| 儀表板 | `/dashboard/` | ✅ 接通 |
| 組合分析 | `/combo/` | ⚠️ stub |
| 賠率 | `/pool-odds/` | ⚠️ stub |
| 資金流向 | `/flow/` | ⚠️ stub |
| 價值熱圖 | `/value-heatmap/` | ⚠️ stub |
| 即時賽事 | `/live/` | ⚠️ stub（WebSocket 未實現） |
| 自選馬匹 | `/watchlist/` | ⚠️ stub |

## 設計系統

- **字體**：Noto Serif TC（標題）· Noto Sans TC（正文）· JetBrains Mono（數字/賠率）
- **主色**：綠 `#00843D` · 紅 `#C8102E` · 棕 `#5C3A1E`（HKJC 配色）
- **Dark mode**：`:root[data-theme="dark"]`，對比度 ≥ 4.5:1（AA）
- **佈局**：手機優先，440px 最大寬，桌面呈現「手機框」效果

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
