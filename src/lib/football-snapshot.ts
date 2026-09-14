/**
 * 天喜足球 S5 凍結快照（2026-09-13）
 * 來源：tianxi-football-database `snapshots/ens_s5.json`（腳本 scripts/ens_s5.py）
 * 三軌集成＋校準，賠率零權重（market_beta = 0）。時序前推，測試季賽果從未參與擬合。
 * 呢份數字凍結，只增不改。
 */

export const FB_SNAPSHOT_DATE = "2026-09-13";
export const FB_TOTAL_MATCHES = 149890;
export const FB_SPAN = "2012 → 2026";

export type FbTrack = {
  key: string;
  name: string;
  note: string;
  rps: number;
  logloss: number;
  acc: number;
  drawRecall: number;
  live: boolean;
};

export const FB_TRACKS: FbTrack[] = [
  {
    key: "ens",
    name: "S5 三軌集成＋校準",
    note: "現行採用",
    rps: 0.2098,
    logloss: 1.0203,
    acc: 0.4904,
    drawRecall: 0.0029,
    live: true,
  },
  { key: "lgb", name: "S4 天喜足球LGB", note: "54 項賽前特徵", rps: 0.2105, logloss: 1.0242, acc: 0.4866, drawRecall: 0.029, live: false },
  { key: "elo", name: "S2 天喜足球ELO", note: "主客獨立評分", rps: 0.2117, logloss: 1.0261, acc: 0.4861, drawRecall: 0.0, live: false },
  { key: "dc", name: "S3 入球模型 Dixon-Coles", note: "比分機率矩陣", rps: 0.2138, logloss: 1.0322, acc: 0.4839, drawRecall: 0.0002, live: false },
  { key: "freq", name: "歷史頻率（第一閘）", note: "及格線", rps: 0.2261, logloss: 1.0699, acc: 0.4452, drawRecall: 0, live: false },
  { key: "market", name: "市場賠率去水（僅對照）", note: "永不入模", rps: 0.2047, logloss: 1.0056, acc: 0.501, drawRecall: 0, live: false },
];

export type FbSeason = {
  season: number;
  n: number;
  alpha: [number, number, number]; // LGB / 入球模型 / Elo
  calib: "none" | "vector" | "isotonic";
  rps: number;
  logloss: number;
  acc: number;
  lgbRps: number;
};

export const FB_SEASONS: FbSeason[] = [
  { season: 2012, n: 7874, alpha: [0.7, 0.2, 0.1], calib: "none", rps: 0.2128, logloss: 1.034, acc: 0.4776, lgbRps: 0.2143 },
  { season: 2013, n: 10720, alpha: [0.45, 0.35, 0.2], calib: "none", rps: 0.2111, logloss: 1.0244, acc: 0.4914, lgbRps: 0.2129 },
  { season: 2014, n: 11280, alpha: [0.4, 0.25, 0.35], calib: "vector", rps: 0.2097, logloss: 1.0203, acc: 0.4936, lgbRps: 0.2109 },
  { season: 2015, n: 11484, alpha: [0.4, 0.15, 0.45], calib: "vector", rps: 0.2106, logloss: 1.0211, acc: 0.4884, lgbRps: 0.2113 },
  { season: 2016, n: 11670, alpha: [0.55, 0.1, 0.35], calib: "isotonic", rps: 0.2091, logloss: 1.0184, acc: 0.4962, lgbRps: 0.2097 },
  { season: 2017, n: 11683, alpha: [0.55, 0.1, 0.35], calib: "vector", rps: 0.2081, logloss: 1.0129, acc: 0.501, lgbRps: 0.2087 },
  { season: 2018, n: 11545, alpha: [0.6, 0.1, 0.3], calib: "none", rps: 0.2082, logloss: 1.0098, acc: 0.4956, lgbRps: 0.2088 },
  { season: 2019, n: 9271, alpha: [0.6, 0.15, 0.25], calib: "vector", rps: 0.2097, logloss: 1.0227, acc: 0.486, lgbRps: 0.2104 },
  { season: 2020, n: 12084, alpha: [0.65, 0.2, 0.15], calib: "none", rps: 0.2133, logloss: 1.0322, acc: 0.4753, lgbRps: 0.2144 },
  { season: 2021, n: 12121, alpha: [0.55, 0.4, 0.05], calib: "none", rps: 0.2099, logloss: 1.0218, acc: 0.4908, lgbRps: 0.2099 },
  { season: 2022, n: 11915, alpha: [0.6, 0.3, 0.1], calib: "none", rps: 0.2083, logloss: 1.0139, acc: 0.4996, lgbRps: 0.2086 },
  { season: 2023, n: 11660, alpha: [0.65, 0.05, 0.3], calib: "vector", rps: 0.2092, logloss: 1.0193, acc: 0.4861, lgbRps: 0.2095 },
  { season: 2024, n: 8510, alpha: [0.65, 0.05, 0.3], calib: "none", rps: 0.2089, logloss: 1.0181, acc: 0.4946, lgbRps: 0.2093 },
  { season: 2025, n: 7442, alpha: [0.65, 0.1, 0.25], calib: "vector", rps: 0.2087, logloss: 1.0182, acc: 0.484, lgbRps: 0.2094 },
  { season: 2026, n: 631, alpha: [0.65, 0.05, 0.3], calib: "none", rps: 0.2123, logloss: 1.0254, acc: 0.4739, lgbRps: 0.2125 },
];

export type FbBin = { bin: string; n: number; pred: number; act: number };

/** 首選機率分區可靠度（校準後，ECE 0.30%） */
export const FB_CALIBRATION: FbBin[] = [
  { bin: "30–40%", n: 30946, pred: 0.3774, act: 0.3795 },
  { bin: "40–50%", n: 65073, pred: 0.4465, act: 0.4479 },
  { bin: "50–60%", n: 33674, pred: 0.542, act: 0.5476 },
  { bin: "60–70%", n: 11953, pred: 0.6424, act: 0.6448 },
  { bin: "70–80%", n: 5703, pred: 0.7452, act: 0.7571 },
  { bin: "80–90%", n: 2366, pred: 0.839, act: 0.8407 },
  { bin: "90–100%", n: 175, pred: 0.922, act: 0.9086 },
];

export const FB_ECE_CALIBRATED = 0.003;
export const FB_ECE_RAW = 0.0055;

/** 和局機率分區可靠度 —— S5 起呢個係和局嘅主指標（取代召回率） */
export const FB_DRAW_RELIABILITY: FbBin[] = [
  { bin: "5–10%", n: 900, pred: 0.0828, act: 0.1089 },
  { bin: "10–15%", n: 3174, pred: 0.1283, act: 0.1295 },
  { bin: "15–20%", n: 7758, pred: 0.1789, act: 0.1775 },
  { bin: "20–25%", n: 29081, pred: 0.2322, act: 0.2373 },
  { bin: "25–30%", n: 94470, pred: 0.2751, act: 0.2762 },
  { bin: "30–35%", n: 13903, pred: 0.3143, act: 0.3017 },
  { bin: "35–40%", n: 541, pred: 0.363, act: 0.2717 },
];

/** S7 價值注盈虧回測（2026-09-13 凍結）——賠率只在回測嘅價值判定出現，永不入模 */
export type FbValueRun = {
  key: string;
  name: string;
  note: string;
  bets: number;
  hit: number;
  avgOdds: number;
  yieldPct: number;
};

export const FB_VALUE_RUNS: FbValueRun[] = [
  { key: "best00", name: "全市場最佳價 · 門檻 0%", note: "有優勢就落注", bets: 214096, hit: 0.2896, avgOdds: 4.314, yieldPct: -2.24 },
  { key: "best02", name: "全市場最佳價 · 門檻 2%", note: "", bets: 189956, hit: 0.2829, avgOdds: 4.44, yieldPct: -2.36 },
  { key: "best05", name: "全市場最佳價 · 門檻 5%", note: "主方案", bets: 158186, hit: 0.2724, avgOdds: 4.649, yieldPct: -2.5 },
  { key: "best10", name: "全市場最佳價 · 門檻 10%", note: "", bets: 117257, hit: 0.2537, avgOdds: 5.047, yieldPct: -2.85 },
  { key: "b365_00", name: "單一莊家 · 門檻 0%", note: "冇比價", bets: 151865, hit: 0.2818, avgOdds: 4.072, yieldPct: -8.85 },
  { key: "b365_05", name: "單一莊家 · 門檻 5%", note: "冇比價", bets: 107746, hit: 0.2618, avgOdds: 4.389, yieldPct: -9.9 },
  { key: "draw05", name: "只買和局 · 門檻 5%", note: "機率封頂 30%", bets: 31793, hit: 0.2138, avgOdds: 4.833, yieldPct: -3.54 },
  { key: "draw10", name: "只買和局 · 門檻 10%", note: "機率封頂 30%", bets: 19347, hit: 0.1977, avgOdds: 5.276, yieldPct: -3.47 },
];

export const FB_VALUE_SEASONS: { season: number; yieldPct: number }[] = [
  { season: 2012, yieldPct: -1.23 },
  { season: 2013, yieldPct: -2.06 },
  { season: 2014, yieldPct: -1.13 },
  { season: 2015, yieldPct: -2.02 },
  { season: 2016, yieldPct: -1.93 },
  { season: 2017, yieldPct: 0.02 },
  { season: 2018, yieldPct: -2.82 },
  { season: 2019, yieldPct: 0.29 },
  { season: 2020, yieldPct: -1.31 },
  { season: 2021, yieldPct: -2.95 },
  { season: 2022, yieldPct: -4.83 },
  { season: 2023, yieldPct: -2.45 },
  { season: 2024, yieldPct: -6.18 },
  { season: 2025, yieldPct: -10.04 },
  { season: 2026, yieldPct: -3.61 },
];

export const FB_VALUE_KELLY = { bets: 158186, capPct: 2, finalBank: 0, startBank: 1000, maxDd: -1505.8 };

/**
 * S8 五大聯賽實力模型（2026-09-14 凍結）
 * Dixon-Coles 攻守係數＋主場優勢＋低比分修正，時間半衰期 180 日，
 * 每兩星期滾動重訓，只用開賽前已完成場次。
 * 波膽層正式採用「實力重加權」變體：比分矩陣按集成主／和／客機率分區縮放。
 */
export const FB_STRENGTH = {
  frozen: "2026-09-14",
  leagues: "英超 · 德甲 · 西甲 · 意甲 · 法甲",
  span: "2020/21 → 2026",
  matches: 11051,
  backtested: 8942,
  halfLifeDays: 180,
  retrainDays: 14,
  variants: [
    { key: "raw", name: "純入球實力模型", scoreHit: 0.1237, acc: 0.5215, rps: 0.2025, live: false },
    { key: "reweighted", name: "實力重加權（採用）", scoreHit: 0.1264, acc: 0.5266, rps: 0.2004, live: true },
  ],
  bigGoalsPred: 0.307,
  bigGoalsAct: 0.312,
  drawConcentration: { before: 0.51, after: 0.54 },
} as const;

/**
 * S9 xG 併入實力模型：可行性驗證（2026-09-14）
 * 只作方法論驗證，資料樣本用完即棄、唔會排程、唔入倉（來源 robots.txt 全站禁爬）。
 * 合規落地要等已授權 xG 供應（FootyStats API／TheSports／Opta）。
 */
export const FB_XG = {
  frozen: "2026-09-14",
  status: "validated-not-live",
  leagues: "英超 · 德甲 · 西甲 · 意甲 · 法甲",
  span: "2018/19 → 2026",
  matches: 14285,
  backtested: 10684,
  bestWeight: { goals: 0.35, xg: 0.65 },
  variants: [
    { key: "goals", name: "現行：只用實際入球", scoreHit: 0.1255, acc: 0.5185, rps: 0.2029, live: true },
    { key: "xgblend", name: "入球 × xG 混合（待授權）", scoreHit: 0.1261, acc: 0.5257, rps: 0.2003, live: false },
  ],
  marketLine: 0.2047,
} as const;

/** 賽前陣容／傷停／xG 數據源決策（2026-09-14） */
export const FB_SOURCES = [
  {
    item: "逐場 xG",
    source: "FootyStats 擱置（免費帳戶 0 聯賽配額）；bigballsdata 逐場 statistics 免費層 403",
    status: "待接入" as const,
    note: "FootyStats 揀聯賽要付費訂閱先解鎖，已擱置；bigballsdata 逐場 xG 屬付費端點。免費源之中唯一逐場齊全嘅站點 robots.txt 全站禁爬，已排除",
  },
  {
    item: "球員季累積 xG",
    source: "bigballsdata API（xg-leaders 端點，免費層已驗通）",
    status: "待接入" as const,
    note: "2026-09-14 逐端點實測：/v1/leagues/{id}/xg-leaders 免費層 200 且含真 xG 值，可聚合落球隊做實力特徵；唔係逐場，但可以逐輪拉取差分化",
  },
  {
    item: "賽前先發陣容",
    source: "APIfootball v3（apiv3.apifootball.com，已驗證連通）＋ bigballsdata stored lineups（免費層 200，備援）",
    status: "待接入" as const,
    note: "APIfootball 金鑰已驗通，覆蓋 1,019 個聯賽（五大齊）；完成賽事實測有齊正選 11 人、後備、教練；未開賽場次陣容一般開賽前約一個鐘先公布，未公布一律黃燈",
  },
  {
    item: "傷停名單",
    source: "bigballsdata injuries 端點（免費層已驗通 200）＋ APIfootball missing_players（待觀察）",
    status: "待接入" as const,
    note: "bigballsdata /v1/injuries 免費層 200，取代原先只靠 APIfootball 嘅方案；APIfootball 欄位實測為空，降為備援；缺資料即以「可用陣容比率 = 1」保守處理",
  },
  {
    item: "賽後技術統計",
    source: "APIfootball v3（每場 statistics 欄）＋ bigballsdata stored stats（免費層 200，備援）",
    status: "待接入" as const,
    note: "射門、中目標、角球、犯規、黃牌、控球、攻勢逐場齊全，正好做節奏層（S10）嘅每日實數來源，唔使再靠歷史快照",
  },
  {
    item: "外部實力對帳尺",
    source: "ClubElo 官方免 key CSV API（api.clubelo.com，1 req/s，2026-09-14 接入）",
    status: "已接入" as const,
    note: "只做對帳，唔入模、唔入凍結預測：每日全日表落 bronze 快照，再按開賽日 as-of 同自建 Elo 逐場比對（聯賽內 z-score，唔直接減 1500）。對唔上名或上游掛就寫 NULL、當日對帳 skip，唔填 0 唔用均值頂；覆蓋率、水平、方向、突變四條線超標即開告警",
  },
] as const;

/**
 * S10 賽事節奏層：Elo 分差 vs 滾動平均（2026-09-14 凍結）
 * 起因：外部帖文聲稱「Elo 分差係比賽行為統計嘅最強預測因子」。
 * 我哋用自建 Elo（逐場迭代、跨季 25% 回歸、只用賽前賽果）喺五大聯賽
 * 40,646 場（2000-08-11 → 2026-09-03）重做驗證，逐項出斯皮爾曼相關度。
 * 結論：射門／角球 —— Elo 分差壓倒滾動平均；犯規／牌數 —— 相關為負，
 * 滾動平均（球隊風格）才係主特徵。所以兩組盤口用唔同特徵組合。
 */
export type FbTempoStat = {
  key: string;
  name: string;
  n: number;
  mean: number;
  rhoElo: number;
  rhoOwnRoll: number;
  rhoOppConceded: number;
  driver: "elo" | "style";
  buckets: { label: string; n: number; mean: number }[];
};

export const FB_TEMPO = {
  frozen: "2026-09-14",
  leagues: "英超 · 德甲 · 西甲 · 意甲 · 法甲",
  span: "2000-08-11 → 2026-09-03",
  matches: 40646,
  eloK: 20,
  homeAdvantage: 60,
  seasonRegress: 0.25,
  stats: [
    {
      key: "shots",
      name: "射門",
      n: 79672,
      mean: 12.4,
      rhoElo: 0.4302,
      rhoOwnRoll: 0.2997,
      rhoOppConceded: 0.3051,
      driver: "elo",
      buckets: [
        { label: "< −200（弱很多）", n: 3712, mean: 8.45 },
        { label: "−200 至 −100", n: 11744, mean: 9.87 },
        { label: "−100 至 0", n: 24380, mean: 11.22 },
        { label: "0 至 +100", n: 24380, mean: 13.21 },
        { label: "+100 至 +200", n: 11744, mean: 15.2 },
        { label: "> +200（強很多）", n: 3712, mean: 17.84 },
      ],
    },
    {
      key: "corners",
      name: "角球",
      n: 78916,
      mean: 5.06,
      rhoElo: 0.3111,
      rhoOwnRoll: 0.1554,
      rhoOppConceded: 0.1711,
      driver: "elo",
      buckets: [
        { label: "< −200（弱很多）", n: 3710, mean: 3.38 },
        { label: "−200 至 −100", n: 11668, mean: 3.99 },
        { label: "−100 至 0", n: 24080, mean: 4.59 },
        { label: "0 至 +100", n: 24080, mean: 5.45 },
        { label: "+100 至 +200", n: 11668, mean: 6.14 },
        { label: "> +200（強很多）", n: 3710, mean: 7.22 },
      ],
    },
    {
      key: "fouls",
      name: "犯規",
      n: 78158,
      mean: 13.78,
      rhoElo: -0.0973,
      rhoOwnRoll: 0.4976,
      rhoOppConceded: 0.4784,
      driver: "style",
      buckets: [
        { label: "< −200（弱很多）", n: 3701, mean: 12.61 },
        { label: "−200 至 −100", n: 11586, mean: 14.14 },
        { label: "−100 至 0", n: 23792, mean: 14.45 },
        { label: "0 至 +100", n: 23792, mean: 13.99 },
        { label: "+100 至 +200", n: 11586, mean: 12.89 },
        { label: "> +200（強很多）", n: 3701, mean: 11.02 },
      ],
    },
    {
      key: "cards",
      name: "牌數（黃 1／紅 3）",
      n: 79670,
      mean: 2.32,
      rhoElo: -0.1496,
      rhoOwnRoll: 0.2045,
      rhoOppConceded: 0.2067,
      driver: "style",
      buckets: [
        { label: "< −200（弱很多）", n: 3712, mean: 2.31 },
        { label: "−200 至 −100", n: 11744, mean: 2.56 },
        { label: "−100 至 0", n: 24379, mean: 2.55 },
        { label: "0 至 +100", n: 24379, mean: 2.27 },
        { label: "+100 至 +200", n: 11744, mean: 1.93 },
        { label: "> +200（強很多）", n: 3712, mean: 1.53 },
      ],
    },
  ] satisfies FbTempoStat[],
  note: "球證傾向欄位（Referee）唔在現用歷史檔內，要由 datahub PDDL 五大聯賽 CSV 補入，才做得到完整犯規／牌數模型。",
} as const;

/**
 * 外部資料源審查（第二批，2026-09-14）
 * 逐個實測回應、robots.txt 立場、授權同實際覆蓋，然後定裁決。
 * 裁決三檔：主源（可排程）／核對（只作交叉驗證）／不採用。
 */
export type FbAudit = {
  name: string;
  kind: string;
  verdict: "主源" | "核對" | "不採用";
  reason: string;
};

export const FB_AUDIT: FbAudit[] = [
  {
    name: "hudl/open-data（原 StatsBomb 開放資料）",
    kind: "逐場事件級 · 含 xG 同首發陣容",
    verdict: "核對",
    reason: "xG 品質係業界黃金標準，適合驗證我哋自家 xG；但只覆蓋精選歷史賽季、唔係當季逐輪，授權屬自訂條款，商業用途要人手覆核",
  },
  {
    name: "the-odds-api.com",
    kind: "跨莊賠率聚合",
    verdict: "核對",
    reason: "只作對照線同價值判定（權重永遠零）。免費層每月 500 點且按盤口數扣點，歷史賠率要付費，未夠支撐逐日跨莊比價",
  },
  {
    name: "datahub.io 足球集",
    kind: "五大聯賽歷史 CSV",
    verdict: "核對",
    reason: "上游係 football-data.co.uk，含球證欄，正好補我哋現用歷史檔缺失嘅 Referee；但更新參差、只有聯賽無歐戰，唔做主源",
  },
  {
    name: "withqwerty/reep（CC0）",
    kind: "跨供應商實體 ID 對照表",
    verdict: "核對",
    reason: "63.8 萬個球員／球隊／教練 ID 跨 40 多個供應商互對，正好用嚟做名稱對照同多源合併時嘅實體對齊，非賽果資料",
  },
  {
    name: "sportsapipro.com",
    kind: "商業 API · 比分／陣容／賠率",
    verdict: "核對",
    reason: "免費層每日只有 100 次請求（全運動共用），且係 2025/26 新站未經長期驗證；先小量實測準確度才談升級",
  },
  {
    name: "sports.bzzoiro.com",
    kind: "商業 API · 比分／自家預測／賠率",
    verdict: "核對",
    reason: "robots.txt 聲明唔准用作 AI 訓練；本身帶自家預測同賠率欄，唔會拿嚟餵模型，只作對照",
  },
  {
    name: "statsultra.com",
    kind: "預測展示站",
    verdict: "不採用",
    reason: "有公開方法論（fbref/Opta 的 GxG 強度評分＋15,000 次蒙地卡羅模擬）但冇任何回測數字；robots.txt 明文封鎖 AI 爬蟲，只作人手一次查閱同排版參考",
  },
  {
    name: "worldfantasysoccer.com",
    kind: "夢幻足球遊戲平台",
    verdict: "不採用",
    reason: "係選人組隊遊戲，冇比賽級資料下載或接口，同預測引擎無關",
  },
  {
    name: "Kaggle soccer-players-statistics",
    kind: "球員能力值快照",
    verdict: "不採用",
    reason: "授權未標明，八年前一次性快照之後冇更新，內容係遊戲式能力值而唔係真實逐場統計",
  },
];

export const pct = (v: number, d = 2) => `${(v * 100).toFixed(d)}%`;
