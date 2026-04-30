# 天喜 Frontend · tianxi-site

> Cloudflare Pages 靜態前端。Vanilla HTML/CSS/JS。跟 HKJC app 嘅 3-level 層級導航（meeting card → race 排位表 → horse detail），輕量、快、冇 build step。

## Production

- **URL**：<https://tianxi-site.pages.dev>
- **Host**：Cloudflare Pages · project `tianxi-site`
- **API 源**：<https://tianxi-backend.tianxi-entertainment.workers.dev>

## 生態系統

| Repo | 角色 |
|---|---|
| [tianxi-database](https://github.com/sleepingarhat/tianxi-database) | CSV source + scraper + D1 sync GHA |
| [tianxi-backend](https://github.com/sleepingarhat/tianxi-backend) | Workers API + ELO engine |
| **tianxi-site** (本 repo) | CF Pages 靜態前端 |

## 設計系統憲法

- **Dark mode restored** (2026-04-29)：`:root[data-theme="dark"]` block in `assets/tokens.css`，所有 token 有 contrast 註記（≥ 4.5:1 normal text AA）。
- **Flat UI**：唔做 3D gold plate / bevel shadow。Buttons = pill / filled rectangle。
- **Brand palette** (簡化)：green / red / brown / gold 保留，但只做 accent · 主體用 `--paper` / `--ink` 灰階。
- **Layout 參考 HKJC app**：顏色字體自己規矩。
- **Flat + 格式統一**：tokens.css 單一 source of truth，所有頁用共用 pattern classes。

## 3-Level 導航

### Level 1 · `/index.html` — 下一個賽馬日

- `TX_API.nextMeeting()` → `{date, venue, races: [{raceNumber, startTime, className, ...}]}`
- 純 meeting card layout（日期 + 場地 chip + 場地狀況 + 場次 list）
- 無 hero / 無 quick-nav（純 HKJC 風格）
- Fallback banner 顯示 if 最新可用日期 < today

### Level 2 · `/race/index.html?raceId=...` — 排位表

- 頂 chip row 切換同場 siblings
- 賽事資料列（日期 / 星期 / 時間 / 場地 / 班次 / 途程 / 跑道 / 讓賽類型）
- Entries table：馬號 · silks 32×32 · 馬名 + 騎/練 · 獨贏 · 檔位 · 負磅

### Level 3 · `/horse/index.html?id=...` / `?raceId=&no=...` — 馬匹詳情

- Silks 40×40 + 馬號馬名 hero
- KV 表：騎師 / 練馬師 / 檔位 / 負磅 / 馬體重 / 6 次近績 / 評分 / 年齡性別 / 最佳時間 / 配備 / 分齡讓磅 / 優先出賽權
- 天喜獨有：ELO 綜合 + 場次適應評分 + 最終預測分

## AnimatedThemeToggler

`assets/theme.js` 用 `document.startViewTransition` API 做圓形 clip-path wipe（from click origin）。Fallback 直接切（`prefers-reduced-motion` or 無 API）。

`localStorage.tx-theme` ∈ `{light, dark, auto}`，默認 auto 跟 `prefers-color-scheme`。

## 頁面清單

```
/                — Level 1 · 下一個賽馬日
/race/           — Level 2 · 排位表
/horse/          — Level 3 · 馬匹詳情
/dashboard/      — 儀表板（Elo 軌跡 + 組合概率）
/predictor/      — 選馬（因子 slider DIY）
/schedule/       — 賽程表
/encyclopedia/   — 百科
/lounge/         — 聊天室
/combo/          — 組合機率
/pool-odds/      — 各彩池賠率
/flow/           — 資金流向
/value-heatmap/  — 值博度熱圖
/live/           — 即時賠率
/results/        — 賽後結果
/watchlist/      — 心水追蹤
/login/          — 登入
/404.html        — 404
```

## Local dev

```bash
# 靜態 server
python3 -m http.server 8080

# 或 wrangler dev（接 D1 / Workers 模擬）
wrangler pages dev .
```

## Deploy

```bash
# 需要 CLOUDFLARE_API_TOKEN（要有 Account · Cloudflare Pages · Edit scope）
# + CLOUDFLARE_ACCOUNT_ID
wrangler pages deploy . --project-name=tianxi-site --branch=main --commit-dirty=true
```

## 憲法：唔做投注平台

天喜 = **分析 / 資訊 SaaS**。展示：
- ✅ 所有彩池賠率 / 投注分佈 / 組合機率 / ELO 走勢 / 值博度分析
- ❌ 投注籃 / HKJC 投注碼 / stake 計算器 / 派彩預估 / 下注 CTA

法規視角：香港只有 HKJC 合法經營賽馬投注。資訊展示合規，代理人行為違法。

## Open issues

- [ ] Dark mode visual polish：15 個頁面需要人手 review
- [ ] Silks proxy：`/api/silks/:code.gif` 首次 hit 會慢 · 要配 CDN cache header
- [ ] `/live/` WebSocket 連接：未實裝
- [ ] i18n：目前淨 zh-HK · 未支援英文 / 簡體
