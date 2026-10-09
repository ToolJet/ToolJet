import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test, { describe } from 'node:test';

const script = new URL('./evaluate-dependabot-release-policy.mjs', import.meta.url).pathname;

function alert({
  number = 1,
  severity,
  scope,
  createdAt = '2026-09-01T00:00:00Z',
  name = `package-${number}`,
  manifest = `area-${number}/package-lock.json`,
  range = '< 2.0.0',
}) {
  return {
    number,
    created_at: createdAt,
    html_url: `https://github.example/alerts/${number}`,
    dependency: {
      package: { name },
      manifest_path: manifest,
      scope,
    },
    security_advisory: { ghsa_id: `GHSA-test-${number}`, severity },
    security_vulnerability: { vulnerable_version_range: range },
  };
}

// lockfile v3 with the given `node_modules/...` path -> version entries
function lockfile(installs) {
  const packages = { '': { name: 'root' } };
  for (const [path, version] of Object.entries(installs)) packages[path] = { version };
  return JSON.stringify({ lockfileVersion: 3, packages });
}

// `tree` maps relative paths to file contents; when given, it becomes --tree
function evaluate(alerts, now, tree) {
  const directory = mkdtempSync(join(tmpdir(), 'dependabot-release-policy-'));
  const alertsPath = join(directory, 'alerts.json');
  writeFileSync(alertsPath, JSON.stringify(alerts));

  const args = [script, alertsPath, now];
  if (tree) {
    const root = join(directory, 'tree');
    mkdirSync(root);
    for (const [path, contents] of Object.entries(tree)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), contents);
    }
    args.push('--tree', root);
  }
  return spawnSync(process.execPath, args, { encoding: 'utf8' });
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

describe('with --tree, a blocking alert already fixed in the branch', () => {
  const now = '2026-10-07T00:00:00Z';
  const critical = (overrides = {}) =>
    alert({ severity: 'critical', scope: 'runtime', name: 'simple-git', manifest: 'server/package-lock.json',
      range: '>= 3.15.0, < 4.0.1', ...overrides });

  test('passes when the branch lockfile has a patched version', () => {
    const result = evaluate([critical()], now, {
      'server/package-lock.json': lockfile({ 'node_modules/simple-git': '4.0.2' }),
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /1 blocking alert\(s\) already fixed/);
  });

  test('passes when the branch removed the package entirely', () => {
    const result = evaluate([critical()], now, {
      'server/package-lock.json': lockfile({ 'node_modules/other': '1.0.0' }),
    });
    assert.equal(result.status, 0, result.stderr);
  });

  test('still blocks when the branch lockfile is still vulnerable', () => {
    const result = evaluate([critical()], now, {
      'server/package-lock.json': lockfile({ 'node_modules/simple-git': '3.36.0' }),
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /simple-git in server\/package-lock.json/);
  });

  test('still blocks when any nested copy is still vulnerable', () => {
    const result = evaluate([critical()], now, {
      'server/package-lock.json': lockfile({
        'node_modules/simple-git': '4.0.2',
        'node_modules/some-tool/node_modules/simple-git': '3.20.0',
      }),
    });
    assert.equal(result.status, 1);
  });

  test('does not match packages that merely end with the same name', () => {
    const result = evaluate([critical()], now, {
      'server/package-lock.json': lockfile({
        'node_modules/simple-git': '4.0.2',
        'node_modules/not-simple-git': '1.0.0',
      }),
    });
    assert.equal(result.status, 0, result.stderr);
  });

  test('treats a prerelease of the fixed version as still vulnerable', () => {
    const result = evaluate([critical()], now, {
      'server/package-lock.json': lockfile({ 'node_modules/simple-git': '4.0.1-beta.1' }),
    });
    assert.equal(result.status, 1);
  });

  test('handles inclusive upper bounds', () => {
    const tree = (version) => ({ 'server/package-lock.json': lockfile({ 'node_modules/simple-git': version }) });
    const atBound = evaluate([critical({ range: '<= 2.0.2' })], now, tree('2.0.2'));
    const above = evaluate([critical({ range: '<= 2.0.2' })], now, tree('2.0.3'));
    assert.equal(atBound.status, 1);
    assert.equal(above.status, 0, above.stderr);
  });
});

describe('with --tree, anything unverifiable keeps blocking (fail closed)', () => {
  const now = '2026-10-07T00:00:00Z';
  const critical = (overrides = {}) =>
    alert({ severity: 'critical', scope: 'runtime', name: 'simple-git', manifest: 'server/package-lock.json',
      range: '< 4.0.1', ...overrides });
  const fixedTree = { 'server/package-lock.json': lockfile({ 'node_modules/simple-git': '4.0.2' }) };

  test('blocks when the lockfile is missing from the branch', () => {
    assert.equal(evaluate([critical()], now, {}).status, 1);
  });

  test('blocks when the lockfile is not valid JSON', () => {
    assert.equal(evaluate([critical()], now, { 'server/package-lock.json': '{oops' }).status, 1);
  });

  test('blocks when the lockfile is v1 (no packages map)', () => {
    const v1 = JSON.stringify({ lockfileVersion: 1, dependencies: { 'simple-git': { version: '4.0.2' } } });
    assert.equal(evaluate([critical()], now, { 'server/package-lock.json': v1 }).status, 1);
  });

  test('blocks when the alert range cannot be parsed', () => {
    assert.equal(evaluate([critical({ range: 'unknown' })], now, fixedTree).status, 1);
  });

  test('blocks when the installed version cannot be parsed', () => {
    const tree = { 'server/package-lock.json': lockfile({ 'node_modules/simple-git': 'github:x/y' }) };
    assert.equal(evaluate([critical()], now, tree).status, 1);
  });

  test('blocks package.json-only manifests (no installed version to check)', () => {
    const tree = { 'plugins/packages/smtp/package.json': JSON.stringify({ dependencies: { 'simple-git': '^4.0.2' } }) };
    assert.equal(evaluate([critical({ manifest: 'plugins/packages/smtp/package.json' })], now, tree).status, 1);
  });

  test('blocks a manifest path that escapes the checkout', () => {
    assert.equal(evaluate([critical({ manifest: '../server/package-lock.json' })], now, fixedTree).status, 1);
  });
});

test('without --tree, a fixed branch still blocks (default-branch-only behavior)', () => {
  const result = evaluate(
    [alert({ severity: 'critical', scope: 'runtime' })],
    '2026-10-07T00:00:00Z'
  );
  assert.equal(result.status, 1);
});

test('ignores alerts in the docs/ site, which is not shipped', () => {
  const result = evaluate(
    [alert({ severity: 'critical', scope: 'runtime', manifest: 'docs/package-lock.json' })],
    '2026-12-31T00:00:00Z'
  );
  assert.equal(result.status, 0, result.stderr);
});

test('still blocks lockfiles that only contain "docs" deeper in the path', () => {
  const result = evaluate(
    [alert({ severity: 'critical', scope: 'runtime', manifest: 'plugins/packages/docs/package-lock.json' })],
    '2026-12-31T00:00:00Z'
  );
  assert.equal(result.status, 1);
});
