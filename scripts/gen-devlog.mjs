#!/usr/bin/env node
// Auto-generates dev-log/data.json from the commit history of the three Tianxi repos.
// Zero-dependency (Node 18+ global fetch). Reads GH_TOKEN from env. Writes ./dev-log/data.json relative to cwd.
// Designed to run in CI (deploy_site.yml) right before the Pages deploy, OR locally.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const OUT = resolve(process.cwd(), "dev-log/data.json");

const REPOS = [
  { repo: "sleepingarhat/tianxi-backend", area: "後端·模型", areaKey: "backend" },
  { repo: "sleepingarhat/tianxi-database", area: "數據·爬蟲", areaKey: "data" },
  { repo: "sleepingarhat/tianxi-site", area: "前端", areaKey: "web" },
];
const TYPE = { feat: "新功能", fix: "修正", perf: "優化", refactor: "重構", ci: "自動化" };
const KEEP = /^(feat|fix|perf|refactor|ci)(\([^)]+\))?!?:/i;
const DROPTAG = /^\[(data|audit|sanity|manifest|backup|odds|snapshot|cache)\]/i;

function pad(n){ return String(n).padStart(2, "0"); }
function hkt(iso){
  const d = new Date(new Date(iso).getTime() + 8 * 3600 * 1000);
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
}

async function fetchCommits(repo){
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "tx-devlog-gen" };
  if (TOKEN) headers.Authorization = `token ${TOKEN}`;
  const r = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=60`, { headers });
  if (!r.ok) throw new Error(`${repo} -> HTTP ${r.status}`);
  return r.json();
}

async function main(){
  const seen = new Set();
  const entries = [];
  for (const { repo, area, areaKey } of REPOS){
    let commits;
    try { commits = await fetchCommits(repo); }
    catch (e){ console.error(`[gen-devlog] skip ${repo}: ${e.message}`); continue; }
    for (const c of commits){
      const full = (c.commit?.message || "").split("\n")[0].trim();
      if (!full) continue;
      if (/^merge/i.test(full)) continue;
      if (/\[skip ci\]/i.test(full)) continue;
      if (DROPTAG.test(full)) continue;
      const m = full.match(KEEP);
      if (!m) continue;
      const type = m[1].toLowerCase();
      const scope = (full.match(/^\w+\(([^)]+)\)/) || [])[1] || "";
      const title = full.replace(/^\w+(\([^)]+\))?!?:\s*/, "").trim();
      const key = `${repo}||${title.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const { date, time } = hkt(c.commit.author.date);
      entries.push({ date, time, repo: repo.split("/")[1], area, areaKey, type, typeLabel: TYPE[type], scope, title, sha: c.sha.slice(0, 7) });
    }
  }
  entries.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const now = new Date(Date.now() + 8 * 3600 * 1000);
  const generatedHKT = `${now.getUTCFullYear()}-${pad(now.getUTCMonth()+1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())} HKT`;
  const payload = { generated: new Date().toISOString(), generatedHKT, count: entries.length, entries };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(`[gen-devlog] wrote ${entries.length} entries -> ${OUT}`);
}

main().catch((e) => { console.error("[gen-devlog] fatal:", e); process.exit(1); });
