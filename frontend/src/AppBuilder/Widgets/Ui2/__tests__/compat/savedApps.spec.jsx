/**
 * Backward compatibility, layer 2: apps saved under an earlier release still work after an upgrade.
 *
 * fixtures/<release>/<Type>.json is a saved page per widget and release (see scripts/ui2-compat-fixtures.js): the
 * widget with non-default properties and styles, a handler on each of its events, control-component calls of each of
 * its actions, a text bound to each of its exposed values, and a RunJS query calling and reading it by name. Each runs
 * through import's rename and the data migrations (which must agree), loads into the real store, and renders. Then:
 * no widget is unavailable, nothing logs an error, every saved event still dispatches its action, every saved action
 * and binding still exists, and the exposed values match what was recorded for that fixture
 * (<Type>.oracle.json). Fixtures are never edited or deleted; fixtures/manifest.json pins each by checksum.
 *
 * UI2_COMPAT_RECORD=1 records the oracles still marked pending (a new release's set). It never overwrites one.
 */
import fs from 'fs';
import path from 'path';
import { loadCompatibilityFixture } from '@/test/app-builder';
import { harnessFor, replay } from './savedAppReplay';
import { importRename, migrate } from './migrationReplay';

jest.mock(
  '@helpers/migration.helper',
  () => ({
    MigrationProgress: class {
      show() {}
    },
    deleteAppHistoryForStructuralMigration: async () => {},
  }),
  { virtual: true }
);

const ROOT = path.join(__dirname, 'fixtures');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const RECORD = process.env.UI2_COMPAT_RECORD === '1';
// Saved apps meet dates through the widgets' own defaults (a calendar opens on today); pin today and the time zone.
const NOW = new Date('2026-06-15T09:00:00.000Z');
const NOT_DATE = [
  'hrtime',
  'nextTick',
  'performance',
  'queueMicrotask',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'requestIdleCallback',
  'cancelIdleCallback',
  'setImmediate',
  'clearImmediate',
  'setInterval',
  'clearInterval',
  'setTimeout',
  'clearTimeout',
];
// Not app errors: React's own test-timing notice; jsdom refusing to navigate when a Link's click() follows it; and
// React's development-only attribute casing warning for the core canvas's `data-parentId` (AppCanvas/Container.jsx),
// printed once for the first container a run mounts.
const NOISE = [
  /not wrapped in act\(/,
  /Not implemented: navigation/,
  /does not recognize the `%s` prop.*data-parentId/,
];

const onDisk = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) =>
    fs
      .readdirSync(path.join(ROOT, d.name))
      .filter((f) => f.endsWith('.json') && !f.endsWith('.oracle.json'))
      .map((f) => `${d.name}/${f.replace(/\.json$/, '')}`)
  );

describe('UI 2.0 saved-app fixtures', () => {
  it('are all pinned in fixtures/manifest.json, and none is missing', () => {
    const pinned = Object.keys(manifest.fixtures);
    const missing = pinned.filter((name) => !fs.existsSync(path.join(ROOT, manifest.fixtures[name].path)));
    expect({ missing, unpinned: onDisk.filter((name) => !pinned.includes(name)) }).toEqual({
      missing: [],
      unpinned: [],
    });
  });
});

describe.each(Object.keys(manifest.fixtures))('saved app %s', (name) => {
  const { payload, oracle: recorded, metadata } = loadCompatibilityFixture(name, { edition: 'ce', root: ROOT });
  const harness = harnessFor(payload);
  let consoleError;

  beforeEach(async () => {
    process.env.TZ = 'UTC';
    jest.useFakeTimers({ now: NOW, doNotFake: NOT_DATE });
    consoleError = jest.spyOn(console, 'error');
    await harness.setup();
  });
  afterEach(() => {
    harness.teardown();
    consoleError.mockRestore();
    jest.useRealTimers();
  });

  test(`[COMPAT-${name}] loads, renders, dispatches and exposes what it did when it was saved`, async () => {
    const imported = importRename(payload);
    const migrated = await migrate(payload);
    expect(migrated).toEqual(imported); // an exported app and a stored app become the same app

    const { problems, observed } = await replay(harness, imported, payload);
    const errors = consoleError.mock.calls
      .map((args) => args.map((a) => (a instanceof Error ? a.message : String(a))).join(' '))
      .filter((text) => !NOISE.some((re) => re.test(text)));
    for (const text of errors) problems.push(`console.error: ${text.slice(0, 400)}`);
    if (problems.length) throw new Error(`${name} (${metadata.provenance}):\n  ${problems.join('\n  ')}`);

    if (recorded.pending) {
      if (!RECORD) throw new Error(`${name} has no recorded oracle yet. Run it once with UI2_COMPAT_RECORD=1.`);
      fs.writeFileSync(path.join(ROOT, metadata.oracle), `${JSON.stringify(observed, null, 2)}\n`);
      return;
    }
    expect(observed).toEqual(recorded);
  });
});
