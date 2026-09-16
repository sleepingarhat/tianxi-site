/** 球隊頁共用類型同名稱代號：由已落地賽果派生，唔涉凍結預測軌。 */

export type LeagueTeam = {
  team: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  pts: number;
  elo: number;
  eloHome: number;
  eloAway: number;
  form: ("W" | "D" | "L")[];
  home: { played: number; gf: number; ga: number; pts: number };
  away: { played: number; gf: number; ga: number; pts: number };
  eloTrend: { date: string; elo: number }[];
  matches: {
    date: string;
    opp: string;
    venue: "H" | "A";
    gf: number;
    ga: number;
    res: "W" | "D" | "L";
    eloBefore: number;
    oppEloBefore: number;
  }[];
};

export type LeaguePayload = {
  ok: boolean;
  div: string;
  league_zh: string;
  season: number;
  elo_note: string;
  table: LeagueTeam[];
};

export const LEAGUE_ZH: Record<string, string> = {
  E0: "英超",
  D1: "德甲",
  SP1: "西甲",
  I1: "意甲",
  F1: "法甲",
};

/** 隊名 → 網址代號（穩定、可逆對照靠聯賽名單重新比對） */
export function teamSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 展示層傾向閘：主／客勝率差距細過 5 個百分點就判和（連波膽都跟和局格）。
 * 只影響卡面大字，唔改凍結矩陣、唔改對帳同訓練（一律全格）。
 */
export const LEAN_DRAW_GAP = 0.05;

export function leanSide(p: number[]): 0 | 1 | 2 {
  const h = p[0] ?? 0;
  const a = p[2] ?? 0;
  if (Math.abs(h - a) < LEAN_DRAW_GAP) return 1;
  return h >= a ? 0 : 2;
}

/**
 * 對外預測字＝凍結矩陣加總三格嘅 argmax，唔用比分眾數、唔用近盤判和規則。
 * 「主客接近就出和」仍屬研究軌（研究倉先量 |P_H−P_A| 分桶實際和局率），未過閘唔入產品。
 */
export function argmaxSide(p: number[]): 0 | 1 | 2 {
  const h = p[0] ?? 0;
  const d = p[1] ?? 0;
  const a = p[2] ?? 0;
  if (d >= h && d >= a) return 1;
  return h >= a ? 0 : 2;
}

export const SIDE_ZH_3 = ["主勝", "和局", "客勝"] as const;

/** 主客機率距離：研究軌用嚟分桶（0.03／0.05／0.08），產品側只作展示。 */
export function haGap(p: number[]) {
  return Math.abs((p[0] ?? 0) - (p[2] ?? 0));
}
