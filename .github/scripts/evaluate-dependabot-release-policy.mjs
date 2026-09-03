#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const enforcement = {
  runtimeCritical: new Date('2026-10-01T00:00:00Z'),
  overdueRuntimeHigh: new Date('2026-11-01T00:00:00Z'),
  anyOverdue: new Date('2026-12-31T00:00:00Z'),
};

const defaultDeadlineDays = {
  'runtime:critical': 2,
  'runtime:high': 7,
  'development:critical': 30,
  'development:high': 30,
};

function parseJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseDate(value, label) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error(`Invalid ${label}: ${value}`);
  return date;
}

function activeException(record, now) {
  const exception = record?.exception;
  if (!exception) return false;

  return Boolean(exception.justification && exception.approvedBy)
    && parseDate(exception.expiresAt, 'exception expiry') >= now;
}

function normalizeSeverity(value) {
  return value === 'medium' ? 'moderate' : value;
}

function deadlineFor(alert, record) {
  const publicKey = trackingKey(alert);
  if (record?.deadline) return parseDate(record.deadline, `deadline for ${publicKey}`);

  const key = `${alert.dependency?.scope}:${normalizeSeverity(alert.security_advisory?.severity)}`;
  const days = defaultDeadlineDays[key];
  if (days === undefined) return null;

  const deadline = parseDate(alert.created_at, `creation date for ${publicKey}`);
  deadline.setUTCDate(deadline.getUTCDate() + days);
  return deadline;
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

if (process.argv.length < 4 || process.argv.length > 5) {
  console.error(
    'Usage: evaluate-dependabot-release-policy.mjs '
      + '<open-alerts.json> <tracking.json> [now]'
  );
  process.exit(2);
}

try {
  const alerts = parseJson(process.argv[2]);
  const tracking = parseJson(process.argv[3]);
  const now = process.argv[4] ? parseDate(process.argv[4], 'evaluation time') : new Date();

  if (
    !Array.isArray(alerts)
    || !tracking.alerts
    || typeof tracking.alerts !== 'object'
    || Array.isArray(tracking.alerts)
  ) {
    throw new Error('Unexpected alerts or tracking file structure');
  }

  const blockers = [];

  for (const alert of alerts) {
    const record = tracking.alerts[trackingKey(alert)];
    const severity = normalizeSeverity(alert.security_advisory?.severity);
    const scope = alert.dependency?.scope;

    if (now >= enforcement.runtimeCritical && severity === 'critical' && scope === 'runtime') {
      blockers.push(describe(alert, 'unresolved runtime Critical vulnerability'));
      continue;
    }

    if (activeException(record, now)) continue;

    const deadline = deadlineFor(alert, record);

    if (
      now >= enforcement.overdueRuntimeHigh
      && severity === 'high'
      && scope === 'runtime'
      && deadline
      && deadline < now
    ) {
      blockers.push(describe(alert, `overdue since ${deadline.toISOString()}`));
      continue;
    }

    if (now >= enforcement.anyOverdue) {
      if (!deadline) {
        blockers.push(describe(alert, 'missing the required recorded remediation deadline'));
      } else if (deadline < now) {
        blockers.push(describe(alert, `overdue since ${deadline.toISOString()}`));
      }
    }
  }

  console.log(`Evaluated ${alerts.length} open Dependabot alert(s) at ${now.toISOString()}.`);

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
