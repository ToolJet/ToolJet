/**
 * UI 2.0 Table with a cell editor open when its edits are discarded or its column stops being editable (release audit
 * round 2): the open draft belongs to the edits, so a discard or a switch to read-only closes the editor and its later
 * blur commits nothing. The editor stayed open and its blur wrote the draft back as a new change. Titles carry
 * [ShadTable-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tbl1';
const widget = createWidgetHarness({
  componentType: 'ShadTable',
  handle: 'table1',
  id: ID,
  widgetHeight: 480,
  widgetWidth: 800,
});
const columns = (editable) => `{{[{ key: 'name', name: 'Name', isEditable: ${editable} }]}}`;
const rows = () => [...document.querySelectorAll('tbody tr')];
const names = () => rows().map((tr) => tr.querySelector('td').textContent);
const exposed = () => widget.exposed() ?? {};
const settle = () => act(() => new Promise((r) => setTimeout(r, 30)));

/** Opens the first name's editor and types a draft without committing it. */
const draftFirstName = async (text) => {
  fireEvent.click(rows()[0].querySelector('td'));
  const input = await waitFor(() => rows()[0].querySelector('input'));
  fireEvent.change(input, { target: { value: text } });
  return input;
};

describe('UI 2.0 Table pending edits', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  const mount = () => {
    widget.render({ currentMode: 'view', properties: { columns: binding(columns(true)) } });
    widget.setEvents(setVariableOn(ID, 'onCellValueChanged', { key: 'changed', value: 'yes' }));
    return waitFor(() => expect(rows()).toHaveLength(3));
  };
  const expectNoEdit = async (input) => {
    fireEvent.blur(input);
    await settle();
    expect(rows()[0].querySelector('input')).toBeNull();
    expect(exposed().changeSet ?? {}).toEqual({});
    expect(names()[0]).toBe('Ada Lovelace');
    expect(widget.variables().changed).toBeUndefined();
  };

  test('[ShadTable-EDIT-101] discardChanges closes an open editor, and its blur commits nothing', async () => {
    await mount();
    const input = await draftFirstName('Draft');
    await widget.act('discardChanges');
    await expectNoEdit(input);
  });

  test('[ShadTable-EDIT-102] a column switched to read-only closes its open editor, and its blur commits nothing', async () => {
    await mount();
    const input = await draftFirstName('Draft');
    await act(async () => widget.setComponentProperty(ID, 'columns', columns(false), 'properties'));
    await expectNoEdit(input);
  });

  test('[ShadTable-EDIT-103] a table disabled while a cell is edited closes the editor, and its blur commits nothing', async () => {
    await mount();
    const input = await draftFirstName('Draft');
    await widget.act('setDisable', true);
    await expectNoEdit(input);
  });

  test('[ShadTable-EDIT-104] an edit committed before the switch to read-only stays pending, to save or discard', async () => {
    await mount();
    const input = await draftFirstName('Zed');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(exposed().changeSet).toEqual({ 0: { name: 'Zed' } }));
    await act(async () => widget.setComponentProperty(ID, 'columns', columns(false), 'properties'));
    await settle();
    expect(exposed().changeSet).toEqual({ 0: { name: 'Zed' } });
    expect(names()[0]).toBe('Zed');
    await widget.act('discardChanges');
    await waitFor(() => expect(names()[0]).toBe('Ada Lovelace'));
  });
});
