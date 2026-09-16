import { createFileRoute } from "@tanstack/react-router";

/**
 * 球員資料層（照片／先發／傷停）源探測，內部驗收用。
 * 只在服務端讀密鑰，回傳權限同覆蓋狀況，永不回傳密鑰。
 */

async function probeApiSports(key: string) {
  const base = "https://v3.football.api-sports.io";
  const headers = { "x-apisports-key": key, accept: "application/json" };
  const call = async (path: string) => {
    try {
      const r = await fetch(`${base}${path}`, { headers });
      const t = await r.text();
      let j: any = null;
      try {
        j = JSON.parse(t);
      } catch {
        /* ignore */
      }
      const errs = j?.errors;
      const errCount = Array.isArray(errs) ? errs.length : errs ? Object.keys(errs).length : 0;
      return {
        http: r.status,
        results: j?.results ?? null,
        errors: errCount > 0 ? errs : null,
        sample: Array.isArray(j?.response) ? j.response[0] ?? null : null,
      };
    } catch (e) {
      return { http: 0, error: e instanceof Error ? e.name : "error" };
    }
  };
  return {
    status: await call("/status"),
    // 39 = Premier League；2024 為免費層最新可用季
    players_2024: await call("/players?league=39&season=2024&page=1"),
    squads: await call("/players/squads?team=33"),
    injuries_2024: await call("/injuries?league=39&season=2024"),
    injuries_current: await call("/injuries?league=39&season=2025"),
    fixtures_2024: await call("/fixtures?league=39&season=2024&round=Regular%20Season%20-%201"),
  };
}

async function probeApiFootball(key: string) {
  const base = "https://apiv3.apifootball.com/";
  const call = async (qs: string) => {
    try {
      const r = await fetch(`${base}?${qs}&APIkey=${encodeURIComponent(key)}`, {
        headers: { accept: "application/json" },
      });
      const t = await r.text();
      let j: any = null;
      try {
        j = JSON.parse(t);
      } catch {
        /* ignore */
      }
      return {
        http: r.status,
        count: Array.isArray(j) ? j.length : null,
        error: Array.isArray(j) ? null : (j?.message ?? "non_array"),
        keys: Array.isArray(j) && j[0] ? Object.keys(j[0]).slice(0, 24) : null,
      };
    } catch (e) {
      return { http: 0, error: e instanceof Error ? e.name : "error" };
    }
  };
  return {
    // 152 = Premier League（apifootball.com league_id）
    teams: await call("action=get_teams&league_id=152"),
    lineups_recent: await call("action=get_events&league_id=152&from=2026-09-08&to=2026-09-16"),
    predictions: await call("action=get_predictions&league_id=152&from=2026-09-16&to=2026-09-23"),
  };
}

export const Route = createFileRoute("/api/public/football-player-source-check")({
  server: {
    handlers: {
      GET: async () => {
        const asKey = process.env["APISPORTS_API_FOOTBALL_KEY"];
        const afKey = process.env["API_FOOTBALL_KEY"];
        const out: Record<string, unknown> = { checked_at: new Date().toISOString() };
        out["api_sports"] = asKey ? await probeApiSports(asKey) : { error: "missing_secret" };
        out["apifootball"] = afKey ? await probeApiFootball(afKey) : { error: "missing_secret" };
        return new Response(JSON.stringify(out, null, 2), {
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      },
    },
  },
});
