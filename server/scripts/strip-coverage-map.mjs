#!/usr/bin/env node
// Strips the embedded coverageMap from jest --json result files.
//
// jest attaches a full coverageMap to the AggregatedResults object whenever --coverage
// is set (@jest/reporters CoverageReporter.onRunComplete), and --json --outputFile
// serializes that object as-is — so every untested-file 0% entry rides along in a file
// meant to report pass/fail counts. coverage-final.json is already the authoritative
// report; this is pure duplication (confirmed empirically: ~12MB for one spec file).
//
// Usage: node strip-coverage-map.mjs <file>...  (missing files are skipped)

import fs from 'node:fs';

for (const file of process.argv.slice(2)) {
  if (!fs.existsSync(file)) continue;
  const results = JSON.parse(fs.readFileSync(file, 'utf8'));
  delete results.coverageMap;
  fs.writeFileSync(file, JSON.stringify(results));
}
