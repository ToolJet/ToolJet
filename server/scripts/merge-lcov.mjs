#!/usr/bin/env node
// Merge two or more lcov.info files (union of hits) into one, and print combined totals.
//
// The git-sync e2e coverage config emits lcovonly (not istanbul `json`), so scripts/merge-coverage.mjs
// (which needs coverage-final.json) can't combine the unit + e2e git-sync runs. This merges at the
// lcov level instead: a line/branch/function counts as covered if hit by EITHER run.
//
// Usage:
//   node scripts/merge-lcov.mjs <out.info> <in1.info> <in2.info> ...
//   e.g. node scripts/merge-lcov.mjs coverage-gitsync-combined/lcov.info \
//        coverage-gitsync/lcov.info coverage-gitsync-unit/lcov.info
import fs from 'node:fs';
import path from 'node:path';

function parseLcov(text) {
  const files = new Map(); // path -> { da:Map(line->hit), fn:Map(name->hit), br:Map(key->taken) }
  let cur = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('SF:')) {
      const p = line.slice(3);
      if (!files.has(p)) files.set(p, { da: new Map(), fn: new Map(), br: new Map() });
      cur = files.get(p);
    } else if (!cur) {
      continue;
    } else if (line.startsWith('DA:')) {
      const [ln, hit] = line.slice(3).split(',');
      cur.da.set(+ln, Math.max(cur.da.get(+ln) || 0, +hit));
    } else if (line.startsWith('FNDA:')) {
      const idx = line.indexOf(',');
      const hit = +line.slice(5, idx);
      const name = line.slice(idx + 1);
      cur.fn.set(name, Math.max(cur.fn.get(name) || 0, hit));
    } else if (line.startsWith('FN:')) {
      const name = line.slice(line.indexOf(',') + 1);
      if (!cur.fn.has(name)) cur.fn.set(name, 0);
    } else if (line.startsWith('BRDA:')) {
      const parts = line.slice(5).split(','); // line,block,branch,taken
      const key = parts.slice(0, 3).join(':');
      const taken = parts[3] === '-' ? 0 : +parts[3];
      cur.br.set(key, Math.max(cur.br.get(key) || 0, taken));
    } else if (line === 'end_of_record') {
      cur = null;
    }
  }
  return files;
}

function mergeInto(dst, src) {
  for (const [p, s] of src) {
    if (!dst.has(p)) dst.set(p, { da: new Map(), fn: new Map(), br: new Map() });
    const d = dst.get(p);
    for (const [k, v] of s.da) d.da.set(k, Math.max(d.da.get(k) || 0, v));
    for (const [k, v] of s.fn) d.fn.set(k, Math.max(d.fn.get(k) || 0, v));
    for (const [k, v] of s.br) d.br.set(k, Math.max(d.br.get(k) || 0, v));
  }
}

const [out, ...inputs] = process.argv.slice(2);
if (!out || inputs.length === 0) {
  console.error('Usage: node scripts/merge-lcov.mjs <out.info> <in1.info> <in2.info> ...');
  process.exit(1);
}
const missing = inputs.filter((f) => !fs.existsSync(f));
if (missing.length) {
  console.error(`Missing lcov input(s): ${missing.join(', ')}\nRun the suites with --coverage first.`);
  process.exit(1);
}

const merged = new Map();
for (const f of inputs) mergeInto(merged, parseLcov(fs.readFileSync(f, 'utf8')));

let LF = 0, LH = 0, FNF = 0, FNH = 0, BRF = 0, BRH = 0;
const perFile = [];
let lcovOut = '';
for (const [p, d] of merged) {
  const lf = d.da.size, lh = [...d.da.values()].filter((h) => h > 0).length;
  const fnf = d.fn.size, fnh = [...d.fn.values()].filter((h) => h > 0).length;
  const brf = d.br.size, brh = [...d.br.values()].filter((h) => h > 0).length;
  LF += lf; LH += lh; FNF += fnf; FNH += fnh; BRF += brf; BRH += brh;
  perFile.push({ p, lf, lh, pct: lf ? (lh / lf) * 100 : 100 });
  lcovOut += `SF:${p}\n`;
  for (const [name, hit] of d.fn) lcovOut += `FNDA:${hit},${name}\n`;
  lcovOut += `FNF:${fnf}\nFNH:${fnh}\n`;
  for (const [key, taken] of d.br) { const [l, b, br] = key.split(':'); lcovOut += `BRDA:${l},${b},${br},${taken || '-'}\n`; }
  lcovOut += `BRF:${brf}\nBRH:${brh}\n`;
  for (const [ln, hit] of [...d.da.entries()].sort((a, b) => a[0] - b[0])) lcovOut += `DA:${ln},${hit}\n`;
  lcovOut += `LF:${lf}\nLH:${lh}\nend_of_record\n`;
}
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, lcovOut);

const pct = (h, f) => (f ? ((h / f) * 100).toFixed(2) : '100.00');
console.log(`\nMerged ${inputs.length} lcov file(s) → ${out}\n`);
console.log(`=== COMBINED coverage ===`);
console.log(`Lines:      ${pct(LH, LF)}%  (${LH}/${LF})`);
console.log(`Functions:  ${pct(FNH, FNF)}%  (${FNH}/${FNF})`);
console.log(`Branches:   ${pct(BRH, BRF)}%  (${BRH}/${BRF})`);

perFile.sort((a, b) => a.pct - b.pct);
const rel = (p) => p.replace(process.cwd() + '/', '');
console.log(`\n=== lowest-coverage files (line% | covered/total) ===`);
for (const r of perFile.filter((r) => r.lf >= 20).slice(0, 20))
  console.log(`  ${String(r.pct.toFixed(1)).padStart(5)}% | ${String(r.lh).padStart(4)}/${String(r.lf).padStart(4)}  ${rel(r.p)}`);
