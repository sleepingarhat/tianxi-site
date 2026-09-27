# Lovable 交接（2026-09-27 夜）

Grok 今晚做咗嘅、同你朝早／晏昼賽馬線嘅邊界。**唔好改凍結四擇、唔好開 SHAP overlay、唔好升足球指紋。**

## 你已經做完（賽馬 9-27）——Grok 承認、唔重做

1. 沙田 11 場入帳：四擇平均 2.0／4、首選 27.3%、頭三有份 81.8%。呢啲係對帳重算。
2. Stage 7 連敗修正 `246586c1`：通用名只核數量。下個預測 run 起唔好改返嚴對名。
3. SHAP 第二刀 `717e2fe`：status=ok，頭五＝近仗加權平均名次／騎師 Elo／檔位／同程頭三率／練馬師 Elo。**產品 overlay 閘未過 → 前台紅綠因子繼續唔上。**
4. 凍結完整性：9-27 只有第 1 場有開賽前快照；第 2–11 場**唔補寫、唔入凍結戰績**。命中率頁 11 場 ≠ 凍結四擇。

隊徽次級聯賽靜態後備：你繼續，Grok 唔插手。

## Grok 今晚新改（tianxi-site PR #3）

- 足球 E1 解釋層：Ledger + `/football/explain`
- 賽馬 H-E1：`horseExplain.ts` + `HorseExplainChip` 接 `/predictor`，放哋「點解擇佢」之上
- closeGap=null；SHAP overlay 唔上；四擇零改
- 足球指紋零改

## 研究

- F-R1 否決（S25-5）
- F-R2 評分軌 PASS_TRACK，未入 S5 集成
- F-R3 Δλ=0

## 規矩

- 9-27 第 2–11 場缺鎖前快照：禁止事後補凍結
- market_beta=0；CatBoost 未批；獨贏只旁註
- 「發」才刷開發日誌公開條目
