import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const script = new URL('./evaluate-dependabot-release-policy.mjs', import.meta.url).pathname;

function alert({ number = 1, severity, scope, createdAt = '2026-09-01T00:00:00Z' }) {
  return {
    number,
    created_at: createdAt,
    html_url: `https://github.example/alerts/${number}`,
    dependency: {
      package: { name: `package-${number}` },
      manifest_path: `area-${number}/package-lock.json`,
      scope,
    },
    security_advisory: { ghsa_id: `GHSA-test-${number}`, severity },
  };
}

function evaluate(alerts, now) {
  const directory = mkdtempSync(join(tmpdir(), 'dependabot-release-policy-'));
  const alertsPath = join(directory, 'alerts.json');
  writeFileSync(alertsPath, JSON.stringify(alerts));

  return spawnSync(process.execPath, [script, alertsPath, now], { encoding: 'utf8' });
}

test('passes when there are no open alerts', () => {
  const result = evaluate([], '2026-12-31T00:00:00Z');
  assert.equal(result.status, 0, result.stderr);
});

test('does not block a runtime Critical before 1 October 2026', () => {
  const result = evaluate(
    [alert({ severity: 'critical', scope: 'runtime' })],
    '2026-09-30T23:59:59Z'
  );
  assert.equal(result.status, 0, result.stderr);
});

test('blocks an unresolved runtime Critical from 1 October 2026', () => {
  const result = evaluate(
    [alert({ severity: 'critical', scope: 'runtime' })],
    '2026-10-01T00:00:00Z'
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unresolved runtime Critical/);
  assert.match(result.stderr, /GHSA-test-1/);
  assert.doesNotMatch(result.stderr, /#1|alerts\/1/);
});

test('does not block an overdue runtime High before 1 November 2026', () => {
  const result = evaluate(
    [alert({ severity: 'high', scope: 'runtime', createdAt: '2026-09-01T00:00:00Z' })],
    '2026-10-15T00:00:00Z'
  );
  assert.equal(result.status, 0, result.stderr);
});

test('blocks an overdue runtime High from 1 November 2026', () => {
  const result = evaluate(
    [alert({ severity: 'high', scope: 'runtime', createdAt: '2026-10-01T00:00:00Z' })],
    '2026-11-01T00:00:00Z'
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /overdue since/);
});

test('does not block a runtime High that is still within its deadline', () => {
  const result = evaluate(
    [alert({ severity: 'high', scope: 'runtime', createdAt: '2026-10-30T00:00:00Z' })],
    '2026-11-01T00:00:00Z'
  );
  assert.equal(result.status, 0, result.stderr);
});

test('blocks an overdue development Critical from 31 December 2026', () => {
  const result = evaluate(
    [alert({ severity: 'critical', scope: 'development', createdAt: '2026-11-01T00:00:00Z' })],
    '2026-12-31T00:00:00Z'
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /overdue since/);
});

test('blocks an overdue moderate alert from 31 December 2026 (30-day window)', () => {
  const result = evaluate(
    [alert({ severity: 'moderate', scope: 'runtime', createdAt: '2026-01-01T00:00:00Z' })],
    '2026-12-31T00:00:00Z'
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /overdue since/);
});

test('treats medium as moderate with the same 30-day window', () => {
  const result = evaluate(
    [alert({ severity: 'medium', scope: 'runtime', createdAt: '2026-01-01T00:00:00Z' })],
    '2026-12-31T00:00:00Z'
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /MODERATE/);
});

test('does not block a moderate alert still within its 30-day window', () => {
  const result = evaluate(
    [alert({ severity: 'moderate', scope: 'runtime', createdAt: '2026-12-15T00:00:00Z' })],
    '2026-12-31T00:00:00Z'
  );
  assert.equal(result.status, 0, result.stderr);
});

test('blocks an overdue low alert from 31 December 2026 (60-day window)', () => {
  const result = evaluate(
    [alert({ severity: 'low', scope: 'runtime', createdAt: '2026-01-01T00:00:00Z' })],
    '2026-12-31T00:00:00Z'
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /overdue since/);
});

test('does not block a low alert still within its 60-day window', () => {
  const result = evaluate(
    [alert({ severity: 'low', scope: 'runtime', createdAt: '2026-11-15T00:00:00Z' })],
    '2026-12-31T00:00:00Z'
  );
  assert.equal(result.status, 0, result.stderr);
});

test('does not enforce moderate or low before 31 December 2026', () => {
  const result = evaluate(
    [
      alert({ number: 1, severity: 'moderate', scope: 'runtime', createdAt: '2026-01-01T00:00:00Z' }),
      alert({ number: 2, severity: 'low', scope: 'runtime', createdAt: '2026-01-01T00:00:00Z' }),
    ],
    '2026-12-30T23:59:59Z'
  );
  assert.equal(result.status, 0, result.stderr);
});

test('exits 2 on a malformed alerts file', () => {
  const result = evaluate({ not: 'an array' }, '2026-12-31T00:00:00Z');
  assert.equal(result.status, 2);
});
