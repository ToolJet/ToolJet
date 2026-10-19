// Release audit round 3: Codex's fixtures reviewTableFallbackIdCollision and reviewTableFallbackEditCollision. Table: a
// row without an id is keyed by its position, and that key can not be taken for a real id such as "#0" (selectRow
// picked both rows, and the real row's editable cell opened no editor).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, waitFor } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadTable',
  id: 'table1',
  handle: 'table1',
  widgetWidth: 800,
  widgetHeight: 400,
});
let errorSpy;
const duplicateKeys = [];
beforeEach(() => {
  w.setup();
  duplicateKeys.length = 0;
  const original = console.error;
  errorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (String(args[0]).includes('Encountered two children with the same key')) duplicateKeys.push(args);
    else original(...args);
  });
});
afterEach(() => {
  w.teardown();
  errorSpy.mockRestore();
});

const missing = { name: 'Missing ID' };
const real = { id: '#0', name: 'Unique real ID' };
const render = (rows, editable = false) =>
  w.render({
    currentMode: 'view',
    properties: {
      data: binding(rows),
      idField: binding('id'),
      columns: binding([{ key: 'name', name: 'Name', isEditable: editable }]),
    },
  });

test.each([false, true])('selectRow picks only the row whose id is "#0" (real id first=%s)', async (first) => {
  render(first ? [real, missing] : [missing, real]);
  await w.act('selectRow', 'id', '#0');
  expect({ row: w.exposed().selectedRow, rows: w.exposed().selectedRows }).toEqual({ row: real, rows: [real] });
  expect(duplicateKeys).toHaveLength(0);
});

test.each([false, true])('an edit reaches only the row whose id is "#0" (real id first=%s)', async (first) => {
  render(first ? [real, missing] : [missing, real], true);
  await act(async () =>
    w.setEvents(
      setVariableOn('table1', 'onCellValueChanged', { key: 'updates', value: '{{components.table1.dataUpdates}}' })
    )
  );
  const row = () => document.querySelectorAll('tbody tr')[first ? 0 : 1];
  await act(async () => fireEvent.click(row().querySelector('td')));
  await waitFor(() => expect(row().querySelector('input')).not.toBeNull());
  await act(async () => fireEvent.change(row().querySelector('input'), { target: { value: 'Edited unique' } }));
  await act(async () => fireEvent.keyDown(row().querySelector('input'), { key: 'Enter' }));
  const edited = { ...real, name: 'Edited unique' };
  expect({ updates: w.exposed().dataUpdates, event: w.variables().updates }).toEqual({
    updates: [edited],
    event: [edited],
  });
  expect(w.exposed().updatedData).toEqual(first ? [edited, missing] : [missing, edited]);
});
