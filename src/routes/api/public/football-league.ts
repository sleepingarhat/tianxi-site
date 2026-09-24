import { createFileRoute } from "@tanstack/react-router";

/** Proxy current-season results CSV and build a standings payload. Elo fields stay 0 unless a later snapshot exists — do not invent ratings. */
const REPO = "sleepingarhat/tianxi-football-database";
const LEAGUE_ZH: Record<string, string> = {
  E0: "英超",
  D1: "德甲",
  SP1: "西甲",
  I1: "意甲",
  F1: "法甲",
};

function seasonGuess() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  return m >= 7 ? y : y - 1;
}

type Agg = {
  team: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  pts: number;
  home: { played: number; gf: number; ga: number; pts: number };
  away: { played: number; gf: number; ga: number; pts: number };
  matches: { date: string; opp: string; venue: "H" | "A"; gf: number; ga: number; res: "W" | "D" | "L"; eloBefore: number; oppEloBefore: number }[];
};

function emptySide() {
  return { played: 0, gf: 0, ga: 0, pts: 0 };
}

export const Route = createFileRoute("/api/public/football-league")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const div = (url.searchParams.get("div") || "E0").toUpperCase();
        const json = (body: unknown, status = 200) =>
          new Response(JSON.stringify(body), {
            status,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "access-control-allow-origin": "*",
              "cache-control": "public, max-age=300, s-maxage=900",
            },
          });
        if (!LEAGUE_ZH[div]) return json({ ok: false, error: "unknown div" }, 400);
        const token = process.env["GITHUB_TOKEN"];
        if (!token) return json({ ok: false, error: "未設定 GitHub token", table: [] }, 200);

        const season = seasonGuess();
        const tryYears = [season, season - 1];
        let csv = "";
        let used = season;
        try {
          for (const y of tryYears) {
            const path = `data/results/${y}_${div}.csv`;
            const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
              headers: {
                Accept: "application/vnd.github.raw+json",
                Authorization: `Bearer ${token}`,
                "User-Agent": "tianxi-web",
              },
            });
            if (res.status === 404) continue;
            if (!res.ok) return json({ ok: false, error: `upstream ${res.status}`, table: [] }, 200);
            csv = await res.text();
            used = y;
            break;
          }
        } catch (err) {
          return json({ ok: false, error: err instanceof Error ? err.message : "unknown", table: [] }, 200);
        }
        if (!csv) return json({ ok: true, div, league_zh: LEAGUE_ZH[div], season: used, elo_note: "未有本季賽果 CSV", table: [] });

        const lines = csv.split(/\r?\n/).filter(Boolean);
        const header = lines.shift()?.split(",") ?? [];
        const idx = (name: string) => header.indexOf(name);
        const iDate = idx("Date");
        const iH = idx("HomeTeam");
        const iA = idx("AwayTeam");
        const iHG = idx("FTHG");
        const iAG = idx("FTAG");
        const iFTR = idx("FTR");
        const teams = new Map<string, Agg>();
        const ensure = (name: string) => {
          let t = teams.get(name);
          if (!t) {
            t = { team: name, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, pts: 0, home: emptySide(), away: emptySide(), matches: [] };
            teams.set(name, t);
          }
          return t;
        };
        for (const line of lines) {
          const cols = line.split(",");
          const home = cols[iH];
          const away = cols[iA];
          const hg = Number(cols[iHG]);
          const ag = Number(cols[iAG]);
          const ftr = cols[iFTR];
          if (!home || !away || !Number.isFinite(hg) || !Number.isFinite(ag)) continue;
          const date = cols[iDate] || "";
          const H = ensure(home);
          const A = ensure(away);
          const apply = (t: Agg, gf: number, ga: number, venue: "H" | "A", opp: string) => {
            const res = gf > ga ? "W" : gf < ga ? "L" : "D";
            const pts = res === "W" ? 3 : res === "D" ? 1 : 0;
            t.played += 1;
            t.gf += gf;
            t.ga += ga;
            t.pts += pts;
            if (res === "W") t.win += 1;
            else if (res === "D") t.draw += 1;
            else t.loss += 1;
            const side = venue === "H" ? t.home : t.away;
            side.played += 1;
            side.gf += gf;
            side.ga += ga;
            side.pts += pts;
            t.matches.push({ date, opp, venue, gf, ga, res, eloBefore: 0, oppEloBefore: 0 });
          };
          if (ftr && !"HDA".includes(ftr)) continue;
          apply(H, hg, ag, "H", away);
          apply(A, ag, hg, "A", home);
        }
        const table = [...teams.values()]
          .map((t) => ({
            ...t,
            matches: t.matches.slice(-8).reverse(),
            elo: 0,
            eloHome: 0,
            eloAway: 0,
            form: t.matches.slice(-5).map((m) => m.res),
            eloTrend: [] as { date: string; elo: number }[],
          }))
          .sort((a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga));
        return json({
          ok: true,
          div,
          league_zh: LEAGUE_ZH[div],
          season: used,
          elo_note: "本端點只從賽果 CSV 計積分；天喜足球ELO 走勢未在此重算，不造假分。",
          table,
        });
      },
    },
  },
});
