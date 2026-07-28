#!/usr/bin/env node
// Renders a coverage-summary.json (istanbul json-summary reporter) as a collapsed
// PR-comment fragment. No dependencies — ci-gate runs on the bare runner with no
// server/node_modules, same constraint as render-failed-tests.mjs.
//
// Usage:
//   node render-coverage.mjs   → <details> block; empty output if no summary
//
// Env: COVERAGE_SUMMARY (coverage-summary.json path), COVERAGE_ARTIFACT_URL (optional)
//
// Lines only, deliberately: with the v8 provider, untested files get exactly one
// synthetic branch and one synthetic function each (istanbul's generateEmptyCoverage),
// so branch/function totals are mostly placeholder noise, not real numbers.

import fs from 'node:fs';

const MAX_AREAS = 6;

function loadSummary() {
  const p = process.env.COVERAGE_SUMMARY;
  if (!p || !fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

// Buckets each absolute file path to its top two segments under server/
// (src/modules, ee/licensing, src/helpers, ...) so the table stays short.
function areaFor(filePath) {
  const marker = '/server/';
  const idx = filePath.lastIndexOf(marker);
  const rel = idx >= 0 ? filePath.slice(idx + marker.length) : filePath;
  const parts = rel.split('/').filter(Boolean);
  return parts.slice(0, 2).join('/') || rel;
}

function fmtPct(covered, total) {
  if (total === 0) return '—';
  return `${((covered / total) * 100).toFixed(1)}%`;
}

function fmtInt(n) {
  return n.toLocaleString('en-US');
}

const summary = loadSummary();
if (!summary || !summary.total) process.exit(0);

const { lines } = summary.total;
const fileKeys = Object.keys(summary).filter((k) => k !== 'total');
const filesTouched = fileKeys.filter((k) => summary[k].lines.covered > 0).length;

const areas = new Map();
for (const key of fileKeys) {
  const area = areaFor(key);
  const entry = areas.get(area) || { covered: 0, total: 0 };
  entry.covered += summary[key].lines.covered;
  entry.total += summary[key].lines.total;
  areas.set(area, entry);
}

const sortedAreas = [...areas.entries()].sort((a, b) => b[1].covered - a[1].covered);
const shown = sortedAreas.slice(0, MAX_AREAS);
const rest = sortedAreas.slice(MAX_AREAS);

const rows = shown.map(
  ([area, { covered, total }]) => `| \`${area}\` | ${fmtInt(covered)}/${fmtInt(total)} | ${fmtPct(covered, total)} |`
);
if (rest.length) {
  const restCovered = rest.reduce((a, [, v]) => a + v.covered, 0);
  const restTotal = rest.reduce((a, [, v]) => a + v.total, 0);
  rows.push(
    `| _…${rest.length} more area${rest.length === 1 ? '' : 's'}_ | ${fmtInt(restCovered)}/${fmtInt(restTotal)} | ${fmtPct(restCovered, restTotal)} |`
  );
}

const artifactLink = process.env.COVERAGE_ARTIFACT_URL
  ? ` · [full HTML report ↗](${process.env.COVERAGE_ARTIFACT_URL})`
  : '';

console.log(
  [
    '<details>',
    `<summary><b>📊 Coverage — ${lines.pct}% lines</b> · unit + e2e merged</summary>`,
    '',
    `**${fmtInt(lines.covered)} / ${fmtInt(lines.total)} lines** · ${fmtInt(filesTouched)} / ${fmtInt(fileKeys.length)} files touched${artifactLink}`,
    '',
    '| Area | Lines | % |',
    '|---|---:|---:|',
    ...rows,
    '',
    '<sub>v8 provider — line coverage only; branch/function counts aren\'t meaningful here because untested files contribute one synthetic branch and function each.</sub>',
    '</details>',
  ].join('\n')
);
