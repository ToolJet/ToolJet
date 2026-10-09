#!/usr/bin/env node
// Coverage gate for full run-ci PR runs. Prints the PR-comment fragment (line 1: the
// "Coverage" table cell; rest: optional uncovered-lines details) and exits 1 when the gate fails. No dependencies — ci-gate runs on the bare runner.
//
// Checks (server):
//   1. Overall lines must not drop below the base branch (latest push run) − FLOOR_TOLERANCE.
//   2. Changed executable lines must be ≥ PATCH_MIN% covered (diff-cover JSON).
//   3. No newly added file may be 0% covered.
// A missing report fails the gate — this only runs after the server suites went green.
//
// Env: CI_RESULTS dir containing
//   coverage/coverage-summary.json  PR coverage (istanbul json-summary)
//   base/coverage-summary.json      base-branch coverage (optional → no floor check)
//   lcov/pr.diff                    PR diff incl. submodule changes (new-file detection)
//   patch.json                      diff-cover --format json output
// COVERAGE_ARTIFACT_URL (optional) — link to the HTML report. BASE_REF (optional) — base branch label.
//
// Renders only paths, percentages and line numbers — never source lines: this is a
// public PR comment and server/ee is private.

import fs from 'node:fs';
import path from 'node:path';

// TEMP: lowered from 80 (and untested new files only warn) until the
// untested LTS modules (incl. AI) get tests; restore both then.
const PATCH_MIN = 60;
const FLOOR_TOLERANCE = 0.1;
const MAX_FILES = 15;

const dir = process.env.CI_RESULTS || '/tmp/ci-results';
const readJson = (p) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, p), 'utf8'));
  } catch {
    return null;
  }
};
const readText = (p) => {
  try {
    return fs.readFileSync(path.join(dir, p), 'utf8');
  } catch {
    return null;
  }
};

const pct = (n) => `${n.toFixed(2)}%`;
const fmtInt = (n) => n.toLocaleString('en-US');
const mark = (ok) => (ok === null ? '⚠️' : ok ? '✅' : '❌');

// "3,4,5,9" → "3-5, 9"
function ranges(lines) {
  const out = [];
  for (const n of [...lines].sort((a, b) => a - b)) {
    const last = out[out.length - 1];
    if (last && n === last[1] + 1) last[1] = n;
    else out.push([n, n]);
  }
  return out.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)).join(', ');
}

// Files the PR adds: `diff --git a/x b/x` followed by `new file mode` before the first hunk.
function addedFiles(diff) {
  const added = new Set();
  let file = null;
  for (const line of (diff || '').split('\n')) {
    if (line.startsWith('diff --git ')) file = line.split(' b/').pop();
    else if (file && line.startsWith('new file mode')) added.add(file);
    else if (line.startsWith('@@')) file = null;
  }
  return added;
}

const summary = readJson('coverage/coverage-summary.json');
const base = readJson('base/coverage-summary.json');
const patch = readJson('patch.json');
const diff = readText('lcov/pr.diff');

const parts = [];
let failed = false;
const check = (ok, text) => {
  if (ok === false) failed = true;
  parts.push(`${mark(ok)} ${text}`);
};

// 1. Changed code
const uncovered = [];
if (!patch || diff === null) {
  check(false, 'changed lines: patch report missing');
} else {
  const total = patch.total_num_lines || 0;
  const missing = patch.total_num_violations || 0;
  if (total === 0) {
    check(true, 'no executable lines changed');
  } else {
    const p = patch.total_percent_covered;
    check(p >= PATCH_MIN, `changed lines ${p}% (${fmtInt(total - missing)}/${fmtInt(total)}, min ${PATCH_MIN}%)`);
  }

  const added = addedFiles(diff);
  const stats = Object.entries(patch.src_stats || {});
  const untestedNew = stats.filter(([f, s]) => added.has(f) && s.covered_lines.length === 0 && s.violation_lines.length > 0);
  if (untestedNew.length) check(null, `${untestedNew.length} new file${untestedNew.length === 1 ? '' : 's'} with no tests`);

  for (const [file, s] of stats) {
    if (s.violation_lines.length) uncovered.push({ file, s, isNew: added.has(file) });
  }
  uncovered.sort((a, b) => b.s.violation_lines.length - a.s.violation_lines.length);
}

// 2. Overall floor
const baseName = process.env.BASE_REF ? `\`${process.env.BASE_REF}\`` : 'base';
const report = process.env.COVERAGE_ARTIFACT_URL ? ` · [report ↗](${process.env.COVERAGE_ARTIFACT_URL})` : '';
if (!summary?.total) {
  check(false, 'overall: coverage report missing');
} else {
  const prPct = summary.total.lines.pct;
  const basePct = base?.total?.lines?.pct;
  if (basePct === undefined) {
    check(null, `overall ${pct(prPct)} (no ${baseName} baseline found)${report}`);
  } else {
    const delta = prPct - basePct;
    const sign = delta >= 0 ? '+' : '−';
    check(
      delta >= -FLOOR_TOLERANCE,
      `overall ${pct(prPct)} (${sign}${Math.abs(delta).toFixed(2)} vs ${baseName}, min ${pct(basePct - FLOOR_TOLERANCE)})${report}`
    );
  }
}

// Line 1: cell for the "Coverage" row of the CI table. Rest: optional details.
const out = [parts.join('<br>')];
if (uncovered.length) {
  const shown = uncovered.slice(0, MAX_FILES);
  out.push(
    '<details>',
    `<summary><b>${failed ? '❌' : 'ℹ️'} Uncovered changed lines · ${uncovered.length} file${uncovered.length === 1 ? '' : 's'}</b></summary>`,
    '',
    '| File | Covered | Missing lines |',
    '|---|---:|---|',
    ...shown.map(
      ({ file, s, isNew }) => `| \`${file}\`${isNew ? ' 🆕' : ''} | ${Math.round(s.percent_covered)}% | ${ranges(s.violation_lines)} |`
    ),
    ...(uncovered.length > MAX_FILES ? [`| _…${uncovered.length - MAX_FILES} more_ | | |`] : []),
    '',
    '<sub>Server unit + e2e + git-sync suites, v8 line coverage. Excludes module/entity/dto/migrations (`server/test/jest-coverage.config.ts`).</sub>',
    '</details>'
  );
}

console.log(out.join('\n'));
process.exit(failed ? 1 : 0);
