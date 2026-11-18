#!/usr/bin/env node
/*
  Pins the Code mode app template's dependencies to versions older than the publish scan's release cooldown, so a new
  app starts with a lockfile the scan passes (tj-deps/new-release). Run it whenever the template's dependencies change:

    node scripts/pin-template-deps.mjs [--days 8]

  1. A third-party dependency whose range allows no release older than --days days moves down to the newest such
     release in its major (a caret range on it); ranges that already allow one stay as they are.
  2. The lockfile is resolved with `npm install --package-lock-only --before=<cutoff>`, so transitive packages are
     that old too. First-party @tooljet packages are added afterwards without the cutoff: we release them ourselves.
  3. It is written to src/app-template/frontend/package-lock.json with the project name left as a template variable.

  No install scripts run (--ignore-scripts); nothing is installed, only the lockfile is resolved.
*/
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const semver = require('semver');

const cli = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = path.join(cli, 'src/_templates/library/code-app/packagejson.ejs.t');
const LOCKFILE = path.join(cli, 'src/app-template/frontend/package-lock.json');
const NAME_VAR = '<%= name %>';
const FIRST_PARTY = /^@tooljet\//;

const daysFlag = process.argv.indexOf('--days');
const days = daysFlag > -1 ? Number(process.argv[daysFlag + 1]) : 8;
if (!Number.isFinite(days) || days < 1) throw new Error('--days must be a positive number');
const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const npm = (args, cwd) => execFileSync('npm', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

/** The newest non-prerelease version in `range`'s major that was published before the cutoff. */
const pinnedVersion = (name, range) => {
  const times = JSON.parse(npm(['view', name, 'time', '--json']));
  const major = semver.minVersion(range).major;
  const old = Object.entries(times)
    .filter(([v, t]) => semver.valid(v) && !semver.prerelease(v) && semver.major(v) === major && new Date(t) < cutoff)
    .map(([v]) => v);
  // Prefer one the current range already allows; else step back below its floor, staying in the major.
  const chosen = semver.maxSatisfying(old, range) ?? semver.rsort(old)[0];
  if (!chosen) throw new Error(`${name}: no ${major}.x release older than ${days} days`);
  return chosen;
};

const raw = fs.readFileSync(TEMPLATE, 'utf8');
const match = /^(---\n[\s\S]*?\n---\n)([\s\S]*)$/.exec(raw);
if (!match) throw new Error(`${TEMPLATE} has no front matter`);
const [, frontMatter, body] = match;
const pkg = JSON.parse(body.replace(NAME_VAR, 'code-app-template'));

const firstParty = {};
for (const field of ['dependencies', 'devDependencies']) {
  for (const [name, range] of Object.entries(pkg[field] ?? {})) {
    if (FIRST_PARTY.test(name)) {
      firstParty[name] = { field, range };
      continue;
    }
    // A range that already allows an old enough release stays as it is (the lockfile pins the exact version);
    // only a floor that is too new moves down.
    const version = pinnedVersion(name, range);
    const next = semver.satisfies(version, range) ? range : `^${version}`;
    if (next !== range) console.log(`${name}: ${range} -> ${next}`);
    pkg[field][name] = next;
  }
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-template-lock-'));
try {
  const thirdParty = structuredClone(pkg);
  for (const [name, { field }] of Object.entries(firstParty)) delete thirdParty[field][name];
  fs.writeFileSync(path.join(work, 'package.json'), JSON.stringify(thirdParty, null, 2));
  npm(['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund', `--before=${cutoff.toISOString()}`], work);
  fs.writeFileSync(path.join(work, 'package.json'), JSON.stringify(pkg, null, 2));
  npm(['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], work);

  const lock = JSON.parse(fs.readFileSync(path.join(work, 'package-lock.json'), 'utf8'));
  lock.name = NAME_VAR;
  if (lock.packages?.['']) lock.packages[''].name = NAME_VAR;
  fs.mkdirSync(path.dirname(LOCKFILE), { recursive: true });
  fs.writeFileSync(LOCKFILE, JSON.stringify(lock, null, 2) + '\n');
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}

fs.writeFileSync(TEMPLATE, frontMatter + JSON.stringify(pkg, null, 2).replace('"code-app-template"', `"${NAME_VAR}"`) + '\n');
console.log(`Pinned to releases before ${cutoff.toISOString().slice(0, 10)}; wrote ${path.relative(cli, LOCKFILE)}`);
