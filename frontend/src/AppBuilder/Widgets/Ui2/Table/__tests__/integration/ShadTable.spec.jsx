/**
 * UI 2.0 Table: rows and typed columns with search, sort, filters, paging, selection, cell editing, action buttons and
 * downloads, on the native Table's events, actions and exposed values.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked (jsdom's missing Blob URLs are given
 * values where a download needs them). Standard control behaviour (visibility, disabled, loading, tooltip) is covered for
 * every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx; this file covers what the Table itself does, related keys
 * grouped. Titles carry [ShadTable-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'tbl1';
const widget = createWidgetHarness({
  componentType: 'ShadTable',
  handle: 'table1',
  id: ID,
  widgetHeight: 480,
  widgetWidth: 800,
});

const EDITABLE =
  "{{[{ key: 'name', name: 'Name', isEditable: true }, { key: 'actions', name: 'Actions', columnType: 'button', buttons: [{ id: 'open', label: 'Open' }] }]}}";
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const rows = () => [...document.querySelectorAll('tbody tr')];
const row = (text) => rows().find((tr) => tr.textContent.includes(text));
const names = () => rows().map((tr) => tr.querySelector('td').textContent);
const headers = () => [...document.querySelectorAll('thead th')].map((th) => th.textContent);
const exposed = () => widget.exposed() ?? {};
const on = (eventId, value, key = 'seen') => setVariableOn(ID, eventId, { key, value });
const settle = (ms = 30) => act(() => new Promise((r) => setTimeout(r, ms)));
const editFirstName = async (text) => {
  fireEvent.click(rows()[0].querySelector('td'));
  const input = await waitFor(() => rows()[0].querySelector('input'));
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: 'Enter' });
};
const popover = (name) => {
  const trigger = screen.getByRole('button', { name });
  fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse', ctrlKey: false });
  fireEvent.click(trigger);
};
const withDownloads = async (run) => {
  const saved = [];
  Object.assign(URL, { createObjectURL: jest.fn(() => 'blob:table'), revokeObjectURL: jest.fn() });
  const spy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function save() {
    saved.push(this.download);
  });
  try {
    await run(saved);
  } finally {
    spy.mockRestore();
  }
};

describe('UI 2.0 Table', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadTable-DEF-001] shows the sample rows in typed columns with a toolbar and row count, nothing selected', async () => {
    render();

    await waitFor(() => expect(names()).toEqual(['Ada Lovelace', 'Alan Turing', 'Grace Hopper']));
    expect(headers()).toEqual(['Name', 'Status', 'Date', 'Amount']);
    expect(row('Ada')).toHaveTextContent('Paid');
    expect(row('Ada')).toHaveTextContent('14 Sep 2026');
    expect(row('Ada')).toHaveTextContent('$1,250.00');
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveAttribute('placeholder', 'Search…');
    expect(screen.getByRole('button', { name: /Filter/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Columns/ })).toBeInTheDocument();
    expect(screen.getByText('3 rows')).toBeInTheDocument();
    await waitFor(() => expect(exposed().currentData).toHaveLength(3));
    expect(exposed()).toMatchObject({
      selectedRow: {},
      selectedRowId: null,
      selectedRows: [],
      selectedRowsId: [],
      pageIndex: 1,
      searchText: '',
      sortApplied: [],
      filters: [],
      changeSet: {},
      dataUpdates: [],
      lastActionClicked: {},
    });
    expect(exposed().filteredData).toHaveLength(3);
    expect(exposed().currentPageData).toHaveLength(3);
  });

  test('[ShadTable-PROP-001] currency, locale and dateFormat format cells; badgeColors colours badges by value', async () => {
    render({
      properties: {
        currency: binding('EUR'),
        locale: binding('de-DE'),
        dateFormat: binding('YYYY/MM/DD'),
        badgeColors: binding("{{({ Paid: '#16a34a' })}}"),
      },
    });

    await waitFor(() => expect(row('Ada')).toHaveTextContent('2026/09/14'));
    expect(row('Ada')).toHaveTextContent(/1\.250,00\s€/);
    expect(within(row('Ada')).getByText('Paid').closest('[style]').style.getPropertyValue('--kb-badge-fg')).toBe(
      '#16a34a'
    );
  });

  test('[ShadTable-EVT-001] a row click fires onRowClicked and onSelectionChanged with the row already exposed', async () => {
    render();
    widget.setEvents([
      ...on('onRowClicked', '{{components.table1.selectedRow.name}}'),
      ...on('onSelectionChanged', '{{components.table1.selectedRows.length}}', 'count'),
    ]);

    await waitFor(() => expect(rows()).toHaveLength(3));
    fireEvent.click(row('Alan'));

    await waitFor(() => expect(widget.variables().seen).toBe('Alan Turing'));
    expect(widget.variables().count).toBe(1);
    expect(exposed()).toMatchObject({ selectedRowId: 1, selectedRowsId: [1] });
    expect(row('Alan')).toHaveAttribute('data-state', 'selected');
  });

  test('[ShadTable-PROP-002] disableRowDeselection (on by default, also when unset) keeps a row selected on a second click', async () => {
    // A table made through the MCP carries only the properties it was given: no disableRowDeselection at all.
    const unset = componentDefinition(ID, 'table1', 'ShadTable', {});
    delete unset.component.definition.properties.disableRowDeselection;
    render({ extraComponents: { [ID]: unset } });
    widget.setEvents(countInvocationsOn(ID, 'onRowClicked'));

    await waitFor(() => expect(rows()).toHaveLength(3));
    fireEvent.click(row('Grace'));
    await waitFor(() => expect(widget.variables().calls).toBe(1));
    fireEvent.click(row('Grace'));
    await waitFor(() => expect(widget.variables().calls).toBe(2));
    expect(exposed().selectedRow).toMatchObject({ name: 'Grace Hopper' });
  });

  test('[ShadTable-PROP-003] with disableRowDeselection off, the deselecting click is a selection change only', async () => {
    render({ properties: { disableRowDeselection: binding('{{false}}') } });
    widget.setEvents([
      ...countInvocationsOn(ID, 'onRowClicked'),
      ...countInvocationsOn(ID, 'onSelectionChanged', { key: 'changes' }),
    ]);

    await waitFor(() => expect(rows()).toHaveLength(3));
    fireEvent.click(row('Ada'));
    await waitFor(() => expect(widget.variables().changes).toBe(1));
    fireEvent.click(row('Ada'));
    await waitFor(() => expect(widget.variables().changes).toBe(2));
    expect(widget.variables().calls).toBe(1);
    expect(exposed().selectedRow).toEqual({});
  });

  test('[ShadTable-PROP-011] highlightSelectedRow off selects a row without marking it', async () => {
    render({ properties: { highlightSelectedRow: binding('{{false}}') } });

    await waitFor(() => expect(rows()).toHaveLength(3));
    fireEvent.click(row('Ada'));
    await waitFor(() => expect(exposed().selectedRowsId).toEqual([0]));
    expect(row('Ada')).not.toHaveAttribute('data-state');
  });

  test('[ShadTable-PROP-012] allowSelection off selects nothing, though a click still exposes the clicked row', async () => {
    render({ properties: { allowSelection: binding('{{false}}') } });

    await waitFor(() => expect(rows()).toHaveLength(3));
    fireEvent.click(row('Alan'));
    await waitFor(() => expect(exposed().selectedRow).toMatchObject({ name: 'Alan Turing' }));
    expect(exposed().selectedRows).toEqual([]);
    expect(row('Alan')).not.toHaveAttribute('data-state');
  });

  test('[ShadTable-PROP-004] showBulkSelector adds checkboxes: a row, or all on the page, with the count of selected', async () => {
    render({ properties: { showBulkSelector: binding('{{true}}') } });
    widget.setEvents(countInvocationsOn(ID, 'onSelectionChanged'));

    await waitFor(() => expect(screen.getAllByRole('checkbox', { name: 'Select row' })).toHaveLength(3));
    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Select row' })[1]);
    await waitFor(() => expect(exposed().selectedRowsId).toEqual([1]));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all on this page' }));
    await waitFor(() => expect(exposed().selectedRowsId).toEqual([0, 1, 2]));
    expect(screen.getByText('3 of 3 selected')).toBeInTheDocument();
    expect(widget.variables().calls).toBe(2);
  });

  test('[ShadTable-PROP-005] defaultSelectedRow selects the first row matching it; idField keeps a selection across a reload', async () => {
    render({ properties: { defaultSelectedRow: binding('{{({ id: 2 })}}') } });
    await waitFor(() => expect(exposed().selectedRow).toMatchObject({ name: 'Alan Turing' }));
    expect(row('Alan')).toHaveAttribute('data-state', 'selected');

    render({ properties: { idField: binding('name') } });
    await waitFor(() => expect(rows()).toHaveLength(3));
    fireEvent.click(row('Ada'));
    widget.setComponentProperty(
      ID,
      'data',
      "{{[{ id: 12, name: 'Alan Turing' }, { id: 11, name: 'Ada Lovelace' }]}}",
      'properties'
    );
    await waitFor(() => expect(exposed().selectedRow).toEqual({ id: 11, name: 'Ada Lovelace' }));
  });

  test('[ShadTable-EVT-002] rowsPerPage pages the rows; Next fires onPageChanged with pageIndex set; enablePagination off shows all', async () => {
    render({ properties: { rowsPerPage: binding('{{2}}') } });
    widget.setEvents(on('onPageChanged', '{{components.table1.pageIndex}}'));

    await waitFor(() => expect(names()).toEqual(['Ada Lovelace', 'Alan Turing']));
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(widget.variables().seen).toBe(2));
    expect(names()).toEqual(['Grace Hopper']);
    expect(exposed().currentPageData).toHaveLength(1);

    render({ properties: { rowsPerPage: binding('{{2}}'), enablePagination: binding('{{false}}') } });
    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(screen.queryByRole('button', { name: 'Next page' })).toBeNull();
  });

  test('[ShadTable-PROP-006] serverSidePagination counts from totalRecords; enablePrevButton and enableNextButton gate the pager', async () => {
    render({ properties: { serverSidePagination: binding('{{true}}'), totalRecords: binding('{{500}}') } });
    await waitFor(() => expect(screen.getByText('500 rows')).toBeInTheDocument());
    expect(rows()).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(exposed().pageIndex).toBe(2));
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();

    render({
      properties: {
        serverSidePagination: binding('{{true}}'),
        totalRecords: binding('{{500}}'),
        enablePrevButton: binding('{{false}}'),
        enableNextButton: binding('{{false}}'),
      },
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  });

  test('[ShadTable-EVT-003] typing in the search box (searchPlaceholder) fires onSearch after a pause and filters the rows', async () => {
    render({ properties: { searchPlaceholder: binding('Find a customer') } });
    widget.setEvents(on('onSearch', '{{components.table1.searchText}}'));

    fireEvent.change(await screen.findByPlaceholderText('Find a customer'), { target: { value: 'grace' } });
    await waitFor(() => expect(widget.variables().seen).toBe('grace'));
    expect(names()).toEqual(['Grace Hopper']);
    expect(exposed().filteredData).toHaveLength(1);

    render({ properties: { serverSideSearch: binding('{{true}}') } });
    await widget.act('setSearchText', 'zzz');
    await waitFor(() => expect(exposed().searchText).toBe('zzz'));
    // The app's query searches; the rows stay what data holds.
    expect(rows()).toHaveLength(3);
  });

  // CI (2026-10-17): onSearch fired before filteredData, currentPageData and searchText were published, so a handler
  // reading them saw the rows before the search. A widget publishes before the event that announces it.
  test('[ShadTable-EVT-013] onSearch handlers read the searched rows: they are published before it fires', async () => {
    render({ properties: { searchPlaceholder: binding('Find a customer') } });
    widget.setEvents(
      on(
        'onSearch',
        '{{[components.table1.searchText, components.table1.filteredData.length, components.table1.currentPageData.length]}}'
      )
    );
    fireEvent.change(await screen.findByPlaceholderText('Find a customer'), { target: { value: 'grace' } });
    await waitFor(() => expect(widget.variables().seen).toBeDefined());
    expect(widget.variables().seen).toEqual(['grace', 1, 1]);
  });

  test('[ShadTable-EVT-014] onSort, onFilterChanged and onPageChanged handlers read the rows after the change', async () => {
    render({ properties: { rowsPerPage: binding('{{2}}') } });
    widget.setEvents([
      ...on('onSort', '{{components.table1.filteredData[0].name}}', 'sorted'),
      ...on('onFilterChanged', '{{components.table1.filteredData.length}}', 'filtered'),
      ...on('onPageChanged', '{{components.table1.currentPageData[0].name}}', 'paged'),
    ]);
    await waitFor(() => expect(rows()).toHaveLength(2));

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(widget.variables().paged).toBeDefined());
    expect(widget.variables().paged).toBe('Grace Hopper');

    fireEvent.click(screen.getByRole('button', { name: 'Amount' }));
    await waitFor(() => expect(widget.variables().sorted).toBeDefined());
    expect(widget.variables().sorted).toBe('Alan Turing');

    popover(/Filter/);
    fireEvent.change(await screen.findByRole('textbox', { name: 'Value' }), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(widget.variables().filtered).toBeDefined());
    expect(widget.variables().filtered).toBe(1);
  });

  test('[ShadTable-PROP-007] displaySearchBox, showFilterButton and hideColumnSelectorButton control the toolbar', async () => {
    render({
      properties: {
        displaySearchBox: binding('{{false}}'),
        showFilterButton: binding('{{false}}'),
        hideColumnSelectorButton: binding('{{true}}'),
      },
    });

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(screen.queryByRole('textbox', { name: 'Search' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Filter/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Columns/ })).toBeNull();
  });

  test('[ShadTable-PROP-008] the column selector hides a column', async () => {
    render();

    await waitFor(() => expect(headers()).toHaveLength(4));
    popover(/Columns/);
    const status = await screen.findByText('Status', { selector: 'label span' });
    fireEvent.click(status.closest('label').querySelector('[role=checkbox]'));
    await waitFor(() => expect(headers()).toEqual(['Name', 'Date', 'Amount']));
  });

  test('[ShadTable-EVT-004] a sortable header fires onSort with sortApplied; enabledSort off and serverSideSort keep the order', async () => {
    render();
    widget.setEvents(on('onSort', '{{components.table1.sortApplied[0].direction}}'));

    await waitFor(() => expect(rows()).toHaveLength(3));
    fireEvent.click(screen.getByRole('button', { name: 'Amount' }));
    await waitFor(() => expect(widget.variables().seen).toBe('asc'));
    expect(names()).toEqual(['Alan Turing', 'Ada Lovelace', 'Grace Hopper']);
    expect(exposed().sortApplied).toEqual([{ column: 'Amount', columnKey: 'amount', direction: 'asc' }]);
    fireEvent.click(screen.getByRole('button', { name: 'Amount' }));
    await waitFor(() => expect(names()[0]).toBe('Grace Hopper'));
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toHaveAttribute('aria-sort', 'descending');

    render({ properties: { serverSideSort: binding('{{true}}') } });
    await widget.act('setSort', 'name', 'desc');
    await waitFor(() => expect(exposed().sortApplied[0]).toMatchObject({ columnKey: 'name', direction: 'desc' }));
    expect(names()[0]).toBe('Ada Lovelace');

    render({ properties: { enabledSort: binding('{{false}}') } });
    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(screen.queryByRole('button', { name: 'Amount' })).toBeNull();
  });

  test('[ShadTable-EVT-005] a header press fires onHeaderClick with selectedColumnHeader; entering a row fires onRowHovered', async () => {
    render({ properties: { enabledSort: binding('{{false}}') } });
    widget.setEvents([
      ...on('onHeaderClick', '{{components.table1.selectedColumnHeader.key}}'),
      ...on('onRowHovered', '{{components.table1.hoveredRow.name}}', 'hovered'),
    ]);

    await waitFor(() => expect(rows()).toHaveLength(3));
    fireEvent.click(screen.getByRole('columnheader', { name: 'Date' }));
    await waitFor(() => expect(widget.variables().seen).toBe('date'));
    expect(exposed().selectedColumnHeader).toEqual({ name: 'Date', key: 'date' });
    fireEvent.mouseEnter(row('Grace'));
    await waitFor(() => expect(widget.variables().hovered).toBe('Grace Hopper'));
    expect(exposed().hoveredRowId).toBe(2);
  });

  test('[ShadTable-EVT-006] the filter panel applies filters, firing onFilterChanged; serverSideFilter leaves the rows to the app', async () => {
    render();
    widget.setEvents(on('onFilterChanged', '{{components.table1.filters[0].value}}'));

    await waitFor(() => expect(rows()).toHaveLength(3));
    popover(/Filter/);
    fireEvent.change(await screen.findByRole('textbox', { name: 'Value' }), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(widget.variables().seen).toBe('Ada'));
    expect(names()).toEqual(['Ada Lovelace']);
    expect(exposed().filters).toEqual([{ column: 'Name', condition: 'contains', value: 'Ada' }]);

    render({ properties: { serverSideFilter: binding('{{true}}') } });
    await widget.act('setFilters', [{ column: 'name', condition: 'contains', value: 'Ada' }]);
    await waitFor(() => expect(exposed().filters).toHaveLength(1));
    expect(rows()).toHaveLength(3);
  });

  test('[ShadTable-ACT-001] setFilters takes keys or header names; clearFilters removes them', async () => {
    render();

    await widget.act('setFilters', [{ column: 'Status', condition: 'equals', value: 'Paid' }]);
    await waitFor(() => expect(names()).toEqual(['Ada Lovelace']));
    expect(screen.getByRole('button', { name: /Filter/ })).toHaveTextContent('1');
    await widget.act('clearFilters');
    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(exposed().filters).toEqual([]);
  });

  test('[ShadTable-EVT-007] editing a cell fires onCellValueChanged with changeSet, dataUpdates and updatedData set', async () => {
    render({ properties: { columns: binding(EDITABLE) } });
    widget.setEvents(on('onCellValueChanged', '{{components.table1.changeSet[0].name}}'));

    await waitFor(() => expect(rows()).toHaveLength(3));
    await editFirstName('Zed');
    await waitFor(() => expect(widget.variables().seen).toBe('Zed'));
    expect(exposed().dataUpdates).toEqual([expect.objectContaining({ id: 1, name: 'Zed' })]);
    expect(exposed().updatedData.map((r) => r.name)).toEqual(['Zed', 'Alan Turing', 'Grace Hopper']);
    expect(screen.getByText('1 row changed')).toBeInTheDocument();
  });

  test('[ShadTable-IME-001] the Enter that ends an IME composition in a cell editor does not commit it', async () => {
    // Release audit round 2: the Enter that confirms composed characters committed the cell (and closed the editor).
    render({ properties: { columns: binding(EDITABLE) } });
    await waitFor(() => expect(rows().length).toBeGreaterThan(0));
    fireEvent.click(rows()[0].querySelector('td'));
    await waitFor(() => expect(rows()[0].querySelector('input')).not.toBeNull());
    const input = rows()[0].querySelector('input');
    fireEvent.change(input, { target: { value: 'とう' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    await settle();
    expect(exposed().changeSet ?? {}).toEqual({});
    expect(rows()[0].querySelector('input')).not.toBeNull();
    fireEvent.keyDown(rows()[0].querySelector('input'), { key: 'Enter' });
    await waitFor(() => expect(exposed().changeSet).toEqual({ 0: { name: 'とう' } }));
  });

  test('[ShadTable-EVT-012] new data drops the edits, and the published changeSet, dataUpdates and updatedData with them', async () => {
    render({ properties: { columns: binding(EDITABLE) } });
    widget.setEvents(on('onCellValueChanged', 'edited', 'changes'));
    await waitFor(() => expect(rows()).toHaveLength(3));
    await editFirstName('Zed');
    await waitFor(() => expect(exposed().changeSet).toEqual({ 0: { name: 'Zed' } }));
    widget.setComponentProperty(ID, 'data', "{{[{ id: 1, name: 'From server' }]}}", 'properties');
    await waitFor(() => expect(names()).toEqual(['From server']));
    await waitFor(() => expect(exposed().changeSet).toEqual({}));
    expect(exposed().dataUpdates).toEqual([]);
    expect(exposed().updatedData.map((r) => r.name)).toEqual(['From server']);
  });

  test('[ShadTable-EVT-011] an edited row is filtered and sorted by its edited values', async () => {
    render({ properties: { columns: binding(EDITABLE) } });

    await waitFor(() => expect(rows()).toHaveLength(3));
    await editFirstName('Zed');
    await waitFor(() => expect(names()[0]).toBe('Zed'));
    await widget.act('setFilters', [{ column: 'name', condition: 'contains', value: 'Zed' }]);
    await waitFor(() => expect(names()).toEqual(['Zed']));
    await widget.act('clearFilters');
    await widget.act('setSort', 'name', 'asc');
    await waitFor(() => expect(names()).toEqual(['Alan Turing', 'Grace Hopper', 'Zed']));
    await widget.act('setSort', 'name', 'desc');
    await waitFor(() => expect(names()).toEqual(['Zed', 'Grace Hopper', 'Alan Turing']));
  });

  test('[ShadTable-EVT-008] Save changes fires onBulkUpdate; Discard fires onCancelChanges and drops the edits', async () => {
    render({ properties: { columns: binding(EDITABLE) } });
    widget.setEvents([
      ...on('onBulkUpdate', '{{components.table1.dataUpdates.length}}'),
      ...on('onCancelChanges', '{{components.table1.dataUpdates.length}}', 'cancelled'),
    ]);

    await waitFor(() => expect(rows()).toHaveLength(3));
    await editFirstName('Zed');
    fireEvent.click(await screen.findByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(widget.variables().seen).toBe(1));
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(widget.variables().cancelled).toBe(0));
    expect(names()[0]).toBe('Ada Lovelace');
    expect(screen.queryByText('1 row changed')).toBeNull();
  });

  test('[ShadTable-ACT-002] discardChanges drops edits without firing onCancelChanges; showBulkUpdateActions off hides the bar', async () => {
    render({ properties: { columns: binding(EDITABLE), showBulkUpdateActions: binding('{{false}}') } });
    widget.setEvents(on('onCancelChanges', 'YES'));

    await waitFor(() => expect(rows()).toHaveLength(3));
    await editFirstName('Zed');
    await waitFor(() => expect(exposed().changeSet).toEqual({ 0: { name: 'Zed' } }));
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
    await widget.act('discardChanges');
    await waitFor(() => expect(exposed().changeSet).toEqual({}));
    expect(names()[0]).toBe('Ada Lovelace');
    expect(widget.variables().seen).toBeUndefined();
  });

  test('[ShadTable-EVT-009] an action button fires onActionButtonClicked with lastActionClicked and the row set', async () => {
    render({ properties: { columns: binding(EDITABLE) } });
    widget.setEvents(on('onActionButtonClicked', '{{components.table1.lastActionClicked.row.name}}'));

    await waitFor(() => expect(rows()).toHaveLength(3));
    fireEvent.click(within(row('Alan')).getByRole('button', { name: 'Open' }));
    await waitFor(() => expect(widget.variables().seen).toBe('Alan Turing'));
    expect(exposed().lastActionClicked).toMatchObject({
      buttonId: 'open',
      columnKey: 'actions',
      columnName: 'Actions',
    });
  });

  test('[ShadTable-EVT-015] an action button selects its row as a click on the row does, and never deselects it', async () => {
    // The action published selectedRow alone: the clicked row stayed highlighted, onSelectionChanged did not fire,
    // and the next click on the highlighted row deselected it. The native Table's action click reaches the row: the
    // row selects and onRowClicked fires, after onActionButtonClicked.
    render({ properties: { columns: binding(EDITABLE), disableRowDeselection: binding('{{false}}') } });
    widget.setEvents([
      ...countInvocationsOn(ID, 'onRowClicked'),
      ...countInvocationsOn(ID, 'onSelectionChanged', { key: 'changes' }),
      ...on('onActionButtonClicked', '{{components.table1.selectedRows[0].name}}'),
    ]);

    await waitFor(() => expect(rows()).toHaveLength(3));
    fireEvent.click(row('Ada'));
    await waitFor(() => expect(widget.variables().changes).toBe(1));
    fireEvent.click(within(row('Alan')).getByRole('button', { name: 'Open' }));
    await waitFor(() => expect(widget.variables().seen).toBe('Alan Turing'));
    await waitFor(() => expect(widget.variables().changes).toBe(2));
    expect(widget.variables().calls).toBe(2);
    expect(exposed()).toMatchObject({ selectedRow: { name: 'Alan Turing' }, selectedRowId: 1, selectedRowsId: [1] });
    expect(row('Alan')).toHaveAttribute('data-state', 'selected');
    expect(row('Ada')).not.toHaveAttribute('data-state');

    // An action on the selected row keeps it selected: a click on a button is not a deselecting click.
    fireEvent.click(within(row('Alan')).getByRole('button', { name: 'Open' }));
    await waitFor(() => expect(widget.variables().calls).toBe(3));
    await settle();
    expect(widget.variables().changes).toBe(2);
    expect(exposed()).toMatchObject({ selectedRow: { name: 'Alan Turing' }, selectedRowsId: [1] });
    expect(row('Alan')).toHaveAttribute('data-state', 'selected');
  });

  test('[ShadTable-PROP-013] with allowSelection off, an action exposes its row for the handler and highlights nothing', async () => {
    render({ properties: { columns: binding(EDITABLE), allowSelection: binding('{{false}}') } });
    widget.setEvents([
      ...countInvocationsOn(ID, 'onRowClicked'),
      ...countInvocationsOn(ID, 'onSelectionChanged', { key: 'changes' }),
      ...on('onActionButtonClicked', '{{components.table1.selectedRow.name}}'),
    ]);

    await waitFor(() => expect(rows()).toHaveLength(3));
    fireEvent.click(within(row('Grace')).getByRole('button', { name: 'Open' }));
    await waitFor(() => expect(widget.variables().seen).toBe('Grace Hopper'));
    await waitFor(() => expect(widget.variables().calls).toBe(1));
    expect(exposed()).toMatchObject({ selectedRowId: 2, selectedRows: [], selectedRowsId: [] });
    expect(widget.variables().changes).toBeUndefined();
    expect(rows().filter((tr) => tr.hasAttribute('data-state'))).toEqual([]);

    // A row the selectRow action picked is not marked either, as on the native Table: with selection off, a marked row
    // would disagree with the selectedRow an action or click exposes.
    await widget.act('selectRow', 'name', 'Alan Turing');
    fireEvent.click(within(row('Grace')).getByRole('button', { name: 'Open' }));
    await waitFor(() => expect(widget.variables().calls).toBe(2));
    expect(exposed().selectedRow).toMatchObject({ name: 'Grace Hopper' });
    expect(rows().filter((tr) => tr.hasAttribute('data-state'))).toEqual([]);
  });

  test('[ShadTable-EVT-010] showRefreshButton fires onRefresh; showDownloadButton downloads CSV and fires onTableDataDownload', async () => {
    render({ properties: { showRefreshButton: binding('{{true}}'), showDownloadButton: binding('{{true}}') } });
    widget.setEvents([...on('onRefresh', 'YES', 'refreshed'), ...on('onTableDataDownload', 'YES', 'downloaded')]);

    fireEvent.click(await screen.findByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(widget.variables().refreshed).toBe('YES'));
    await withDownloads(async (saved) => {
      popover('Download');
      fireEvent.click(await screen.findByText('Download CSV'));
      await waitFor(() => expect(widget.variables().downloaded).toBe('YES'));
      expect(saved[0]).toMatch(/^table1_.*\.csv$/);
    });
  });

  test('[ShadTable-ACT-003] downloadTableData saves the shown rows as CSV or JSON', async () => {
    render();

    await withDownloads(async (saved) => {
      await widget.act('downloadTableData', 'csv');
      await widget.act('downloadTableData', 'JSON');
      expect(saved).toEqual([expect.stringMatching(/\.csv$/), expect.stringMatching(/\.json$/)]);
      expect(URL.createObjectURL.mock.calls.map(([blob]) => blob.type)).toEqual([
        'text/csv;charset=utf-8',
        'application/json',
      ]);
    });
  });

  test('[ShadTable-ACT-004] setPage moves pages without firing onPageChanged; setSearchText searches', async () => {
    render({ properties: { rowsPerPage: binding('{{1}}') } });
    widget.setEvents(on('onPageChanged', 'YES'));

    await widget.act('setPage', 3);
    await waitFor(() => expect(names()).toEqual(['Grace Hopper']));
    expect(exposed().pageIndex).toBe(3);
    await widget.act('setSearchText', 'alan');
    await waitFor(() => expect(names()).toEqual(['Alan Turing']));
    await settle();
    expect(widget.variables().seen).toBeUndefined();
  });

  test('[ShadTable-ACT-005] selectRow and deselectRow; selectRows, deselectRows, selectAllRows and deselectAllRows', async () => {
    render({ properties: { showBulkSelector: binding('{{true}}') } });

    await widget.act('selectRow', 'name', 'Alan Turing');
    await waitFor(() => expect(exposed().selectedRow).toMatchObject({ id: 2 }));
    await widget.act('deselectRow');
    await waitFor(() => expect(exposed().selectedRows).toEqual([]));
    await widget.act('selectRows', 'id', [1, 3]);
    await waitFor(() => expect(exposed().selectedRowsId).toEqual([0, 2]));
    await widget.act('deselectRows', 'id', [1]);
    await waitFor(() => expect(exposed().selectedRowsId).toEqual([2]));
    await widget.act('selectAllRows');
    await waitFor(() => expect(exposed().selectedRowsId).toEqual([0, 1, 2]));
    // A list as the key selects nothing.
    await widget.act('deselectAllRows');
    await widget.act('selectRows', [1], [1]);
    await waitFor(() => expect(exposed().selectedRows).toEqual([]));
  });

  test('[ShadTable-DEF-002] selectRows and deselectRows over 10k values on 10k rows finish quickly', async () => {
    render({
      properties: { data: binding("{{Array.from({ length: 10000 }, (_, i) => ({ id: i, name: 'Row ' + i }))}}") },
    });

    const started = performance.now();
    await widget.act(
      'selectRows',
      'id',
      Array.from({ length: 10000 }, (_, i) => i)
    );
    await waitFor(() => expect(exposed().selectedRows).toHaveLength(10000));
    await widget.act(
      'deselectRows',
      'id',
      Array.from({ length: 5000 }, (_, i) => i)
    );
    await waitFor(() => expect(exposed().selectedRows).toHaveLength(5000));
    expect(performance.now() - started).toBeLessThan(8000);
  });

  // A 10k-row list bound as the columns, or as the filters, by mistake: the table draws at most 100 columns and
  // checks at most 50 filters instead of freezing.
  test('[ShadTable-DEF-003] a huge list bound as columns or filters is capped, not drawn or checked in full', async () => {
    const huge = "{{Array.from({ length: 10000 }, (_, i) => ({ key: 'k' + i, name: 'Column ' + i }))}}";
    render({ properties: { columns: binding(huge) } });
    await waitFor(() => expect(headers()).toHaveLength(100));

    render();
    const started = performance.now();
    await widget.act(
      'setFilters',
      Array.from({ length: 10000 }, () => ({ column: 'id', condition: 'gt', value: 1 }))
    );
    await waitFor(() => expect(exposed().filters).toHaveLength(50));
    expect(performance.now() - started).toBeLessThan(8000);
  });

  test('[ShadTable-PROP-009] cellSize, tableType and stickyHeader shape the rows and header; showRowCount off hides the count', async () => {
    render({
      properties: { cellSize: binding('condensed'), tableType: binding('striped'), showRowCount: binding('{{false}}') },
    });
    await waitFor(() => expect(rows()[0].querySelector('td').style.height).toBe('36px'));
    expect(rows()[1].className).toContain('--lk-striped');
    expect(rows()[0].className).not.toContain('--lk-striped');
    expect(screen.queryByText('3 rows')).toBeNull();

    render({
      properties: {
        cellSize: binding('spacious'),
        tableType: binding('bordered'),
        dynamicHeight: binding('{{false}}'),
      },
    });
    await waitFor(() => expect(rows()[0].querySelector('td').style.height).toBe('56px'));
    expect(rows()[0].querySelector('td')).toHaveClass('tw-border-r');
    expect(document.querySelector('thead')).toHaveClass('tw-sticky');

    render({ properties: { stickyHeader: binding('{{false}}'), dynamicHeight: binding('{{false}}') } });
    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(document.querySelector('thead')).not.toHaveClass('tw-sticky');
  });

  test('[ShadTable-PROP-010] emptyText and emptyDescription show for no rows; a search with no match says so', async () => {
    render({
      properties: {
        data: binding('{{[]}}'),
        emptyText: binding('No invoices yet'),
        emptyDescription: binding('Create one to get started'),
      },
    });
    expect(await screen.findByText('No invoices yet')).toBeInTheDocument();
    expect(screen.getByText('Create one to get started')).toBeInTheDocument();

    render();
    await widget.act('setSearchText', 'nobody');
    expect(await screen.findByText('No matching rows.')).toBeInTheDocument();
  });

  test('[ShadTable-STY-001] colours reach the table as CSS variables; header casing, border and font size apply', async () => {
    const { container } = render({
      styles: {
        accentColor: binding('#2563eb'),
        backgroundColor: binding('#ffffff'),
        headerBackgroundColor: binding('#f1f5f9'),
        headerTextColor: binding('#334155'),
        textColor: binding('#0f172a'),
        mutedTextColor: binding('#64748b'),
        borderColor: binding('#e2e8f0'),
        rowHoverColor: binding('#f8fafc'),
        selectedRowColor: binding('#dbeafe'),
        stripedRowColor: binding('#fafafa'),
        borderRadius: binding('{{10}}'),
        fontSize: binding('{{13}}'),
        headerCasing: binding('uppercase'),
        showBorder: binding('{{false}}'),
      },
    });

    const root = container.querySelector('.tj-shadcn');
    await waitFor(() => expect(root.style.getPropertyValue('--sc-primary')).toBe('#2563eb'));
    expect(
      [
        '--lk-bg',
        '--lk-head-bg',
        '--lk-head-fg',
        '--lk-fg',
        '--lk-muted',
        '--lk-border',
        '--lk-hover',
        '--lk-selected',
        '--lk-striped',
        '--lk-radius',
      ].map((v) => root.style.getPropertyValue(v))
    ).toEqual([
      '#ffffff',
      '#f1f5f9',
      '#334155',
      '#0f172a',
      '#64748b',
      '#e2e8f0',
      '#f8fafc',
      '#dbeafe',
      '#fafafa',
      '10px',
    ]);
    expect(document.querySelector('thead th')).toHaveClass('tw-uppercase');
    expect(document.querySelector('table').parentElement).not.toHaveClass('tw-border');
    expect(document.querySelector('table').closest('.tw-gap-3').style.fontSize).toBe('13px');
  });
});
