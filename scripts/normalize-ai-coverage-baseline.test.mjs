import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { normalizeBaseline, repositoryPath, unchangedFiles } from './normalize-ai-coverage-baseline.mjs';

const counts = (total, covered) =>
  Object.fromEntries(
    ['lines', 'statements', 'functions', 'branches'].map((metric) => [
      metric,
      { total, covered, skipped: 0, pct: total ? Math.floor((covered / total) * 10000) / 100 : 100 },
    ])
  );
const existing = 'server/src/modules/ledger/service.ts';
const omitted = 'server/ee/ai/helpers/catalog.ts';

test('counts only unchanged, previously omitted AI sources as uncovered in the baseline', () => {
  const baseline = { total: counts(100, 60), [existing]: counts(100, 60) };
  const current = { total: counts(150, 90), [existing]: counts(100, 60), [omitted]: counts(50, 30) };
  const { summary, added } = normalizeBaseline(baseline, current, [omitted]);
  assert.deepEqual(added, [omitted]);
  assert.deepEqual(summary.total.lines, { total: 150, covered: 60, skipped: 0, pct: 40 });
  assert.equal(summary[omitted].lines.covered, 0);
  assert.equal(baseline.total.lines.total, 100);
});

test('does not normalize new or modified AI source files, preserving the original floor', () => {
  const baseline = { total: counts(100, 60), [existing]: counts(100, 60) };
  const current = { total: counts(150, 60), [existing]: counts(100, 60), [omitted]: counts(50, 0) };
  const { summary, added } = normalizeBaseline(baseline, current, []);
  assert.deepEqual(added, []);
  assert.equal(summary.total.lines.pct, 60);
  assert.ok(current.total.lines.pct < summary.total.lines.pct - 0.1);
});

test('leaves existing baseline coverage and later normalized baselines unchanged', () => {
  const baseline = { total: counts(150, 80), [existing]: counts(100, 60), [omitted]: counts(50, 20) };
  const current = { total: counts(150, 70), [existing]: counts(100, 50), [omitted]: counts(50, 20) };
  const { summary, added } = normalizeBaseline(baseline, current, [omitted]);
  assert.deepEqual(summary, baseline);
  assert.deepEqual(added, []);
  assert.ok(current.total.lines.pct < summary.total.lines.pct - 0.1);
});

test('rejects malformed counts instead of lowering the baseline', () => {
  const baseline = { total: counts(100, 60), [existing]: counts(100, 60) };
  const current = { total: counts(150, 90), [omitted]: counts(-1, 0) };
  assert.throws(() => normalizeBaseline(baseline, current, [omitted]), /Invalid lines/);
});

test('normalizes coverage paths without depending on a checkout location', () => {
  assert.equal(repositoryPath('server/ee/ai/service.ts'), 'server/ee/ai/service.ts');
  assert.equal(repositoryPath('ee/ai/service.ts'), 'server/ee/ai/service.ts');
  assert.equal(
    repositoryPath(`${process.cwd()}/server/src/modules/ai/controller.ts`),
    'server/src/modules/ai/controller.ts'
  );
  assert.throws(() => repositoryPath('unrelated/file.ts'), /Unrecognized/);
});

test('Git provenance excludes new and modified files in both public and private repositories', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-provenance-'));
  const root = path.join(temporary, 'public');
  const enterprise = path.join(temporary, 'private');
  const git = (cwd, ...args) =>
    execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const initialize = (cwd, prefix) => {
    fs.mkdirSync(path.join(cwd, prefix), { recursive: true });
    git(cwd, 'init', '-q');
    git(cwd, 'config', 'user.name', 'Coverage fixture');
    git(cwd, 'config', 'user.email', 'coverage@example.invalid');
    for (const file of ['unchanged.ts', 'modified.ts'])
      fs.writeFileSync(path.join(cwd, prefix, file), 'export const value = 1;\n');
    git(cwd, 'add', '.');
    git(cwd, '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'baseline');
    const baseline = git(cwd, 'rev-parse', 'HEAD');
    for (const file of ['new.ts', 'modified.ts'])
      fs.writeFileSync(path.join(cwd, prefix, file), 'export const value = 2;\n');
    git(cwd, 'add', '.');
    git(cwd, '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'current');
    return baseline;
  };
  try {
    const baseline = initialize(root, 'server/src/modules/ai');
    const enterpriseBaseline = initialize(enterprise, 'ai');
    const files = ['server/src/modules/ai/', 'server/ee/ai/'].flatMap((prefix) =>
      ['unchanged.ts', 'modified.ts', 'new.ts'].map((file) => prefix + file)
    );
    assert.deepEqual(unchangedFiles(files, root, baseline, enterprise, enterpriseBaseline), [
      'server/src/modules/ai/unchanged.ts',
      'server/ee/ai/unchanged.ts',
    ]);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
