import { createFileRoute } from "@tanstack/react-router";

// 引擎健康公開代理：主站自訂網域 → Worker /api/analyze/engine-health。
// 純轉發，唔改內容、唔碰凍結預測。
const WORKER_BASE = "https://tianxi-backend.tianxi-entertainment.workers.dev";

export const Route = createFileRoute("/api/public/engine-health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const res = await fetch(`${WORKER_BASE}/api/analyze/engine-health`, {
            headers: { Accept: "application/json" },
          });
          const text = await res.text();
          return new Response(text, {
            status: res.status,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "public, max-age=60, s-maxage=120",
            },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ ok: false, error: "engine health upstream unavailable", detail: String(err) }),
            { status: 502, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
