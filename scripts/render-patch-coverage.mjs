#!/usr/bin/env node
// Renders patch-coverage JSONs (from compute-patch-coverage.mjs) as a collapsed
// PR-comment fragment: a combined headline (a changed line is covered if EITHER
// suite hit it) plus a server / git-sync breakdown partitioned by file path.
//
// Zero dependencies — ci-gate runs on the bare runner with no server/node_modules,
// same constraint as render-coverage.mjs. Empty output if no inputs / no changed
// executable lines, so render-ci-comment.sh omits the block cleanly.
//
// Env: PATCH_COV_INPUTS = comma-separated patch-coverage JSON paths (missing ones skipped)

import fs from 'node:fs';

// Files under these prefixes belong to the git-sync suite (mirrors the git-sync
// coverage globs + the `@group gitsync` test split). Everything else → server.
const GITSYNC_PREFIXES = [
  'ee/git-sync',
  'ee/platform-git-sync',
  'ee/git-sync-configs',
  'ee/git-sync-webhooks',
  'ee/workspace-branches',
  'ee/app-git',
  'src/modules/git-sync',
  'src/modules/git-sync-configs',
  'src/modules/platform-git-sync',
  'src/modules/workspace-branches',
  'src/modules/app-git',
];
const isGitsync = (file) => GITSYNC_PREFIXES.some((p) => file.startsWith(p));

function loadInputs() {
  const paths = (process.env.PATCH_COV_INPUTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const out = [];
  for (const p of paths) {
    if (!fs.existsSync(p)) continue;
    try {
      out.push(JSON.parse(fs.readFileSync(p, 'utf8')));
    } catch {
      /* skip malformed */
    }
  }
  return out;
}

// Union every suite's per-file executable/covered line sets → Map<file, {exec:Set, cov:Set}>.
function unionByFile(inputs) {
  const map = new Map();
  for (const input of inputs) {
    for (const f of input.files || []) {
      const entry = map.get(f.file) || { exec: new Set(), cov: new Set() };
      for (const ln of f.executable || []) entry.exec.add(ln);
      for (const ln of f.covered || []) entry.cov.add(ln);
      map.set(f.file, entry);
    }
  }
  return map;
}

function tally(entries) {
  let exec = 0;
  let cov = 0;
  for (const e of entries) {
    exec += e.exec.size;
    cov += e.cov.size;
  }
  return { exec, cov };
}

const fmtPct = (cov, exec) => (exec === 0 ? '—' : `${((cov / exec) * 100).toFixed(1)}%`);
const bar = (cov, exec) => {
  if (exec === 0) return '';
  const pct = (cov / exec) * 100;
  return pct >= 90 ? '🟢' : pct >= 75 ? '🟡' : '🔴';
};

const inputs = loadInputs();
if (inputs.length === 0) process.exit(0);

const byFile = unionByFile(inputs);
if (byFile.size === 0) process.exit(0);

const all = [...byFile.values()];
const total = tally(all);
if (total.exec === 0) process.exit(0);

const serverEntries = [...byFile].filter(([f]) => !isGitsync(f)).map(([, e]) => e);
const gitsyncEntries = [...byFile].filter(([f]) => isGitsync(f)).map(([, e]) => e);
const server = tally(serverEntries);
const gitsync = tally(gitsyncEntries);

// Files with uncovered changed lines, worst first — the actionable list.
const uncovered = [...byFile]
  .map(([file, e]) => {
    const missing = [...e.exec].filter((ln) => !e.cov.has(ln)).sort((a, b) => a - b);
    return { file, missing, exec: e.exec.size, cov: e.cov.size };
  })
  .filter((f) => f.missing.length > 0)
  .sort((a, b) => b.missing.length - a.missing.length);

// Collapse consecutive line numbers into ranges: [3,4,5,9] → "3–5, 9".
function ranges(nums) {
  const out = [];
  let start = null;
  let prev = null;
  for (const n of nums) {
    if (start === null) {
      start = prev = n;
    } else if (n === prev + 1) {
      prev = n;
    } else {
      out.push(start === prev ? `${start}` : `${start}–${prev}`);
      start = prev = n;
    }
  }
  if (start !== null) out.push(start === prev ? `${start}` : `${start}–${prev}`);
  // Cap so one heavily-changed file can't bloat the comment into a wall of numbers.
  const MAX_RANGES = 12;
  if (out.length > MAX_RANGES) {
    return `${out.slice(0, MAX_RANGES).join(', ')} … (+${out.length - MAX_RANGES} more)`;
  }
  return out.join(', ');
}

const MAX_FILES = 15;
const shown = uncovered.slice(0, MAX_FILES);

const suiteRow = (label, t) =>
  `| ${label} | ${t.cov}/${t.exec} | ${bar(t.cov, t.exec)} ${fmtPct(t.cov, t.exec)} |`;

const lines = [
  '<details>',
  `<summary><b>🎯 Patch coverage — ${fmtPct(total.cov, total.exec)}</b> · ${total.cov}/${total.exec} changed lines covered</summary>`,
  '',
  '| Suite | Lines | Covered |',
  '|---|---:|---:|',
  suiteRow('**Combined**', total),
  suiteRow('server', server),
  suiteRow('git-sync', gitsync),
  '',
];

if (shown.length) {
  lines.push('**Uncovered changed lines**', '');
  lines.push('| File | Missing lines |', '|---|---|');
  for (const f of shown) {
    lines.push(`| \`${f.file}\` | ${ranges(f.missing)} |`);
  }
  if (uncovered.length > shown.length) {
    lines.push(`| _…${uncovered.length - shown.length} more file(s)_ | |`);
  }
  lines.push('');
}

lines.push(
  '<sub>Patch coverage = covered ÷ changed executable lines (added/modified vs the merge-base). ' +
    'Combined counts a line as covered if either suite hit it; server/git-sync split is by file path. ' +
    'Informational only — never gates the merge.</sub>',
  '</details>'
);

console.log(lines.join('\n'));
