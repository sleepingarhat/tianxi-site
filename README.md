# 天喜前端 · tianxi-site

Cloudflare Pages 純靜態前端，提供香港賽馬日程、排位、賽果、馬匹百科與公開分析結果。

站台：[tianxi.racing](https://tianxi.racing)

## 技術森

- **Vanilla HTML/CSS/JS** — 無 build step
- **部署**：Cloudflare Pages
- **API**：`https://tianxi.racing/api/*`

## 生態

| Repo | 職責 |
|------|------|
| [tianxi-database](https://github.com/sleepingarhat/tianxi-database) | 賽果與馬医 CSV |
| [tianxi-backend](https://github.com/sleepingarhat/tianxi-backend) | TX-Oracle API |
| **tianxi-site**（本倉） | 公開站台 |
| [tianxi-marksix](https://github.com/sleepingarhat/tianxi-marksix) | 六合彩命盤研究 |
| [hk-mark-six-2002-now](https://github.com/sleepingarhat/hk-mark-six-2002-now) | 六合彩攞珠紀錄 |

## 頁面

| 頁面 | 路徑 |
|------|------|
| 賽馬日入口 | `/` |
| 排位表 | `/race/` |
| 馬匹詳情 | `/horse/` |
| 賽果 | `/results/` |
| 日程 | `/schedule/` |
| 儀表板 | `/dashboard/` |
| 選馬 | `/predictor/` |
| 引擎 | `/engine/` |
| 六合彩 | `/marksix/` |
