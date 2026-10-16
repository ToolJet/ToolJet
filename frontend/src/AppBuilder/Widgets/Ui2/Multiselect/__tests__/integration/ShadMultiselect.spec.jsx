/**
 * UI 2.0 Multiselect: several choices from a searchable list, shown as chips in the field.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Multiselect itself does. Titles carry [ShadMultiselect-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { createWidgetHarness, binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'ms1';
const widget = createWidgetHarness({
  componentType: 'ShadMultiselect',
  handle: 'multiselect1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 320,
  defaultProperties: {
    label: binding('Teams'),
    options: binding(
      "{{[{ label: 'Design', value: 'design' }, { label: 'Engineering', value: 'engineering' }, { label: 'Marketing', value: 'marketing' }, { label: 'Sales', value: 'sales' }, { label: 'Support', value: 'support' }]}}"
    ),
    defaultValue: binding("{{['design', 'engineering']}}"),
    placeholder: binding('Select teams...'),
    searchPlaceholder: binding('Search teams...'),
  },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const field = () => screen.getByRole('combobox');
const exposed = () => widget.exposed() ?? {};
const open = async () => {
  await act(async () => fireEvent.click(field()));
  await screen.findByRole('listbox');
};
const item = (text) => screen.getByText(text).closest('[cmdk-item]');
const pick = async (text) => {
  await act(async () => fireEvent.click(item(text)));
};
const search = async (text) => {
  await act(async () => {
    fireEvent.change(screen.getByPlaceholderText('Search teams...'), { target: { value: text } });
  });
};

describe('UI 2.0 Multiselect', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadMultiselect-DEF-001] shows the label, help text and the defaultValue picks as chips, and exposes them', async () => {
    render({ properties: { description: binding('Who can see the board') } });

    expect(await screen.findByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Who can see the board')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Design' })).toBeInTheDocument();
    await waitFor(() => expect(exposed().values).toEqual(['design', 'engineering']));
    expect(exposed().selectedOptions.map((o) => o.label)).toEqual(['Design', 'Engineering']);
    expect(exposed().label).toBe('Teams');
    expect(exposed().options).toHaveLength(5);
    expect(exposed().searchText).toBe('');
  });

  test('[ShadMultiselect-PROP-001] with nothing picked the field shows the placeholder', async () => {
    render({ properties: { defaultValue: binding('{{[]}}') } });

    await waitFor(() => expect(field()).toHaveTextContent('Select teams...'));
    expect(exposed().values).toEqual([]);
  });

  test('[ShadMultiselect-PROP-002] the search box filters the list, and emptyText shows when nothing matches', async () => {
    render({ properties: { emptyText: binding('No team found.') } });
    await open();

    await search('mark');
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.queryByText('Sales')).toBeNull();
    await search('zzzz');
    expect(await screen.findByText('No team found.')).toBeInTheDocument();
  });

  test('[ShadMultiselect-PROP-003] showSearch off hides the search box; serverSideSearch keeps every option listed', async () => {
    render({ properties: { showSearch: binding('{{false}}') } });
    await open();
    expect(screen.queryByPlaceholderText('Search teams...')).toBeNull();
    await act(async () => fireEvent.keyDown(document.activeElement, { key: 'Escape' }));

    render({ properties: { serverSideSearch: binding('{{true}}') } });
    await open();
    await search('zzzz');
    await waitFor(() => expect(exposed().searchText).toBe('zzzz'));
    expect(item('Sales')).toBeInTheDocument();
  });

  test('[ShadMultiselect-PROP-004] optionsLoadingState shows a spinner in place of the options', async () => {
    render({ properties: { optionsLoadingState: binding('{{true}}') } });
    await open();

    expect(screen.queryByText('Sales')).toBeNull();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  test('[ShadMultiselect-PROP-005] Select all picks every option, and maxVisibleChips folds the rest into "+N more"', async () => {
    render({ properties: { defaultValue: binding('{{[]}}'), maxVisibleChips: binding('{{2}}') } });
    await open();

    await pick('Select all');

    await waitFor(() => expect(exposed().values).toHaveLength(5));
    expect(screen.getByText('+3 more')).toBeInTheDocument();
  });

  test('[ShadMultiselect-PROP-006] showSelectAll off leaves no Select all row', async () => {
    render({ properties: { showSelectAll: binding('{{false}}') } });
    await open();

    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.queryByText('Select all')).toBeNull();
  });

  test('[ShadMultiselect-PROP-007] maxSelections disables unpicked options at the limit and counts the picks', async () => {
    render({ properties: { defaultValue: binding("{{['design']}}"), maxSelections: binding('{{1}}') } });
    await open();

    expect(screen.getByText('1 of 1 selected')).toBeInTheDocument();
    expect(item('Sales')).toHaveAttribute('data-disabled', 'true');
    await pick('Sales');
    expect(exposed().values).toEqual(['design']);
  });

  test('[ShadMultiselect-PROP-008] the clear button beside the chips empties the picks', async () => {
    render();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Clear selection' })));
    await waitFor(() => expect(exposed().values).toEqual([]));
  });

  test('[ShadMultiselect-PROP-009] showClearBtn off leaves no clear button beside the chips', async () => {
    render({ properties: { showClearBtn: binding('{{false}}') } });

    expect(await screen.findByRole('button', { name: 'Remove Design' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull();
  });

  test('[ShadMultiselect-EVT-001] toggling an option fires onSelect, and its handler reads the new values', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onSelect', { value: '{{components.multiselect1.values}}' }));
    await open();

    await pick('Marketing');

    await waitFor(() => expect(widget.variables().seen).toEqual(['design', 'engineering', 'marketing']));
    expect(exposed().selectedOptions.map((o) => o.label)).toEqual(['Design', 'Engineering', 'Marketing']);
  });

  test('[ShadMultiselect-EVT-002] removing a chip deselects it and fires onSelect', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onSelect', { value: '{{components.multiselect1.values}}' }));

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Remove Design' })));

    await waitFor(() => expect(widget.variables().seen).toEqual(['engineering']));
  });

  test('[ShadMultiselect-EVT-003] typing a search fires onSearchTextChanged with searchText already updated', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onSearchTextChanged', { value: '{{components.multiselect1.searchText}}' }));
    await open();

    await search('sup');

    await waitFor(() => expect(widget.variables().seen).toBe('sup'));
  });

  test('[ShadMultiselect-EVT-004] focusing and leaving the field fire onFocus and onBlur', async () => {
    render();
    widget.setEvents([
      ...setVariableOn(ID, 'onFocus', { key: 'focused' }),
      ...setVariableOn(ID, 'onBlur', { key: 'blurred' }),
    ]);

    await act(async () => field().focus());
    await waitFor(() => expect(widget.variables().focused).toBe('YES'));
    await act(async () => field().blur());
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'));
  });

  test('[ShadMultiselect-KBD-001] Enter opens the list and Backspace removes the last chip', async () => {
    render();

    await act(async () => fireEvent.keyDown(field(), { key: 'Backspace' }));
    await waitFor(() => expect(exposed().values).toEqual(['design']));
    await act(async () => fireEvent.keyDown(field(), { key: 'Enter' }));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  test('[ShadMultiselect-ACT-001] selectOptions adds known values, deselectOptions removes them and clear empties all', async () => {
    render({ properties: { defaultValue: binding('{{[]}}') } });

    await widget.act('selectOptions', ['sales', 'support', 'nope']);
    await waitFor(() => expect(exposed().values).toEqual(['sales', 'support']));
    await widget.act('deselectOptions', 'sales');
    await waitFor(() => expect(exposed().values).toEqual(['support']));
    await widget.act('clear');
    await waitFor(() => expect(exposed().values).toEqual([]));
  });

  test('[ShadMultiselect-ACT-002] setFocus and setBlur move focus to and from the field', async () => {
    render();

    await widget.act('setFocus');
    expect(document.activeElement).toBe(field());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(field());
  });

  test('[ShadMultiselect-VAL-001] a mandatory multiselect needs one pick', async () => {
    render({ properties: { defaultValue: binding('{{[]}}') }, validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(exposed().isMandatory).toBe(true);
    await widget.act('selectOptions', ['sales']);
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadMultiselect-VAL-002] a customRule message makes the picks invalid and is shown once the list closes', async () => {
    render({
      validation: {
        customRule: binding("{{components.multiselect1.values.length > 2 ? 'Pick two teams at most' : ''}}"),
      },
    });
    await open();
    await pick('Sales');
    await act(async () => fireEvent.keyDown(document.activeElement, { key: 'Escape' }));

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('Pick two teams at most')).toBeInTheDocument();
  });

  test('[ShadMultiselect-STY-001] chip and accent styles reach the field as CSS variables', async () => {
    const { container } = render({
      styles: { accentColor: binding('#e11d48'), chipBackgroundColor: binding('#dcfce7') },
    });

    await waitFor(() => expect(field()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-primary')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-chip-bg')).toBe('#dcfce7');
  });
});
