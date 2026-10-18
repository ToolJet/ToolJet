/**
 * Backward compatibility, saved-app scenarios: apps whose shape the per-widget fixtures do not cover.
 *
 * compat/scenarios/<name>.json is a hand-written saved app; <name>.oracle.json holds what a correct upgrade gives,
 * written by hand rather than recorded, so a rename that misses does not become the expected result. Each app runs
 * through import's rename and the data migrations (which must agree) and then:
 *  - static: the saved text afterwards (what a rename must change, and what it must leave alone);
 *  - ownKeys: data keys the app owns, such as '__proto__', still there and unchanged;
 *  - loaded into the real store and rendered: bindings resolved, exposed values, RunJS results, events fired.
 * Scenarios: expressions (bracket, comment-split, optional and run-time references), proto-key (own __proto__ keys in
 * app data), mixed (native widgets with UI 2.0 widgets). A scenario the product does not pass yet says so in its oracle
 * (knownFailing: owner and reason) and runs as test.failing.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import fs from 'fs';
import path from 'path';
import { act, waitFor } from '@testing-library/react';
import { loadCompatibilityFixture } from '@/test/app-builder';
import { MODULE_ID, store, drain } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { toStore } from '../compat/savedAppReplay';
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

const ROOT = path.join(__dirname, '../compat/scenarios');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const at = (value, dotted) => dotted.split('.').reduce((v, k) => (v === undefined || v === null ? v : v[k]), value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

describe.each(Object.keys(manifest.fixtures))('saved-app scenario %s', (name) => {
  const { payload, oracle } = loadCompatibilityFixture(name, { edition: 'ce', root: ROOT });
  const [first] = payload.components;
  const harness = createWidgetHarness({
    componentType: first.type,
    handle: first.name,
    id: first.id,
    preload: [...new Set(payload.components.map((c) => c.type))],
    widgetHeight: first.layouts.desktop.height,
    widgetWidth: 640,
    seedFromRegisteredDefinition: false,
    capabilities: { dnd: true },
  });
  beforeEach(() => harness.setup());
  afterEach(harness.teardown);

  // A scenario the product does not pass yet names its owner and reason in its oracle (knownFailing) and runs as
  // test.failing: it turns red the day it is fixed, and the marker comes out then.
  const run = oracle.knownFailing ? test.failing : test;
  run(
    `[COMPAT-SCENARIO-${name}] upgrades as written${
      oracle.knownFailing ? ` (known failing: ${oracle.knownFailing})` : ''
    }`,
    async () => {
      const problems = [];
      const imported = importRename(payload);
      const migrated = await migrate(payload);
      if (!same(migrated, imported)) problems.push('import and the data migrations give different apps');

      const byName = Object.fromEntries(migrated.components.map((c) => [c.name, c]));
      const queryNamed = (q) => migrated.dataQueries.find((x) => x.name === q);
      const eventNamed = (ref) => {
        const [component, eventId] = ref.split('-');
        return migrated.events.find((e) => e.sourceId === byName[component]?.id && e.name === eventId);
      };
      const target = (check) =>
        check.component ? byName[check.component] : check.query ? queryNamed(check.query) : eventNamed(check.event);

      for (const check of oracle.static ?? []) {
        const where = check.component ?? check.query ?? check.event;
        const value = at(target(check), check.path);
        if ('equals' in check && value !== check.equals)
          problems.push(`${where} ${check.path} is ${JSON.stringify(value)}, expected ${JSON.stringify(check.equals)}`);
        if ('contains' in check && !String(value).includes(check.contains))
          problems.push(`${where} ${check.path} lost ${JSON.stringify(check.contains)}: ${JSON.stringify(value)}`);
      }
      for (const check of oracle.ownKeys ?? []) {
        const where = check.component ?? check.query;
        const holder = at(target(check), check.path);
        if (!holder || !Object.prototype.hasOwnProperty.call(holder, check.key))
          problems.push(`${where} ${check.path} lost its own key ${JSON.stringify(check.key)}`);
        else if (!same(holder[check.key], check.equals))
          problems.push(`${where} ${check.path}.${check.key} is ${JSON.stringify(holder[check.key])}`);
      }

      harness.render({
        componentId: first.id,
        currentMode: 'view',
        extraComponents: Object.fromEntries(migrated.components.map((c) => [c.id, toStore(c)])),
        events: migrated.events,
        also: migrated.components.slice(1).map((c) => ({ id: c.id, componentType: c.type, widgetWidth: 640 })),
      });
      store().dataQuery.setQueries(
        migrated.dataQueries.map((q) => ({ ...q, data_source_id: null, app_version_id: q.appVersionId })),
        MODULE_ID
      );
      const exposed = (component) => store().getExposedValueOfComponent(byName[component].id, MODULE_ID) ?? {};
      await waitFor(() => expect(Object.keys(exposed(first.name)).length).toBeGreaterThan(0));
      await act(drain);

      for (const check of oracle.resolved ?? []) {
        const value = store().getResolvedComponent(byName[check.component].id, null, MODULE_ID)?.properties?.[
          check.property
        ];
        if (String(value) !== check.equals)
          problems.push(
            `${check.component}.${check.property} resolves to ${JSON.stringify(value)}, expected ${check.equals}`
          );
      }
      for (const check of oracle.exposed ?? []) {
        const value = exposed(check.component)[check.key];
        if (!same(value, check.equals))
          problems.push(
            `${check.component}.${check.key} is ${JSON.stringify(value)}, expected ${JSON.stringify(check.equals)}`
          );
      }
      for (const [queryName, expected] of Object.entries(oracle.runJs ?? {})) {
        const q = queryNamed(queryName);
        let result;
        await act(async () => {
          result = await store().queryPanel.executeMultilineJS(q.options.code, q.id, false, 'view', {}, MODULE_ID);
          await drain();
        });
        if (result?.status !== 'ok') problems.push(`RunJS ${queryName} failed: ${result?.data?.message}`);
        else if (!same(result.data, expected))
          problems.push(
            `RunJS ${queryName} returned ${JSON.stringify(result.data)}, expected ${JSON.stringify(expected)}`
          );
      }
      for (const step of oracle.fire ?? []) {
        await act(async () => {
          store().eventsSlice.fireEvent(step.event, byName[step.component].id, MODULE_ID);
          await drain();
        });
        for (const check of step.then) {
          const value = exposed(check.component)[check.key];
          if (!same(value, check.equals))
            problems.push(
              `after ${step.component}.${step.event}, ${check.component}.${check.key} is ${JSON.stringify(value)}, ` +
                `expected ${JSON.stringify(check.equals)}`
            );
        }
      }

      if (problems.length) throw new Error(`${name}:\n  ${problems.join('\n  ')}`);
    }
  );
});
