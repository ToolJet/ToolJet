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

function key(number = 1) {
  return `GHSA-test-${number}|area-${number}/package-lock.json|package-${number}`;
}

function evaluate(alerts, tracking, now) {
  const directory = mkdtempSync(join(tmpdir(), 'dependabot-release-policy-'));
  const alertsPath = join(directory, 'alerts.json');
  const trackingPath = join(directory, 'tracking.json');
  writeFileSync(alertsPath, JSON.stringify(alerts));
  writeFileSync(trackingPath, JSON.stringify({ alerts: tracking }));

  return spawnSync(process.execPath, [script, alertsPath, trackingPath, now], {
    encoding: 'utf8',
  });
}

test('does not enforce runtime Critical blocking before 1 October 2026', () => {
  const result = evaluate(
    [alert({ severity: 'critical', scope: 'runtime' })],
    {},
    '2026-09-30T23:59:59Z'
  );
  assert.equal(result.status, 0, result.stderr);
});

test('blocks an unresolved runtime Critical from 1 October 2026', () => {
  const result = evaluate(
    [alert({ severity: 'critical', scope: 'runtime' })],
    {},
    '2026-10-01T00:00:00Z'
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unresolved runtime Critical/);
  assert.match(result.stderr, /GHSA-test-1/);
  assert.doesNotMatch(result.stderr, /#1|alerts\/1/);
});

test('blocks an overdue runtime High from 1 November 2026', () => {
  const result = evaluate(
    [alert({ severity: 'high', scope: 'runtime', createdAt: '2026-10-01T00:00:00Z' })],
    {},
    '2026-11-01T00:00:00Z'
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /overdue since/);
});

test('blocks an untracked lower-severity alert from 31 December 2026', () => {
  const result = evaluate(
    [alert({ severity: 'moderate', scope: 'runtime' })],
    {},
    '2026-12-31T00:00:00Z'
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing the required recorded remediation deadline/);
});

test('honors a complete unexpired exception', () => {
  const result = evaluate(
    [alert({ severity: 'high', scope: 'runtime' })],
    {
      [key()]: {
        owner: 'security-owner',
        deadline: '2026-09-03T00:00:00Z',
        exception: {
          justification: 'Compensating control is active',
          approvedBy: 'security-approver',
          expiresAt: '2026-10-15T00:00:00Z',
        },
      },
    },
    '2026-10-10T00:00:00Z'
  );
  assert.equal(result.status, 0, result.stderr);
});

test('does not allow an exception to bypass runtime Critical blocking', () => {
  const result = evaluate(
    [alert({ severity: 'critical', scope: 'runtime' })],
    {
      [key()]: {
        exception: {
          justification: 'Compensating control is active',
          approvedBy: 'security-approver',
          expiresAt: '2027-01-01T00:00:00Z',
        },
      },
    },
    '2026-10-01T00:00:00Z'
  );
  assert.equal(result.status, 1);
});

test('blocks an alert with an expired exception', () => {
  const result = evaluate(
    [alert({ severity: 'high', scope: 'runtime', createdAt: '2026-09-01T00:00:00Z' })],
    {
      [key()]: {
        exception: {
          justification: 'Temporary control',
          approvedBy: 'security-approver',
          expiresAt: '2026-10-31T00:00:00Z',
        },
      },
    },
    '2026-11-01T00:00:00Z'
  );
  assert.equal(result.status, 1);
});

test('allows a tracked lower-severity alert before its explicit deadline', () => {
  const result = evaluate(
    [alert({ severity: 'moderate', scope: 'runtime' })],
    { [key()]: { deadline: '2027-01-15T00:00:00Z' } },
    '2026-12-31T00:00:00Z'
  );
  assert.equal(result.status, 0, result.stderr);
});

test('normalizes medium severity to the moderate policy bucket', () => {
  const result = evaluate(
    [alert({ severity: 'medium', scope: 'runtime' })],
    {},
    '2026-12-31T00:00:00Z'
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /MODERATE runtime/);
});
