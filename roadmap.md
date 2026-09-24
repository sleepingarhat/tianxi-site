# tianxi-web roadmap

## 進行中
- [x] 2026-09-19 停賽守門：因董建華離世，今日賽事停賽；首頁／選馬／逐場卡／日程顯示停賽通告，前端停止今日預測查詢，避免 9 月 16 日舊資料冒充今日賽事；今日不生成、不鎖定、不入凍結對帳及開季戰績，模型線不變
- [x] S31 鎖點改追已批規格（T−1.5h）：新增 src/lib/lock-window.ts，鎖點時間＝fixture 首場 post_time − 90 分鐘（唔再等賽果入庫）；writePredictionLog／writeRaceDayReportCache 改用 predictionWritesAreFrozen（未到鎖點可刷新＝初版；到鎖點有快照即拒寫；到鎖點未有快照准寫一次）；讀取側 dateIsLocked 由鎖點一刻起讀凍結快照（today-picks／top-picks／picks-by-date／explain）；wrangler 加 */5 輕量 lock tick（heavy job 留原時段）＋ GET /api/analyze/lock-state、POST /admin/api/lock-tick；健康頁 LOCK_POLICY aligned=true、public_freeze 翻 PASS；主站加 /api/public/lock-state 代理，選馬頁初版章寫出實際鎖定時間。鎖後只准 join 名次，唔再寫預測欄；算法線同指紋一分不動
- [x] S32 凍結對帳表（先量、唔改模型）：後端 src/lib/freeze-ledger.ts ＋ GET /api/analyze/freeze-ledger，只讀已鎖 prediction_log（禁回測、禁 live 重算）；主尺＝四揀入圍數／頭四覆蓋／平均相交（賽日＋開季累積，Top3 旁註），副尺＝位置命中（位置格數按出賽匹數 ≥7 為 3、否則 2），旁註＝獨贏頭馬、市場大熱、模型 vs 扣水隱含獨贏 logloss、平注模擬 EV（只量市場硬度，永不回寫模型／指紋／健康頁）；主站加 /api/public/freeze-ledger 代理同 /freeze-ledger 頁（開季累積 → 逐賽日 → 逐場明細）；樣本先 9-6／9-9／9-13，9-16 鎖完完場後自動加行；場數少出表唔下結論
- [ ] S33 card_delta（鎖後變更 overlay）：換騎／蹄鐵／後備上陣只微調已鎖分數，永不入 LGB、永不改凍結欄；缺資料＝0、紅燈可睇唔入戰績
- [x] S35 開季收口三項（純展示層）：(1) 鎖同字統一——prediction-status.ts 加 DAY_LOCK_MINUTES_BEFORE_FIRST_POST=90／meetingLockMinutes()，全站只講「首場開跑前 90 分鐘一次鎖全日」，版本字只得「初版 · 未鎖」／「最終版 · 已鎖」一套，卡面唔再出現 18:40／開跑前 30 分鐘；(2) 少仗紅燈——SCARCE_START_THRESHOLD=2，四揀有第一／二次出賽即紅燈＋「少仗 N 匹」章，reason 寫明改用 ELO＋試閘／血統、唔用 min_data_in_leaf=80 葉、唔入戰績，出賽次數由 getHorseStarts server fn 批量讀 totalStarts（缺＝0，唔靠估），引擎監控加鎖點口徑／少仗紅燈兩行；(3) 首屏加獨立「本季開季窗」行（2026/27 起，按場數加權四揀平均），同近 90 日歷史窗分開標。模型線一分未動
- [ ] S34 少仗紅燈規則寫入健康頁（後端）：新馬／試閘場次標紅燈（α=0.88、96 匹有分只證明「有分」，唔證明新馬唔係亂估）；少仗退 Elo＋試閘／血統先驗
- [x] S30 賽馬引擎健康稽核修正：掛上 /api/analyze/engine-health（JSON／HTML）＋ /engine/health.json ＋ /admin/engine-health ＋ 主站代理 /api/public/engine-health；健康 payload 改 buildEngineHealth(db) 即時讀季節同最近凍結賽日（live 曲線／diagnostics 兩項 WATCH 自動翻）；鎖點規格（T−1.5h）同落地（第一場賽果入庫）未對齊已寫明，public_freeze 降 WATCH；today-picks 加 frozen／edition，選馬頁加「初版／最終版」章；SANITY 馬匹池路徑改 horses/profiles/horse_profiles.csv；工程債待辦：analyze.ts／admin.ts 拆檔、盤 prune 保留歷史 live snapshot
- [x] 全站頁面大標題加入聚光掃光；品牌「天喜 TIANXI」同步聚光，「ENTERTAINMENT」使用紙墨金金箔流光，並支援減少動態效果
- [x] 排位表手機版重整：統一所有馬匹號碼尺寸，取消厚重黑底；固定馬名／檔位欄邊界避免重疊，並參考香港賽馬會官方排位表重整資料層級與密度
- [ ] 會員／收費權限：建立付費會員方案；只有已驗證付費權限可見會員預測與獨家分數。「更高權重」候選必須先完成 walk-forward 回測並通過四揀主指標閘門，未通過前不可宣稱較準或套入生產
- [ ] 賽前預測通知：每個賽馬日首場前 24 小時提醒管理員當日各場四揀馬匹；避免重複通知，並在「預測與賽果」顯示當日凍結預測分數
- [ ] 3 個 UI 設計方向（鎖定舊 tianxi-site 設計語言：紙/墨/金、Noto Serif TC 標題、tnum 等寬數字、深頂欄+深底導航、最大欄 440；禁彩虹漸變/玻璃擬態）→ 用戶揀一個
- [ ] 按頁面補齊載入動效／骨架屏（用戶回報部分頁面感覺「冇咗 UI 效果」，需逐頁確認後加載）
- [x] 六合彩頁手機載入穩定性：lunar-javascript 改自存同源（public/marksix/lunar.js，除去第三方 CDN 單點）、`/api/public/marksix-data?file=history` 代理只回 date/draw/numbers/special（1MB → 269KB）、site-app.js 資料請求加 15 秒逾時＋重試一次、逾時提示改為頂部細橫幅唔再全頁遮蓋

## 機率品質四步（研究文章落地）
- [x] 一、評估指標：`/api/analyze/prediction-accuracy`（Brier、log-loss、Brier 技巧分、ECE、校準斜率、9 段可靠度分箱）＋ `/engine/monitor` 顯示「機率品質」與可靠度圖
- [x] 二、機率校準：三甲機率 Platt scaling（a=0.5796、b=-0.414）已上線並套用；`/api/analyze/calibration`（公開讀取／管理員 fit=1&apply=1），時間切分 70% 擬合、30% 驗證：Brier 0.17914→0.17367、Log-loss 0.53694→0.52327；嚴格單調，唔改排序；`/engine/monitor` 加「機率校準 · 三甲」卡
- [x] 三、逐匹解釋（局部貢獻）：選馬頁新增「點解揀佢」面板 —— 同場特徵 z-score × 天喜LGB 特徵重要度權重，逐匹列推高／拉低項（`src/lib/why-picked.ts`、`src/components/tx/WhyPicked.tsx`）
- [x] 四、殘差診斷：`/api/analyze/residuals` ＋ 新頁 `/engine/residuals`（班次／路程／地質／賠率區間／馬場逐組偏差、Brier、四揀中匹、偏差警示）。結果：班次／路程／地質偏差 ≤1pp；賠率區間有系統性偏差——≤3.0 熱門三甲低估 19.1pp、3.1-6.0 低估 11.2pp、>25 大冷高估 4.0pp
- [~] 五之二（不用賠率權重嘅方案）：按賠率區間分段機率校準 —— `/api/analyze/calibration?days=365&fit=1&bands=1`（管理員），五段（≤3.0／3.1-6.0／6.1-12.0／12.1-25.0／>25）逐段擬合 Platt，只調三甲／四甲機率、唔改排名；門檻：每段 ≥200 匹、斜率 0.1-3、驗證集要贏過現行全局曲線。365 日 2,194 匹結果：≤3.0 樣本不足（95）、>25 擬合失敗、3.1-6.0 與 6.1-12.0 斜率失控，只有 12.1-25.0 合格（Brier 0.1338→0.1305）。生產維持全局曲線，分段未啟用（代碼已上線，`bands` 欄位預設空）
- [x] 五之三：非賠率特徵解釋「熱門真係強」——新增十項（同班次自身往績 hc_starts/hc_top3、慣常班次水平 class_hist_avg／升降 class_step、騎師／練馬師近 180 日滾動上名率、檔位相對位置 draw_pct 與 draw_x_dist），全部賽前 as-of、零賠率成份。1,730 場／21,323 匹、walk-forward（每 50 場重訓、1,530 場評估）三組 A/B：基準 四揀 1.9850／前三 1.2608／首選 21.37%／三甲任中 85.95%；+十項 1.9889／1.2503／20.52%／84.71%；+十項+Stage14 休賽 1.9582／1.2078／21.11%／84.77%。主指標僅 +0.004（雜訊）而前三與首選下跌 → 閘門不通過，生產特徵未改；代碼已入倉（44ae304f、afd040dc）待樣本累積後重測
- [x] 血統資料缺口已補：新增 `HorsePedigree_Scraper.py`（tianxi-database，自動由排位表／檔案／賽果找出馬匹，只抓血統未齊者，純 requests 免 Chrome）＋ `scripts/pedigree_to_d1_sql.py` ＋ 排程 `capy_pedigree.yml`（一／二／六 21:30 排位表模式抓新馬、三 05:00 全池補抓上限 600，跑完 commit CSV 並推 D1）。已即時執行：`horse_pedigree` 6,068 行、`horses.sire` 由 16 → 6,068，三項血統特徵有真實資料
- [ ] 新馬血統評分回測：用新血統資料測「無往績新馬用血統＋騎練＋首戰班次起步」是否勝過現行班次基準 ELO

- [~] 五、按殘差結果調整：已加入市場賠率先驗（同場 log 市場隱含機率 z-score × β，寫入 `app_settings.market_beta`，生產預設 β=0＝未啟用）＋ admin 回測接口 `/api/analyze/market-tune?days=&betas=&apply=1`（只有四揀平均與前三平均都不跌才會 apply）。45 日小樣本（18 場）：β=0 四揀 1.889／β=0.3 2.000／β=0.5 2.111／β=0.8 2.167，方向與殘差一致但樣本太小；365 日全窗口回測待跑完才決定是否上線


## 待做
- [ ] 驗證 ELO 三軸權重 0.7/0.2/0.1 是否最佳（grid search 回測）
- [ ] 驗證因子傾斜只用檔位＋負磅是否最佳；評估加入班次適配、賽道/going 適配、步速走位、休賽日數等場次因子
- [x] 檔位效應分層擴展 v3（場地狀況／出賽匹數／班次，共 4 層加權合成）：365 日 883 場 A/B — v1 2.009、v2 2.024、v3 2.020 四揀平均，差距屬雜訊，生產維持 v1（v3 代碼已部署但未套用）
- [x] 內部監控台搬入新站 `/admin`（Lovable Cloud 登入 + admin 角色守門；伺服器端代理 Worker `/admin/api/*`，含讀取與寫入操作）
- [x] 註冊帳戶後為該帳戶授予 admin 角色（user_roles）
- [x] 後端 tianxi-backend 倉庫同步：透過 GitHub 整合提交檔位 v3 代碼（commit c0c3949），倉庫與線上 Worker 一致
- [ ] Worker 端輪換 ADMIN_TOKEN（曾在對話中出現）

## 資料修補（見 AUDIT.md）
- [x] 2026-09-09 跑馬地賽果補回（採集程式瀏覽器逾時失敗）：8 場賽果＋官方派彩已入庫，戰績彙總與策略盈虧已重算；capy_race_daily 工作流加入 3 次自動重試
- [x] horse_form_records 回填 race_id（未配對由 102,566 降到 1,417）
- [x] 補 2020 年 190 場缺失賽果
- [x] 分段時間歷史回填（馬匹分段 220 → 8,685 場；大勢分段 0 → 8,685 場）
- [x] 補回 2017-06 完全缺失嘅 8 個賽馬日（72 場）
- [x] 12 個從未抓取賽馬日已抓回並入庫；往績未配對由 1,417 降到 68（46 條為從化境外賽、22 條為退出馬，屬無對應）
- [x] 新季開鑼：修好 tianxi-database 的 backend PAT，排位已入庫（2026-09-06 沙田 10 場 120 匹），/api/season 轉 in_season，賠率抓取閘門已解除
- [x] 資料修補後重跑 LGB 訓練/回測（2024-09-01→2026-07-15）：top1 21.3% / top2 58.1% / top3 85.9% / top4 97.2%；Elo top1 16.8%、市場 top1 31.3%
- [ ] 引擎調參：主指標改為「四揀平均中匹數」（現 2.05／4，目標 3.0）；做特徵消融 + alpha 校準；不再以首選命中率為目標
- [ ] 特徵排序表升級：由等權平均改為學習權重（用 LGB 特徵重要度／回歸擬合），並加入班次、賽事質素、樣本量收縮


- [ ] 按 tianxi.racing/api/* 逐頁重建：賽馬日入口 / 排位 / 馬匹 / 賽果 / 日程 / 儀表板 / 選馬 / 引擎 / 六合彩
- [x] 新特徵「特徵排序表」`/features`（真實 D1 資料，十項特徵 + 自選綜合排序）
  - [x] 同場對賽勝次（例：1號贏過同場馬匹共 7 次）
  - [x] 最佳同程統計（馬 x 程）冠/亞/季
  - [x] 最佳檔位統計（馬 x 檔，同賽道同路程近季，W% / P%）
  - [x] 同程最快時間（總時 / 相隔日子）
  - [x] 同程最快末段（末段時間 / 總時間）
  - [x] 最強騎練合作（騎 x 練，W% / P%）
  - [x] 綜合排序總覽（看某匹馬是否全項名列前茅）
- [ ] 引擎升級與測試
- [ ] Git sync 出 tianxi-web repo
- [ ] 會員 / 收費（最後處理）

## UI 資訊密度升級（參考 beam / boardui）
- [x] 全站大標題聚光及品牌「ENTERTAINMENT」金箔流光：強制文字裁切生效並提高金色掃光反差
- [x] 儀表板：主指標流光卡、圓環、狀態籌碼、兩欄資料格、賽日時間軸
- [x] 選馬神器 predictor：雙欄改為「天喜預測／市場穩陣」，統一馬號、馬名、檔位、三甲、引擎勝算與即時獨贏資料層級；兩欄每匹均顯示每 60 秒更新的獨贏賠率
- [x] 預測與賽果 prediction-vs-result：新增「賽日總覽」（四揀／三甲平均動態條、三重彩／四重彩／三甲任中場數、逐場 n/4 命中導覽條可直接跳場）＋逐場彩池命中膠囊＋α 健康卡
- [x] 策略盈虧 strategy-pnl（逐日紀錄改為最新日期置頂）

- [ ] 賽果／賽事 results, race
- [ ] 馬匹頁 horse（已修正手機版晨操／試閘日期與詳情互相疊字）
- [ ] 引擎／監控 engine, admin
- [ ] 其餘頁面（schedule, cards, pool-odds, track-record, features, encyclopedia, membership）

## 引擎集成權重
- [x] ensemble_alpha 已由 0 修正為 0.85（14 個賽日 143 場回測：四揀平均中匹 1.895→2.126），2026-09-08 套用並 fresh 重算
- [x] 前端顯示集成 α 與「LGB 是否真正影響排名」提示：新增 `AlphaGuard`（綠／黃／紅三級，α<0.5 判警示並提示查緊急覆寫；存檔版 α 與現行設定不同只作留意），已接入儀表板集成模型卡同預測與賽果頁
- [x] 查明原因：2026-05-27 /api/set-alpha 緊急覆寫（LGB degraded）未回復，影響 2026-05-27 之後所有賽日（含 09-06 開鑼日）
- [x] 引擎流程每步加上數學公式／方程式

## UI 動態化（2026-09-08 要求）
- [x] 鎖定（綠燈）時「天喜預測 / 市場穩陣」兩框變彩色框
- [x] 鎖定時上述三個外框加入流光閃爍（綠色／金色旋轉光束）
- [x] 集成模型三個圓圈改為動態填充進度條
- [x] 全站進度條加入動態填充動畫

## ELO 三軸權重掃描（α=0.85 固定，120 日 19 賽日 192 場）
- [x] 後端加入可調權重 + /api/analyze/elo-tune
- [x] 365 日全季掃描（865 場、12 組）：0.70/0.20/0.10 = 2.013 四揀平均，與最佳 0.65/0.25/0.10（2.014）差異在雜訊內 → 決定保留現行權重，不改
- [x] 紅／黃／綠狀態燈慢速呼吸閃爍（狀態卡 + 狀態籌碼）
- [x] 滾動表現柱形圖柱子出界（已限寬 overflow-hidden）

- [x] ELO 三軸權重定案：365 日重測推翻 120 日結果（0.50/0.35/0.15 反而最低 1.984），維持 0.70/0.20/0.10
- [x] 檔位效應按路程／賽道分層回測：後端加入 v2 檔位模型（場地×賽道 rail×路程分層、期望上位率用每場實際馬匹數、經驗貝葉斯收縮）＋ `/api/analyze/draw-tune` A/B；365 日 865 場結果 v1 2.034 vs v2 2.044（四揀平均），前三 1.298 vs 1.284，差異在雜訊內 → 生產維持 v1，未套用
- [x] 檔位因子倍數（scale）回測參數落地：後端 `computePicksFromEntries` 支援 `drawScaleOverride`，`/api/analyze/draw-tune?scales=` 可一次比較多個倍數（生產默認 ×1，未改設定）
- [ ] 倍數掃描結果（365 日 865 場，α=0.85）：×1 2.044／×2 2.053／×3 2.043（完整）；×5／×8／×12／×20／×30／×50 重跑中（/tmp/drawscale-scan.py，150 段，結果落 /tmp/drawscale-results.json）
- [ ] α 自動歸零問題：lgb_predict_upcoming gate 失敗（no race_logloss_curve / corr_lgb_elo NaN）會 set-alpha=0，2026-09-09 08:33 HKT 又觸發一次，已手動還原 0.85；待與用戶決定點改（例如閘門失敗時維持現值、或通知而非自動降）


## 馬會即時天氣（2026-09-09）
- [x] 接駁馬會馬場天氣站（風速追蹤器同源 GraphQL），`/api/public/hkjc-weather` 60 秒快取
- [x] 日程頁、選馬頁加入「馬場即時天氣」卡（氣溫／濕度／氣壓／平均風＋陣風／雨量／草地含水量／日照＋跑道 A-D 段風速）
- [x] 未跑賽日「同地質」改用馬會官方即日地質（wt_WeatherMeeting go_ch），冇官方值先退回同場最近賽日實際地質
- [x] 天氣存檔：`weather_snapshots` 表 + `/api/public/weather-archive`，每 5 分鐘一次，但只喺賽馬日首場前 3 小時至尾場後 1 小時之間先真正存檔（其餘時間即時略過，慳成本）
- [x] 天氣紀錄每晚 23:50 HKT 自動同步入 GitHub `tianxi-database/data/weather/YYYY-MM.csv`（`/api/public/weather-sync-github`），賽事資料集中管理
- [x] 每次改動同步更新開發者日誌 `/dev-log`（已補回 2026-09-06 → 09-09 全部條目）
- [ ] 天氣特徵研究：累積約一季後測「風向×跑法（前領/後上）」、「含水量×地質」、「氣溫濕度×路程」；命中率唔跌先入引擎
- [x] 場地圖指南針擺法／方向與官方對齊：羅盤整體逆時針 40° 偏左，NEWS 字母向內收並加入四方刻度及雙層圓框；縮短中央箭嘴，避免遮擋 N／S；下一賽馬日縮圖再向左移；特徵表拉開即時賠率與排序數值間距
- [x] 下一賽馬日資料補齊：天氣改讀馬會即時天氣，首場時間直接讀完整賽事表，移除錯誤「待公佈」

- [ ] 賽馬對帳頁加「引擎軌 A/B 拆分」（2026-09-13 用戶提問）：逐日／逐場次分開列天喜ELO 與天喜LGB 嘅頭馬命中率、四揀平均中匹數，避免單日十場波動被誤讀為某軌更準（現有回測基準：ELO 15.8%／35.9%，LGB 軌 17.7%／38.8%）

## 足球數據預測引擎（2026-09-12 起）
計劃書：`docs/football-engine-plan.md`（英超先跑通 → 五大聯賽；首個目標 1X2；照抄賽馬三倉架構）
- [x] 文獻研究：建模路線比較、gate 基準（RPS 為主指標）、校準方法、洩漏陷阱、walk-forward 設計
- [x] 資料源研究：football-data.co.uk（英超 1993 至今含收盤賠率）＋ Understat/FBref（xG 2014/15 起）＋ api-football（傷停陣容）
- [x] 自動更新設計：bronze/silver/gold 分層、GitHub Actions 每日增量＋每週全量校驗、team_mapping 對齊、資料品質告警、D1＋Postgres 雙層
- [x] S0 建三倉（2026-09-13）：`tianxi-football-database`（腳本／快照／mapping／Actions）、`tianxi-football-backend`、`tianxi-football-engine`；前端 `/football` 路由待建；D1 建庫待做
- [x] S1 基準線快照（2026-09-13，238,854 場／2000–2026／38 聯賽）：uniform RPS 0.2247、prior_asof RPS 0.2261（S2 gate）、market_devig RPS 0.2047（僅對照，最終逼近目標）；明細 `snapshots/baseline_snapshot.csv`
- [x] FootyStats 驗收腳本（`scripts/footystats_acceptance.py` ＋ Actions）：聯賽歷史深度、賽前欄位、xG 十項規格、速率上限；待開最低階付費帳戶勾 3–5 個聯賽跑完整驗收
- [x] S0 收尾（部分）：`/football` 前端路由骨架已上線（階段進度＋S1 基準線＋鐵律＋數據源授權表，2026-09-13）；仍欠：D1 建庫＋自建 football-data.co.uk 逐季採集器（不長期依賴第三方鏡射）
- [x] S2 天喜足球ELO（2026-09-13，主客獨立評分＋跨季回歸 0.70＋淨勝球加權 K＝22，時序前推）：RPS 0.2144、log-loss 1.0373、命中率 47.90%，三項全勝歷史頻率閘（0.2261／1.0699／44.52%）；五組參數 ±0.001 穩健；腳本 `scripts/elo_s2.py`、快照 `snapshots/elo_s2.json` 已入 tianxi-football-database
- [x] S3 Poisson / Dixon-Coles 入球模型（2026-09-13，在線攻防係數梯度更新＋主場優勢 γ=0.12＋跨季回歸 0.80＋ρ=-0.05 低比分修正，暖機 40 場，時序前推 205,326 場）：RPS 0.2149、log-loss 1.0367、命中率 47.42%，三項全勝歷史頻率閘；同一比分矩陣派生 1X2／OU2.5／BTTS 保證一致；OU2.5 log-loss 0.6918（僅僅贏基準率 0.6930）、BTTS 0.6939（輸基準率 0.6925，暫不上線，交 S4）；腳本 `scripts/dc_s3.py`、快照 `snapshots/dc_s3.json` 已入倉
- [x] S4 天喜足球LGB（2026-09-13，54 項賽前特徵、逐季 walk-forward 重訓、賠率零權重，實測 2012–2026 共 149,890 場）：RPS 0.2105、log-loss 1.0242、命中率 48.66%、ECE 1.36%，同批場次全勝 S3（0.2138／1.0322／48.39%）；BTTS log-loss 0.6903 贏基準率 0.6925（可上線）、OU2.5 0.6840；逐季 RPS 0.2086–0.2144 無崩季；和局召回率僅 2.9%（交 S5 校準）；腳本 `scripts/lgb_s4.py`、快照 `snapshots/lgb_s4.json` 已入倉
- [x] S5 α 集成 + 校準（2026-09-13，Elo／DC／LGB 對數空間加權，權重與校準器只用測試季之前兩季季外預測擬合，賠率零權重）：RPS 0.2098、log-loss 1.0203、命中率 49.04%、ECE 0.30%（S4 為 1.36%），三項全勝 S4／S3／S2；逐季 RPS 0.2081–0.2133 無崩季；和局召回率跌至 0.3%（集成更尖銳），但和局機率分區可靠（27.5% 預測 vs 27.6% 實際）→ 和局改以「價值注」用法，召回率降為診斷指標；腳本 `scripts/ens_s5.py`、快照 `snapshots/ens_s5.json` 已入倉
- [~] S6 足球預測頁 + 公開對帳
  - [x] 公開對帳頁 `/football/results`（2026-09-13）：總成績、六軌對照、逐季 15 行明細（權重＋校準器）、首選機率校準表、和局分區可靠度（取代召回率）、未過關項目公開（30–35%／35–40% 高估和局 → 價值注封頂 30%）
  - [x] 自建每日採集器（2026-09-13）：`ingest_results.py`（官方 CSV，22 聯賽 × 2000 起，逐季一檔 + manifest）、`ingest_fixtures.py`（未來一週賽程＋賽前平均賠率，抓唔到保留舊貨並標 stale）、`selfcheck.py`（新鮮度上限：賽程 12h／賽果 30h，缺快照即報）、`football_daily.yml`（每 6 小時，自檢失敗自動開／續 watchdog issue）
  - [x] 引擎流程頁 `/football/engine`（2026-09-13）：八步時序（T-7 日 → T-30 分凍結＋版本指紋）、紅黃綠燈定義、逐季集成權重＋校準器表、採用 54 項特徵按六組列出、明確不採用六項（賠率／假 xG 欄／賽中統計／和局重採樣／隨機切分／球員分數加總）附原因
  - [~] 逐場賽前凍結＋版本指紋＋紅黃綠燈（2026-09-13）：`scripts/predict_fixtures.py`（197,871 場歷史前推重建 Elo＋DC 在線狀態 → 190 場賽前機率、λ、最可能比分、OU2.5、BTTS、市場去水對照＋價值差、指紋、T-30 鎖定判斷）；已入 `football_daily.yml` 每 6 小時重算，`selfcheck.py` 加預測層 12h 新鮮度；站內 `/football/fixtures` ＋ 私有倉代理 `/api/public/football-predictions`。**未完**：LGB／集成逐場推論未接入 → 狀態一律紅燈（未校準），接入後才出黃／綠燈
  - [ ] 賽後逐場對帳（等本批凍結預測有賽果）
  - [x] S7 價值注盈虧回測（2026-09-13，149,890 場、賠率只作價值判定不入模）：八方案全負 —— 全市場最佳價門檻 0%／2%／5%／10% 分別 −2.24%／−2.36%／−2.50%／−2.85%，單一莊家 −8.85%／−9.90%，只買和局（機率封頂 30%）−3.54%／−3.47%，凱利（上限 2%）由 1000 輸光；逐季 15 季只有 2017（+0.02%）、2019（+0.29%）正數，2025 季 −10.04%；關鍵發現：跨莊比價值 7 個百分點（−9.9% → −2.2%）；腳本 `scripts/value_bets_s7.py`、快照 `snapshots/value_bets_s7.json` 已入倉；**商業閘門未過 → 價值注不上線，不開收費**
  - [ ] 價值注翻正（需 xG／賽前陣容／傷停 v1 特徵；不得以賠率入模）
- [ ] 用戶授權自動推進：每個「下一步」由我自行決策執行，直至足球引擎搭建完成（2026-09-13 起）
- [ ] S6 產品化（紅黃綠燈鎖定、特徵選取頁、可靠度圖、殘差診斷）
- [x] 定案（2026-09-12）：賠率零排名權重；球員層只做「陣容強度修正特徵」（球員ELO×分鐘加權 → 預期首發／板凳深度／可用率／輪換方差），不取代球隊層；球隊與球員名跟馬會官方繁中譯名（雙軌 team_names/player_names 對照表＋官方譯名爬取器）；足球頁併入現網 `/football/*`
- [ ] 待你確認：football-data.co.uk 商用授權、api-football 付費方案、arXiv:2512.12116 編號（內容與足球無關）、ResearchGate 該篇原文連結／PDF
- [ ] 足球賽前陣容／傷停免費源可行性評估（用戶提供清單 2026-09-13）：Big Balls Football API、WhoScored/FotMob/Sofascore/Transfermarkt 網站抓取、StatsBomb open data 歷史陣容——逐一驗證授權與穩定性
- [x] 特徵字典 v0.1 落地：`docs/football-feature-dict.md`（16 章欄位規格、refresh／freeze／可否入 prediction_log／v0-v2 分期、加特徵硬規矩）
- [ ] 研究 https://www.ai-prediction.info/ （2026-09-13 用戶要求）：其預測產出、指標展示、資料源與可借鑒之處
- [x] 競品研究 ai-prediction.info：定價 HK$3,800/月（6 個月 HK$7,800）、表現頁只有截圖無可核查指標、方法論不公開；結論寫入 `docs/football-engine-plan.md` §7
- [ ] 借鑒項 A：HKJC 七類盤口內在一致性檢查（反推 λ 交叉驗證模型）
- [ ] 借鑒項 B：Glicko-2 作為足球評分軌 A/B 候選（處理轉會／傷兵／換帥衝擊的不確定度）
- [x] 競品研究 data4mula.com：資訊架構、單場分析九大區塊、多莊 SD/CV 分歧度、四條盤路歷史帶；結論寫入 `docs/football-engine-plan.md` §8（Cloudflare 封鎖，不爬）
- [ ] feature_dict 補三組（來自 data4mula）：進失球六時段分佈 `goals_share_min_*`／`conceded_share_*`、球證贏盤率 `ref_home_cover_rate`、跨莊分歧度 `p_impl_sd`／`p_impl_cv`
- [ ] 前端借鑒：四條盤路歷史色帶（勝負／讓球／大細／單雙）、半全場與入球數分佈（由模型 λ 比分矩陣生成而非純歷史頻率）
- [ ] 研究開源專案 github.com/Scodive/MatchPredict（2026-09-13 用戶要求）：模型結構、特徵、資料源、有無回測與校準，判斷可否借鑒
- [x] 研究 Scodive/MatchPredict：實際只用 sklearn RF/GBDT + 約 20 欄近 10 場統計 + LLM 文字分析；發現四大洩漏（特徵非 as-of、隨機 K-fold、scaler 全集 fit、只報 accuracy 並宣稱 90%）→ 反面教材，結論寫入 `docs/football-engine-plan.md` §9
- [ ] 產品層可借鑒（來自 MatchPredict）：日曆式歷史預測瀏覽＋逐日命中率、會員積分／VIP 分層、串關五模式命名對照我們雙欄設計
- [x] 研究 kochlisGit/ProphitBet（MIT、573★）：27 欄主客滾動特徵（shift(1) 逐季 as-of，做法正確）、Profit Balance 盈虧平衡指標、內建機率校準、Boruta＋決策樹規則抽取 → 可用；賠率三欄直接入模、預設隨機 StratifiedKFold＋Optuna 掛隨機切分、SMOTE/NearMiss 重採樣 → 不可用。結論寫入 `docs/football-engine-plan.md` §10
- [ ] 落地項（來自 ProphitBet）：v0 隊級滾動特徵照其邏輯實作但剔除賠率欄；gate 加 Profit Balance 輔助指標；`/football/features` 加 Boruta 裁決欄與決策樹規則圖
- [x] 研究 1canhhoa/sports-betting-toolbox（TS、MIT、⭐135／fork 869）：預測層以 LLM 出機率＋全表一次算戰績＋子字串隊名匹配 → 不可用；策略層（移植 Python `sports-betting`）TimeSeriesSplit 時序回測表、價值注 `p×odds>1`、`OddsComparisonBettor` 去水基準 → 可用。結論寫入 `docs/football-engine-plan.md` §11
- [ ] 落地項（來自 sports-betting-toolbox）：足球回測輸出表統一為訓練期／測試期／下注日數／注數／每注 yield%／ROI%／期末資金；S1 加入價值注判定與多莊平均去水基準；商業閘門＝RPS 過關 ＋ yield 正數
- [x] 研究競品 tipsme.hk（Datamount Solutions Ltd，波馬合一＋貼士市集）：查明足球資料層 100% 買自 TheSports API（`img.thesports.com` / `widgets.thesports01.com`）；結論寫入 `docs/football-engine-plan.md` §12
- [ ] 申請 TheSports 15 日免費試用，抽 schema 樣本評估是否覆蓋特徵字典第 6–9 章（賽前陣容／傷停／球員能力／中文隊名球員名），再決定付費；買賠率亦維持 `market_beta=0`
- [ ] 補入足球特徵字典第 3 章：讓勝率、大率、角大率(>9.5/>10.5)、六時段進失球分佈；`/football/match` 加「同主客／賽事相同」篩選
- [ ] `/football` 球隊頁參考佢哋密度：傷停名單（缺陣場數＋預計復出）、每場帶氣溫／角球／紅黃牌、六項能力分＋總分（子分必須可回測並標賽前凍結時間）
- [ ] 免費引流工具：讓球盤去水還原（抽水%＋真實勝率＋凱利注碼）、過關計算機——與 S1 去水基準／價值注同源
- [ ] 會員定價錨定 HK$688/年（tipsme 鑽石會員價，含「四隻精選馬匹」，與我們四揀正面對撞）
- [x] 研究 7M（news.7m.com.cn 賽前分析欄）：版權明文嚴禁轉載／建立鏡像，數據源自 SportsDT（二手授權）→ 與 Sofascore／Flashscore 同級，不爬取、不進生產；「免費調用」只係帶其品牌廣告的嵌入頁，非原始數據，只列應急備援。結論寫入 `docs/football-engine-plan.md` §13
- [ ] `team_names` 表加 `name_zh_hk`（馬會官方為唯一權威）＋ `name_zh_cn`（對接內地源如 TheSports／SportsDT 回傳簡體名用）＋ `alias[]`、`source`、`verified_by/at`；無把握入待審告警
- [ ] `/football/match` 加「人話賽前簡報」：四段式（港式標題／模型推介＋紅黃綠燈＋凍結時間／軍情：陣式・擔正・入球助攻・傷出缺陣・預計正選變動／場外動態短訊流），資料自建、文字由語言模型生成，機率只來自可回測模型
- [x] 研究 FootyStats（Cloudflare 擋，不爬）：其自售 JSON API（`api.football-data-api.com`，含近5/6/10場滾動統計、H2H、Odds Comparison、BTTS／大細／角球／牌）明寫供 ML 用，價格遠低於 TheSports → 定為第二順位採購源。結論 `docs/football-engine-plan.md` §14
- [x] 研究 Mysports.AI（NBA/MLB/NHL 訂閱平台）：方法論與我們一致（去洩漏欄位、Elo 為主、球員效率總和與球隊實力弱相關、正EV才出手）；績效全標「回測示意」不可作基準。§15
- [x] 研究 HongKongScore.com：純關鍵詞殼站，比分全嵌 SPBO，零數據零分析 → 無參考價值。§16
- [x] 研究騰訊工程師《用大數據技術預測足球勝率》：盈利硬門檻 `1/precision < 命中場均賠率`；最佳模型 54.55% 仍不達標 → 按機率分段找可出手區間（英超出手率 ~20%、法甲 ~7%）。§17
- [ ] 資料源採購次序定案：免費組合 → FootyStats API（補盤口統計／H2H）→ TheSports（需中文譯名＋賽前陣容＋角球即場才升級）；任何源賠率一律 `market_beta=0`
- [ ] 足球商業閘門統一成一張表：技術（RPS／Brier／ECE）＋ 商業（盈利門檻 1/precision < 均賠、Profit Balance、yield%、ROI、最大回撤、平均賠率、盈虧比）
- [ ] 按預測機率分段找「可出手區間」，產品顯示「今日出手／不出手」與出手率（沿用賽馬已上線的分段校準基建，但用於決定是否推薦，不改排名）
- [ ] 新增「聯賽混沌度」指標（各隊近10季積分排名方差平均）：用於排擴展聯賽優先次序，並作紅黃綠燈降級理由之一
- [ ] 足球ELO加入跨賽季回歸（`Elo_next = R×0.75 + 0.25×聯盟平均`）；同時回測賽馬引擎是否需要跨季回歸
- [ ] 特徵字典第3章新增 `scored_in_both_halves_rate`（兩個半場都入球率）；新增繁體統計榜頁（兩半場都入球／BTTS／大細2.5／角球大細／讓勝率／零封率）
- [ ] 命中率／對帳頁加「誠實定義」段落：全部推薦整體命中率 vs 精選高信心命中率並列；補資金曲線（含最大回撤）與學習曲線
- [ ] 建立 with_odds 離線對照軌（17家初賠式基準），只用來量度 no_odds 模型距離市場多遠，不入生產排名
- [ ] SEO 策略：避開「足球比分／即時比分」紅海詞，攻長尾統計榜與方法論頁

- [x] 研究 AutoBetSoft（autobetsoft.com/ai/model.html）：匿名營運、定價需登入才見、模型頁只堆砌算法名詞、「85% 勝率」無驗證協議；核心做法係賠率誘阻方向 → 與 `market_beta=0` 衝突。反面案例，§18
- [x] 研究知乎《足球预测数据模型实战…worldliveball》：推廣軟文，無資料集／無模型細節／無切分協議；同系列宣稱 80%／82.3% 皆不可查驗。只取多尺度特徵分層、蒙特卡洛比分分布、預測快照留痕三個理念。§19
- [x] 研究 NerdyTips（nerdytips.com/zh，KickOff Ventures LLC）：唯一真做凍結預測＋公開對帳（274,510 場、66.6%、CSV＋GitHub commit 稽核）；但只有命中率、無 RPS／ECE／ROI，中文只有簡體，定價隱藏。§20
- [x] 盡職審查 SportsAPIPro：法人不透明、正在出售（MRR ~US$2.4–3.3K）、schema 幾可判定係 SofaScore 包裝轉售、無傷停端點、陣容只有開賽前 30–60 分鐘、無中文名、無開盤歷史 → **不採購**，只可用 Free tier 交叉核對。§21
- [ ] 對帳頁照 NerdyTips 三段式版面做（KPI 卡＋月度與近14日時序圖＋原始 CSV 下載），但 KPI 要包含 RPS／ECE／yield%／最大回撤；凍結證明加預測快照 hash＋凍結時間，可逐場展開比對
- [ ] 凍結範圍必須連「揀邊個盤口」的規則一齊凍結並公示（避免 NerdyTips "Best Tip" 式事後擇優質疑）
- [ ] 每日限量免費貼士（參考 NerdyTips 6 條）作獲客漏斗；定價公開透明（與 NerdyTips／AutoBetSoft 隱藏定價形成差異）
- [ ] 研究 api-football.com/pricing（免費層額度、付費層價格、覆蓋與歷史深度）與 understat.com（xG 資料結構、抓取授權、歷史深度）
- [ ] 產品原則寫入公開頁：全部歷史預測公開，包括差的預測與虧損期，不隱藏、不刪除、不事後修改
- [ ] 特徵設計（用戶觀察 2026-09-13，四項全部要回測驗證，不假設成立）：
  - [ ] 天氣互動項：雨量／風速 × 球隊控球風格（控球率、傳球數、短傳比）交互特徵；Open-Meteo 歷史逐小時，按開賽時間 as-of
  - [ ] 連勝品質調整：所有近況特徵加對手強度加權版本（對手 ELO 加權勝率 vs 原始勝率），並同時保留兩者比較，量度「假連勝」
  - [ ] 傷停影響量化：傷停 × 該球員 ELO 貢獻／上場分鐘佔比 → 缺陣強度指數；與市場賠率反應做殘差分析，檢驗市場是否低估（只作離線對照，不入排名）
  - [ ] H2H 時間衰減：對戰往績加指數衰減，>3–4 年權重趨近零；用回測選衰減半衰期，而非拍板定死
- [x] 審查 API-Football（API-SPORTS，法國，2018）：Free 100 次/日、Pro US$19/7,500、Ultra US$29/75,000、Mega US$39/150,000；1,226 聯賽；免費層即含陣容＋傷停＋事件；賠率只有 7 日滾動、滾球不留歷史；**無中文名**；ToS 被 Cloudflare 擋未核實。定位＝免費／低成本輔助位，採購次序不變。§23
- [ ] 申請 API-Football Free key 實測三項：付費層歷史回溯到哪一季、陣容實際開賽前幾分鐘出現、每分鐘速率上限；並人手登入下載官方 ToS 核對轉售／attribution 條款
- [x] 審查 Understat：**robots.txt 實測 `Disallow: /` 全站禁爬** → 合規紅旗，降級為「需書面授權」；且 2025-12 起改架構，`shotsData`／`datesData`／`teamsData` 已不在靜態 HTML，開源套件解析失效。§24
- [ ] 寄信問 Understat 授權／官方匯出；未有書面回覆前不做任何排程抓取
- [x] S8 xG 技術可行性驗證（2026-09-13）：Understat 新架構嘅 XHR 端點 `getLeagueData/{league}/{season}`（gzip JSON，含逐場 xG／npxG／PPDA／deep／xPTS）已解通，寫成 `scripts/ingest_xg.py`（隊名對照表 + 由 football-data 賽果反查核對）＋ `scripts/xg_coverage.py`（±1 日容差，因 Understat 用 UTC、football-data 用英國本地日期）。實測五大聯賽 2014/15–2026 共 21,763 場、隊名 100% 對名、對接率 99.85%。**但覆核 robots.txt 仍係 `Disallow: /`（全站禁爬）→ 抓回嘅資料全部由倉庫撤回、每日流程嘅 xG 步驟移除、腳本標記「已停用，切勿排程」**，只留作合規替代源接上時嘅結構參考
- [ ] S8 合規 xG 落地：改用 StatsBomb open data（免費、研究用途）做首個真實 xG 來源，沿用已寫好嘅對名同對接核對；覆蓋不足嘅聯賽等 FootyStats／TheSports 授權
- [ ] 研究 zhuanlan.zhihu.com/p/682338619（2026-09-13 用戶提供）：知乎反爬 40362 全擋（HTTP 直取 403、無頭瀏覽器亦被限流）→ 需用戶貼正文或截圖
- [x] 審查《使用深度學習構建足球競賽預測模型之研究》（2018 臺灣國際科展 190009，謝之貽／康橋高中，用戶 2026-09-13 上傳 PDF）：Kaggle European Soccer Database 2008–2016，CNN 分層共享參數（球員屬性層 → 球隊層 → 融合層）＋全連接層接滾動戰績，正確率約 60%（十次隨機種子變異極小）；和局精確率高（約 0.85）但召回率極低（約 0.15），主勝召回約 0.9 —— 同我哋 S5 集成嘅和局行為完全一致，佐證「和局唔應該當首選，要用機率對賠率」嘅取向
- [ ] 借鑑科展 SoccerNet：球員屬性用「共享參數」而非逐人獨立特徵（減參數、抗過擬合）＋滾動戰績走另一分支，列為球員層特徵（§6）嘅備選架構；其驗證用隨機切分，我哋照舊只用逐季時序前推
- [ ] xG 主源次序改為：StatsBomb open data → FootyStats API → TheSports；Understat 只作人手抽樣核對
- [ ] 特徵字典加入 xG 供應商驗收清單（PPDA、deep completions、逐球 xG＋X/Y 座標、situation／shotType／lastAction、npxG／xGChain／xGBuildup、分鐘區間與位置拆分）
- [ ] with_odds 離線對照軌的長期賠率庫改用 football-data.co.uk 開盤／收盤 CSV（API-Football 只有 7 日滾動，做不到步進回測）
- [ ] 對帳頁加和局召回率（draw recall）次要指標，主指標仍 RPS（§25 PredictApp）
- [ ] 回測 ELO 更新目標值改「實際入球 × xG 混合」版本；殘差經有界函數更新（§25）
- [ ] Ordered Logit 列入 LGB 對照模型（1X2 有序三類）（§25）
- [ ] 特徵字典新增：新教練旗標、xG 效率回歸調整、<10 場向聯賽均值收縮（§26）
- [ ] 引擎硬紀律：全部盤口（1X2／BTTS／大小／波膽）由同一比分機率矩陣派生（§26）
- [ ] 對帳頁加「市場可靠度」視角；關於頁寫明無莊家 affiliate 連結（§26）
- [ ] 開 FootyStats 最低階付費帳戶揀 3–5 個聯賽驗收 xG／H2H／Odds Comparison 欄位（§27）；用人手瀏覽器核對其條款頁轉售／署名規定
- [ ] 對帳頁 FAQ 寫入「近乎全中截圖」教學案例（§28）：點解要開賽前凍結＋快照指紋＋全部公開
- [ ] xgabora 數據集落排程倉做基線快照；抽 3 季同 football-data.co.uk 原檔逐場核對；Elo 延續段抽 50 隊重算比對（§29）
- [ ] 禁止事項寫入特徵字典：xgabora README 建議嘅 ExpectedGoals／DrawLikelihood 等衍生欄含賠率同賽中統計，唔准入模（§29.2）
- [ ] Reddit 帖 1oxnqkf 待用戶貼正文再評（§30）

## 自動化韌性（2026-09-13）
- [x] 修 `lgb_predict_upcoming.yml` / `lgb_backfill.yml` / `alpha_tune.yml` 後端地址（tianxi.racing 切換後 404，連續四日重訓失敗）
- [x] 修 `deploy.yml` 檢查失敗（三個 analyze 端點未列入 manifest）
- [x] 修 `engine_sanity_daily.yml`：`$SEASON_` unbound variable、`/api/season` 需帶 User-Agent（403）、推送前先 rebase
- [x] 新增 `automation_watchdog.yml`（backend：關鍵流程新鮮度 + 今日 LGB 覆蓋率；database：採集流程新鮮度），異常自動開 GitHub issue
- [x] 重訓 2.5 小時問題：特徵快取改增量（restore-keys + 表頭核對），預期降至十幾分鐘
- [x] 上一版模型後備（carry-over）：`predict_upcoming.py --save-bundle/--load-bundle`（凍結 booster + τ_lgb/τ_elo/α + FEAT_COLS；欄位變更即拒絕評分，不用舊 α）
- [x] `lgb_predict_upcoming.yml` 重訓後 `actions/cache/save` 存 bundle（key `lgb-model-v1-<run_id>`）
- [x] 新增 `lgb_fast_predict.yml`：賽日每 30 分鐘 gate 查覆蓋率，零覆蓋即用後備模型只評今日場次；bundle 或 DB cache 缺失則 fail closed
- [x] `today-picks` / race-day report 補 `startTime`（entries_upcoming.post_time → races.start_time），狀態燈終於計得到 T-30 鎖定
- [x] 前端 `modelProvenance()` + 狀態燈標「暫定／最終預測（昨日模型）」、副欄 chip、賽日總燈註明頂住場數
- [ ] 觀察：明日凌晨起驗證增量特徵 + bundle 存取實際生效（首日 bundle cache 仍為空，fast predict 會 fail closed 並報警）

## 足球 · 四倉審查行動項（2026-09-13，§32）
- [x] 審查 golazo（MIT 但打 FotMob 未公開 API → 資料層不可用）、livescoreFootball（無 LICENSE → 不引用）、datasets/football-datasets（PDDL 公有領域，但無賠率欄且 2026-06-23 起停更）、michill H2H（CC0 上游，可用）
- [ ] 採集器韌性四件：空結果持久快取、併發上限、失敗保留上一份有效快照、`sync_states` 新鮮度表
- [ ] 加 `/api/capabilities` 機器可讀自述端點；看門狗改自動比對端點清單（取代人手 manifest）
- [ ] datahub PDDL 五大聯賽 CSV 落交叉核對軌，並補 `Referee` 欄餵球證特徵；不得當主源
- [ ] michill H2H（7,503 場）＋ martj42 CC0 落世界盃線；簡體隊名經 `team_names` 轉港式繁體，缺漏開待審告警
- [ ] H2H 特徵帶三態覆蓋標記（有交鋒／確認無交鋒／待驗證）；訓練標籤一律用 90 分鐘賽果 `result_90m`

## 足球三條紀律（2026-09-13，計劃書 §33）
- [x] 洩漏紀律寫入計劃書：滾動特徵、標準化統計量、Elo／校準器一律逐季 walk-forward，違者回測作廢
- [x] 逐輪凍結寫入計劃書：預測逐個比賽日生成並凍結，帶模型＋特徵指紋，禁一次批算整季
- [ ] 機率區間：bootstrap 或三軌分歧度出 90% 帶寬，賽事卡顯示「±x 個百分點」
- [ ] 特徵貢獻：LGB SHAP 逐場前三至五項推高／推低因子，只作解釋層
- [ ] 官方球隊徽章授權未有，暫用按隊名派生嘅盾形識別標（已上線）
- [x] 波膽改每場一個（全場機率最高一格）＋「四球或以上合計機率」，並喺頁尾寫明為何最高機率格幾乎必然係低比分
- [x] /football/fixtures 由 11 欄大表改為賽事卡：識別標、主和客機率條、三格波膽（主勝／和局／客勝各自最可能）、引擎口徑摺疊面板
- [ ] 賽事頁掃讀密度（參考 data4mula／tipsme）：日期分組標頭、排序切換（時間／價值差／信心）、跨莊分歧度欄
- [x] 隊徽資源審查（計劃書 §34／§35）：下載站（Football-Logos.cc、FootyLogos、Brands of the World、Wikimedia Commons）只作離線參考；Kaggle 圖集不採用
- [x] 隊徽上線路線定案：football-data.org 免費層 crest URL（第一順位）→ API-Football 備援 → TheSportsDB（標出處）→ 派生識別標兜底；URL 由排程落 team_names 表，前端直用 API 託管 URL
- [x] football-data.org 免費 key 已入 secret（`FOOTBALL_DATA_ORG_TOKEN`），實測 `/v4/competitions/{code}/teams` 回 crest URL，rate limit 每分鐘 10 次
- [x] 改用站內代理 `/api/public/football-crests?div=`（逐聯賽邊緣快取 7 日、上游失敗只短快取 5 分鐘並當無徽章處理），免同步排程同商標託管；football-data.org 免費層未覆蓋嘅聯賽（土超／比甲／希超／蘇聯賽等）回空陣
- [ ] API-Football 備援：補免費層未覆蓋嘅 13 個聯賽 crest
- [x] 前端 `/football/fixtures` 接入官方 crest（`useCrests` 客戶端 token 對照，命中率 ~53%；對唔上或圖檔載入失敗即退回派生盾形識別標）
- [ ] openfootball 靜態球隊資料入 `team_mapping` 輔助對照

### S8 五大聯賽實力模型（2026-09-14 併入引擎）
- [x] 訓練：英超／德甲／西甲／意甲／法甲 2020/21 至今 11,051 場，回測 8,942 場，每 14 日滾動重訓，時間半衰期 180 日，只用賽前資料
- [x] 過閘成績：純入球實力 RPS 0.2025 ／ 命中 52.15% ／ 波膽 12.37%；實力重加權 RPS 0.2004 ／ 命中 52.66% ／ 波膽 12.64%（三項全勝，正式採用重加權）
- [x] 引擎頁新增 S8 卡公開權重與成績；流程第 ⑥ 步寫明卜瓦松矩陣＋Dixon-Coles 低比分修正＋實力分區加權
- [x] 波膽展示改「一個主選＋分區備選」：主選為三區最高機率格，另兩區各出最可能比分（全場機率＋該賽果內條件機率）＋四球以上合計機率
- [x] 明確拒絕「用賠率反推隱含機率校正模型」呢個常見做法（market_beta = 0），只作對照線同價值判斷，頁尾已寫明
- [ ] 把五大聯賽實力模型 λ 推廣到其餘 33 個聯賽（樣本較薄，需向聯賽均值收縮）
- [ ] 實力模型 λ 落上游 predict_fixtures.py，取代現行在線混合 λ（現時網站只在展示層重加權）

### S9 xG／陣容／傷停：翻正價值注嘅三格缺口（2026-09-14）
- [x] xG 併入實力模型可行性驗證：Dixon-Coles 訓練目標改為「實際入球 × xG 混合」，五大聯賽 2018/19→2026 共 14,285 場、回測 10,684 場、每 14 日滾動重訓、只用賽前資料 → RPS 0.2029 → 0.2003、命中 51.85% → 52.57%、波膽 12.55% → 12.61%（三項全勝），最佳比例 65% xG／35% 入球，0.30–0.40 區間平坦
- [x] 驗證樣本合規處理：來源 robots.txt 全站禁爬 → 樣本用完即棄、唔排程、唔入倉；只保留結論同模型改動
- [x] 引擎頁新增 S9 卡：公開驗證數字＋三格缺口採用源次序與狀態；明寫三格未齊前唔宣稱價值注可行
- [x] bigballsdata.com 評估＋鑰匙驗通（2026-09-14）：免費層（GitHub 登入 2,000 次/日）逐端點實測——xg-leaders（球員季累積真 xG）、injuries、stored lineups、stored stats 全部 200；逐場 statistics（含逐場 xG）403 屬付費。定位：傷停主源、陣容／統計備援、球員 xG 聚合特徵來源
### S12 波膽塌落 1-1 修正（2026-09-14）
診斷：公開「波膽」本質係 DC 矩陣眾數，λ 被壓扁（λh 中位 1.57、λa 中位 1.24、λa < 0.8 零場），加 ρ=−0.05 把質量推向低分格 → 190 場 178 場 1-1、12 場 2-1。根因喺 S3 結構：聯賽基準鎖 log 1.35、係數 clamp ±1.2、跨季 ×0.80、Elo 差完全冇注入 λ。
- [x] 展示層（唔郁 S6 凍結 1X2，2026-09-14 上線）：同一張矩陣出 Top 8 格、條件波膽（主勝／和／客勝格內各自排序）、期望比分 E[gh]-E[ga]、尾部桶 P(主勝3+)／P(gh≥4)／P(ga=0)
- [ ] 研究軌 λ 注入實力：λh = exp(μ + γ + αh − βa + κ·elo_diff/400)，κ 掃 0.4–0.7，walk-forward 睇懸殊場 1-1 有無跌出 Top 3、RPS／log-loss 有無爛
- [ ] 肥尾：負二項／過散泊松，或另開 P(GD≥3) 頭用 Elo 分桶歷史頻率校準；明確唔用零膨脹（會更多 1-1）
- [ ] 現實錨：懸殊場目標＝1-1 跌出前三、2-0／3-0／3-1 行先、4-0 入 Top 8；唔會把 6-0 當單一預測
- [ ] 三項閘（RPS／log-loss／ECE）全過，κ 先准寫入 S6 凍結指紋

### S11 ClubElo 對帳層（2026-09-14）
- [x] ingest_clubelo.py：官方免 key CSV（api.clubelo.com）每日全日表落 data/clubelo/daily/，限速 1 req/s、四次重試、失敗保留舊快照＋非零退出，唔寫假數唔填 0
- [x] mapping/clubelo_names.csv：五大聯賽 110 行對名（含本季升降隊），對唔上入 unmapped 出報告，唔 silently 亂配
- [x] reconcile_elo.py：as-of 對帳（開賽日當時 ClubElo vs 自建 elo_s2），聯賽內 z-score 比較；四條告警線＝對名率 95%／z 中位數差 0.50／近 50 場符號一致率 80%／單日跳幅 60 分；snapshots 只增不改
- [x] football_daily.yml：賽果增量後、S6 凍結前插入兩步（continue-on-error），對帳源掛唔擋凍結寫入；異常自動開 watchdog issue；自檢報告加 clubelo 層（報告性質，唔當健康門檻）
- [ ] 兩週真實數據校準告警起步線（現時四條線係推定值）
- [ ] 可選 overlay 特徵：ClubElo 只有過 walk-forward 閘先准入 S4／S5，未過就維持純對帳

- [ ] FootyStats 擱置：免費帳戶 0 聯賽配額，揀聯賽要付費訂閱先解鎖；除非日後課金，否則唔再做 xG 源
- [ ] bigballsdata 接入：每日拉 xg-leaders 差分化做球隊實力特徵；injuries 落傷停特徵；stored lineups 做 APIfootball 陣容備援
- [ ] 接上已授權 xG 供應（FootyStats API 為首選，用戶已有訂閱 → TheSports → Opta），開啟 xG 混合目標值
- [x] APIfootball v3 鑰匙驗通（apiv3.apifootball.com）：1,019 聯賽、五大齊；完成賽事實測有齊正選 11 人＋後備＋教練；未開賽場次陣容約開賽前一個鐘公布（今晚實測確認 timing）；statistics 欄射門／角球／犯規／牌數齊全 → 可做 S10 節奏層每日實數源
- [x] api-football.com（API-SPORTS）鑰匙驗通：免費層每日 100 次、只包 2022–2024 歷史季；英超 2024 傷停實測 3,168 條（球員＋傷患類型＋缺陣場次）→ 定位＝傷停／陣容特徵歷史回測源
- [ ] 歷史傷停回填：API-SPORTS 免費層 2022–2024 五大聯賽 injuries 落地（每日 100 次要分多日拉），用嚟訓練同驗證陣容特徵
- [ ] 代理 xG（第二順位，研究軌）：只用 StatsBomb 開放射門事件訓模型＋APIfootball 實測統計做 zone formula 粗代理（唔叫 xG）；xg_source ∈ {statsbomb, proxy_zone, none}，none 保持 NULL；未過 walk-forward 三項閘唔入 predict_fixtures 同公開頁
- [ ] APIfootball 陣容採集器落地：開賽前 60 分鐘起每 10 分鐘輪詢 lineups，公布後凍結快照；missing_players 欄實測為空，傷停標「待觀察」，缺資料時可用陣容比率 = 1
- [ ] 陣容特徵四項落地：預期首發強度、板凳深度、可用陣容比率、輪換不確定度（§6）
- [ ] 三格齊備後重跑 S7 價值注回測，睇能否跨過抽水線（現最佳 −2.24%）

### S10 資料源與方法論研究批次（2026-09-14，用戶提交九源＋兩篇）
- [x] 逐個查證完成：核對級三樣有價值（hudl/open-data 做 xG 校準黃金樣本、datahub CSV 補球證欄、withqwerty/reep CC0 實體 ID 對照）；the-odds-api／sportsapipro／sports.bzzoiro 額度太少或自帶預測，只作對照；不採用 statsultra（零回測＋禁 AI 爬蟲）、worldfantasysoccer（夢幻遊戲平台）、Kaggle 球員能力值（授權不明＋八年前快照）
- [ ] the-odds-api.com：只作對照線與價值判定（market_beta = 0 不變），評估免費層額度是否夠逐日跨莊比價
- [ ] sportsapipro.com：評估是否可作合規 xG／陣容／傷停源（FootyStats 之外的候選）
- [ ] hudl/open-data（StatsBomb 開放資料）：只作歷史抽樣核對，不作當季逐輪源
- [x] 自建 Elo 實測 40,646 場（79,672 樣本）駁回「Elo 通吃四項」講法：射門 ρ +0.4302（滾動 +0.2997）、角球 +0.3111（滾動 +0.1554）由實力主導；犯規 −0.0973（滾動 +0.4976）、牌數 −0.1496（滾動 +0.2045）由風格主導
- [x] 引擎頁新增 S10 節奏層卡＋外部資料源審查卡，數字與裁決理由公開
- [ ] 節奏層落地：射門／角球以 Elo 分差為主特徵、犯規／牌數以風格滾動＋球證傾向為主特徵，逐季前推驗證後才上線
- [ ] 由 datahub（上游 football-data.co.uk）五大聯賽 CSV 補 Referee 欄（現用歷史檔無此欄，缺咗做唔到完整犯規／牌數模型）
- [ ] hudl/open-data 自訂授權條款人手覆核後，才作自家 xG 校準樣本
- [ ] worldfantasysoccer / statsultra：抽取展示與呈現手法（不抄資料），寫入方法論源流章節
- [ ] 原則重申：外部只作啟發與交叉核對，模型、特徵、凍結機制與呈現一律自建

- [ ] 逐場 xG 來源評估補充：Sportmonks xG add-on（付費）、sportsdatacampus 免費清單、hungson175 gist 清單、xgstat.com（Vercel 機器人驗證擋爬、無公開 API）——結論記入 dev-log 同 football-source-check 來源表

### S13 逐場凍結帳＋公開對帳（2026-09-14，用戶批：鎖 60 分鐘／先接 S5 才開帳／只收五大）
斷層診斷：足球只有會被覆寫嘅 `data/predictions/upcoming.json`，冇賽馬嗰套「一場一條凍結帳」；冇結算 job、冇公開讀口；燈號三份文件唔一致（檔案 30 分鐘 vs backend README T−24h／T−1h）；回測身分（S5／S8）同生產凍結軌（S3＋S2）分叉。
- [x] 逐場鎖定統一＝開賽前 60 分鐘（`predict_fixtures.py` LOCK_MINUTES = 60），黃燈可刷新／綠燈已鎖／紅燈退回基準
- [x] 凍結器同時凍結整張波膽結構（`cs`：Top 8 格、三區條件格、期望比分、尾部桶），公開頁只讀凍結值，唔喺前端重算
- [x] `scripts/log_predictions.py`：按 match_key upsert 落 `data/predictions/log/YYYY-MM.json`，鎖後預測欄（p／lambda／cs／fingerprint／track／status）永不覆寫，被拒改動記入 `log/audit.jsonl`
- [x] `scripts/settle_predictions.py`：賽果 CSV 按 `div|DD/MM/YYYY|home|away` join，只寫 result（ft_h／ft_a／ftr／rps／argmax_hit／p_actual／波膽格排名／尾部實現），預測欄一分不改；開賽 3 日後仍 join 唔到才入 unmatched，唔智能亂配
- [x] `data/predictions/hit_rate.json` 公開讀口：入帳範圍＝五大聯賽（E0／D1／SP1／I1／F1）＋綠燈＋已鎖；紅燈軌只作診斷；附基準 0.2261 同市場去水 0.2047
- [x] 每日流程：S6 凍結後插入 upsert 同結算兩步；站內讀口 `/api/public/football-predictions?file=hit_rate`、`?file=log&month=YYYY-MM`
- [x] `/football/results` 頁頂加逐場凍結帳三數（平均 RPS／校準偏差／樣本＋指紋）＋「預測 vs 賽果」只讀凍結列表；波膽以「實際比分排第幾格」對帳，唔用眾數打 ✓／✗
- [ ] 接 S5 集成推論入每日凍結軌（同一指紋）→ 綠燈成立，戰績正式開帳；未接入前三數顯示「未開帳」，唔借回測數字充當實戰
- [ ] 完場後禁止重算之自動檢查：selfcheck 加「已鎖場次 p 有無被改」比對 audit
- [ ] 收費會員頁引用 football-data.co.uk 歷史（非商業條款）前，需法律位確認

### S14 波膽一致性優化次序（2026-09-14，用戶清單）
- [ ] ①公開只出 S8 重加權後嘅格（1X2 與波膽同一來源），未縮放 raw DC 唔出街
- [ ] ②波膽 KPI 改 Top 1／Top 3／Top 8 覆蓋率＋格 log-loss（目標 Top 8 約 55–70%），12.6% 命中率降級為輔助
- [ ] ③ρ 隨 λh·λa 衰減（或總 λ 過線關修正），專治懸殊場假 1-1
- [ ] ④κ 把 Elo 注入 λ，walk-forward 過 RPS／log-loss／ECE 三閘先談寫入凍結指紋
- [ ] ⑤主客攻防分開（as-of、shift(1)）；五大聯賽 μ 分開，唔用全局 log 1.35
- [ ] 更後：過散（負二項／雙變量負二項）＋兩狀態混合（賽前滾動 BTTS／總入球做權重）；同 ③ 一齊校，否則中間場更 1-1
- [ ] 明確唔做：人手規則「Elo>200 顯示 4-0」、用收盤波膽賠率教矩陣、賽中／紅牌／賽後 xG 入波膽、綠燈後為陣容重開成張格；1X2 永不為出大比數而改

### S15 前端層級紀律（2026-09-14，用戶定案：先引擎面，唔做資料館）
第一層（現階段唯一主力）今日預測＋已完對帳：燈號、1X2 機率條、波膽四層、指紋、日期＋五大聯賽篩、頁頂一條戰績（RPS／樣本／版本）。
第二層（有凍結帳後）五大聯賽積分榜＋「天喜足球ELO」一欄（標明自建、賽前 as-of、非 FIFA 排名）；球隊名點入去去「近期預測 vs 賽果」。
第三層（資料合約齊後）球會頁：只放主客 Elo、近況 λ／預期入球、近期預測對帳。
第四層（最遲）球員頁：等陣容／球員 ID 對照表凍結，只做五大、有出場先有頁。
暫緩：球員頁、全球球會百科、LGB 排行榜、每聯賽「數據中心」。
署名規則：一頁最多一條「天喜分」＝天喜足球ELO；LGB 只出引擎說明同戰績；入球模型只署名波膽區；ClubElo 只做對帳。未綠燈一律寫「基準軌」。

### S16 S5 集成推論接入每日凍結軌（已完成 2026-09-15，綠燈帳待完場樣本）
- [x] features_s5.py 單一賽前特徵引擎（as-of、只用開賽前資料）＋ train_s5.py 逐季前推訓練＋向量標度校準
- [x] 三項閘門全過：RPS 0.2083 / log-loss 1.0154 / ECE 0.65%，全部贏最佳單軌；模型指紋 378c283b73a7-bb35e29b0c7b-175995 併入凍結指紋
- [x] predict_fixtures 改用 S5 機率；波膽由 rescale_matrix 按 S5 分區重加權（1X2／波膽／大細／BTTS 同一張矩陣）
- [x] 燈號：S5 就緒＋雙方熱身 40 場＝final（綠燈入帳，今日 180 場）；否則 fallback（紅燈只作診斷，今日 10 場）
- [x] football_train_s5.yml 每月 1、15 號重訓，過閘才入倉，唔過閘自動開 watchdog issue
- [x] 前端：預測頁綠／紅雙軌燈號、只讀凍結波膽結構、並列閘門數字
- [ ] hit_rate.json 綠燈帳累積中，頁頂三數要等綠燈場次有完場賽果才轉真數（絕不借回測數字）

### S17 「預測 vs 賽果」升格公開主對帳頁（已完成 2026-09-15）
- [x] 獨立公開頁 /football/prediction-vs-result，同賽馬「預測與賽果」同一級；回測頁只留歷史數字並加入口
- [x] 一張卡三狀態：未開賽 → 進行中 · 預測已鎖定（唔顯示即時比分、唔預先畫 ✓）→ 已結算
- [x] 篩選：五大／全部聯賽、逐日、狀態三層；紅燈（熱身不足）場照顯示賽果但標「唔入戰績」
- [x] 頁頂三格維持「未開帳」（平均 RPS／1X2 校準／樣本＋指紋），波膽 Top 8 覆蓋率放摺疊次要項
- [ ] 等第一批綠燈完場樣本，三格轉實數並做結算驗收（抽 5 場對頁面、凍結列、指紋）

### S18 開帳前紀律：鎖定硬檢查＋對帳指標定義（已完成 2026-09-15）
- [x] 鎖定政策唯一口徑寫入 log_predictions.py（LOCK_POLICY）、README 同 selfcheck：開賽前 60 分鐘轉綠燈，已鎖場永遠跟當時指紋
- [x] 已鎖場遇新模型：refuse_locked ＋ fingerprint_drift 雙記錄（今日 179 場拒絕升指紋、11 場未鎖正常刷新）
- [x] 每日出 snapshots/lock_YYYY-MM-DD.json 鎖定報告；鎖定分鐘唔一致即警告
- [x] selfcheck 新增凍結帳層（月檔／場次／已鎖／已結算／拒絕數／鎖定分鐘一致／hit_rate 指標定義齊全）
- [x] 對帳指標寫死並輸出 hit_rate.json.metrics：主＝RPS＋ECE＋樣本指紋；1X2 次＝首選命中率；波膽＝頭八格覆蓋＋實際格 log-loss；排除波膽命中率、紅燈場、價值注 yield、回測填實戰
- [x] settle_predictions 逐場計 cs_logloss（跌出頭八格用最細格機率一半作罰分底）並入 aggregate；對帳頁摺疊項多一格
- [ ] 結算驗收（等今晚至週末五大聯賽完場）：抽 5 場對頁面機率／波膽格／指紋 vs 凍結列，確認只補賽果欄

### S23 主客分拆攻防生產移植（2026-09-15）
- [x] 在現行生產凍結軌（gamma=0.12、rho=-0.05、lr=0.04、warm=40）上 walk-forward：五大聯賽 46,855 場、評分季 2012 起 11,702 場
- [x] 三閘對照：基準 RPS 0.20568、log-loss 1.0026、ECE 10-bin 1.41%
- [x] 主客分拆四係數（atk_h/def_h/atk_a/def_a）48 組掃描：最佳 RPS 0.20873（lr=0.04、warm=60、gamma=0.06），log-loss 1.0097、ECE 4.21%，全部三閘都輸；gamma=0.12 時 RPS 0.2090、ECE 2.98%
- [x] 裁決：唔升指紋；predict_fixtures.py、dc_s3.py、lgb_s4.py 維持 global atk/dfn；研究結果 JSON 上傳倉庫 data/research/s23/
- [x] 解釋與研究軌刀 4 嘅差異：cuts.py 用 gamma=0.26 baseline（RPS 0.21356），主客分拆改善到 0.21032 並過三閘；現行生產 gamma=0.12 baseline 已更優，主客分拆再拆四係數反而攤薄主場效應、校準變差
- [ ] 下一條模型線暫時封住；產品線繼續對帳展示，對照表等賽果

### S26 產品線對帳（2026-09-15 起）
- [x] 對帳三格轉實數：190 場完場、綠燈五大 5 場入帳（RPS 0.1446、ECE 0.2001、頭八格 60%、格 log-loss 2.8842）；樣本細，只作起步參考
- [x] 抽五場核對凍結列：p_actual 逐位對上、cs_rank 同 top8 重計一致、結算只補 result
- [x] 核對揭兩漏洞已修（數據倉庫三腳本）：predict_fixtures 鎖定窗口改 0≤Δ≤60min（已開賽永不鎖）；log_predictions 賽後入帳標 late_ingest 永不鎖；settle_predictions 綠燈加 genuine_lock（first_seen ≤ 開賽−60min）。現有 5 場綠燈 first_seen 早過開賽 5.5–8h，新檢查下仍合資格
- [ ] 對外對照表（天喜 vs 公開站，同一批已鎖預測逐場記 1X2／波膽格／RPS）：等綠燈樣本再累积先開，唔用回測充場

### S24 倉庫分家（2026-09-15，完成）
- [x] 新開私有研究倉 `sleepingarhat/tianxi-football-research`：`scripts/research/`（7 個腳本）＋ `data/research/`（9 個結果 JSON，含 S23、S25 試驗 1–5）遷入
- [x] 生產倉 `tianxi-football-database` 刪走全部 research 路徑；只留凍結預測、prediction_log、audit、指紋、models/、snapshots/、每日凍結 workflow
- [x] 網站倉 `tianxi-site` 刪走本地 `research/` 副本，避免三處同一份研究檔
- [x] 權限邊界寫入兩倉 README：產品站只讀生產倉凍結檔；研究倉唔准寫指紋／模型／凍結檔，升級只准人手在生產倉開新版本
- [x] 研究倉加 `NOTES-rejected.md`：禁止列（殘差、ρ(λ)、逐聯賽 μ、時間衰減、κ→λ、Rue–Salvesen γ、疊加、賠率入模、單格命中回寫調參…）＋紅燈規則（缺資料 Δλ=0、紅燈可睇唔入戰績）

### S28 中文隊名對照（2026-09-15，完成）
- [x] `src/lib/teamZh.ts`：五大聯賽 96 隊 football-data 短名 → 港式馬會譯名（英超 20／德甲 18／西甲 20／意甲 20／法甲 18）；先按聯賽查表，再用跨聯賽全站唯一名後備，撞名或表外原樣顯示英文，唔會亂譯
- [x] 接入四個顯示位：賽前預測卡、五大積分榜、球隊資料頁（標題／近況對手／逐場凍結對帳）、公開對帳逐場卡；隊徽派生盾形標 initials 同步改中文頭兩字
- [x] 純展示層：內部鍵、teamSlug、凍結列 join 全部維持英文短名；唔碰凍結、唔入模、唔改對帳
- [ ] 維護：升降班新隊入表；表外新隊暫顯英文短名

### S27 場次條件層 Δλ 表（2026-09-15，結構落地）
- [x] `docs/delta-schema.md`：三表欄位定義、只附加語意（改正靠新行 + supersedes）、硬規則（唔准寫 data/predictions、models、snapshots、唔准帶凍結欄）
- [x] `data/delta/{delta_squad,delta_density,delta_market}.jsonl` 空表 ＋ `_schema_version=1`（結構版本，唔係模型指紋）
- [x] `scripts/delta_write.py` 只附加寫入器：拒絕凍結路徑、拒絕凍結欄（p/lambda/cs/fingerprint/locked_at/result）、拒絕未知欄；結構階段 delta_h/delta_a 一律 0、applied 一律 false
- [x] 缺資料語意：status=missing → Δλ=0 退回基準 λ、場次標紅燈（可查可睇、唔入戰績、唔入對帳分母）；delta_market `captured_before_lock=false` 唔准入任何對照表
- [ ] 准用前置未齊：公布名單時間戳、穩定分鐘、賽前 projected xG、門將撲救；未齊唔碰凍結、Δλ 維持 0
- [ ] 試驗 5 重開條件：S24＋S27 已完成，紅燈規則已寫入研究倉；仍需人手開跑，指紋一分不動

### S29 條件層資料層前置（2026-09-15，只落庫、唔生成 δ）
- [x] `docs/lineup-source-survey.md`：五大聯賽公布名單時刻調查（英超官方 75 分鐘；德甲／西甲／意甲 60–75、法甲 60–90 浮動、官方冇承諾）、聚合來源次序（官方 > API-Football 免費層 20–40 分鐘多數遲過鎖定線 > TheSportsDB 唔准做開關）
- [x] 時間戳定義寫死：`effective_ts = lineup_published_ts ?? lineup_observed_ts`；`lead_minutes = (kickoff − effective_ts)/60`
- [x] 遲到規則表：`ok`（≥60 分鐘且兩隊齊 11 人，eligible=true）／`late`／`post_kickoff`／`incomplete`／`missing`／`unmatched` 一律 eligible=false → Δλ=0、場次紅燈
- [x] `docs/context-data-schema.md` ＋ `data/context/{lineups,player_minutes,projected_xg,gk_saves}.jsonl` 空表 ＋ `_schema_version=1`：四項一次定齊欄位同遲到規則
- [x] `scripts/context_write.py` 只附加寫入器：拒絕凍結路徑同凍結／δ 欄（p/lambda/cs/fingerprint/locked_at/result/delta_h/delta_a/applied）、拒絕未知欄；eligible 由時間戳＋完整度自動計，已本地實測（官方 75 分鐘→ok、觀察 30 分鐘→late、完場 xG→missing、防護觸發）
- [x] `scripts/ingest_lineups.py` 採集骨架：只記 published/observed 時間戳同 11 人完整度；冇授權 key 或抓取失敗寫 missing 佔位，唔用平均／上仗 11 人頂替
- [ ] 未開（按指示排後）：用名單計 δ、LGB 改估兩個 Poisson λ、動態攻防重開；凍結預測、prediction_log、指紋一分不動



### S19 λ 生成鏈升級（研究軌，未過三閘唔升指紋）
- [x] 研究腳本 scripts/research/lambda_chain.py：Elo 差注入 λ（κ 掃描）＋ ρ 隨強度衰減（ψ）＋聯賽自己嘅 μ，五大聯賽 46,855 場、評分季 ≥ 2021（8,603 場）
- [x] 首輪結果：κ > 0 令 RPS／實際格 log-loss／ECE 三項全部變差（κ 0.15→RPS 0.2150、κ 0.60→0.2209，基準 0.2137）；1-1 眾數佔比由 58.7% 跌到 41.3%，即「格靚咗但機率差咗」——κ 唔准升指紋
- [x] 一刀一把掃描 research/cuts.py（基準 RPS 0.21356／格 LL 2.9835／ECE 0.04347）
  - [x] 1. 近十場對平均對手殘差 w=0.15/0.30/0.50 → RPS 0.2140／0.2149／0.2165，三閘不過
  - [x] 2. ρ 隨 λ 衰減 ψ=0.6/1.2/2.0 → RPS 0.2136 不動、格 LL 微退，只校準略好，不過
  - [x] 3. 逐聯賽 μ → RPS 0.21369、ECE 0.0445（升），不過
  - [x] 4. 主客分拆攻防 → RPS 0.21032／格 LL 2.9618／ECE 0.01239，**三閘齊過**（1-1 眾數 50% → 76%）
  - [x] 5. 時間衰減 ξ=0.05/0.12/0.25 → RPS 0.2139／0.2147／0.2172，不過
  - [x] 疊加測試：刀4＋ρ(λ)／＋μ／＋殘差／＋ξ 四組各有一項輸單獨刀4 → 唔疊
- [ ] 升指紋前置：把刀 4 移植入生產 S3／S5，逐季 walk-forward 對正生產閘門（RPS 0.2083／LL 1.0154／ECE 0.0065）；未移植前凍結預測一分不改
- [ ] LGB 改估兩個 λ（Poisson 損失）再砌格；1X2 集成保留
- [ ] 肥尾（負二項／雙變量泊松）、陣容、真 xG：未授權或未過閘唔入凍結
- [ ] 刻意唔做：單格命中訓練、κ 再掃、球員百科、賠率入模、為齊隊徽盜圖

### S21 公開對帳對照表（等第一批綠燈完場）
- [ ] 現況 2026-09-14：凍結帳 190 場、settled 0、green null，未有完場數字
- [ ] 一兩週綠燈完場後出對照表：同一批已鎖預測 vs 公開站，逐場記錄 1X2、波膽格、RPS
- [ ] 抽 5 場核對頁面／凍結列／指紋一致，結算只補賽果欄



### S20 隊徽覆蓋率
- [x] 盤點：15 個聯賽 284 隊，原本 268 隊無徽（次級聯賽完全未接源）
- [x] 加第二順位源 API-Football（授權帳戶；免費層只到 2024 賽季，當季查唔到會退返 2024，隊徽 URL 長期穩定）＋隊名別名表／三字代號對照／整段名稱包含兜底
- [x] 實測結果：五大聯賽、荷甲、葡超 100% 有徽；仍缺 51 隊集中喺德乙／意乙／西乙／法乙／比甲／土超／希超（免費層無當季名單，升班隊對唔上），照樣出派生盾形標
- [ ] 次級聯賽補徽：等付費層或另一授權源，先唔盜鏈
- [ ] 研究腳本同結果暫存喺網站倉 research/（推 tianxi-football-database 被封，下次同步）

### S22 球隊資料頁＋五大聯賽積分榜（產品線，指紋唔變）
- [x] /api/public/football-league?div=：由已落地賽果 CSV 即場派生積分榜、天喜足球ELO（自建、賽前 as-of、跨季回歸 25%、主場 +60）、主客攻防分拆、逐隊近況；唔讀 CSV 賠率欄，唔動凍結軌
- [x] /football/standings 五大聯賽積分榜：積分表加一欄自建 Elo（ClubElo 只對帳，唔上榜）＋主客攻防分拆表；撳隊名入球隊頁
- [x] /football/team/$div/$slug 球隊資料頁：天喜分走勢、本季概況、主客攻防、近況、逐場凍結預測 vs 賽果（只讀凍結帳，賽後只補賽果欄；眾數命中只作展示）
- [ ] 中文隊名對照（跟 HKJC 官方譯名）待名單凍結先落，暫用原文隊名
- [ ] 球員頁、球會百科、LGB 排行榜：繼續擱

### S23 主客分拆攻防生產移植（唯一改模型嘅一條）
- [ ] 只移植攻防參數：每隊主攻／主守／客攻／客守（或等價編碼）入生產 dc_s3.py／ens_s5.py；唔夾帶殘差、ξ、分聯賽 μ、κ、ρ 衰減
- [ ] 生產凍結協議驗收：逐季 walk-forward（測試季賽果唔入擬合）、對照現行生產軌（唔用研究基準 0.2136）、五大同全樣本分開報
- [ ] 三項齊過（RPS↓／實際格 log-loss↓／ECE ≤ 基準）先換指紋；任何一季或全樣本有一項輸返即停、留舊軌。今日唔改凍結
- [ ] 波膽同 1X2 仍由同一張格出；綠燈規則不變，升班／熱身不足仍然紅
- [ ] 唔用未結算場倒過來驗移植

### S24 倉庫分家
- [ ] research/ 同凍結檔分家（權限／目錄分開），避免兩套數

### S25 research_only 試驗規格（波膽聚中／和局／場次 Δλ）
- [x] docs/football-research-spec-s25.md：凍結參數清單、禁止列（已否決六刀）、統一三閘＋副閘、試驗序、場次 Δλ 三層、紅燈退回基準、資料層前置
- [x] 試驗 1 DIBP 對角膨脹（p 聯賽級常數，D 只蓋 0–2 球和）：λ 層鎖死（主客分拆已否決、維持 global atk/dfn），生產基準 RPS 0.20524／格LL 2.9456／ECE 0.01095／OU LL 0.68787／對角 0.2482 對實際和 0.2535；全局 p 0.01–0.12 同逐聯賽展開窗 p 全部主閘唔過（p=0.01 已 RPS 0.20527、ECE 0.01386，逐季亦輸），裁決停、唔升指紋。結果 data/research/s25/dibp_result.json、腳本 scripts/research/dibp_s25.py、本地 research/dibp_s25.py
- [x] 試驗 2 雙變量 Poisson 共享衝擊 λ₃（λ₁=λ_H−λ₃、λ₂=λ_A−λ₃，邊際期望不變，只加正相關；全局／逐聯賽常數，唔逐場）：生產基準 RPS 0.20525／格LL 2.9455／ECE 0.01097／OU LL 0.68781。λ₃ 0.01–0.15 加 DC 修正全部主閘唔過（格LL、ECE 齊退，λ₃≥0.06 逐季亦輸）；純 BP（rho=0）λ₃=0.15 RPS 0.20516、ECE 0.00944、OU 0.68724 較好，但格 log-loss 退到 2.9509、2021 季輸返，主閘唔齊。裁決停、唔升指紋。結果 data/research/s25/bp_result.json、腳本 scripts/research/bp_s25.py、本地 research/bp_s25.py
- [x] 試驗 3 邊際換 CMP／負二項（先唔加相關）：生產基準 RPS 0.20525／格LL 2.9455／ECE 0.01097／OU LL 0.68781／0-0 0.0717／高分格(≥6球) 0.0764。肥尾方向全線輸——負二項 r=2→64 全部主閘 0/3（r=2 格LL 3.0585、ECE 0.03164、0-0 膨到 0.1376、1-1 眾數歸零），CMP ν<1 同樣輸。收窄方向 ν≥1.02 三主閘齊過但 OU 2.5 校準開始漂（ν=1.03 OU 0.68806）；細掃 ν=1.01 主閘 3/3 副閘 3/3 逐季全過，但幅度係雜訊級（RPS −0.00001、ECE −0.00008、格LL 持平），唔值得升指紋。裁決停、留舊軌。結果 data/research/s25/cmp_result.json、腳本 scripts/research/cmp_s25.py、本地 research/cmp_s25.py
- [x] 試驗 4 DIBP on BP（次序：獨立泊松 → BP λ₃ → DC rho → 對角膨脹 p，λ₃／p 皆常數）：生產基準 RPS 0.20525／格LL 2.9455／ECE 0.01097／OU 0.68781／對角 0.2482 對實際和 0.2535。12 個 λ₃×p 組合＋1 個逐聯賽組合全部唔過，且十三個組合逐季都輸返。最好者純 BP λ₃=0.15 + p=0.005（RPS 0.20517、ECE 0.01080、OU 0.68724）格LL 仍退到 2.9507，主閘 2/3；p↑ 對角吹過實際和局率（0.2802）、和眾數升到 87%，試驗 1「齊唱和」失敗樣重現。裁決停、唔升指紋，聯合分佈層（試驗 1–4）收工。結果 data/research/s25/dibp_on_bp_result.json、腳本 scripts/research/dibp_on_bp_s25.py、本地 research/dibp_on_bp_s25.py
- [x] 產品微調還原：取消波膽大字跟 1X2 傾向分區，回復全矩陣最可能一格；凍結矩陣、對帳、訓練不變（2026-09-15）
- [x] 試驗 5 動態攻防（攻守兩條獨立隨機遊走、各自精度）：粗掃 24 組合（tau0=5/10/25、q=0/0.0001/0.0005/0.001、obs_scale=0.5/1.0）全部唔過閘，最好 RPS 0.20551（輸基準 0.20524）、格LL 2.9396（稍贏）、ECE 1.309%（輸基準 1.099%），主閘 1/3，逐季輸返。q=0 時精度只增不減、係數凍結，和眾數 99.9–100%；q 稍大則過擬合。裁決停、唔升指紋。S25 五把試驗全部唔過，模型線暫停，轉產品線等賽果對帳。結果 data/research/s25/dynamic_ad_result.json、腳本 scripts/research/dynamic_ad_s25.py、本地 research/dynamic_ad_s25.py
- [x] 產品文案：凍結卡波膽大字下加註「最可能比分 ≠ 勝方，頂格通常 10–20%，係最不意外嘅比分」（回應用戶提問，唔涉模型）
- [ ] 場次 Δλ 倉：δ_名單（官方名單公布先寫）、δ_密度、Δλ_市場（只做殘差診斷）；缺資料一律 Δλ = 0 退回基準
- [ ] 球員層資料前置：分鐘、賽前 projected xG、撲救、公布名單時間戳；未齊唔碰凍結
- [ ] 禁止列不變：殘差、ρ(λ)、逐聯賽 μ、ξ、κ、Rue–Salvesen γ、疊加、單格命中訓練、賠率入模

### S35 每日採集停更修正（2026-09-16）
- [x] 症狀：站上賽程停留 9-14 23:53 批（190 場），9-15 之後場次全失
- [x] 真因：scripts/log_predictions.py late_ingest 判斷內重複 `from datetime import datetime` → 函式內 datetime 變局部變數 → 第 59 行 UnboundLocalError；該步 fail 令「入倉」step 唔跑，抓到嘅賽程／賽果／凍結預測從未 commit（9-15 四次 run 全同一死法）
- [x] 修正：刪局部 import，推資料倉庫並手動重跑 football daily ingest → success，upcoming.json 已更新
- [x] ClubElo 502 非主因（continue-on-error，符合對帳層唔擋凍結規則）
- [x] 上游 fixtures.csv 只滾動未來約一週（現時 30 場：9-15/16/17），未開賽 10 場係真數，週末五大場次等上游放出
- [ ] 待辦：加 watchdog——若 upcoming.json last_success 超過 12 小時就開 issue（今日未做）
- [x] 凍結預測、鎖定政策、版本指紋一分未動

### S36 球員資料層（2026-09-16，只開資料層）
- [x] 源探測：API-SPORTS 免費層 /players/squads 當季名單＋官方相片連結可讀（實測 63 名球員全有 photo）；/injuries 只包 2022–2024；當季 fixtures／lineups 唔包。apifootball.com 當季 get_events 帶 lineup 物件，但冇公布時間戳
- [x] data/context/ schema_version 2：新增 players.jsonl、injuries.jsonl（只附加、永不 UPDATE、缺資料＝missing）
- [x] 相片只存連結，唔重新託管；photo_license 未確認＝唔准上前台；無授權站（Forza 一類）唔抓唔直連
- [x] 當季名單時間戳：ingest_lineups.py --source current 走 apifootball，只記 lineup_observed_ts（首次見到齊 11 人，保守上界），未公布寫 missing 繼續輪詢
- [x] 合格閘：as_of／observed_ts 要早過開賽前 60 分鐘，否則 late／missing → Δλ=0 退回基準、紅燈可查唔入戰績
- [x] 當季傷停免費層拿唔到 → missing 佔位，唔准用上季／平均／上仗頂替
- [x] 配額紀律：每日滾動 ≤20 隊（100 請求／日上限），五大 96 隊約五日一輪
- [ ] 未做：δ_名單／δ_密度估計、LGB 兩個 Poisson λ、球員前台頁、穩定分鐘與門將撲救採集器
- [x] 凍結預測、每日凍結流程、版本指紋一分未動

### S37 對外只報主／和／客（2026-09-16）
- [x] 產品口徑：卡面、逐場對帳、球隊頁一律只報三格（P_H／P_D／P_A ＝ 同一張凍結矩陣加總），預測字改用 argmax(P_H,P_D,P_A)，唔再用比分眾數
- [x] 波膽收入摺疊區只作診斷；唔另訓 1X2 分類器（避免同舊頁、舊凍結分叉）
- [x] 舊 5% 近盤判和展示閘（leanSide）唔再用喺卡面
- [x] S26 研究量表：|P_H−P_A| < 0.03／0.05／0.08／0.12 分桶，量實際和局率對實際主勝率、對平均 P_D、對 argmax 命中率（已鎖凍結帳 190 場）
- [x] 裁決：三閘全部唔過（gap<0.05：實際和 25.0% 對主勝 40.0%、平均 P_D 26.9%、argmax 命中 35.0% 對硬出和 25.0%）→ 「近盤出和」唔入產品、唔改指紋
- [ ] 樣本累積到 ≥200 場近盤場再重量一次；τ 規則未過閘前永不寫入凍結
- [x] 凍結矩陣、對帳、訓練、指紋一分未動

### S26b 和局預測回測（2026-09-16）
- [x] 五大聯賽 46,903 場、評分季 ≥2021 共 8,649 場，λ 層鎖死＝現行生產軌
- [x] 第一層（只改標籤）：argmax 51.47%；主客距離閘、和局加權、弱勢閘全部跌命中率（最多跌到 39.7%），和局精確率 27.9–29.3% ≈ 基礎率 25.4%（冇識別力）
- [x] 第二層（改機率，和局對數機率平移 δ）：δ 0.05–0.60 主閘全數唔過（RPS 0.20525→0.21009、ECE 1.08%→2.66%），逐季亦輸返
- [x] 診斷：P_D 已校準（平均 24.82% 對實際 25.39%、ECE 1.08%）；最高 P_D 一成場次實際仍主勝 39.0% > 和 26.8% → 和局無法成為正確眾數
- [x] 裁決：維持 argmax，唔加出和規則、唔平移機率、唔升指紋
- [ ] 唯一准許展示做法（待決定要唔要落）：|P_H−P_A| < 0.08 加「三揀接近 · 和局機率偏高」標籤，唔改預測字
- [ ] 要令和局有識別力只可加新資訊（名單／密度／projected xG）落 Δλ 條件層再過三主閘

## S38 第二層推薦結算（2026-09-16）
- [x] 分層：第一層只出凍結矩陣加總三格（對 RPS，一分不動）；第二層只出一句結算，唔改三格／λ／矩陣／指紋，盤＝0
- [x] 決策互斥三類：一面倒 max(P_H,P_A)≥τ → 強隊 −1；近盤 |P_H−P_A|≤δ → 弱隊 +1；其餘 → 較高嗰邊直勝（唔出和，卡上寫明）
- [x] τ／δ 由凍結 walk-forward 揀（46,709 場、評分季 ≥2021 共 8,464 場，掃 τ∈{.60,.65,.70,.75}×δ∈{.05,.07,.10}）：τ=0.60、δ=0.10 寫死，一季只准改一次
- [x] 主閘＝推薦堆校準（隱含贏率 vs 實際，≤2 點）：近盤 +1 過（0.61 點）、其餘過（2.1–2.4 點）、強隊 −1 唔過（4.25–9.83 點，逐季一致高估）
- [x] MINUS1_GATE_PASSED=false：一面倒場退回強隊直勝，−1 只作卡面旁註並寫出高估幅度
- [x] 產品：src/lib/footballSecondLayer.ts、賽前預測卡第二層卡、凍結帳卡結算行、對帳頁第二層獨立戰績欄（贏／走水／輸、隱含 vs 實際、三類覆蓋）
- [x] 戰績分兩欄：1X2 對三格、第二層對結算；−1／+1 贏唔當 1X2 中
- [ ] 累積綠燈已鎖完場樣本後重量一次 −1 校準；過 2 點閘才考慮開 MINUS1_GATE_PASSED（一季一次）

## S39 停賽自動偵測 ＋ 賽果入帳狀態（2026-09-21）
- [x] /api/public/meeting-cancellation：人手覆核檔 → 馬會公告關鍵字 → 賽日結構（排位表 0 場／0 匹，只查當日或過往）→ 正常賽日；上游失敗回正常賽日並標 source=unknown（守舊唔誤報）
- [x] 人手覆核檔位置 tianxi-database data/meeting-status/YYYY-MM-DD.json（2026-09-19 已存檔並實測命中）
- [x] useMeetingCancellation 成為全站唯一停賽真相（60 秒 stale／5 分鐘重抓）；硬編碼名單降為離線 fallback
- [x] 通告分兩級：已確認停賽（紅）／疑似停賽（黃，待官方確認）；兩者一律不生成、不鎖定、不入戰績
- [x] 足球對帳加第四狀態「待賽果入帳」（開賽逾 3 小時未 join 賽果）：寫明上游賽果檔未更新、賽果一到自動結算、凍結預測唔補算
- [ ] 後端 tianxi-backend：CANCELLED_MEETING_DATES 改讀 meeting_status（append-only），每 5 分鐘鎖點檢查同一條 cron 命中即跳過 writePredictionLog
- [ ] 上游 90 分鐘賽果檔（football-data.co.uk）更新後核對 09-18～09-20 共 198 場自動入帳

## 2026-09-22 解釋層第一刀 + 抓取修復
- [x] tianxi-database 四個工作流修好瀏覽器／驅動版本不配對（setup-chrome install-chromedriver），每日賽果流程重跑 success
- [x] /explain 全局分層覆蓋頁（349 場、平均 2.04／4、分層 + 兩頭殘差；<10 場標樣本太少）
- [x] /explain/:date 逐場拆解（凍結四揀 vs 實際頭 4 重疊，唯讀，唔改排名）
- [ ] 引擎倉 lgb_walkforward.py 加 TreeSHAP + explain_log（append-only、fail-closed），前端先顯示紅綠五因子
- [ ] 解釋層改接 GET /api/explain/global、GET /api/explain/meeting?date=（現讀倉內 JSON）

- [x] 2026-09-24 對齊收口：/explain 即場讀 hit-rate（頭條 358 場、平均 2.03／4、窗至 09-23；分層表／殘差寫死「只計至 09-16，349 場」，兩套數分開標）；/explain/2026-09-23 九場全出（只中 2,1,1,2,1,3,2,2,1、平均 1.67）；新增 /football/explain（綠燈 28 場、首選 71.4%、頭八格 50%、RPS 0.2081、ECE 0.1547）；正式站 tianxi.racing 瀏覽器等 hydration 核對，三條路由同預覽一致。預測指紋不變。
- [x] 2026-09-24 賽季橫額改讀 /api/season（tianxi-site assets/engine-health.js，commit c78cd22）：賽季標籤優先取 API 嘅 status／lastMeeting／nextMeeting／label，in_season 唔出「休季中」、off_season 先出休季句；API 失敗先 overlay 靜態 engine/health.json，唔會因靜態檔滯後成頁當休季；純讀取唔寫唔快取做凍結帳；同段修正渲染函數名筆誤 ess→esc。預測卡／凍結四揀／鎖定／指紋／解釋入口無改。
- [x] 收料層（tianxi-database）：賽果抓取跳過條件改場號集合（CSV 已排位場號 == 馬會實際場號兼連續 1..N，每場至少有完賽名次），停用行數／連結數門檻；09-23 補齊 9 場 109 名次
- [x] 命中率自動重算（tianxi-backend）：已評場數 < 有完整頭 4 場數、或賽果新過 hit-rate generatedAt 即重算；GET 讀取同 cron 都做檢查；只重算對帳，凍結四揀不動；賽果未齊唔評（fail-closed），手動重跑降級後備
- [x] 引擎倉季節旗 lastMeeting 滯後：靜態檔已改 2026-09-23／in_season，橫額以 /api/season 為準（用戶倉側完成）
- [x] 2026-09-24 足球 S5.1 TreeSHAP 真數（研究倉 tianxi-football-research data/research/s39/lgb_shap.json，commit f91e60d）：沙盒用資料倉 FeatureEngine 重放 198,288 場（177,207 場暖身後），取最新 4,000 場計 TreeSHAP；status=ok、指紋 378c283b73a7-bb35e29b0c7b-175995 對上、54 特徵、applied_to_freeze=false；gain 頭五 dc_pa／elo_exp／elo_diff／lam_diff／seen_a；per_class（主=Elo 系、客=dc_pa、和=dc_pd 幅細，同 S26b「LGB 分唔出和」一致）＋ per_league（五大頭三幾乎同一套，德甲窗追溯到 2021-10 較早、唔當可直接比）已加。研究擴充閘過；產品 overlay 閘未過——無逐場 local 因子包、只解釋 LGB 65% 軌、Elo／DC 共線未拆，前端紅綠因子唔上。沙盒計算路徑代替 GHA（GITHUB_API_KEY 係 connector key，Actions 用唔到）；lgb_shap_compute.py 三分類 SHAP 維度 bug 已修（commit 1645560）。
- [ ] 賽馬 SHAP：等鎖點 booster（未到手前全面停）
