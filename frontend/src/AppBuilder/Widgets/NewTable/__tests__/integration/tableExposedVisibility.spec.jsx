/**
 * The Inspector reads `isVisible`/`isDisabled` off the exposed-variable store
 * live, so any commit that writes `undefined` into it is directly observable
 * as "undefined" in the Inspector for a frame, even though the value settles
 * to the correct boolean shortly after.
 *
 * Root cause: Table.jsx seeds its local `exposedVariablesTemporaryState` from
 * its own private tableStore, which is still empty on first render (Table.jsx
 * initializes it in a useEffect). A mount-only effect then broadcasts that
 * stale (undefined) local state into the exposed-variable store, clobbering
 * the correct default the generic widget wrapper had already seeded.
 *
 * Empirically verified (subscribing to every store commit around a real
 * mount): the sequence is `[true, ..., undefined, ..., false]` for a table
 * configured with `visibility: false` — never a clean `true -> false`.
 */
import React from 'react';
import { act } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import {
  AppBuilderTestSession,
  defineAppBuilderScenario,
  seedApp,
  componentDefinition,
  binding,
} from '@/test/app-builder';

const MODULE_ID = 'canvas';

const scenario = defineAppBuilderScenario({
  id: 'table-exposed-visibility',
  name: 'Table exposed isVisible/isDisabled on mount',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true, media: { matches: false } },
});

function widgetProps(id, componentType) {
  return {
    id,
    componentType,
    moduleId: MODULE_ID,
    currentMode: 'edit',
    currentLayout: 'desktop',
    widgetHeight: 40,
    widgetWidth: 200,
    inCanvas: true,
    darkMode: false,
    onOptionChange: () => {},
    onOptionsChange: () => {},
  };
}

/** Records every committed value of one exposed key for a component, across the whole mount. */
function recordExposedKey(id, key) {
  const seen = [];
  const unsubscribe = useStore.subscribe((state) => {
    seen.push(state.getExposedValueOfComponent(id, MODULE_ID)?.[key]);
  });
  return { seen, unsubscribe };
}

async function mountTable(id, properties) {
  const session = new AppBuilderTestSession({ scenario });
  seedApp(
    {
      [id]: componentDefinition(id, 'table1', 'Table', {
        data: { value: '{{ [{ "name": "Ada" }] }}' },
        columns: {
          value: [
            { name: 'name', key: 'name', columnType: 'string', id: 'col-name', columnSize: 100, isEditable: false },
          ],
        },
        ...properties,
      }),
    },
    { moduleId: MODULE_ID }
  );
  const state = useStore.getState();
  state.setEditorLoading(false, MODULE_ID);
  state.setCurrentMode('edit', MODULE_ID);

  const recorder = recordExposedKey(id, Object.keys(properties)[0] === 'visibility' ? 'isVisible' : 'isDisabled');

  session.render(<RenderWidget {...widgetProps(id, 'Table')} />);
  // The real Table module is React.lazy-loaded; give its mount effects (private
  // tableStore init, then the exposed-variable correction) a full chance to run.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  recorder.unsubscribe();
  return recorder.seen;
}

describe('Table exposed isVisible/isDisabled never pass through undefined on mount', () => {
  test('isVisible settles from the config default straight to the configured value, never undefined', async () => {
    const seen = await mountTable('tbl-visible', { visibility: binding('{{false}}') });

    expect(seen).not.toContain(undefined);
    expect(seen[seen.length - 1]).toBe(false);
  });

  test('isDisabled settles from the config default straight to the configured value, never undefined', async () => {
    const seen = await mountTable('tbl-disabled', { disabledState: binding('{{true}}') });

    expect(seen).not.toContain(undefined);
    expect(seen[seen.length - 1]).toBe(true);
  });
});
