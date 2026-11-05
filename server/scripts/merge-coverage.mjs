#!/usr/bin/env node
// Merges coverage-final.json files found (recursively) under one or more input
// directories and emits the requested istanbul reporters into --out.
//
// Replaces `npx nyc merge` / `npx nyc report`: nyc is not a declared dependency here,
// so those calls fetched it over the network on every run, and both call sites
// silenced errors — which is how a previous input path mismatch went unnoticed.
// This walks recursively (nyc merge does not), so it also handles the sharded
// coverage-e2e/shard-N/coverage-final.json layout directly.
//
// Usage:
//   node scripts/merge-coverage.mjs --out <dir> <input>...

import fs from 'node:fs';
import path from 'node:path';
import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

function parseArgs(argv) {
  const args = { out: null, reporters: ['json', 'html', 'lcovonly', 'json-summary'], inputs: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--out') args.out = argv[++i];
    else if (arg === '--reporters') args.reporters = argv[++i].split(',');
    else args.inputs.push(arg);
  }
  if (!args.out || args.inputs.length === 0) {
    console.error('Usage: merge-coverage.mjs --out <dir> [--reporters json,html,lcovonly,json-summary] <input>...');
    process.exit(1);
  }
  return args;
}

function findCoverageFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const found = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name === 'coverage-final.json') found.push(full);
    }
  }
  return found;
}

const { out, reporters, inputs } = parseArgs(process.argv.slice(2));

const files = inputs.flatMap(findCoverageFiles);
if (files.length === 0) {
  console.error(`No coverage-final.json found under: ${inputs.join(', ')}`);
  console.error('Run the test suites with --coverage first.');
  process.exit(1);
}

console.log(`Merging ${files.length} coverage file(s):`);
files.forEach((f) => console.log(`  ${f}`));

const map = libCoverage.createCoverageMap({});
for (const file of files) {
  map.merge(JSON.parse(fs.readFileSync(file, 'utf8')));
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const context = libReport.createContext({ dir: out, coverageMap: map });
for (const reporter of reporters) {
  reports.create(reporter, {}).execute(context);
}

console.log(`\nCoverage report written to ${out}/`);
