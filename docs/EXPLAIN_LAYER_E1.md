# 解釋層 E1／聯合研究隊列（2026-09-27）

指紋、α、market_beta、第二層 τ／δ、LambdaRank、CatBoost：**零改**。

## 已落地（足球 · tianxi-site）

- `src/lib/footballExplain.ts`：凍結列 → 預測字／原因句／近盤標籤／紅燈 caveat／完場對照句
- `FootballLedger` 卡面讀同一套函數
- 近盤標籤閘：`|P_H−P_A| < 0.08`（S26b）；唔改 argmax、唔入對帳

## 賽馬 H-E1（規格，唔改 TX-Oracle）

對齊足球展示層，唔抄讓波、唔改四擇。

1. `/explain` 繼續只讀鎖後 `prediction_log`。
2. 模板填空（未寫入 prod）：
   - 獨贏一句＝凍結第一名
   - 位置一句＝凍結頭三／頭四，同分欄、分對帳
   - 若頭兩匹獨贏機率差低於待定閘 → 標籤「頭馬接近」（唔改四擇、唔入戰績）
3. 閘值未定：用鎖後快照掃分位，校準「近義場實際爭頭馬頻率」先寫死；而家唔估。
4. 禁：SHAP 當原因、臨場盤入解釋因果、獨贏命中升主尺、CatBoost 換樹。

## 研究隊列（過閘先升引擎）

| ID | 題 | 產線 |
|---|---|---|
| F-R1 | 動態攻防時間結構 vs S3 | 先唔改 |
| F-R2 | pi-rating vs Elo softmax | 先唔改 |
| F-R3 | Δλ 授權名單／密度／xG | 條件層全 0 |
| H-R1 | Elo 衰減對打 | 唔換 CatBoost |
| H-R2 | 凍結 p vs 扣水 q log-loss | 診斷 |
| 共用 E2 | 完場「當時點解／結果」卡 | 展示 |

禁止列維持 `tianxi-football-research/NOTES-rejected.md`。
