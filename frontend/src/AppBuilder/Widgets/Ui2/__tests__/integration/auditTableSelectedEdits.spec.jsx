// Release audit round 3: Codex's fixtures reviewTableSelectedEditSnapshot and reviewTableSelectedDiscardSnapshot. Table:
// selectedRow and selectedRows show the selected record as edited, inside onCellValueChanged and after it, and as
// it was again once the edits are discarded.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadTable',
  id: 'table1',
  handle: 'table1',
  widgetWidth: 800,
  widgetHeight: 400,
});
beforeEach(() => w.setup());
afterEach(() => w.teardown());

const original = { id: 'A', name: 'Alpha' };
const edited = { id: 'A', name: 'Edited' };
const snapshot =
  '{{{selected:components.table1.selectedRow,selectedRows:components.table1.selectedRows,updates:components.table1.dataUpdates}}}';
const render = () =>
  w.render({
    currentMode: 'view',
    properties: { data: binding([original]), columns: binding([{ key: 'name', name: 'Name', isEditable: true }]) },
  });
const editName = async (value) => {
  await act(async () => fireEvent.click(document.querySelector('tbody td')));
  await waitFor(() => expect(document.querySelector('tbody input')).not.toBeNull());
  await act(async () => fireEvent.change(document.querySelector('tbody input'), { target: { value } }));
  await act(async () => fireEvent.keyDown(document.querySelector('tbody input'), { key: 'Enter' }));
};
const selection = () => ({ selected: w.exposed().selectedRow, selectedRows: w.exposed().selectedRows });

test('an edit to the selected row shows in selectedRow inside onCellValueChanged and after', async () => {
  render();
  await w.act('selectRow', 'id', 'A');
  expect(w.exposed().selectedRow).toEqual(original);
  await act(async () =>
    w.setEvents(setVariableOn('table1', 'onCellValueChanged', { key: 'snapshot', value: snapshot }))
  );
  await editName('Edited');
  expect(w.exposed().dataUpdates).toEqual([edited]);
  expect(w.variables().snapshot).toEqual({ selected: edited, selectedRows: [edited], updates: [edited] });
  expect(selection()).toEqual({ selected: edited, selectedRows: [edited] });
});

test('discardChanges puts the selected row back as it was', async () => {
  render();
  await editName('Edited');
  await w.act('selectRow', 'id', 'A');
  expect(w.exposed().selectedRow).toEqual(edited);
  await w.act('discardChanges');
  expect(w.exposed().dataUpdates).toEqual([]);
  expect(w.exposed().updatedData).toEqual([original]);
  expect(selection()).toEqual({ selected: original, selectedRows: [original] });
});

test('a user discard shows the original row inside onCancelChanges', async () => {
  render();
  await editName('Edited');
  await w.act('selectRow', 'id', 'A');
  expect(w.exposed().selectedRow).toEqual(edited);
  await act(async () => w.setEvents(setVariableOn('table1', 'onCancelChanges', { key: 'snapshot', value: snapshot })));
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Discard' })));
  expect(w.variables().snapshot).toEqual({ selected: original, selectedRows: [original], updates: [] });
});

test('new data drops the edits from the selected row too', async () => {
  render();
  await w.act('selectRow', 'id', 'A');
  await editName('Edited');
  const fresh = { id: 'A', name: 'Fresh' };
  await act(async () => w.setComponentProperty('table1', 'data', `{{${JSON.stringify([fresh])}}}`, 'properties'));
  await waitFor(() => expect(w.exposed().updatedData).toEqual([fresh]));
  expect(selection()).toEqual({ selected: fresh, selectedRows: [fresh] });
});
