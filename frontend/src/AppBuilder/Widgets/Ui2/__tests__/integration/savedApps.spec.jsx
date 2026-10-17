/**
 * Backward compatibility, layer 2: apps saved under an earlier release still work after an upgrade.
 *
 * compat/fixtures/<release>/<Type>.json is a saved page per widget and release (see scripts/ui2-compat-fixtures.js): the
 * widget with non-default properties and styles, a handler on each of its events, control-component calls of each of
 * its actions, a text bound to each of its exposed values, and a RunJS query calling and reading it by name. Each runs
 * through import's rename and the data migrations (which must agree), loads into the real store, and renders. Then:
 * no widget is unavailable, nothing logs an error or a warning (ui2Harness's console guard), every saved event still dispatches its action, every saved action
 * and binding still exists, and the exposed values match what was recorded for that fixture
 * (<Type>.oracle.json). Fixtures are never edited or deleted; fixtures/manifest.json pins each by checksum.
 *
 * UI2_COMPAT_RECORD=1 records the oracles still marked pending (a new release's set). It never overwrites one.
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import fs from 'fs';
import path from 'path';
import { loadCompatibilityFixture } from '@/test/app-builder';
import { MODULE_ID, store, drain } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { harnessFor, replay } from '../compat/savedAppReplay';
import { importRename, migrate } from '../compat/migrationReplay';

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

const ROOT = path.join(__dirname, '../compat/fixtures');
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

const onDisk = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) =>
    fs
      .readdirSync(path.join(ROOT, d.name))
      .filter((f) => f.endsWith('.json') && !f.endsWith('.oracle.json'))
      .map((f) => `${d.name}/${f.replace(/\.json$/, '')}`)
  );

// Charts get a size (jsdom has no layout); the gallery's slots are 640 wide.
measureChartsAt(640, 320);

// A Link's click() follows its target as a press does; a browser would leave the page, jsdom logs that it cannot.
// The widget's own handling (onClick) still runs; only the page change is held back.
const stayOnPage = (event) => {
  if (event.target?.closest?.('a[href^="http"]')) event.preventDefault();
};
beforeAll(() => document.addEventListener('click', stayOnPage));
afterAll(() => document.removeEventListener('click', stayOnPage));

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
  const harness = harnessFor(payload, createWidgetHarness);

  beforeEach(async () => {
    process.env.TZ = 'UTC';
    jest.useFakeTimers({ now: NOW, doNotFake: NOT_DATE });
    await harness.setup();
  });
  afterEach(() => {
    harness.teardown();
    jest.useRealTimers();
  });

  test(`[COMPAT-${name}] loads, renders, dispatches and exposes what it did when it was saved`, async () => {
    const imported = importRename(payload);
    const migrated = await migrate(payload);
    expect(migrated).toEqual(imported); // an exported app and a stored app become the same app

    const { problems, observed } = await replay(harness, imported, payload, { MODULE_ID, store, drain });
    if (problems.length) throw new Error(`${name} (${metadata.provenance}):\n  ${problems.join('\n  ')}`);

    if (recorded.pending) {
      if (!RECORD) throw new Error(`${name} has no recorded oracle yet. Run it once with UI2_COMPAT_RECORD=1.`);
      fs.writeFileSync(path.join(ROOT, metadata.oracle), `${JSON.stringify(observed, null, 2)}\n`);
      return;
    }
    expect(observed).toEqual(recorded);
  });
});
