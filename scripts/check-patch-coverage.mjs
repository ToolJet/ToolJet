#!/usr/bin/env node
/**
 * Enforces the patch-coverage threshold for the ci-gate's 'Patch Coverage'
 * commit status.
 *
 * Reads the per-suite JSONs produced by compute-patch-coverage.mjs, unions
 * their per-file executable/covered line sets (a line covered by ANY suite
 * counts), and compares covered/executable against the threshold.
 *
 * Verdicts (written to $GITHUB_OUTPUT when set, always echoed to stdout):
 *   pass — coverage >= threshold
 *   fail — coverage <  threshold
 *   na   — nothing to enforce: no input files, no changed files, or zero
 *          changed executable lines (docs/config-only PRs, push events where
 *          patch coverage was never computed, or coverage merge skipped)
 *
 * Always exits 0 — the workflow step reads the verdict and decides; a crash
 * here must not flip the Gate job's conclusion.
 *
 * Usage:
 *   node scripts/check-patch-coverage.mjs \
 *     --inputs /tmp/patchcov/server.json,/tmp/patchcov/gitsync.json \
 *     --threshold 80
 */
import fs from 'node:fs';

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--inputs') a.inputs = argv[++i];
    else if (k === '--threshold') a.threshold = Number(argv[++i]);
  }
  if (!a.inputs || !Number.isFinite(a.threshold)) {
    console.error('Usage: check-patch-coverage.mjs --inputs <a.json,b.json> --threshold <pct>');
    process.exit(2);
  }
  return a;
}

function loadInputs(csv) {
  const out = [];
  for (const p of csv.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (!fs.existsSync(p)) continue;
    try {
      out.push(JSON.parse(fs.readFileSync(p, 'utf8')));
    } catch {
      /* skip malformed */
    }
  }
  return out;
}

// Same union as render-patch-coverage.mjs: Map<file, {exec:Set, cov:Set}>.
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

const args = parseArgs(process.argv.slice(2));
const inputs = loadInputs(args.inputs);
const byFile = unionByFile(inputs);

let exec = 0;
let cov = 0;
for (const e of byFile.values()) {
  exec += e.exec.size;
  cov += e.cov.size;
}

let verdict;
let pct = '';
if (inputs.length === 0 || exec === 0) {
  verdict = 'na';
} else {
  pct = ((cov / exec) * 100).toFixed(1);
  verdict = Number(pct) >= args.threshold ? 'pass' : 'fail';
}

const lines = [`verdict=${verdict}`, `pct=${pct}`, `covered=${cov}`, `executable=${exec}`];
for (const l of lines) console.log(l);
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, lines.join('\n') + '\n');
}
