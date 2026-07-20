#!/usr/bin/env node
/**
 * Coverage ratchet: coverage may only go up.
 *
 * Compares coverage/coverage-summary.json (produced by `npm run test:ci` via the
 * json-summary reporter) against the committed coverage-baseline.json and fails
 * if any tracked directory drops by more than TOLERANCE percentage points.
 *
 * Usage:
 *   node scripts/coverage-ratchet.js            # check (CI gate)
 *   node scripts/coverage-ratchet.js --update   # rewrite the baseline (run on merge to develop)
 */
const fs = require('fs');
const path = require('path');

const TOLERANCE = 0.5; // percentage points a bucket may drop before CI fails
const METRICS = ['statements', 'branches'];

// Directory buckets the ratchet tracks. Add a bucket when a coverage wave starts
// on a new area; never remove one.
const BUCKETS = [
  'src/_helpers',
  'src/AppBuilder/_utils',
  'src/AppBuilder/_stores',
  'src/_stores',
  'src/_services',
  'src/_components',
  'src/components/ui',
  'src/_ui',
];

const summaryPath = path.resolve(__dirname, '../coverage/coverage-summary.json');
const baselinePath = path.resolve(__dirname, '../coverage-baseline.json');

if (!fs.existsSync(summaryPath)) {
  console.error(`coverage-ratchet: ${summaryPath} not found. Run \`npm run test:ci\` first.`);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const repoRoot = path.resolve(__dirname, '..');

function aggregate(bucket) {
  const totals = {};
  METRICS.forEach((m) => (totals[m] = { covered: 0, total: 0 }));
  Object.entries(summary).forEach(([file, metrics]) => {
    if (file === 'total') return;
    const rel = path.relative(repoRoot, file);
    if (!rel.startsWith(bucket + path.sep)) return;
    METRICS.forEach((m) => {
      totals[m].covered += metrics[m].covered;
      totals[m].total += metrics[m].total;
    });
  });
  const pct = {};
  METRICS.forEach((m) => {
    pct[m] = totals[m].total === 0 ? null : Number(((totals[m].covered / totals[m].total) * 100).toFixed(2));
  });
  return pct;
}

const current = { total: {} };
METRICS.forEach((m) => (current.total[m] = summary.total[m].pct));
BUCKETS.forEach((bucket) => {
  current[bucket] = aggregate(bucket);
});

if (process.argv.includes('--update')) {
  fs.writeFileSync(baselinePath, JSON.stringify(current, null, 2) + '\n');
  console.log(`coverage-ratchet: baseline updated at ${baselinePath}`);
  process.exit(0);
}

if (!fs.existsSync(baselinePath)) {
  console.error(`coverage-ratchet: ${baselinePath} not found. Run with --update to create it.`);
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
let failed = false;

Object.entries(baseline).forEach(([bucket, metrics]) => {
  METRICS.forEach((m) => {
    const base = metrics[m];
    const now = current[bucket] ? current[bucket][m] : null;
    if (base === null || base === undefined) return; // bucket had no files at baseline time
    if (now === null || now === undefined) {
      console.error(`✗ ${bucket} ${m}: baseline ${base}% but no coverage data now`);
      failed = true;
      return;
    }
    const delta = now - base;
    if (delta < -TOLERANCE) {
      console.error(`✗ ${bucket} ${m}: ${now}% (baseline ${base}%, dropped ${Math.abs(delta).toFixed(2)}pp)`);
      failed = true;
    } else {
      console.log(`✓ ${bucket} ${m}: ${now}% (baseline ${base}%)`);
    }
  });
});

if (failed) {
  console.error('\ncoverage-ratchet: coverage dropped below baseline. Add tests for your changes,');
  console.error('or (if a legitimate decrease, e.g. deleted code) run `npm run coverage:ratchet:update`.');
  process.exit(1);
}
console.log('\ncoverage-ratchet: OK');
