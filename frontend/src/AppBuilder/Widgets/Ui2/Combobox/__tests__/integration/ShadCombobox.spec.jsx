/**
 * UI 2.0 Combobox: a searchable single select (a popover with a search box over the options).
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Combobox itself does. Titles carry [ShadCombobox-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { createWidgetHarness, binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'cb1';
const COUNTRIES =
  "{{[{ label: 'United States', value: 'us', group: 'Americas' }, { label: 'Canada', value: 'ca', group: 'Americas' }, { label: 'Germany', value: 'de', group: 'Europe', description: 'EU member' }, { label: 'Japan', value: 'jp', group: 'Asia Pacific', disabled: true }]}}";
const widget = createWidgetHarness({
  componentType: 'ShadCombobox',
  handle: 'combobox1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 320,
  defaultProperties: {
    label: binding('Country'),
    options: binding(COUNTRIES),
    placeholder: binding('Select a country...'),
    searchPlaceholder: binding('Search countries...'),
  },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const trigger = () => screen.getByRole('combobox');
const exposed = () => widget.exposed() ?? {};
const open = async () => {
  await act(async () => {
    fireEvent.pointerDown(trigger(), { button: 0, pointerType: 'mouse', ctrlKey: false });
    fireEvent.click(trigger());
  });
  await screen.findByRole('listbox');
};
const search = async (text) => {
  await act(async () => {
    fireEvent.change(screen.getByPlaceholderText('Search countries...'), { target: { value: text } });
  });
};
/** cmdk items are picked by a click. */
const pick = async (label) => {
  const item = (await screen.findByText(label)).closest('[cmdk-item]');
  await act(async () => fireEvent.click(item));
};

describe('UI 2.0 Combobox', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadCombobox-DEF-001] shows the label, help text and placeholder, and exposes an empty selection', async () => {
    render({ properties: { description: binding('Where the order ships') } });

    expect(await screen.findByText('Country')).toBeInTheDocument();
    expect(screen.getByText('Where the order ships')).toBeInTheDocument();
    expect(trigger()).toHaveTextContent('Select a country...');
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(exposed().selectedOption).toEqual({});
    expect(exposed().searchText).toBe('');
    expect(exposed().label).toBe('Country');
    expect(exposed().options.map((o) => o.value)).toEqual(['us', 'ca', 'de', 'jp']);
  });

  test('[ShadCombobox-PROP-001] options are listed under their group headings, with descriptions, and a disabled one cannot be picked', async () => {
    render();
    await open();

    expect(screen.getByText('Americas')).toBeInTheDocument();
    expect(screen.getByText('Asia Pacific')).toBeInTheDocument();
    expect(screen.getByText('EU member')).toBeInTheDocument();
    expect(screen.getByText('Japan').closest('[cmdk-item]')).toHaveAttribute('data-disabled', 'true');
  });

  test('[ShadCombobox-PROP-002] defaultValue selects that option and exposes it', async () => {
    render({ properties: { defaultValue: binding('ca') } });

    await waitFor(() => expect(trigger()).toHaveTextContent('Canada'));
    expect(exposed().value).toBe('ca');
    expect(exposed().selectedOption).toMatchObject({ label: 'Canada', group: 'Americas' });
  });

  test('[ShadCombobox-PROP-003] the search box filters the list, and emptyText shows when nothing matches', async () => {
    render({ properties: { emptyText: binding('No country found.') } });
    await open();

    await search('ger');
    expect(screen.getByText('Germany')).toBeInTheDocument();
    expect(screen.queryByText('Canada')).toBeNull();
    await search('zzzz');
    expect(await screen.findByText('No country found.')).toBeInTheDocument();
  });

  test('[ShadCombobox-PROP-004] showSearch off hides the search box', async () => {
    render({ properties: { showSearch: binding('{{false}}') } });
    await open();

    expect(screen.queryByPlaceholderText('Search countries...')).toBeNull();
    expect(screen.getByText('Canada')).toBeInTheDocument();
  });

  test('[ShadCombobox-PROP-005] serverSideSearch keeps every option listed while the app filters them itself', async () => {
    render({ properties: { serverSideSearch: binding('{{true}}') } });
    await open();

    await search('zzzz');
    await waitFor(() => expect(exposed().searchText).toBe('zzzz'));
    expect(screen.getByText('Canada')).toBeInTheDocument();
    expect(screen.getByText('Germany')).toBeInTheDocument();
  });

  test('[ShadCombobox-PROP-006] the clear button empties a pick and fires onSelect', async () => {
    render({ properties: { defaultValue: binding('us') } });
    widget.setEvents(setVariableOn(ID, 'onSelect', { value: '{{components.combobox1.value}}' }));

    await act(async () => fireEvent.click(await screen.findByRole('button', { name: 'Clear selection' })));
    await waitFor(() => expect(widget.variables().seen).toBe(''));
    expect(trigger()).toHaveTextContent('Select a country...');
  });

  test('[ShadCombobox-PROP-007] showClearBtn off leaves no clear button beside a pick', async () => {
    render({ properties: { defaultValue: binding('us'), showClearBtn: binding('{{false}}') } });

    await waitFor(() => expect(trigger()).toHaveTextContent('United States'));
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull();
  });

  test('[ShadCombobox-PROP-008] optionsLoadingState shows a spinner in place of the options', async () => {
    render({ properties: { optionsLoadingState: binding('{{true}}') } });
    await open();

    expect(screen.queryByText('Canada')).toBeNull();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  test('[ShadCombobox-PROP-009] items are keyed by position: an option valued "" and duplicate labels stay distinct', async () => {
    render({
      properties: {
        options: binding("{{[{ label: 'All', value: '' }, { label: 'Same', value: 1 }, { label: 'Same', value: 2 }]}}"),
      },
    });
    await open();
    await act(async () => fireEvent.click(screen.getAllByText('Same')[1].closest('[cmdk-item]')));
    await waitFor(() => expect(exposed().value).toBe(2));

    await open();
    await pick('All');
    await waitFor(() => expect(exposed().selectedOption.label).toBe('All'));
    expect(exposed().value).toBe('');
  });

  test('[ShadCombobox-EVT-001] picking an option fires onSelect, and its handler reads the new value', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onSelect', { value: '{{components.combobox1.value}}' }));
    await open();

    await pick('Germany');

    await waitFor(() => expect(widget.variables().seen).toBe('de'));
    expect(exposed().selectedOption).toMatchObject({ label: 'Germany', group: 'Europe' });
    expect(trigger()).toHaveTextContent('Germany');
  });

  test('[ShadCombobox-EVT-002] typing a search fires onSearchTextChanged with searchText already updated', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onSearchTextChanged', { value: '{{components.combobox1.searchText}}' }));
    await open();

    await search('can');

    await waitFor(() => expect(widget.variables().seen).toBe('can'));
  });

  test('[ShadCombobox-EVT-003] focusing and leaving the control fire onFocus and onBlur', async () => {
    render();
    widget.setEvents([
      ...setVariableOn(ID, 'onFocus', { key: 'focused' }),
      ...setVariableOn(ID, 'onBlur', { key: 'blurred' }),
    ]);

    await act(async () => trigger().focus());
    await waitFor(() => expect(widget.variables().focused).toBe('YES'));
    await act(async () => trigger().blur());
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'));
  });

  test('[ShadCombobox-ACT-001] selectOption picks by value and clear empties the selection', async () => {
    render();

    await widget.act('selectOption', 'de');
    await waitFor(() => expect(exposed().value).toBe('de'));
    expect(trigger()).toHaveTextContent('Germany');

    await widget.act('clear');
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(trigger()).toHaveTextContent('Select a country...');
  });

  test('[ShadCombobox-ACT-002] setFocus and setBlur move focus to and from the control', async () => {
    render();

    await widget.act('setFocus');
    expect(document.activeElement).toBe(trigger());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(trigger());
  });

  test('[ShadCombobox-VAL-001] a mandatory combobox with nothing picked is invalid until an option is picked', async () => {
    render({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(exposed().isMandatory).toBe(true);

    await widget.act('selectOption', 'ca');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadCombobox-VAL-002] a customRule message makes the pick invalid and is shown once the menu closes', async () => {
    render({
      validation: { customRule: binding("{{components.combobox1.value === 'us' ? 'We do not ship there yet' : ''}}") },
    });
    await open();

    await pick('United States');

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('We do not ship there yet')).toBeInTheDocument();
  });

  test('[ShadCombobox-STY-001] field and menu styles reach the control and its menu as CSS variables', async () => {
    const { container } = render({
      styles: { accentColor: binding('#e11d48'), menuBackgroundColor: binding('#fef3c7') },
    });

    await waitFor(() => expect(trigger()).toBeInTheDocument());
    expect(container.querySelector('.tj-shadcn').style.getPropertyValue('--sc-primary')).toBe('#e11d48');
    await open();
    const menu = screen.getByRole('listbox').closest('[data-radix-popper-content-wrapper] > *');
    expect(menu.style.getPropertyValue('--lk-menu-bg')).toBe('#fef3c7');
  });
});
