#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const enforcement = {
  runtimeCritical: new Date('2026-10-01T00:00:00Z'),
  overdueRuntimeHigh: new Date('2026-11-01T00:00:00Z'),
  anyOverdue: new Date('2026-12-31T00:00:00Z'),
};

// Remediation windows (in days) measured from an alert's creation date, keyed by
// `scope:severity`. Any scope:severity without an entry here has no policy-defined
// deadline and never blocks on the overdue rules below.
const defaultDeadlineDays = {
  'runtime:critical': 2,
  'runtime:high': 7,
  'runtime:moderate': 30,
  'runtime:low': 60,
  'development:critical': 30,
  'development:high': 30,
  'development:moderate': 30,
  'development:low': 60,
};

function parseJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseDate(value, label) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error(`Invalid ${label}: ${value}`);
  return date;
}

function normalizeSeverity(value) {
  return value === 'medium' ? 'moderate' : value;
}

function trackingKey(alert) {
  const ghsa = alert.security_advisory?.ghsa_id;
  const manifest = alert.dependency?.manifest_path;
  const packageName = alert.dependency?.package?.name;
  if (!ghsa || !manifest || !packageName) {
    throw new Error('An alert is missing its GHSA, manifest path, or package name');
  }
  return `${ghsa}|${manifest}|${packageName}`;
}

function deadlineFor(alert) {
  const key = `${alert.dependency?.scope}:${normalizeSeverity(alert.security_advisory?.severity)}`;
  const days = defaultDeadlineDays[key];
  if (days === undefined) return null;

  const deadline = parseDate(alert.created_at, `creation date for ${trackingKey(alert)}`);
  deadline.setUTCDate(deadline.getUTCDate() + days);
  return deadline;
}

// --- Branch awareness -------------------------------------------------------
// Dependabot alerts are computed from the default branch, so a PR that bumps a
// vulnerable package still sees the alert open until it merges. With --tree, each
// alert is re-checked against the lockfile in the checked-out branch: if every
// installed copy of the package is outside the vulnerable range, the alert is
// already fixed there and does not block. Anything we cannot verify keeps
// blocking (fail closed): a missing/unparsable lockfile, a package.json-only
// manifest, an unparsable range or version, or a lockfile entry with no version.

function parseVersion(value) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/.exec(String(value).trim());
  if (!match) return null;
  return { core: [Number(match[1]), Number(match[2]), Number(match[3])], pre: match[4] ? match[4].split('.') : [] };
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a.core[i] !== b.core[i]) return a.core[i] < b.core[i] ? -1 : 1;
  }
  // a release sorts above any of its prereleases (1.0.0-beta < 1.0.0)
  if (!a.pre.length || !b.pre.length) return b.pre.length - a.pre.length;
  for (let i = 0; i < Math.max(a.pre.length, b.pre.length); i += 1) {
    if (a.pre[i] === undefined) return -1;
    if (b.pre[i] === undefined) return 1;
    const [x, y] = [a.pre[i], b.pre[i]];
    const [xNum, yNum] = [/^\d+$/.test(x), /^\d+$/.test(y)];
    if (x === y) continue;
    if (xNum && yNum) return Number(x) < Number(y) ? -1 : 1;
    if (xNum !== yNum) return xNum ? -1 : 1;
    return x < y ? -1 : 1;
  }
  return 0;
}

// GitHub advisory ranges: comparators joined by commas, all must hold
// (e.g. ">= 3.15.0, < 4.0.1", "<= 2.0.2", "= 3.1.0"). Returns null when unparsable.
function parseRange(range) {
  if (typeof range !== 'string' || !range.trim()) return null;
  const comparators = [];
  for (const part of range.split(',')) {
    const match = /^\s*(<=|>=|<|>|=)\s*(\S+)\s*$/.exec(part);
    const version = match && parseVersion(match[2]);
    if (!version) return null;
    comparators.push({ op: match[1], version });
  }
  return comparators;
}

function inRange(version, comparators) {
  return comparators.every(({ op, version: bound }) => {
    const cmp = compareVersions(version, bound);
    return { '<': cmp < 0, '<=': cmp <= 0, '>': cmp > 0, '>=': cmp >= 0, '=': cmp === 0 }[op];
  });
}

const lockfileCache = new Map();

function readLockfile(tree, manifest) {
  if (lockfileCache.has(manifest)) return lockfileCache.get(manifest);
  let lockfile = null;
  const path = resolve(tree, manifest);
  const inside = !relative(resolve(tree), path).startsWith('..');
  if (inside && manifest.endsWith('package-lock.json') && existsSync(path)) {
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8'));
      // lockfile v2/v3 list every install under `packages`; v1 is not verified
      if (parsed && typeof parsed.packages === 'object') lockfile = parsed;
    } catch {
      lockfile = null;
    }
  }
  lockfileCache.set(manifest, lockfile);
  return lockfile;
}

// true only when the branch's lockfile proves no installed copy is vulnerable
function fixedInTree(alert, tree) {
  const manifest = alert.dependency?.manifest_path;
  const name = alert.dependency?.package?.name;
  const range = parseRange(alert.security_vulnerability?.vulnerable_version_range);
  if (!manifest || !name || !range) return false;

  const lockfile = readLockfile(tree, manifest);
  if (!lockfile) return false;

  const suffix = `node_modules/${name}`;
  for (const [key, entry] of Object.entries(lockfile.packages)) {
    if (key !== suffix && !key.endsWith(`/${suffix}`)) continue;
    const version = parseVersion(entry?.version);
    if (!version || inRange(version, range)) return false;
  }
  return true;
}

function describe(alert, reason) {
  const severity = normalizeSeverity(alert.security_advisory?.severity) ?? 'unknown';
  const scope = alert.dependency?.scope ?? 'unknown';
  const name = alert.dependency?.package?.name ?? 'unknown package';
  return {
    package: name,
    ghsa: alert.security_advisory?.ghsa_id,
    manifest: alert.dependency?.manifest_path,
    severity,
    scope,
    reason,
  };
}

const args = process.argv.slice(2);
const treeFlag = args.indexOf('--tree');
const tree = treeFlag === -1 ? null : args[treeFlag + 1];
if (treeFlag !== -1) args.splice(treeFlag, 2);

if (args.length < 1 || args.length > 2 || (treeFlag !== -1 && !tree)) {
  console.error('Usage: evaluate-dependabot-release-policy.mjs <open-alerts.json> [now] [--tree <checkout>]');
  process.exit(2);
}

try {
  const alerts = parseJson(args[0]);
  const now = args[1] ? parseDate(args[1], 'evaluation time') : new Date();

  if (!Array.isArray(alerts)) {
    throw new Error('Unexpected alerts file structure');
  }

  const blockers = [];
  const fixedOnBranch = [];
  const block = (alert, blocker) => {
    if (tree && fixedInTree(alert, tree)) fixedOnBranch.push(blocker);
    else blockers.push(blocker);
  };

  for (const alert of alerts) {
    const severity = normalizeSeverity(alert.security_advisory?.severity);
    const scope = alert.dependency?.scope;

    if (now >= enforcement.runtimeCritical && severity === 'critical' && scope === 'runtime') {
      block(alert, describe(alert, 'unresolved runtime Critical vulnerability'));
      continue;
    }

    const deadline = deadlineFor(alert);

    if (
      now >= enforcement.overdueRuntimeHigh
      && severity === 'high'
      && scope === 'runtime'
      && deadline
      && deadline < now
    ) {
      block(alert, describe(alert, `overdue since ${deadline.toISOString()}`));
      continue;
    }

    if (now >= enforcement.anyOverdue && deadline && deadline < now) {
      block(alert, describe(alert, `overdue since ${deadline.toISOString()}`));
    }
  }

  console.log(`Evaluated ${alerts.length} open Dependabot alert(s) at ${now.toISOString()}.`);

  if (fixedOnBranch.length > 0) {
    console.log(`${fixedOnBranch.length} blocking alert(s) already fixed in this branch's lockfiles:`);
    for (const fixed of fixedOnBranch) {
      console.log(`- ${fixed.package} in ${fixed.manifest} (https://github.com/advisories/${fixed.ghsa})`);
    }
  }

  if (blockers.length === 0) {
    console.log('Release vulnerability policy passed.');
    process.exit(0);
  }

  console.error(`Release blocked by ${blockers.length} Dependabot alert(s):`);
  for (const blocker of blockers) {
    console.error(
      `- ${blocker.severity.toUpperCase()} ${blocker.scope} ${blocker.package} `
        + `in ${blocker.manifest}: ${blocker.reason} `
        + `(https://github.com/advisories/${blocker.ghsa})`
    );
  }
  process.exit(1);
} catch (error) {
  console.error(`Release policy evaluation failed: ${error.message}`);
  process.exit(2);
}
