import { createFileRoute } from "@tanstack/react-router";

// 鎖點狀態公開代理：主站自訂網域 → Worker /api/analyze/lock-state。
// 已批規格：首場開跑前 90 分鐘鎖死全日四擇；純轉發，唔碰凍結預測。
const WORKER_BASE = "https://tianxi-backend.tianxi-entertainment.workers.dev";

export const Route = createFileRoute("/api/public/lock-state")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const res = await fetch(`${WORKER_BASE}/api/analyze/lock-state`, {
            headers: { Accept: "application/json" },
          });
          const text = await res.text();
          return new Response(text, {
            status: res.status,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "public, max-age=30, s-maxage=60",
            },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ ok: false, error: "lock state upstream unavailable", detail: String(err) }),
            { status: 502, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
