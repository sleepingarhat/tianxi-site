import { createFileRoute } from "@tanstack/react-router";

// 凍結對帳表公開代理：主站自訂網域 → Worker /api/analyze/freeze-ledger。
// 只讀已鎖 prediction_log；純轉發，唔碰凍結預測、唔重算。
const WORKER_BASE = "https://tianxi-backend.tianxi-entertainment.workers.dev";

export const Route = createFileRoute("/api/public/freeze-ledger")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const qs = new URLSearchParams();
        const dates = url.searchParams.get("dates");
        const since = url.searchParams.get("since");
        if (dates) qs.set("dates", dates);
        if (since) qs.set("since", since);
        const suffix = qs.toString() ? `?${qs.toString()}` : "";
        try {
          const res = await fetch(`${WORKER_BASE}/api/analyze/freeze-ledger${suffix}`, {
            headers: { Accept: "application/json" },
          });
          const text = await res.text();
          return new Response(text, {
            status: res.status,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "public, max-age=120, s-maxage=300",
            },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ ok: false, error: "freeze ledger upstream unavailable", detail: String(err) }),
            { status: 502, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
