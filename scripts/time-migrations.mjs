#!/usr/bin/env node
// Times each TypeORM migration from `db:migrate` output and fails when one of
// the PR's own migrations is over the limit.
//
// Usage:
//   NODE_ENV= npm run --prefix server db:migrate 2>&1 | node scripts/time-migrations.mjs
//
// TypeORM's migration:run prints "<n> migrations are new migrations must be
// executed." before the first pending migration and "Migration <Name><13-digit
// timestamp> has been executed successfully." after each one. Every stdin line
// is timestamped on arrival, so a migration's time is the gap between its success
// line and the previous one (the first is measured from the "are new" anchor).
// The final COMMIT of migrationsTransactionMode 'all' is reported as its own row.
//
// Env: JUDGE                         comma-separated 13-digit timestamps from the class
//                                    names of the PR's migrations (TypeORM records the
//                                    class timestamp, not the filename's); only these
//                                    can fail the run
//      MIGRATION_TIME_LIMIT_SECONDS  per-migration limit (default 30)
//      GITHUB_STEP_SUMMARY           markdown table is appended here when set

import readline from 'node:readline';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ANCHOR = /\d+ migrations are new migrations must be executed/;
const DONE = /Migration (\S+?(\d{13})) has been executed successfully/;
const COMMIT = /query: COMMIT/;
const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, ''); // TypeORM colours query logs

// stamped: [{ t: seconds, line }] in arrival order
export function timeMigrations(stamped, { judged = new Set(), limit = 30 } = {}) {
  const rows = [];
  let anchor = null;
  let lastDone = null;
  for (const { t, line: raw } of stamped) {
    const line = stripAnsi(raw);
    if (ANCHOR.test(line)) {
      anchor = t;
      lastDone = null;
      continue;
    }
    const m = line.match(DONE);
    if (m && anchor !== null) {
      const isJudged = judged.has(m[2]);
      const seconds = t - anchor;
      rows.push({ name: m[1], seconds, judged: isJudged, slow: isJudged && seconds > limit });
      anchor = t;
      lastDone = t;
      continue;
    }
    if (lastDone !== null && COMMIT.test(line)) {
      rows.push({ name: '(commit)', seconds: t - lastDone, judged: false, slow: false });
      lastDone = null;
    }
  }
  return rows;
}

export function renderSummary(rows, limit) {
  const status = (r) => (!r.judged ? (r.name === '(commit)' ? 'not judged' : 'merged earlier, not judged') : r.slow ? `❌ over ${limit}s limit` : '✅');
  return [
    '### Migration timing',
    '',
    '| Migration | Time | |',
    '|---|---|---|',
    ...rows.map((r) => `| ${r.name} | ${r.seconds.toFixed(2)}s | ${status(r)} |`),
    '',
  ].join('\n');
}

async function main() {
  const limit = Number(process.env.MIGRATION_TIME_LIMIT_SECONDS || 30);
  const judged = new Set((process.env.JUDGE || '').split(',').filter(Boolean));
  const stamped = [];
  for await (const line of readline.createInterface({ input: process.stdin })) {
    stamped.push({ t: performance.now() / 1000, line });
    console.log(line); // keep the migration log readable in the job output
  }
  const rows = timeMigrations(stamped, { judged, limit });
  const summary = rows.length ? renderSummary(rows, limit) : '### Migration timing\n\nNo pending migrations.\n';
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  const slow = rows.filter((r) => r.slow);
  for (const r of slow) console.log(`::error::${r.name} took ${r.seconds.toFixed(2)}s, over the ${limit}s limit`);
  process.exit(slow.length ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
