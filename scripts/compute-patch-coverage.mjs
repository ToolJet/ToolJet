#!/usr/bin/env node
// Computes PATCH coverage for one test suite: of the lines this PR added/modified,
// how many are covered by that suite's tests. Emits a tiny JSON (only the changed
// lines) so the CI Gate can union suites and render the comment without shipping
// full coverage maps around.
//
// Zero dependencies (pure node + git) — runs inside the test jobs, which have git
// history AND the checked-out submodules (server/ee), then uploads the small result.
//
// SUBMODULES: git-sync code lives in the `server/ee` submodule, so a superproject
// `git diff` only shows a gitlink bump, not line changes. This diffs INSIDE each
// changed submodule (between the base/head gitlink SHAs) and prefixes the paths so
// they line up with the lcov (whose paths are rooted at server/, e.g. `ee/…`).
//
// Model: a changed line is COVERED / UNCOVERED only if it is an executable line in
// the lcov (a `DA:` record). Changed lines with no DA (comments, blanks, type-only)
// or in files the suite never instrumented are ignored — so the denominator is
// exactly "changed lines this suite could have covered". Disjoint suites (server
// excludes git-sync and vice-versa) are unioned later at render time.
//
// Usage:
//   node scripts/compute-patch-coverage.mjs \
//     --lcov server/coverage-combined/lcov.info \
//     --suite server --base <BASE_SHA> \
//     --out /tmp/patch-coverage.server.json
//
// Output JSON: { suite, base, files: [ { file, executable:[lines], covered:[lines] } ] }

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

function parseArgs(argv) {
  const a = { lcov: null, suite: null, base: 'origin/develop', out: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--lcov') a.lcov = argv[++i];
    else if (k === '--suite') a.suite = argv[++i];
    else if (k === '--base') a.base = argv[++i];
    else if (k === '--out') a.out = argv[++i];
  }
  if (!a.lcov || !a.suite || !a.out) {
    console.error('Usage: compute-patch-coverage.mjs --lcov <lcov.info> --suite <name> --base <ref> --out <json>');
    process.exit(2);
  }
  return a;
}

// Normalise any coverage/diff path to a `src/…` or `ee/…` key rooted below server/,
// so istanbul's lcov paths and git's diff paths line up.
function canon(p) {
  return p
    .replace(/\\/g, '/')
    .replace(/^.*?\/server\//, '')
    .replace(/^server\//, '');
}

function git(args, opts = {}) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 128, ...opts });
  } catch (e) {
    return e.stdout ? String(e.stdout) : '';
  }
}
function gitOk(args, opts = {}) {
  try {
    execFileSync('git', args, { stdio: 'ignore', ...opts });
    return true;
  } catch {
    return false;
  }
}

// Parse a `git diff --unified=0` body into Map<canonKey, Set<newLineNo>> of added
// lines (new side only). `prefix` is prepended to each file (for submodule paths).
function parseDiff(out, prefix = '') {
  const files = new Map();
  let cur = null;
  let inHunk = false;
  let newLine = 0;
  for (const raw of out.split('\n')) {
    if (raw.startsWith('diff --git ')) {
      cur = null;
      inHunk = false;
    } else if (raw.startsWith('+++ ')) {
      // File header (always before the first @@ of this file), never a content line.
      const p = raw.slice(4).replace(/^b\//, '');
      if (p === '/dev/null') {
        cur = null;
      } else {
        cur = new Set();
        files.set(canon(prefix ? `${prefix}/${p}` : p), cur);
      }
      inHunk = false;
    } else if (raw.startsWith('@@')) {
      const m = raw.match(/\+(\d+)(?:,(\d+))?/); // @@ -a,b +c,d @@ → new side at c
      newLine = m ? parseInt(m[1], 10) : 0;
      inHunk = true;
    } else if (inHunk && cur && raw[0] === '+') {
      cur.add(newLine); // any '+' inside a hunk is added content (incl. "++x")
      newLine++;
    }
  }
  return files;
}

const DIFF_ARGS = ['diff', '--unified=0', '--no-color', '--diff-filter=d'];

// Submodule paths declared in .gitmodules (e.g. server/ee, frontend/ee).
function submodulePaths() {
  const out = git(['config', '--file', '.gitmodules', '--get-regexp', 'path']);
  return out
    .split('\n')
    .map((l) => l.trim().split(/\s+/)[1])
    .filter(Boolean);
}

// Changed lines inside a submodule, between the base/head gitlink SHAs, prefixed
// with the submodule path so they canon() to the same keys as the lcov.
function submoduleChangedLines(subPath, base) {
  const oldSha = git(['rev-parse', `${base}:${subPath}`]).trim();
  const newSha = git(['rev-parse', `HEAD:${subPath}`]).trim();
  if (!oldSha || !newSha || oldSha === newSha) return new Map();
  // The base gitlink SHA may be absent on a shallow checkout — best-effort fetch.
  if (!gitOk(['-C', subPath, 'cat-file', '-e', oldSha])) {
    gitOk(['-C', subPath, 'fetch', '--no-tags', '--depth=1', 'origin', oldSha]);
  }
  if (!gitOk(['-C', subPath, 'cat-file', '-e', oldSha])) {
    console.error(`[patch-coverage] base SHA ${oldSha.slice(0, 8)} unreachable in ${subPath}; skipping its diff`);
    return new Map();
  }
  const out = git(['-C', subPath, ...DIFF_ARGS, oldSha, newSha]);
  return parseDiff(out, subPath);
}

const args = parseArgs(process.argv.slice(2));

// Only THIS branch's changes: prefer the merge-base, fall back to the raw base when
// it isn't reachable (shallow checkout) — a direct base..HEAD diff is still the PR.
const mergeBase = git(['merge-base', args.base, 'HEAD']).trim() || args.base;

// Superproject files + every changed submodule's internal files.
const changed = parseDiff(git([...DIFF_ARGS, mergeBase, 'HEAD']));
for (const sub of submodulePaths()) {
  for (const [file, lines] of submoduleChangedLines(sub, mergeBase)) {
    const set = changed.get(file) || new Set();
    for (const ln of lines) set.add(ln);
    changed.set(file, set);
  }
}

const lcov = fs.existsSync(args.lcov) ? parseLcovDA(fs.readFileSync(args.lcov, 'utf8')) : new Map();

function parseLcovDA(text) {
  const files = new Map();
  let cur = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('SF:')) {
      const key = canon(line.slice(3));
      cur = files.get(key) || new Map();
      files.set(key, cur);
    } else if (cur && line.startsWith('DA:')) {
      const [ln, hit] = line.slice(3).split(',');
      const n = +ln;
      cur.set(n, Math.max(cur.get(n) || 0, +hit));
    } else if (line === 'end_of_record') {
      cur = null;
    }
  }
  return files;
}

const files = [];
for (const [file, lines] of changed) {
  const da = lcov.get(file);
  if (!da) continue; // file not instrumented by this suite → out of scope here
  const executable = [];
  const covered = [];
  for (const ln of lines) {
    if (!da.has(ln)) continue; // non-executable changed line (comment/blank/type)
    executable.push(ln);
    if (da.get(ln) > 0) covered.push(ln);
  }
  if (executable.length) {
    executable.sort((a, b) => a - b);
    covered.sort((a, b) => a - b);
    files.push({ file, executable, covered });
  }
}

const totalExec = files.reduce((n, f) => n + f.executable.length, 0);
const totalCov = files.reduce((n, f) => n + f.covered.length, 0);

fs.writeFileSync(args.out, JSON.stringify({ suite: args.suite, base: mergeBase, files }, null, 2));
console.log(
  `[patch-coverage:${args.suite}] ${totalCov}/${totalExec} changed executable lines covered ` +
    `across ${files.length} file(s) (base ${mergeBase.slice(0, 12)}) → ${args.out}`
);
