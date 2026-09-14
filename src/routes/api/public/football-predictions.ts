import { createFileRoute } from "@tanstack/react-router";

/**
 * 足球賽前凍結預測代理：tianxi-football-database（private）→ 本站。
 * 倉庫係私有，所以用 GitHub Contents API 帶 token 讀，再對外做邊緣快取。
 * 用戶請求永不即時打上游採集器，只讀已凍結嘅 JSON。
 */
const REPO = "sleepingarhat/tianxi-football-database";
const PATHS: Record<string, string> = {
  predictions: "data/predictions/upcoming.json",
  fixtures: "data/fixtures/upcoming.json",
  hit_rate: "data/predictions/hit_rate.json",
};

/** 逐場凍結帳（只增不改）：?file=log&month=2026-09 */
const LOG_PATH = (month: string) => `data/predictions/log/${month}.json`;

export const Route = createFileRoute("/api/public/football-predictions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const key = url.searchParams.get("file") ?? "predictions";
        const month = url.searchParams.get("month") ?? "";
        const path =
          key === "log" && /^\d{4}-\d{2}$/.test(month) ? LOG_PATH(month) : PATHS[key];
        const json = (body: unknown, status = 200, cache?: string) =>
          new Response(JSON.stringify(body), {
            status,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "access-control-allow-origin": "*",
              ...(cache ? { "cache-control": cache } : {}),
            },
          });

        if (!path) return json({ ok: false, error: "unknown file" }, 400);

        const token = process.env["GITHUB_TOKEN"];
        if (!token) return json({ ok: false, error: "未設定 GitHub token" }, 503);

        try {
          const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
            headers: {
              Accept: "application/vnd.github.raw+json",
              Authorization: `Bearer ${token}`,
              "User-Agent": "tianxi-web",
            },
          });
          if (!res.ok) throw new Error(`upstream ${res.status}`);
          const text = await res.text();
          return new Response(text, {
            headers: {
              "content-type": "application/json; charset=utf-8",
              "access-control-allow-origin": "*",
              "cache-control": "public, max-age=300, s-maxage=900, stale-while-revalidate=86400",
            },
          });
        } catch (err) {
          return json(
            { ok: false, error: err instanceof Error ? err.message : "unknown" },
            502,
          );
        }
      },
    },
  },
});
