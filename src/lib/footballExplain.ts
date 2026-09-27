/**
 * E1 解釋／內容層：只讀凍結列填空，唔改 p／λ／矩陣／指紋／argmax／第二層規則。
 *
 * S26b：|P_H−P_A| < 0.08 准加「三擇接近」標籤；唔出和、唔平移機率、唔入對帳。
 * 第二層結算句由 footballSecondLayer.recommend 產出，本檔只組人話。
 */

import { argmaxSide } from "@/lib/footballTeams";
import {
  type Recommendation,
  recommend,
  legOutcome,
} from "@/lib/footballSecondLayer";

export const EXPLAIN = {
  closeGap: 0.08,
  closeDrawBand: "23–26%",
  disclaimer: "解釋句由凍結列加總，唔另開模型。",
} as const;

const RES_ZH = ["主勝", "和局", "客勝"] as const;
const pc = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`;

export type ExplainInput = {
  p?: number[] | null;
  lambda?: number[] | null;
  exp?: number[] | null;
  status?: string | null;
  lockedAt?: string | null;
  track?: string | null;
  inLedger?: boolean;
  result?: { ft_h: number; ft_a: number; ftr: string; rps?: number } | null;
};

export type ExplainCard = {
  predIdx: 0 | 1 | 2 | -1;
  headline: string;
  why: string;
  closeTag: string | null;
  caveat: string | null;
  settled: string | null;
  rec: Recommendation | null;
  legRes: "win" | "push" | "lose" | null;
};

export function explainMatch(input: ExplainInput): ExplainCard {
  const p = input.p ?? [];
  const predIdx = p.length === 3 ? argmaxSide(p) : -1;
  const lam = input.lambda ?? [];
  const rec =
    p.length === 3 && lam.length === 2
      ? recommend([lam[0]!, lam[1]!], [p[0]!, p[1]!, p[2]!])
      : null;
  const res = input.result ?? null;
  const legRes =
    rec && res ? legOutcome(res.ft_h, res.ft_a, rec.sideHome, rec.line) : null;

  const headline =
    predIdx >= 0
      ? `對外：${RES_ZH[predIdx]} ${pc(p[predIdx] ?? 0, 1)}`
      : "對外：三格未齊，唔出字";

  const bits: string[] = [];
  if (p.length === 3) {
    bits.push(`主客距離 ${pc(Math.abs((p[0] ?? 0) - (p[2] ?? 0)), 1)}`);
  }
  const exp = input.exp ?? input.lambda ?? [];
  if (exp.length === 2 && Number.isFinite(exp[0]) && Number.isFinite(exp[1])) {
    bits.push(`預期入球 ${exp[0]!.toFixed(2)}–${exp[1]!.toFixed(2)}`);
  }
  const green = input.status !== "fallback" && !!input.lockedAt;
  bits.push(green ? "綠燈已鎖" : "紅燈 · 熱身不足");
  if (input.track) bits.push(`軌 ${input.track}`);
  const why = bits.join("｜");

  const gap = p.length === 3 ? Math.abs((p[0] ?? 0) - (p[2] ?? 0)) : Infinity;
  const closeTag =
    gap < EXPLAIN.closeGap
      ? `三擇接近 · 和局機率偏高（歷史近盤和局約 ${EXPLAIN.closeDrawBand}）`
      : null;

  const caveats: string[] = [];
  if (!input.inLedger) caveats.push("唔入公開戰績");
  if (!green) caveats.push("紅燈場只作診斷");
  const caveat = caveats.length ? caveats.join(" · ") : null;

  let settled: string | null = null;
  if (res) {
    const hit = predIdx >= 0 && ["home", "draw", "away"][predIdx] === res.ftr;
    const legZh =
      legRes === "win" ? "贏" : legRes === "push" ? "走水" : legRes === "lose" ? "輸" : "—";
    settled = `90 分鐘 ${res.ft_h}-${res.ft_a} · 1X2 ${hit ? "中" : "唔中"} · 第二層 ${legZh}${
      res.rps != null ? ` · RPS ${res.rps.toFixed(4)}` : ""
    }`;
  }

  return { predIdx, headline, why, closeTag, caveat, settled, rec, legRes };
}
