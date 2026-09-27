import { HORSE_EXPLAIN, explainRace, type HorsePick } from "@/lib/horseExplain";

type Props = {
  picks?: HorsePick[] | null;
  frozen?: boolean | null;
  scoreSource?: string | null;
  ensembleAlpha?: number | null;
};

/** H-E1 晶片：只讀鎖後／當前 picks 填空。唔改四擇、唔當 SHAP、closeGap 未校準所以唔出近義章。 */
export function HorseExplainChip({ picks, frozen, scoreSource, ensembleAlpha }: Props) {
  const card = explainRace({ picks, frozen, scoreSource, ensembleAlpha });
  return (
    <div className="rounded-[8px] border border-deep/20 bg-paper-2 px-2.5 py-2">
      <p className="font-serif-tc text-[13px] font-bold text-ink">{card.winLine}</p>
      <p className="mt-0.5 font-serif-tc text-[12px] text-ink-2">{card.placeLine}</p>
      <p className="tabnum mt-1 font-mono-tx text-[9px] text-ink-3">{card.why}</p>
      {card.closeTag ? (
        <p className="mt-1 rounded-[5px] border border-deep/20 bg-paper px-1.5 py-1 text-[9px] text-ink-2">
          {card.closeTag}
        </p>
      ) : null}
      {card.caveat ? <p className="mt-1 text-[9px] text-ink-3">{card.caveat}</p> : null}
      {card.settled ? (
        <p className="tabnum mt-1 font-mono-tx text-[9px] text-ink-3">{card.settled}</p>
      ) : null}
      <p className="mt-1.5 text-[9px] leading-relaxed text-ink-3">{HORSE_EXPLAIN.disclaimer}</p>
    </div>
  );
}
