#!/usr/bin/env node
/**
 * Enforces the frontend test layout so it cannot drift.
 *
 * The whole standard reduces to one mechanically checkable question:
 *   does this spec import the REAL composed store (@/AppBuilder/_stores/store)?
 *     yes -> it is an integration spec  -> must live in __tests__/integration/
 *     no  -> it is a unit spec          -> must live directly in __tests__/
 *
 * Plus two rules that have already bitten us:
 *   - a file named *.test.* is invisible to jest's testMatch and silently never
 *     runs. There were six such files in the repo, three of them broken.
 *   - every spec must sit inside a __tests__/ directory.
 *
 * Run: npm run validate:test-layout
 */
const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(frontendRoot, 'src');
// Must match an actual IMPORT of the store, not a `jest.mock('.../store')` call —
// a spec that stubs the store is a unit spec, and the opposite of an integration
// one. Matching the bare path treats those two as the same thing.
//
// Also matches a sibling `./widgetHarness` import: AppBuilder/Widgets/__tests__/
// integration/widgetHarness.js is a shared per-directory harness that imports
// the real store on every spec's behalf, so a spec built on it never writes
// the store's own import path — checking only the direct form would misfile
// every widget behaviour spec as a unit test.
const REAL_STORE_IMPORT =
  /(?:from\s+['"]@\/AppBuilder\/_stores\/store['"]|require\(\s*['"]@\/AppBuilder\/_stores\/store['"]|from\s+['"]\.\/widgetHarness['"])/;
// Harness self-tests describe the test infrastructure itself, not product code.
const EXEMPT_PREFIXES = ['src/test/'];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walk(absolute);
    return [absolute];
  });
}

const rel = (absolute) => path.relative(frontendRoot, absolute).split(path.sep).join('/');
const errors = [];
const counts = { unit: 0, integration: 0 };

for (const absolute of walk(srcRoot)) {
  const relative = rel(absolute);
  if (!/\.(spec|test)\.[jt]sx?$/.test(relative)) continue;

  if (/\.test\.[jt]sx?$/.test(relative)) {
    errors.push(
      `${relative}\n    Named *.test.* — jest's testMatch only picks up *.spec.*, so this file NEVER RUNS.\n    Rename it to *.spec.${relative.split('.').pop()}`
    );
    continue;
  }

  if (!relative.includes('/__tests__/')) {
    errors.push(`${relative}\n    Not inside a __tests__/ directory. Move it next to the source it covers.`);
    continue;
  }

  if (EXEMPT_PREFIXES.some((prefix) => relative.startsWith(prefix))) continue;

  const usesRealStore = REAL_STORE_IMPORT.test(fs.readFileSync(absolute, 'utf8'));
  const inIntegrationDir = relative.includes('/__tests__/integration/');

  if (usesRealStore && !inIntegrationDir) {
    errors.push(
      `${relative}\n    Imports the real composed store, so it is an INTEGRATION spec.\n    Move it to ${relative.replace('/__tests__/', '/__tests__/integration/')}`
    );
  } else if (!usesRealStore && inIntegrationDir) {
    errors.push(
      `${relative}\n    Does not import the real composed store, so it is a UNIT spec.\n    Move it to ${relative.replace('/__tests__/integration/', '/__tests__/')}`
    );
  } else {
    counts[inIntegrationDir ? 'integration' : 'unit'] += 1;
  }
}

if (errors.length) {
  console.error(`Test layout violations (${errors.length}):\n\n  ${errors.join('\n\n  ')}\n`);
  console.error('See frontend/src/test/README.md — "Where a test goes".');
  process.exit(1);
}

console.log(`Test layout OK — ${counts.unit} unit, ${counts.integration} integration.`);
