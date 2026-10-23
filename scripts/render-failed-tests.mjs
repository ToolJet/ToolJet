#!/usr/bin/env node
// Renders jest --json results as PR-comment markdown fragments.
//
// Usage:
//   node render-failed-tests.mjs row unit|e2e   → table cell ("✅ 246 passed" /
//                                                 "❌ 2 failed · 244 passed — [step ↗](url)")
//                                                 empty output when no results found
//   node render-failed-tests.mjs details        → nested <details> block with failing
//                                                 tests only; empty output when none
//
// Env: UNIT_JSON (jest --json file), E2E_JSON_DIR (dir of per-shard jsons),
//      UNIT_STEP_URL, E2E_STEP_URL (job log links, optional)

import fs from 'node:fs';
import path from 'node:path';

const MAX_FAILURES = 20;
const MAX_ERR_LINES = 8;
const MAX_ERR_CHARS = 400;

const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, '');

function loadUnit() {
  const p = process.env.UNIT_JSON;
  if (!p || !fs.existsSync(p)) return null;
  try {
    return [JSON.parse(fs.readFileSync(p, 'utf8'))];
  } catch {
    return null;
  }
}

function loadE2e() {
  const dir = process.env.E2E_JSON_DIR;
  if (!dir || !fs.existsSync(dir)) return null;
  const runs = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    try {
      runs.push(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
    } catch {
      // partial shard output (crashed mid-write) — skip
    }
  }
  return runs.length ? runs : null;
}

function counts(runs) {
  return runs.reduce(
    (a, r) => ({
      passed: a.passed + (r.numPassedTests || 0),
      failed: a.failed + (r.numFailedTests || 0),
    }),
    { passed: 0, failed: 0 }
  );
}

function failures(runs) {
  const out = [];
  for (const r of runs) {
    for (const tr of r.testResults || []) {
      const file = tr.name || tr.testFilePath || '';
      const m = file.match(/test\/modules\/([^/]+)\//);
      const mod = m ? m[1] : 'server';
      let hadAssertionFailure = false;
      for (const a of tr.assertionResults || []) {
        if (a.status !== 'failed') continue;
        hadAssertionFailure = true;
        out.push({
          mod,
          title: a.title,
          crumb: (a.ancestorTitles || []).join(' › '),
          error: stripAnsi((a.failureMessages || []).join('\n')),
        });
      }
      // suite crashed before running assertions (import error, timeout)
      if (tr.status === 'failed' && !hadAssertionFailure) {
        out.push({
          mod,
          title: path.basename(file),
          crumb: 'suite failed to run',
          error: stripAnsi(tr.message || ''),
        });
      }
    }
  }
  return out;
}

function trimError(e) {
  let trimmed = e.split('\n').slice(0, MAX_ERR_LINES).join('\n').trimEnd();
  if (trimmed.length > MAX_ERR_CHARS) trimmed = trimmed.slice(0, MAX_ERR_CHARS) + '…';
  return trimmed.replace(/```/g, "'''");
}

function section(label, runs, stepUrl) {
  const fails = failures(runs);
  if (!fails.length) return '';
  const shown = fails.slice(0, MAX_FAILURES);
  const parts = ['<details>', `<summary><b>${label} · ${fails.length} failed</b></summary>`, ''];
  shown.forEach((f, i) => {
    parts.push(`**${i + 1} · \`${f.mod}\` — ${f.title}**`);
    if (f.crumb) parts.push(`<sub>${f.crumb}</sub>`);
    parts.push('', '```', trimError(f.error) || '(no error message captured)', '```', '');
  });
  if (fails.length > shown.length) {
    const link = stepUrl ? ` — [full log ↗](${stepUrl})` : '';
    parts.push(`_…and ${fails.length - shown.length} more${link}_`, '');
  }
  parts.push('</details>');
  return parts.join('\n');
}

const [, , cmd, suite] = process.argv;
const unit = loadUnit();
const e2e = loadE2e();

if (cmd === 'row') {
  const runs = suite === 'unit' ? unit : e2e;
  if (!runs) process.exit(0); // caller falls back to the job-result cell
  const url = suite === 'unit' ? process.env.UNIT_STEP_URL : process.env.E2E_STEP_URL;
  const { passed, failed } = counts(runs);
  const link = url ? ` — [step ↗](${url})` : '';
  console.log(failed ? `❌ ${failed} failed · ${passed} passed${link}` : `✅ ${passed} passed${link}`);
} else if (cmd === 'details') {
  const sections = [
    unit ? section('Unit', unit, process.env.UNIT_STEP_URL) : '',
    e2e ? section('E2E', e2e, process.env.E2E_STEP_URL) : '',
  ].filter(Boolean);
  if (!sections.length) process.exit(0);
  const total = (unit ? failures(unit).length : 0) + (e2e ? failures(e2e).length : 0);
  console.log(
    [
      '<details>',
      `<summary><b>❌ ${total} failing test${total === 1 ? '' : 's'}</b></summary>`,
      '',
      sections.join('\n\n'),
      '',
      '</details>',
    ].join('\n')
  );
} else {
  console.error(`unknown command: ${cmd}`);
  process.exit(1);
}
