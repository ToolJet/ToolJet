#!/usr/bin/env node
// Coverage gate for full run-ci PR runs. Prints the "Coverage" PR-comment section and
// exits 1 when the gate fails. No dependencies — ci-gate runs on the bare runner.
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
// COVERAGE_ARTIFACT_URL (optional) — link to the HTML report.
//
// Renders only paths, percentages and line numbers — never source lines: this is a
// public PR comment and server/ee is private.

import fs from 'node:fs';
import path from 'node:path';

const PATCH_MIN = 80;
const FLOOR_TOLERANCE = 0.1;
const MAX_FILES = 15;
const MAX_AREAS = 6;

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

// Top two segments under server/ (src/modules, ee/licensing, …) — keeps the table short.
function areaFor(filePath) {
  const idx = filePath.lastIndexOf('/server/');
  const rel = idx >= 0 ? filePath.slice(idx + '/server/'.length) : filePath;
  return rel.split('/').filter(Boolean).slice(0, 2).join('/') || rel;
}

const summary = readJson('coverage/coverage-summary.json');
const base = readJson('base/coverage-summary.json');
const patch = readJson('patch.json');
const diff = readText('lcov/pr.diff');

const rows = [];
let failed = false;
const check = (name, result, target, ok) => {
  if (ok === false) failed = true;
  rows.push(`| ${name} | ${result} | ${target} | ${mark(ok)} |`);
};

// 1. Overall floor
if (!summary?.total) {
  check('Overall lines', 'coverage report missing', `≥ base − ${FLOOR_TOLERANCE}`, false);
} else {
  const prPct = summary.total.lines.pct;
  const basePct = base?.total?.lines?.pct;
  if (basePct === undefined) {
    check('Overall lines', `${pct(prPct)} (no baseline found)`, `≥ base − ${FLOOR_TOLERANCE}`, null);
  } else {
    const delta = prPct - basePct;
    const sign = delta >= 0 ? '+' : '−';
    check(
      'Overall lines',
      `${pct(prPct)} (base ${pct(basePct)}, ${sign}${Math.abs(delta).toFixed(2)})`,
      `≥ base − ${FLOOR_TOLERANCE}`,
      delta >= -FLOOR_TOLERANCE
    );
  }
}

// 2 + 3. Changed code and new files
const uncovered = [];
if (!patch || diff === null) {
  check('Changed lines', 'patch report missing', `≥ ${PATCH_MIN}%`, false);
} else {
  const total = patch.total_num_lines || 0;
  const missing = patch.total_num_violations || 0;
  if (total === 0) {
    check('Changed lines', 'no executable lines changed', `≥ ${PATCH_MIN}%`, true);
  } else {
    const p = patch.total_percent_covered;
    check('Changed lines', `${p}% · ${fmtInt(total - missing)}/${fmtInt(total)} lines`, `≥ ${PATCH_MIN}%`, p >= PATCH_MIN);
  }

  const added = addedFiles(diff);
  const stats = Object.entries(patch.src_stats || {});
  const untestedNew = stats.filter(([f, s]) => added.has(f) && s.covered_lines.length === 0 && s.violation_lines.length > 0);
  check(
    'New files with no coverage',
    untestedNew.length ? untestedNew.map(([f]) => `\`${f}\``).join('<br>') : 'none',
    'none',
    untestedNew.length === 0
  );

  for (const [file, s] of stats) {
    if (s.violation_lines.length) uncovered.push({ file, s, isNew: added.has(file) });
  }
  uncovered.sort((a, b) => b.s.violation_lines.length - a.s.violation_lines.length);
}

const out = [
  `#### 🧪 Coverage (server) — ${failed ? '❌ gate failed' : '✅ gate passed'}`,
  '',
  '| Check | Result | Target | |',
  '|---|---|---|:-:|',
  ...rows,
];

if (uncovered.length) {
  const shown = uncovered.slice(0, MAX_FILES);
  out.push(
    '',
    '<details>',
    `<summary>Uncovered changed lines · ${uncovered.length} file${uncovered.length === 1 ? '' : 's'}</summary>`,
    '',
    '| File | Covered | Missing lines |',
    '|---|---:|---|',
    ...shown.map(
      ({ file, s, isNew }) => `| \`${file}\`${isNew ? ' 🆕' : ''} | ${Math.round(s.percent_covered)}% | ${ranges(s.violation_lines)} |`
    ),
    ...(uncovered.length > MAX_FILES ? [`| _…${uncovered.length - MAX_FILES} more_ | | |`] : []),
    '',
    '</details>'
  );
}

if (summary?.total) {
  const areas = new Map();
  for (const [key, v] of Object.entries(summary)) {
    if (key === 'total') continue;
    const a = areas.get(areaFor(key)) || { covered: 0, total: 0 };
    a.covered += v.lines.covered;
    a.total += v.lines.total;
    areas.set(areaFor(key), a);
  }
  const sorted = [...areas].sort((a, b) => b[1].covered - a[1].covered);
  const areaRow = (name, c, t) => `| ${name} | ${fmtInt(c)}/${fmtInt(t)} | ${t ? ((c / t) * 100).toFixed(1) : '—'}% |`;
  const rest = sorted.slice(MAX_AREAS);
  const link = process.env.COVERAGE_ARTIFACT_URL ? ` · [full HTML report ↗](${process.env.COVERAGE_ARTIFACT_URL})` : '';
  out.push(
    '',
    '<details>',
    `<summary>Overall coverage by area · ${fmtInt(summary.total.lines.covered)}/${fmtInt(summary.total.lines.total)} lines${link}</summary>`,
    '',
    '| Area | Lines | % |',
    '|---|---:|---:|',
    ...sorted.slice(0, MAX_AREAS).map(([n, { covered, total }]) => areaRow(`\`${n}\``, covered, total)),
    ...(rest.length
      ? [areaRow(`_…${rest.length} more_`, rest.reduce((s, [, v]) => s + v.covered, 0), rest.reduce((s, [, v]) => s + v.total, 0))]
      : []),
    '',
    '<sub>Unit + e2e merged, v8 line coverage. Excludes module/entity/dto/migrations (`server/test/jest-coverage.config.ts`).</sub>',
    '</details>'
  );
}

console.log(out.join('\n'));
process.exit(failed ? 1 : 0);
