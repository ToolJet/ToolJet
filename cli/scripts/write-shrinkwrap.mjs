#!/usr/bin/env node
/*
  Writes npm-shrinkwrap.json from package-lock.json for `npm pack` / `npm publish` (run by prepack).

  The shrinkwrap ships inside the tarball, and npm 11+ refuses to install a package whose shrinkwrap has an entry that
  resolves outside the package folder (EINVALIDLOCATION) — e.g. "../packages/app-scanner" left behind by a local link.
  So, before writing it:

  - an extraneous entry outside the package (nothing depends on it) is dropped, with a warning;
  - any other entry outside the package fails the pack: the CLI really depends on a local path, which no user can
    install, and the dependency has to come from the registry instead.

    node scripts/write-shrinkwrap.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));

const isOutside = (p) => {
  const rel = path.relative(root, path.resolve(root, p));
  return rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel);
};
// A local entry's location is its key; a link's target is its `resolved` path. Registry URLs are not paths.
const pointsOutside = (key, entry) =>
  (key !== '' && isOutside(key)) || (entry.link === true && typeof entry.resolved === 'string' && isOutside(entry.resolved));

const dropped = [];
const blocking = [];
for (const [key, entry] of Object.entries(lock.packages ?? {})) {
  if (!pointsOutside(key, entry)) continue;
  if (entry.extraneous) {
    dropped.push(key);
    delete lock.packages[key];
  } else {
    blocking.push(key);
  }
}

if (blocking.length > 0) {
  console.error(
    'write-shrinkwrap: package-lock.json has dependencies outside the CLI package, which users cannot install:\n' +
      blocking.map((k) => `  ${k}`).join('\n') +
      '\nDepend on a registry version instead, then re-run npm install.'
  );
  process.exit(1);
}
for (const key of dropped) {
  console.warn(`write-shrinkwrap: dropped extraneous entry outside the package: ${key} (run npm prune to clean the lockfile)`);
}

fs.writeFileSync(path.join(root, 'npm-shrinkwrap.json'), `${JSON.stringify(lock, null, 2)}\n`);
