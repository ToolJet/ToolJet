/**
 * The Table's add-new-row form shows "Adding row…" until the app has dealt with `onNewRowsAdded`, so firing
 * that event must hand back a promise that settles only after every handler (including an async query) has run.
 *
 * Until now no event could be awaited: the store's fireEvent returned nothing and `onNewRowsAdded` was started
 * and forgotten. Arranged through the real store with a RunJS query as the slow handler.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, drainExposedValueBatch } from '@/test/app-builder';

const MODULE_ID = 'canvas';
const state = () => useStore.getState();

const slowQuery = (code) => ({ id: 'q1', name: 'slowQuery', kind: 'runjs', options: { code } });
const handler = (index, event) => ({
  id: `evt-${index}`,
  name: 'onNewRowsAdded',
  index,
  sourceId: 't1',
  target: 'component',
  event: { eventId: 'onNewRowsAdded', ...event },
});

function setup(queryCode) {
  seedApp({ t1: componentDefinition('t1', 'table1', 'Table') }, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  state().dataQuery.setQueries([slowQuery(queryCode)], MODULE_ID);
  state().setQueryMapping(MODULE_ID);
  state().eventsSlice.setEvents(
    [
      handler(0, { actionId: 'run-query', queryId: 'q1' }),
      handler(1, { actionId: 'set-custom-variable', key: 'afterQuery', value: 'yes' }),
    ],
    MODULE_ID
  );
}

const fire = () => state().eventsSlice.fireEvent('onNewRowsAdded', 't1', MODULE_ID, {}, {});

afterEach(() => drainExposedValueBatch());

describe('Table-ADDROWFORM-031 onNewRowsAdded can be awaited', () => {
  test('Table-ADDROWFORM-031 the returned promise settles only after the slow handler and the ones after it ran', async () => {
    // Break this catches: the form closing (or "Adding row…" ending) before the app's handlers have finished.
    setup('await new Promise((resolve) => setTimeout(resolve, 60)); return 1;');

    const done = fire();
    expect(done).toBeInstanceOf(Promise);
    expect(state().getVariable('afterQuery', MODULE_ID)).toBeUndefined();

    await done;

    expect(state().getVariable('afterQuery', MODULE_ID)).toBe('yes');
  });

  test('Table-ADDROWFORM-031 each handler runs exactly once', async () => {
    // Break this catches: the event being dispatched both the fire-and-forget way and the awaited way.
    setup(`const next = (variables.runs || 0) + 1; await actions.setVariable('runs', next); return next;`);

    await fire();

    expect(state().getVariable('runs', MODULE_ID)).toBe(1);
  });
});
