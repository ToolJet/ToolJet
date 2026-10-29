#!/usr/bin/env node
// Derive separate AI reports from the normal suite without executing tests twice.
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const [pkg, input, output] = process.argv.slice(2);
if (!['server', 'frontend'].includes(pkg) || !input || !output) {
  throw new Error('Usage: report-ai-coverage.cjs server|frontend coverage-final.json output-directory');
}
const root = path.resolve(__dirname, '..');
const cwd = path.join(root, pkg);
const localRequire = createRequire(path.join(cwd, 'package.json'));
const { createCoverageMap } = localRequire('istanbul-lib-coverage');
const { createContext } = localRequire('istanbul-lib-report');
const reports = localRequire('istanbul-reports');
const { editionFor, sourceFiles } = require('./ai-test-scope.cjs');
const edition = editionFor(pkg);
const expected = sourceFiles(pkg, edition);
if (!expected.length) throw new Error('AI source scope is empty');
const raw = JSON.parse(fs.readFileSync(input, 'utf8'));
const map = createCoverageMap({});
const seen = new Set();
for (const [file, coverage] of Object.entries(raw)) {
  const absolute = path.isAbsolute(file) ? file : path.resolve(root, file);
  const relative = path.relative(cwd, absolute).split(path.sep).join('/');
  if (!expected.includes(relative)) continue;
  // Portable report paths; source lookup remains anchored to this checkout.
  const portable = `${pkg}/${relative}`;
  map.addFileCoverage({ ...coverage, path: portable });
  seen.add(relative);
}
const missing = expected.filter((file) => !seen.has(file));
if (missing.length) throw new Error(`AI coverage omitted ${missing.length} source files:\n${missing.join('\n')}`);
const context = createContext({
  dir: output,
  coverageMap: map,
  sourceFinder: (file) => fs.readFileSync(path.join(root, file), 'utf8'),
});
for (const reporter of ['json', 'json-summary', 'html', 'lcovonly']) reports.create(reporter).execute(context);
const summary = map.getCoverageSummary().toJSON();
console.log(
  `${pkg} ${edition}: ${seen.size} AI source files; lines ${summary.lines.pct}%, branches ${summary.branches.pct}%, functions ${summary.functions.pct}%`
);
// Floors are rounded down from measured full-scope baselines, not targets or a
// claim of sufficient coverage. Critical newly exercised behaviors get higher floors.
const floors = require('./ai-coverage-thresholds.json')[pkg];
const failures = [];
if (summary.lines.total === 0 || summary.lines.pct < floors.lines[edition === 'ce' ? 'ce' : 'ee']) {
  failures.push(`AI line coverage ${summary.lines.pct}% is below its measured baseline`);
}
for (const [file, floor] of Object.entries(floors.files)) {
  if (edition === 'ce' && file.startsWith('ee/')) continue;
  const coverage = map.fileCoverageFor(`${pkg}/${file}`).toSummary();
  if (coverage.lines.pct < floor) failures.push(`${file}: ${coverage.lines.pct}% lines, minimum ${floor}%`);
}
if (failures.length) throw new Error(failures.join('\n'));
