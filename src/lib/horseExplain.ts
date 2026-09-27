/**
 * H-E1 賽馬解釋／內容層：只讀鎖後預測列填空。
 * 唔改四擇、唔改 LambdaRank／Elo、唔用 SHAP 當原因、臨場盤唔入因果。
 *
 * closeGap 未校準：頭兩匹獨贏差低於閘先標「頭馬接近」。
 * 而家 closeGap = null → 標籤永遠唔出，等鎖後快照掃分位先寫死。
 */

export const HORSE_EXPLAIN = {
  closeGap: null as number | null,
  placeCount: 4,
  disclaimer: "解釋句由鎖後預測列加總，唔另開模型、唔改四擇。",
} as const;

const pc = (v: number | null | undefined, d = 1) =>
  v == null || !Number.isFinite(v) ? "—" : `${(v * 100).toFixed(d)}%`;

export type HorsePick = {
  horseNumber?: number | null;
  nameCh?: string | null;
  pWin?: number | null;
  pTop3?: number | null;
  pTop4?: number | null;
  rank?: number | null;
};

export type HorseExplainInput = {
  picks?: HorsePick[] | null;
  frozen?: boolean | null;
  lockedAt?: string | null;
  scoreSource?: string | null;
  ensembleAlpha?: number | null;
  inLedger?: boolean | null;
  resultPlaces?: number[] | null;
};

export type HorseExplainCard = {
  winLine: string;
  placeLine: string;
  why: string;
  closeTag: string | null;
  caveat: string | null;
  settled: string | null;
};

function byRank(picks: HorsePick[]): HorsePick[] {
  return picks
    .slice()
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || (b.pWin ?? 0) - (a.pWin ?? 0));
}

export function explainRace(input: HorseExplainInput): HorseExplainCard {
  const ranked = byRank(input.picks ?? []);
  const first = ranked[0];
  const second = ranked[1];
  const box = ranked.slice(0, HORSE_EXPLAIN.placeCount);

  const winLine = first
    ? `獨贏一句：#${first.horseNumber ?? "—"} ${first.nameCh ?? "—"} ${pc(first.pWin)}`
    : "獨贏一句：未有凍結第一名";

  const placeLine = box.length
    ? `位置一句：${box
        .map((h) => `#${h.horseNumber ?? "—"} ${h.nameCh ?? "—"}`)
        .join("／")}`
    : "位置一句：未有凍結頭四";

  const bits: string[] = [];
  if (first?.pWin != null && second?.pWin != null) {
    bits.push(`頭兩匹獨贏差 ${pc((first.pWin ?? 0) - (second.pWin ?? 0))}`);
  }
  bits.push(input.frozen ? "綠燈已鎖" : "初版 · 未鎖");
  if (input.scoreSource) bits.push(`源 ${input.scoreSource}`);
  if (typeof input.ensembleAlpha === "number") bits.push(`α=${input.ensembleAlpha.toFixed(2)}`);
  const why = bits.join("｜");

  const gap =
    first?.pWin != null && second?.pWin != null
      ? Math.abs((first.pWin ?? 0) - (second.pWin ?? 0))
      : Infinity;
  const closeTag =
    HORSE_EXPLAIN.closeGap != null && gap < HORSE_EXPLAIN.closeGap
      ? "頭馬接近 · 標籤唔改四擇、唔入戰績"
      : null;

  const caveats: string[] = [];
  if (!input.frozen) caveats.push("未鎖場唔入公開戰績");
  if (input.inLedger === false) caveats.push("唔入公開戰績");
  const caveat = caveats.length ? caveats.join(" · ") : null;

  let settled: string | null = null;
  const places = input.resultPlaces ?? [];
  if (places.length && first?.horseNumber != null) {
    const winHit = places[0] === first.horseNumber;
    const inBox = box.some((h) => h.horseNumber != null && places.slice(0, 4).includes(h.horseNumber));
    settled = `完場頭馬 #${places[0] ?? "—"} · 獨贏 ${winHit ? "中" : "唔中"} · 四擇入圍 ${inBox ? "有" : "無"}`;
  }

  return { winLine, placeLine, why, closeTag, caveat, settled };
}
