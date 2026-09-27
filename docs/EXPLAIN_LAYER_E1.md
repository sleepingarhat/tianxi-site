# 解釋層 E1／聯合研究隊列（2026-09-27）

指紋、α、market_beta、第二層 τ／δ、LambdaRank、CatBoost：**零改**。

## 已落地（足球 · tianxi-site）

- `src/lib/footballExplain.ts`：凍結列 → 預測字／原因句／近盤標籤／紅燈 caveat／完場對照句
- `FootballLedger` 卡面讀同一套函數
- 近盤標籤閘：`|P_H−P_A| < 0.08`（S26b）；唔改 argmax、唔入對帳
- `/football/explain` 仍只讀綠燈覆蓋統計；因果句唔出現

## 已落地（賽馬 · 函數，唔改 TX-Oracle）

- `src/lib/horseExplain.ts`：鎖後 picks → 獨贏一句／位置一句／原因句／完場對照句
- `HORSE_EXPLAIN.closeGap = null`：頭馬接近標籤關閉，等鎖後快照分位校準
- 禁：SHAP 當原因、臨場盤入解釋因果、獨贏命中升主尺、CatBoost 換樹、改四擇

選馬頁尚未接晶片，避免同現有特徵證據卡搶版面。函數可單獨單測。

## 研究隊列

| ID | 題 | 裁決 |
|---|---|---|
| F-R1 | 動態攻防時間結構 vs S3 | **否決**（= S25-5，24 組零過閘） |
| F-R2 | pi-rating vs Elo softmax | 協議已寫，未跑 |
| F-R3 | Δλ 授權名單／密度／xG | 條件層全 0 |
| H-R1 | Elo 衰減對打 | 協議：唔換 CatBoost；研究倉未開跑 |
| H-R2 | 凍結 p vs 扣水 q log-loss | 診斷；獨贏只旁註 |
| 共用 E2 | 完場「當時點解／結果」卡 | 足球 settled 已填空 |

詳細數字見 `tianxi-football-research/NOTES-queue-e1.md`。
禁止列維持 `tianxi-football-research/NOTES-rejected.md`。
