/**
 * S38 第二層：推薦結算。
 *
 * 第一層永遠只出凍結矩陣 M 加總嘅三格 (P_H, P_D, P_A)，一分不動、對 RPS。
 * 第二層只出「一句結算」，唔改三格、唔改 λ、唔改矩陣、唔升指紋、盤口權重永遠 0。
 *
 * 決策（互斥，由上到下）：
 *   1 一面倒 max(P_H,P_A) ≥ τ        → 強隊 −1 勝
 *   2 近盤   |P_H−P_A| ≤ δ           → 弱隊 +1 勝
 *   3 其餘                            → 1X2 較高嗰邊勝（唔出和、唔出讓球）
 * P_D 唔出字，只參與 +1／−1 嘅加總同對帳。
 *
 * τ／δ 由凍結 walk-forward 揀（S38：五大聯賽 2021 季起 8,464 場，掃 τ∈{.60,.65,.70,.75}
 * × δ∈{.05,.07,.10}），主閘＝推薦堆嘅矩陣隱含贏率同實際贏率差距 ≤ 2 個百分點。
 * 結果：τ=0.60、δ=0.10 為最佳組合；第 2、3 格過閘（差距 0.6 同 2.4 點），
 * 第 1 格（強隊 −1）任何 τ 都高估 4.3–9.8 點、逐季一致高估 → 未過閘。
 * 所以 MINUS1_GATE_PASSED=false：一面倒場退回「強隊直勝」，−1 只作旁註觀察。
 * τ、δ 只准一季改一次，改前要重跑 walk-forward。
 */

export const SECOND_LAYER = {
  tau: 0.6,
  delta: 0.1,
  /** 強隊 −1 未過 2 個百分點校準閘 → 唔作推薦，只作旁註 */
  minus1GatePassed: false,
  gate: { calGapMax: 0.02, sample: 8464, evalFrom: 2021 },
} as const;

const MAXG = 8;

function pois(lam: number, k: number) {
  let f = 1;
  for (let i = 2; i <= k; i += 1) f *= i;
  return (Math.exp(-lam) * lam ** k) / f;
}

const resOf = (a: number, b: number) => (a > b ? 0 : a === b ? 1 : 2);

/**
 * 淨勝球分佈：同卡面波膽用同一張矩陣（λ 派生後按三格重新加權，
 * 令邊際等於凍結 1X2），再按 h−a 加總。唔另開公式。
 */
export function marginDist(lambda: [number, number], p: [number, number, number]) {
  const hp = Array.from({ length: MAXG + 1 }, (_, k) => pois(lambda[0], k));
  const ap = Array.from({ length: MAXG + 1 }, (_, k) => pois(lambda[1], k));
  const raw: [number, number, number] = [0, 0, 0];
  for (let a = 0; a <= MAXG; a += 1)
    for (let b = 0; b <= MAXG; b += 1) raw[resOf(a, b)] += (hp[a] ?? 0) * (ap[b] ?? 0);
  const w = raw.map((r, i) => (r > 1e-9 ? (p[i] ?? r) / r : 1)) as [number, number, number];
  const m = new Map<number, number>();
  let total = 0;
  for (let a = 0; a <= MAXG; a += 1)
    for (let b = 0; b <= MAXG; b += 1) {
      const pr = (hp[a] ?? 0) * (ap[b] ?? 0) * (w[resOf(a, b)] ?? 1);
      total += pr;
      m.set(a - b, (m.get(a - b) ?? 0) + pr);
    }
  if (total > 0) for (const [k, v] of m) m.set(k, v / total);
  return m;
}

export type Leg = { win: number; push: number; lose: number };

/** 讓球結算機率：line=−1 即該隊讓一球，line=+1 即受一球，line=0 即直勝（和局當輸）。 */
export function legProbs(margins: Map<number, number>, sideHome: boolean, line: number): Leg {
  let win = 0;
  let push = 0;
  let lose = 0;
  for (const [d, v] of margins) {
    const eff = (sideHome ? d : -d) + line;
    if (eff > 0) win += v;
    else if (eff === 0 && line !== 0) push += v;
    else lose += v;
  }
  return { win, push, lose };
}

/** 已完場結算判定：贏／走水／輸。 */
export function legOutcome(gh: number, ga: number, sideHome: boolean, line: number) {
  const eff = (sideHome ? gh - ga : ga - gh) + line;
  if (eff > 0) return "win" as const;
  if (eff === 0 && line !== 0) return "push" as const;
  return "lose" as const;
}

export type Recommendation = {
  bucket: 1 | 2 | 3;
  bucketZh: string;
  sideHome: boolean;
  line: -1 | 0 | 1;
  /** 推薦嗰句結算（隊名 + 讓球） */
  label: (home: string, away: string) => string;
  leg: Leg;
  gap: number;
  /** 一面倒場：−1 讓球嘅旁註（未過閘，唔作推薦） */
  minus1?: Leg;
};

export function recommend(lambda: [number, number], p: [number, number, number]): Recommendation {
  const m = marginDist(lambda, p);
  const ph = p[0] ?? 0;
  const pa = p[2] ?? 0;
  const gap = Math.abs(ph - pa);
  const strongHome = ph >= pa;
  const sideZh = (home: string, away: string, sh: boolean) => (sh ? home : away);

  if (Math.max(ph, pa) >= SECOND_LAYER.tau) {
    const minus1 = legProbs(m, strongHome, -1);
    if (SECOND_LAYER.minus1GatePassed) {
      return {
        bucket: 1,
        bucketZh: "一面倒",
        sideHome: strongHome,
        line: -1,
        label: (h, a) => `${sideZh(h, a, strongHome)} −1 勝`,
        leg: minus1,
        gap,
      };
    }
    return {
      bucket: 1,
      bucketZh: "一面倒（−1 未過閘 · 退回直勝）",
      sideHome: strongHome,
      line: 0,
      label: (h, a) => `${sideZh(h, a, strongHome)}勝`,
      leg: legProbs(m, strongHome, 0),
      gap,
      minus1,
    };
  }

  if (gap <= SECOND_LAYER.delta) {
    const weakHome = !strongHome;
    return {
      bucket: 2,
      bucketZh: "近盤",
      sideHome: weakHome,
      line: 1,
      label: (h, a) => `${sideZh(h, a, weakHome)} +1 勝`,
      leg: legProbs(m, weakHome, 1),
      gap,
    };
  }

  return {
    bucket: 3,
    bucketZh: "其餘",
    sideHome: strongHome,
    line: 0,
    label: (h, a) => `${sideZh(h, a, strongHome)}勝`,
    leg: legProbs(m, strongHome, 0),
    gap,
  };
}

export const OUTCOME_ZH = { win: "贏", push: "走水", lose: "輸" } as const;
