/**
 * The add-new-row form against a real Table: Add row sends onNewRowsAdded, the form stays locked on
 * "Adding row…" until the app's handlers (here a slow RunJS query) are done, then closes.
 */
import { screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding, store } from '../../../__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'Table',
  handle: 'table1',
  id: 't1',
  widgetHeight: 460,
  widgetWidth: 750,
  defaultProperties: {
    data: binding('{{[{"id":1,"name":"a"}]}}'),
    columns: {
      value: [{ id: 'c1', name: 'name', key: 'name', columnType: 'string', isEditable: '{{true}}' }],
    },
    showAddNewRowButton: binding('{{true}}'),
  },
});

beforeEach(widget.setup);
afterEach(widget.teardown);

const handler = (index, event) => ({
  id: `evt-${index}`,
  name: 'onNewRowsAdded',
  index,
  sourceId: 't1',
  target: 'component',
  event: { eventId: 'onNewRowsAdded', ...event },
});

function renderWithHandlers(queryCode) {
  return widget.render({
    currentMode: 'view',
    afterSeed: () => {
      store().dataQuery.setQueries(
        [{ id: 'q1', name: 'saveRow', kind: 'runjs', options: { code: queryCode } }],
        'canvas'
      );
      store().setQueryMapping('canvas');
    },
    events: [
      handler(0, { actionId: 'run-query', queryId: 'q1' }),
      handler(1, { actionId: 'set-custom-variable', key: 'afterQuery', value: 'yes' }),
    ],
  });
}

async function openFormAndSend() {
  const add = await waitFor(
    () =>
      document.querySelector('[data-cy$="add-new-row-button"]') ||
      (() => {
        throw new Error('no add button');
      })()
  );
  await widget.session.user.click(add);
  await screen.findByRole('dialog', { name: 'Add row' });
  await widget.session.user.click(screen.getByRole('button', { name: 'Add row' }));
}

describe('Table-ADDROWFORM-034 add row against the real Table', () => {
  test('Table-ADDROWFORM-034 the form stays on "Adding row…" until the slow handler has finished, then closes', async () => {
    // Break this catches: the form closing the moment Add row is clicked, while the app is still saving.
    // The handler waits on a promise this test releases, so the check does not depend on timing.
    globalThis.__releaseSave = undefined;
    renderWithHandlers('await new Promise((resolve) => { globalThis.__releaseSave = resolve; }); return 1;');

    await openFormAndSend();
    await waitFor(() => expect(globalThis.__releaseSave).toBeDefined());

    expect(await screen.findByRole('button', { name: 'Adding row…' })).toBeDisabled();
    expect(store().getVariable('afterQuery', 'canvas')).toBeUndefined();
    expect(screen.getByRole('dialog', { name: 'Add row' })).toBeInTheDocument();

    // well past the 150ms fade-out: a form that did not wait for the handler would have closed by now
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(screen.getByRole('button', { name: 'Adding row…' })).toBeInTheDocument();

    globalThis.__releaseSave();

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Add row' })).not.toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(store().getVariable('afterQuery', 'canvas')).toBe('yes');
  });

  test('Table-ADDROWFORM-034 the form closes even when the handler throws', async () => {
    // Break this catches: a failing query leaving the form stuck on "Adding row…".
    renderWithHandlers('throw new Error("save failed");');

    await openFormAndSend();

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Add row' })).not.toBeInTheDocument(), {
      timeout: 3000,
    });
  });
});
