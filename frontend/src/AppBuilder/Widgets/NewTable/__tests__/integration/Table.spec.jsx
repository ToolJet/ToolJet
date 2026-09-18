/**
 * Table: the widget's approved contract (frontend/ee/test/app-builder/widgets/Table/TESTING.md).
 * Shared setup lives in Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real Table / TableContainer / TableData / useTable.
 * Nothing about the widget is mocked.
 *
 * Named literally Table.spec.jsx (not TableXxx.spec.jsx) per this contract's D-02: the
 * widget-testing-contract validator maps a test file to its registered componentType via the
 * file's own basename, and the widget's directory is `NewTable` (does not match `Table`).
 */
import React from 'react';
import { waitFor, within, fireEvent as rtlFireEvent, act } from '@testing-library/react';
import { componentDefinition, seedApp, binding } from '@/test/app-builder';
import { createWidgetHarness, store, MODULE_ID, drain } from '@/AppBuilder/Widgets/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';

const ID = 'tbl1';
const NAME = 'table1';

const COLUMNS = [
  { name: 'name', key: 'name', id: 'col-name', columnType: 'string', columnSize: 120, isEditable: true },
  { name: 'email', key: 'email', id: 'col-email', columnType: 'string', columnSize: 160, isEditable: false },
  { name: 'age', key: 'age', id: 'col-age', columnType: 'number', columnSize: 80, isEditable: true },
];

const ROWS = [
  { id: 1, name: 'Ada', email: 'ada@example.com', age: 30 },
  { id: 2, name: 'Grace', email: 'grace@example.com', age: 40 },
  { id: 3, name: 'Rosalind', email: 'rosalind@example.com', age: 35 },
];

const widget = createWidgetHarness({
  componentType: 'Table',
  handle: NAME,
  id: ID,
  // Baseline mirrors table.js's own shipped `definition.properties` values
  // (table.js:715-882) for every boolean/toggle default; `data`/`columns` are a
  // small deterministic fixture instead of the 10-row/7-column onboarding
  // sample, so individual scenario tests can assert exact rows/cells.
  defaultProperties: {
    title: binding('Table'),
    dataSourceSelector: binding('rawJson'),
    data: binding(`{{${JSON.stringify(ROWS)}}}`),
    columns: { value: COLUMNS },
    autogenerateColumns: { value: false },
    useDynamicColumn: binding('{{false}}'),
    loadingState: binding('{{false}}'),
    rowsPerPage: binding('{{10}}'),
    serverSidePagination: binding('{{false}}'),
    enableNextButton: binding('{{true}}'),
    enablePrevButton: binding('{{true}}'),
    totalRecords: binding('{{10}}'),
    enablePagination: binding('{{true}}'),
    serverSideSort: binding('{{false}}'),
    serverSideFilter: binding('{{false}}'),
    displaySearchBox: binding('{{true}}'),
    showDownloadButton: binding('{{true}}'),
    showFilterButton: binding('{{true}}'),
    isAllColumnsEditable: binding('{{false}}'),
    showBulkUpdateActions: binding('{{true}}'),
    showBulkSelector: binding('{{false}}'),
    highlightSelectedRow: binding('{{false}}'),
    enabledSort: binding('{{true}}'),
    defaultSortColumn: binding(''),
    defaultSortDirection: binding('auto'),
    hideColumnSelectorButton: binding('{{false}}'),
    defaultSelectedRow: binding('{{{}}}'),
    showAddNewRowButton: binding('{{true}}'),
    showRefreshButton: binding('{{false}}'),
    allowSelection: binding('{{true}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    selectRowOnCellEdit: binding('{{false}}'),
    enableExpandableRows: binding('{{false}}'),
    expansionHeight: binding('{{229}}'),
    disableRowDeselection: binding('{{false}}'),
  },
  // TableData's virtualizer measures `tableBodyRef.current`'s scroll-container
  // height; jsdom reports 0 for every layout metric, which without a spy leaves
  // `useVirtualizer` computing zero visible rows despite a non-empty dataset.
  offsetHeight: 400,
  // An expanded row's content renders a real App Builder <Container> (a drop
  // target for child widgets), which throws "Expected drag drop context"
  // without the real react-dnd DndProvider — see README's capabilities.dnd note.
  capabilities: { dnd: true },
});

const exposed = (key) => widget.exposed()?.[key];
const table = () => document.querySelector('table');
const headerCell = (name) => document.querySelector(`[data-cy="${name}-column-header"]`);
// The synthetic `selection` column always renders a <th> (even with
// showBulkSelector off, its header render-fn just returns null), whose
// data-cy still matches `-column-header` with an empty column name prefix.
const headerNames = () =>
  [...document.querySelectorAll('thead [data-cy$="-column-header"]')].map((el) => el.textContent).filter(Boolean);
const cell = (columnHeader, rowIndex) => document.querySelector(`[data-cy$="-${columnHeader}-row-${rowIndex}"]`);
// An editable Number cell always renders a real <input> (not just while
// actively focused) — its value is a DOM property, not textContent.
const cellText = (columnHeader, rowIndex) => {
  const el = cell(columnHeader, rowIndex);
  const input = el?.querySelector('input');
  if (input) return input.value;
  const text = el?.textContent ?? '';
  // DatePickerRenderer keeps a `visibility: hidden` <span> solely to measure
  // text width, holding the SAME string as the visible one — textContent
  // includes hidden elements, so the date literally appears twice back-to-back.
  const half = text.length / 2;
  return Number.isInteger(half) && text.slice(0, half) === text.slice(half) ? text.slice(0, half) : text;
};
const row = (index) => document.querySelector(`[data-cy$="-row-${index}"]`);
const searchInput = () => document.querySelector(`[data-cy="${NAME}-search-input-field"]`);

/** Clicks the idle StringRenderer/BaseInput display element inside an editable cell. */
function clickToEdit(cellEl) {
  rtlFireEvent.click(cellEl.querySelector('.long-text-input') ?? cellEl);
}

async function editCellTo(cellEl, text) {
  clickToEdit(cellEl);
  const editable = await waitFor(() => {
    const el = cellEl.querySelector('[contenteditable="true"]');
    if (!el) throw new Error('not editing yet');
    return el;
  });
  editable.textContent = text;
  rtlFireEvent.blur(editable);
}

describe('Table: default rendering and data source', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-DEF-001] a configured title and raw-JSON data render on mount', async () => {
    widget.render();

    await waitFor(() => expect(table()).toBeInTheDocument());
    expect(headerCell('name')).toBeInTheDocument();
    expect(headerCell('email')).toBeInTheDocument();
    expect(cell('name', 0)?.textContent).toBe('Ada');
    expect(cell('email', 1)?.textContent).toBe('grace@example.com');
  });

  test('[Table-DEF-002] an empty data array renders the empty state, not an error', async () => {
    widget.render({ properties: { data: binding('{{[]}}') } });

    // TableData.jsx returns a dedicated "No data" state instead of an empty
    // <table> when `data.length === 0` — no <table> element exists at all.
    await waitFor(() => expect(document.querySelector('.warning-no-data-text')).toHaveTextContent('No data'));
    expect(table()).not.toBeInTheDocument();
  });

  test('[Table-DATA-001] dataSourceSelector switches the table to a bound variable instead of the data property', async () => {
    const BOUND_ROWS = [{ id: 9, name: 'Bound', email: 'bound@example.com', age: 1 }];
    store().setVariable('boundRows', BOUND_ROWS, MODULE_ID);

    widget.render({
      properties: { dataSourceSelector: binding('{{variables.boundRows}}') },
    });

    await waitFor(() => expect(cell('name', 0)?.textContent).toBe('Bound'));
    // The `data` property itself (still the harness's default ROWS) must NOT be what rendered.
    expect(cell('name', 1)).not.toBeInTheDocument();
  });

  test('[Table-DATA-002] currentData exposes the resolved dataset and tracks a data change', async () => {
    widget.render();

    await waitFor(() => expect(exposed('currentData')).toEqual(ROWS));

    const NEW_ROWS = [{ id: 5, name: 'Katherine', email: 'kat@example.com', age: 50 }];
    widget.setComponentProperty(ID, 'data', `{{${JSON.stringify(NEW_ROWS)}}}`, 'properties');

    await waitFor(() => expect(exposed('currentData')).toEqual(NEW_ROWS));
  });
});

describe('Table: column list and autogeneration', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-COL-001] the configured columns list renders, in order, one column per entry', async () => {
    widget.render();

    await waitFor(() => expect(headerNames()).toEqual(['name', 'email', 'age']));
  });

  test('[Table-AUTOCOL-001] a locked schema (autogenerateColumns off) keeps a hand-authored column list stable across a data-shape change', async () => {
    widget.render({ properties: { autogenerateColumns: { value: false } } });
    await waitFor(() => expect(headerNames()).toEqual(['name', 'email', 'age']));

    const DIFFERENTLY_SHAPED_ROWS = [{ sku: 'A1', price: 9.99 }];
    widget.setComponentProperty(ID, 'data', `{{${JSON.stringify(DIFFERENTLY_SHAPED_ROWS)}}}`, 'properties');
    await drain();

    expect(headerNames()).toEqual(['name', 'email', 'age']);
  });

  test('[Table-AUTOCOL-002] useDynamicColumn derives columns from columnData instead of the static columns list', async () => {
    widget.render({
      properties: {
        useDynamicColumn: binding('{{true}}'),
        columnData: binding(
          `{{${JSON.stringify([
            { name: 'Dyn One', key: 'name', id: 'dyn-1' },
            { name: 'Dyn Two', key: 'email', id: 'dyn-2' },
          ])}}}`
        ),
      },
    });

    await waitFor(() => expect(headerNames()).toEqual(['Dyn One', 'Dyn Two']));
  });

  test('[Table-AUTOCOL-003] with the schema unlocked and no dynamic column, columns are autogenerated from the data shape', async () => {
    widget.render({
      properties: {
        autogenerateColumns: { value: true },
        columns: { value: [] },
        data: binding(`{{${JSON.stringify(ROWS)}}}`),
      },
    });

    await waitFor(() => expect(headerNames().sort()).toEqual(['age', 'email', 'id', 'name'].sort()));
  });
});

const MANY_ROWS = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `Row${i + 1}`,
  email: `row${i + 1}@example.com`,
  age: 20 + i,
}));

const bodyRowCount = () => document.querySelectorAll('.table-row.table-editor-component-row').length;
const paginationButton = (dataCy) => document.querySelector(`[data-cy="${dataCy}"]`);

describe('Table: pagination', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-PAG-001] rowsPerPage bounds how many rows render per page in client mode', async () => {
    widget.render({ properties: { data: binding(`{{${JSON.stringify(MANY_ROWS)}}}`), rowsPerPage: binding('{{2}}') } });

    await waitFor(() => expect(bodyRowCount()).toBe(2));
  });

  test('[Table-PAG-003] enablePagination off renders every row on one page, in both pagination modes', async () => {
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify(MANY_ROWS)}}}`),
        rowsPerPage: binding('{{2}}'),
        enablePagination: binding('{{false}}'),
        serverSidePagination: binding('{{false}}'),
      },
    });
    await waitFor(() => expect(bodyRowCount()).toBe(MANY_ROWS.length));

    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify(MANY_ROWS)}}}`),
        rowsPerPage: binding('{{2}}'),
        enablePagination: binding('{{false}}'),
        serverSidePagination: binding('{{true}}'),
      },
    });
    await waitFor(() => expect(bodyRowCount()).toBe(MANY_ROWS.length));
  });

  test('[Table-PAG-004] setPage CSA and clicking a page control both move the page, but only the click fires onPageChanged', async () => {
    let onPageChangedCount = 0;
    widget.render({
      properties: { data: binding(`{{${JSON.stringify(MANY_ROWS)}}}`), rowsPerPage: binding('{{2}}') },
      events: [
        {
          id: 'evt-page-changed',
          name: 'onPageChanged',
          index: 0,
          sourceId: ID,
          target: 'component',
          event: { eventId: 'onPageChanged', actionId: 'set-custom-variable', key: 'pageChangedCount', value: '{{1}}' },
        },
      ],
    });
    await waitFor(() => expect(bodyRowCount()).toBe(2));

    await widget.act('setPage', 2);
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));
    expect(store().getVariable('pageChangedCount', MODULE_ID)).toBeUndefined();

    rtlFireEvent.click(paginationButton('pagination-button-to-previous'));
    await waitFor(() => expect(store().getVariable('pageChangedCount', MODULE_ID)).toBe(1));
  });

  test('[Table-PAG-SERVER-001] serverSidePagination trusts totalRecords instead of re-paginating the handed rows', async () => {
    // "Page 1" from a server that has 5 total records, 2 per page — only 2 rows
    // are ever handed to the widget at once.
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify(MANY_ROWS.slice(0, 2))}}}`),
        serverSidePagination: binding('{{true}}'),
        serverSideRowsPerPage: binding('{{2}}'),
        totalRecords: binding('{{5}}'),
      },
    });

    await waitFor(() => expect(bodyRowCount()).toBe(2));
    // 5 records at 2/page is 3 pages — the "jump to last page" control's
    // enablement (pageIndex === effectivePageCount) is computed from
    // totalRecords/serverSideRowsPerPage, not from the 2 rows actually handed.
    await waitFor(() => expect(paginationButton('pagination-button-to-last')).toBeInTheDocument());
    expect(paginationButton('pagination-button-to-last')).not.toBeDisabled();
  });
});

const bodyRowOrder = (columnHeader, count = 3) => Array.from({ length: count }, (_, i) => cellText(columnHeader, i));

describe('Table: sorting', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-SORT-001] enabledSort off means clicking a header does not reorder rows', async () => {
    widget.render({ properties: { enabledSort: binding('{{false}}') } });
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(headerCell('age'));
    await drain();

    expect(bodyRowOrder('age')).toEqual(['30', '40', '35']);
  });

  test('[Table-SORT-002] defaultSortColumn/defaultSortDirection apply on load, before any interaction', async () => {
    widget.render({ properties: { defaultSortColumn: binding('age'), defaultSortDirection: binding('desc') } });

    await waitFor(() => expect(bodyRowOrder('age')).toEqual(['40', '35', '30']));
  });

  test('[Table-SORT-004] clicking a header cycles sort direction and fires onSort with the applied column/direction', async () => {
    widget.render();
    await waitFor(() => expect(table()).toBeInTheDocument());

    // TanStack's default toggle order is desc first, then asc.
    rtlFireEvent.click(headerCell('age'));
    await waitFor(() => expect(bodyRowOrder('age')).toEqual(['40', '35', '30']));
    expect(exposed('sortApplied')).toEqual([{ column: 'age', columnKey: 'age', direction: 'desc' }]);

    rtlFireEvent.click(headerCell('age'));
    await waitFor(() => expect(bodyRowOrder('age')).toEqual(['30', '35', '40']));
    expect(exposed('sortApplied')).toEqual([{ column: 'age', columnKey: 'age', direction: 'asc' }]);
  });

  test('[Table-SORT-COMPARATOR-001] a number column sorts numerically, not lexically', async () => {
    widget.render({
      properties: { data: binding(`{{${JSON.stringify([{ age: 10 }, { age: 2 }, { age: 1 }])}}}`) },
    });
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(headerCell('age'));
    // desc-first click, numerically: 10, 2, 1 — a lexical sort would give 2, 10, 1.
    await waitFor(() => expect(bodyRowOrder('age')).toEqual(['10', '2', '1']));
  });

  test('[Table-SORT-COMPARATOR-002] a datepicker column sorts chronologically, not by its formatted display string', async () => {
    widget.render({
      properties: {
        columns: {
          value: [
            {
              name: 'when',
              key: 'when',
              id: 'col-when',
              columnType: 'datepicker',
              columnSize: 120,
              isDateSelectionEnabled: true,
              dateFormat: 'DD/MM/YYYY',
              parseDateFormat: 'DD/MM/YYYY',
              isTimeChecked: false,
            },
          ],
        },
        // Three dates whose lexical (string) order and chronological order are
        // full opposite permutations, so no single click state could pass by
        // coincidentally matching the wrong (lexical) comparator:
        //   lexical ascending:      05/01/2024, 10/06/2023, 20/12/2023
        //   chronological ascending: 10/06/2023, 20/12/2023, 05/01/2024
        data: binding(
          `{{${JSON.stringify([{ when: '05/01/2024' }, { when: '20/12/2023' }, { when: '10/06/2023' }])}}}`
        ),
      },
    });
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(headerCell('when'));
    await waitFor(() => expect(bodyRowOrder('when', 3)).toEqual(['10/06/2023', '20/12/2023', '05/01/2024']));
  });

  test('[Table-SORT-SERVER-001] serverSideSort switches sorting to manual — clicking a header changes sortApplied without reordering rows client-side', async () => {
    widget.render({ properties: { serverSideSort: binding('{{true}}') } });
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(headerCell('age'));

    await waitFor(() =>
      expect(exposed('sortApplied')).toEqual([{ column: 'age', columnKey: 'age', direction: 'desc' }])
    );
    // The rows the widget was handed are unchanged — a server-sorted app is expected to re-fetch, not have the widget reorder them.
    expect(bodyRowOrder('age')).toEqual(['30', '40', '35']);
  });
});

describe('Table: search and filter', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-SEARCH-001] displaySearchBox filters rows (debounced), exposes searchText, and fires onSearch', async () => {
    widget.render({
      events: [
        {
          id: 'evt-search',
          name: 'onSearch',
          index: 0,
          sourceId: ID,
          target: 'component',
          event: { eventId: 'onSearch', actionId: 'set-custom-variable', key: 'searchFired', value: '{{true}}' },
        },
      ],
    });
    await waitFor(() => expect(searchInput()).toBeInTheDocument());

    rtlFireEvent.change(searchInput(), { target: { value: 'grace' } });
    // The debounce is 500ms of REAL time (lodash.debounce) — not yet applied.
    expect(exposed('searchText')).toBeFalsy();

    await waitFor(() => expect(exposed('searchText')).toBe('grace'), { timeout: 2000 });
    expect(bodyRowCount()).toBe(1);
    expect(cellText('name', 0)).toBe('Grace');
    expect(store().getVariable('searchFired', MODULE_ID)).toBe(true);
  });

  test('[Table-SEARCH-002] serverSideSearch resets to page 1 on a non-empty search, without filtering client-side', async () => {
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify(MANY_ROWS)}}}`),
        rowsPerPage: binding('{{2}}'),
        serverSideSearch: binding('{{true}}'),
      },
    });
    await waitFor(() => expect(searchInput()).toBeInTheDocument());

    await widget.act('setPage', 2);
    await waitFor(() => expect(exposed('pageIndex')).toBe(2));

    rtlFireEvent.change(searchInput(), { target: { value: 'row' } });
    await waitFor(() => expect(exposed('searchText')).toBe('row'), { timeout: 2000 });
    await waitFor(() => expect(exposed('pageIndex')).toBe(1));
    // All 5 (server-supplied) rows are still handed through unfiltered — the
    // widget doesn't narrow them itself in server-search mode.
    expect(bodyRowCount()).toBe(2);
  });

  test('[Table-FILTER-002] a configured filter condition narrows rendered rows via setFilters, and clearFilters restores them; onFilterChanged fires on each change', async () => {
    widget.render({
      properties: { data: binding(`{{${JSON.stringify(MANY_ROWS)}}}`), rowsPerPage: binding('{{10}}') },
      events: [
        {
          id: 'evt-filter-changed',
          name: 'onFilterChanged',
          index: 0,
          sourceId: ID,
          target: 'component',
          event: {
            eventId: 'onFilterChanged',
            actionId: 'set-custom-variable',
            key: 'filterChangedCount',
            value: '{{(variables.filterChangedCount ?? 0) + 1}}',
          },
        },
      ],
    });
    await waitFor(() => expect(bodyRowCount()).toBe(MANY_ROWS.length));

    await widget.act('setFilters', [{ column: 'name', condition: 'equals', value: 'Row3' }]);
    await waitFor(() => expect(bodyRowCount()).toBe(1));
    expect(cellText('name', 0)).toBe('Row3');
    expect(exposed('filters')).toEqual([{ column: 'name', condition: 'equals', value: 'Row3' }]);
    await waitFor(() => expect(store().getVariable('filterChangedCount', MODULE_ID)).toBeGreaterThan(0));

    await widget.act('clearFilters');
    await waitFor(() => expect(bodyRowCount()).toBe(MANY_ROWS.length));
    expect(exposed('filters')).toEqual([]);
  });

  test('[Table-FILTER-SERVER-001] serverSideFilter switches filtering to manual — an applied filter changes `filters` without the table re-filtering client-side', async () => {
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify(MANY_ROWS)}}}`),
        rowsPerPage: binding('{{10}}'),
        serverSideFilter: binding('{{true}}'),
      },
    });
    await waitFor(() => expect(bodyRowCount()).toBe(MANY_ROWS.length));

    await widget.act('setFilters', [{ column: 'name', condition: 'equals', value: 'Row3' }]);
    await waitFor(() => expect(exposed('filters')).toEqual([{ column: 'name', condition: 'equals', value: 'Row3' }]));
    // Server mode: the widget exposes the request but does not narrow the rows itself.
    expect(bodyRowCount()).toBe(MANY_ROWS.length);
  });
});

const checkboxIn = (rowEl) => rowEl?.querySelector('[data-cy="checkbox-input"]');
const headerCheckbox = () => document.querySelector('thead [data-cy="checkbox-input"]');
const expandButtons = () => document.querySelectorAll('.table-expansion-toggle');
const expandButton = (rowIndex) => expandButtons()[rowIndex];

describe('Table: row selection', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-SEL-001] allowSelection off still sets selectedRow and fires onRowClicked on a row click', async () => {
    widget.render({ properties: { allowSelection: binding('{{false}}') } });
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(cell('email', 1));
    await waitFor(() => expect(exposed('selectedRow')).toEqual(ROWS[1]));
  });

  test('[Table-SEL-002] showBulkSelector, manual checkboxes, and every bulk-selection CSA converge on the same selectedRows', async () => {
    widget.render({ properties: { showBulkSelector: binding('{{true}}') } });
    await waitFor(() => expect(checkboxIn(row(0))).toBeInTheDocument());

    rtlFireEvent.click(checkboxIn(row(0)));
    await waitFor(() => expect(exposed('selectedRows')).toEqual([ROWS[0]]));

    await widget.act('selectRows', 'id', [ROWS[1].id, ROWS[2].id]);
    await waitFor(() => expect(exposed('selectedRows')).toEqual(expect.arrayContaining([ROWS[1], ROWS[2]])));

    await widget.act('deselectAllRows');
    await waitFor(() => expect(exposed('selectedRows')).toEqual([]));

    rtlFireEvent.click(headerCheckbox());
    await waitFor(() => expect(exposed('selectedRows')).toEqual(expect.arrayContaining(ROWS)));

    await widget.act('deselectRows', 'id', [ROWS[0].id]);
    await waitFor(() => expect(exposed('selectedRows')).toEqual(expect.arrayContaining([ROWS[1], ROWS[2]])));
    expect(exposed('selectedRows')).not.toEqual(expect.arrayContaining([ROWS[0]]));
  });

  test('[Table-SEL-006] selectRow/deselectRow CSAs and a manual row click converge on the same selectedRow', async () => {
    widget.render();
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(cell('email', 1));
    await waitFor(() => expect(exposed('selectedRow')).toEqual(ROWS[1]));

    await widget.act('selectRow', 'id', ROWS[2].id);
    await waitFor(() => expect(exposed('selectedRow')).toEqual(ROWS[2]));

    await widget.act('deselectRow');
    await waitFor(() => expect(exposed('selectedRow')).toEqual({}));
  });
});

describe('Table: expandable rows', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-EXP-003] expanding a row exposes currentExpandedRows/lastExpandedRow, and fires onExpand once per newly-expanded row', async () => {
    widget.render({
      properties: { enableExpandableRows: binding('{{true}}') },
      events: [
        {
          id: 'evt-expand',
          name: 'onExpand',
          index: 0,
          sourceId: ID,
          target: 'component',
          event: {
            eventId: 'onExpand',
            actionId: 'set-custom-variable',
            key: 'expandCount',
            value: '{{(variables.expandCount ?? 0) + 1}}',
          },
        },
      ],
    });
    await waitFor(() => expect(expandButton(0)).toBeInTheDocument());

    rtlFireEvent.click(expandButton(0));

    // Both are row INDICES, not row data.
    await waitFor(() => expect(exposed('currentExpandedRows')).toEqual([0]));
    expect(exposed('lastExpandedRow')).toBe(0);
    await waitFor(() => expect(store().getVariable('expandCount', MODULE_ID)).toBe(1));

    // Clicking the SAME row's toggle again (still expanded) must not re-fire onExpand.
    rtlFireEvent.click(expandButton(0));
    await drain();
    expect(store().getVariable('expandCount', MODULE_ID)).toBe(1);
  });
});

describe('Table: inline cell editing', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-EDIT-001] editing an editable cell updates changeSet and fires onCellValueChanged', async () => {
    widget.render({
      events: [
        {
          id: 'evt-cell-changed',
          name: 'onCellValueChanged',
          index: 0,
          sourceId: ID,
          target: 'component',
          event: {
            eventId: 'onCellValueChanged',
            actionId: 'set-custom-variable',
            key: 'cellChangedFired',
            value: '{{true}}',
          },
        },
      ],
    });
    await waitFor(() => expect(table()).toBeInTheDocument());

    await editCellTo(cell('name', 0), 'Adaline');

    await waitFor(() => expect(exposed('changeSet')).toMatchObject({ 0: { name: 'Adaline' } }));
    await waitFor(() => expect(store().getVariable('cellChangedFired', MODULE_ID)).toBe(true));
  });

  test('[Table-EDIT-002] updatedData/dataUpdates reflect the edited row merged with its original data, not just the changed field', async () => {
    widget.render();
    await waitFor(() => expect(table()).toBeInTheDocument());

    await editCellTo(cell('name', 0), 'Adaline');

    await waitFor(() =>
      expect(exposed('dataUpdates')).toMatchObject({ 0: { name: 'Adaline', email: 'ada@example.com', age: 30 } })
    );
    expect(exposed('updatedData')[0]).toMatchObject({ name: 'Adaline', email: 'ada@example.com', age: 30 });
  });

  test('[Table-EDIT-003] clearing a Number-type editable cell records null in changeSet, not an empty string', async () => {
    widget.render();
    await waitFor(() => expect(table()).toBeInTheDocument());

    const ageInput = cell('age', 0).querySelector('input');
    rtlFireEvent.change(ageInput, { target: { value: '' } });
    rtlFireEvent.blur(ageInput);

    await waitFor(() => expect(exposed('changeSet')).toMatchObject({ 0: { age: null } }));
  });

  test('[Table-EDIT-004] showBulkUpdateActions swaps the footer for Save/Discard while changeSet is non-empty, and Save fires onBulkUpdate', async () => {
    widget.render({
      events: [
        {
          id: 'evt-bulk-update',
          name: 'onBulkUpdate',
          index: 0,
          sourceId: ID,
          target: 'component',
          event: {
            eventId: 'onBulkUpdate',
            actionId: 'set-custom-variable',
            key: 'bulkUpdateFired',
            value: '{{true}}',
          },
        },
      ],
    });
    await waitFor(() => expect(table()).toBeInTheDocument());
    expect(document.querySelector('[data-cy="table-button-save-changes"]')).not.toBeInTheDocument();

    await editCellTo(cell('name', 0), 'Adaline');
    await waitFor(() => expect(document.querySelector('[data-cy="table-button-save-changes"]')).toBeInTheDocument());

    rtlFireEvent.click(document.querySelector('[data-cy="table-button-save-changes"]'));
    await waitFor(() => expect(store().getVariable('bulkUpdateFired', MODULE_ID)).toBe(true));
  });
});

describe('Table: add row and refresh', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-ADDROW-002] committing a new row exposes it via newRows and fires onNewRowsAdded', async () => {
    widget.render({
      events: [
        {
          id: 'evt-new-rows',
          name: 'onNewRowsAdded',
          index: 0,
          sourceId: ID,
          target: 'component',
          event: { eventId: 'onNewRowsAdded', actionId: 'set-custom-variable', key: 'newRowsFired', value: '{{true}}' },
        },
      ],
    });
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(document.querySelector(`[data-cy="${NAME}-add-new-row-button"]`));
    const nameAddCell = await waitFor(() => {
      const el = document.querySelector('[data-cy="name-column-0"]');
      if (!el) throw new Error('add-row popup not open yet');
      return el;
    });
    await editCellTo(nameAddCell, 'Marie');

    rtlFireEvent.click(document.querySelector('[data-cy="save-button"]'));

    await waitFor(() => expect(store().getVariable('newRowsFired', MODULE_ID)).toBe(true));
    expect(Object.values(exposed('newRows'))).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Marie' })])
    );
  });

  test('[Table-REFRESH-002] refreshTable CSA and the refresh button both fire onRefresh, including the no-dependency no-op case', async () => {
    widget.render({
      properties: { showRefreshButton: binding('{{true}}') },
      events: [
        {
          id: 'evt-refresh',
          name: 'onRefresh',
          index: 0,
          sourceId: ID,
          target: 'component',
          event: {
            eventId: 'onRefresh',
            actionId: 'set-custom-variable',
            key: 'refreshCount',
            value: '{{(variables.refreshCount ?? 0) + 1}}',
          },
        },
      ],
    });
    await waitFor(() => expect(table()).toBeInTheDocument());

    // No query depends on this table's data — the CSA is still expected to
    // fire onRefresh (the documented no-op case), not hang or silently skip it.
    await widget.act('refreshTable');
    await waitFor(() => expect(store().getVariable('refreshCount', MODULE_ID)).toBe(1));

    rtlFireEvent.click(document.querySelector(`[data-cy="${NAME}-refresh-button"]`));
    await waitFor(() => expect(store().getVariable('refreshCount', MODULE_ID)).toBe(2));
  });
});

/**
 * Records every committed value of one exposed key for a component, across the
 * whole mount. Leading `undefined`s before the component exists at all in the
 * store are pre-mount noise, not the bug this pins — the guarantee is that once
 * the component has ANY real value, it never regresses back to `undefined`.
 */
function recordExposedKey(key) {
  const seen = [];
  const unsubscribe = useStore.subscribe((state) => {
    seen.push(state.getExposedValueOfComponent(ID, MODULE_ID)?.[key]);
  });
  return {
    unsubscribe,
    get afterMount() {
      const firstReal = seen.findIndex((v) => v !== undefined);
      return firstReal === -1 ? seen : seen.slice(firstReal);
    },
  };
}

describe('Table: isVisible/isDisabled/isLoading state', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-STATE-001] visibility/setVisibility control isVisible, which never transits undefined on mount', async () => {
    const recorder = recordExposedKey('isVisible');
    widget.render({ properties: { visibility: binding('{{false}}') } });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    recorder.unsubscribe();

    expect(recorder.afterMount).not.toContain(undefined);
    expect(recorder.afterMount[recorder.afterMount.length - 1]).toBe(false);

    await widget.act('setVisibility', true);
    await waitFor(() => expect(exposed('isVisible')).toBe(true));
  });

  test('[Table-STATE-002] disabledState/setDisable control isDisabled, which never transits undefined on mount', async () => {
    const recorder = recordExposedKey('isDisabled');
    widget.render({ properties: { disabledState: binding('{{true}}') } });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    recorder.unsubscribe();

    expect(recorder.afterMount).not.toContain(undefined);
    expect(recorder.afterMount[recorder.afterMount.length - 1]).toBe(true);

    await widget.act('setDisable', false);
    await waitFor(() => expect(exposed('isDisabled')).toBe(false));
  });

  test('[Table-STATE-003] loadingState/setLoading show isLoading, which also combines with an in-flight refresh', async () => {
    widget.render({ properties: { loadingState: binding('{{true}}') } });
    await waitFor(() => expect(exposed('isLoading')).toBe(true));
    expect(document.querySelector('.warning-no-data-text')).not.toBeInTheDocument();

    await widget.act('setLoading', false);
    await waitFor(() => expect(exposed('isLoading')).toBe(false));
  });

  test('[Table-STATE-005] setDisable CSA is overridden by a subsequent disabledState property change', async () => {
    // disabledState defaults to false. Re-setting it to the SAME resolved value
    // would not change the useBatchedUpdateEffectArray dependency and so would
    // never re-fire the reset effect — the property must move to a genuinely
    // new value (true, then false again) to prove it, not just be "present".
    widget.render();
    await waitFor(() => expect(table()).toBeInTheDocument());

    await widget.act('setDisable', true);
    await waitFor(() => expect(exposed('isDisabled')).toBe(true));

    widget.setComponentProperty(ID, 'disabledState', '{{true}}', 'properties');
    await drain();
    widget.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(exposed('isDisabled')).toBe(false));
  });

  test('[Table-STATE-006] setVisibility CSA is overridden by a subsequent visibility property change', async () => {
    widget.render();
    await waitFor(() => expect(table()).toBeInTheDocument());

    await widget.act('setVisibility', false);
    await waitFor(() => expect(exposed('isVisible')).toBe(false));

    widget.setComponentProperty(ID, 'visibility', '{{false}}', 'properties');
    await drain();
    widget.setComponentProperty(ID, 'visibility', '{{true}}', 'properties');
    await waitFor(() => expect(exposed('isVisible')).toBe(true));
  });

  test('[Table-STATE-007] setLoading CSA is overridden by a subsequent loadingState property change', async () => {
    widget.render();
    await waitFor(() => expect(table()).toBeInTheDocument());

    await widget.act('setLoading', true);
    await waitFor(() => expect(exposed('isLoading')).toBe(true));

    widget.setComponentProperty(ID, 'loadingState', '{{true}}', 'properties');
    await drain();
    widget.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
    await waitFor(() => expect(exposed('isLoading')).toBe(false));
  });
});

describe('Table: per-column-type rendering', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-COLTYPE-STRING-001] a string column renders its value and enforces regex/customRule validation when editable', async () => {
    widget.render({
      properties: {
        columns: {
          value: [
            {
              name: 'name',
              key: 'name',
              id: 'col-name',
              columnType: 'string',
              columnSize: 120,
              isEditable: true,
              regex: '^[A-Z].*',
            },
          ],
        },
      },
    });
    await waitFor(() => expect(cell('name', 0)?.querySelector('.long-text-input')).toBeInTheDocument());
    expect(cellText('name', 0)).toBe('Ada');

    await editCellTo(cell('name', 0), 'lowercase');
    await waitFor(() => expect(cell('name', 0).querySelector('.is-invalid')).toBeInTheDocument());
  });

  test('[Table-COLTYPE-TEXT-001] a text column renders its value and enforces minLength/maxLength validation when editable', async () => {
    widget.render({
      properties: {
        columns: {
          value: [
            {
              name: 'name',
              key: 'name',
              id: 'col-name',
              columnType: 'text',
              columnSize: 120,
              isEditable: true,
              maxLength: 3,
            },
          ],
        },
      },
    });
    await waitFor(() => expect(cell('name', 0)?.querySelector('.long-text-input')).toBeInTheDocument());

    await editCellTo(cell('name', 0), 'toolong');
    await waitFor(() => expect(cell('name', 0).querySelector('.is-invalid')).toBeInTheDocument());
  });

  test('[Table-COLTYPE-NUMBER-001] a number column renders/edits with decimalPlaces and enforces minValue/maxValue validation', async () => {
    widget.render({
      properties: {
        columns: {
          value: [
            {
              name: 'age',
              key: 'age',
              id: 'col-age',
              columnType: 'number',
              columnSize: 80,
              isEditable: true,
              minValue: 0,
              maxValue: 40,
            },
          ],
        },
      },
    });
    await waitFor(() => expect(table()).toBeInTheDocument());
    expect(cellText('age', 0)).toBe('30');

    const ageInput = cell('age', 0).querySelector('input');
    rtlFireEvent.change(ageInput, { target: { value: '99' } });
    rtlFireEvent.blur(ageInput);
    await waitFor(() => expect(cell('age', 0).querySelector('.is-invalid')).toBeInTheDocument());
  });

  test('[Table-COLTYPE-DATEPICKER-001] a datepicker column renders a configured date per dateFormat/isTimeChecked', async () => {
    widget.render({
      properties: {
        columns: {
          value: [
            {
              name: 'when',
              key: 'when',
              id: 'col-when',
              columnType: 'datepicker',
              columnSize: 150,
              isDateSelectionEnabled: true,
              dateFormat: 'MM/DD/YYYY',
              parseDateFormat: 'DD/MM/YYYY',
              isTimeChecked: false,
            },
          ],
        },
        data: binding(`{{${JSON.stringify([{ when: '25/12/2023' }])}}}`),
      },
    });
    // Parsed as DD/MM/YYYY (25 Dec 2023) then displayed as MM/DD/YYYY.
    await waitFor(() => expect(cellText('when', 0)).toBe('12/25/2023'));
  });

  test('[Table-COLTYPE-DATEPICKER-002] a datepicker column enforces minDate/maxDate validation when editable', async () => {
    widget.render({
      properties: {
        columns: {
          value: [
            {
              name: 'when',
              key: 'when',
              id: 'col-when',
              columnType: 'datepicker',
              columnSize: 150,
              isEditable: true,
              isDateSelectionEnabled: true,
              dateFormat: 'DD/MM/YYYY',
              parseDateFormat: 'DD/MM/YYYY',
              isTimeChecked: false,
              minDate: '01/01/2024',
            },
          ],
        },
        data: binding(`{{${JSON.stringify([{ when: '20/12/2023' }])}}}`),
      },
    });
    // A date before the configured minDate is invalid.
    await waitFor(() =>
      expect(cell('when', 0).querySelector('.is-invalid, .invalid-feedback-date')).toBeInTheDocument()
    );
  });

  test('[Table-COLTYPE-SELECT-001] a select column renders a configured default option and marking a new default clears the previous one', async () => {
    const optionsColumn = () => ({
      name: 'status',
      key: 'status',
      id: 'col-status',
      columnType: 'select',
      columnSize: 120,
      options: [
        { label: 'Active', value: 'active', isDefault: false },
        { label: 'Inactive', value: 'inactive', isDefault: true },
      ],
    });
    widget.render({
      properties: {
        columns: { value: [optionsColumn()] },
        data: binding(`{{${JSON.stringify([{ status: 'inactive' }])}}}`),
      },
    });
    await waitFor(() => expect(cell('status', 0)).toBeInTheDocument());
    expect(cell('status', 0).textContent).toContain('Inactive');
  });

  test('[Table-COLTYPE-MULTISELECT-001] a newMultiSelect column renders multiple selected values and allows multiple defaults', async () => {
    widget.render({
      properties: {
        columns: {
          value: [
            {
              name: 'interest',
              key: 'interest',
              id: 'col-interest',
              columnType: 'newMultiSelect',
              columnSize: 200,
              options: [
                { label: 'Reading', value: 'Reading' },
                { label: 'Music', value: 'Music' },
              ],
            },
          ],
        },
        data: binding(`{{${JSON.stringify([{ interest: ['Reading', 'Music'] }])}}}`),
      },
    });
    await waitFor(() => expect(cell('interest', 0)).toBeInTheDocument());
    expect(cell('interest', 0).textContent).toContain('Reading');
    expect(cell('interest', 0).textContent).toContain('Music');
  });

  test('[Table-COLTYPE-MARKDOWN-002] a markdown column sanitizes bound content via DOMPurify before rendering', async () => {
    widget.render({
      properties: {
        columns: { value: [{ name: 'bio', key: 'bio', id: 'col-bio', columnType: 'markdown', columnSize: 200 }] },
        data: binding(`{{${JSON.stringify([{ bio: '<script>window.__xss = true</script>Hello' }])}}}`),
      },
    });
    await waitFor(() => expect(cell('bio', 0)).toBeInTheDocument());
    expect(cell('bio', 0).querySelector('script')).not.toBeInTheDocument();
    expect(window.__xss).toBeUndefined();
    // react-markdown alone already escapes raw HTML as literal text; DOMPurify
    // (called on the raw value before react-markdown ever sees it) additionally
    // strips it outright, so the literal tag text shouldn't reach the DOM either.
    expect(cell('bio', 0).textContent).not.toContain('<script>');
  });

  test('[Table-COLTYPE-HTML-001] an html column sanitizes bound content via DOMPurify before rendering', async () => {
    widget.render({
      properties: {
        columns: { value: [{ name: 'bio', key: 'bio', id: 'col-bio', columnType: 'html', columnSize: 200 }] },
        data: binding(`{{${JSON.stringify([{ bio: '<img src=x onerror="window.__xss2=true">Hi' }])}}}`),
      },
    });
    await waitFor(() => expect(cell('bio', 0)).toBeInTheDocument());
    expect(cell('bio', 0).querySelector('img')?.getAttribute('onerror')).toBeFalsy();
    expect(window.__xss2).toBeUndefined();
  });

  test('[Table-COLTYPE-BUTTON-001] a button column renders one button per row, independently enabled/disabled', async () => {
    widget.render({
      properties: {
        columns: {
          value: [
            {
              name: 'actions',
              key: 'actions',
              id: 'col-actions',
              columnType: 'button',
              columnSize: 100,
              buttons: [{ id: 'btn-1', buttonLabel: 'Go', disableButton: false }],
            },
          ],
        },
      },
    });
    await waitFor(() => expect(document.querySelector('button')).toBeInTheDocument());
    expect(document.body.textContent).toContain('Go');
  });

  test('[Table-COLTYPE-BUTTON-002] clicking a button-column button selects and scopes to that specific row', async () => {
    widget.render({
      properties: {
        columns: {
          value: [
            {
              name: 'actions',
              key: 'actions',
              id: 'col-actions',
              columnType: 'button',
              columnSize: 100,
              buttons: [{ id: 'btn-1', buttonLabel: 'Go', disableButton: false }],
            },
          ],
        },
      },
    });
    const goButtons = await waitFor(() => {
      const btns = [...document.querySelectorAll('button')].filter((b) => b.textContent.includes('Go'));
      if (btns.length < 2) throw new Error('buttons not rendered yet');
      return btns;
    });

    // Row 1 (Grace)'s own button, not row 0's, must scope selection to row 1.
    rtlFireEvent.click(goButtons[1]);
    await waitFor(() => expect(exposed('selectedRow')).toEqual(ROWS[1]));
  });
});

describe('Table: saved-app compatibility and instance isolation', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-COMPAT-001] a saved definition predating newer features renders with pre-feature defaults, not a crash', async () => {
    // componentDefinition() ships an EMPTY definition.properties — nothing is
    // merged in from table.js's own defaults — so omitting a key here
    // faithfully reproduces an app saved before that key existed.
    const OLD_DEFINITION = componentDefinition(ID, NAME, 'Table', {
      dataSourceSelector: binding('rawJson'),
      data: binding(`{{${JSON.stringify(ROWS)}}}`),
      columns: { value: COLUMNS },
      autogenerateColumns: { value: false },
      // enableExpandableRows, defaultSortColumn, showBulkSelector, and column
      // pinning are all deliberately absent, as they would be from a definition
      // saved before those features existed.
    });
    seedApp({ [ID]: OLD_DEFINITION }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('edit', MODULE_ID);
    widget.session.render(
      <RenderWidget
        id={ID}
        componentType="Table"
        moduleId={MODULE_ID}
        currentMode="edit"
        currentLayout="desktop"
        widgetHeight={40}
        widgetWidth={200}
        inCanvas={true}
        darkMode={false}
        onOptionChange={() => {}}
        onOptionsChange={() => {}}
      />
    );

    await waitFor(() => expect(table()).toBeInTheDocument());
    // Pre-feature defaults: no expand column, no bulk-selector checkboxes, rows still render.
    expect(document.querySelector('.table-expansion-toggle')).not.toBeInTheDocument();
    expect(headerCheckbox()).not.toBeInTheDocument();
    expect(cellText('name', 0)).toBe('Ada');
  });

  test('[Table-ISO-001] two Table instances keep fully independent per-id store state', async () => {
    // Two full RenderWidget mounts of the same widget type collide inside this
    // harness's single shared @dnd-kit DndContext (real product code, real
    // App Builder pages, each own their own canvas — this is a harness gap,
    // not a product one). Exercised instead at the store layer that
    // `initSlice.js:7-41`'s per-`id` keying is designed to guarantee, mirroring
    // the same real store actions a second mounted Table would drive.
    const ID2 = 'tbl2';
    // Seeded as a real page component (so getExposedValueOfComponent can
    // resolve it) but deliberately not mounted via RenderWidget — two full
    // Table mounts collide in this harness's single shared @dnd-kit
    // DndContext (a harness limitation, not a product one).
    widget.render({ extraComponents: { [ID2]: componentDefinition(ID2, 'table2', 'Table') } });
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(cell('email', 1));
    await waitFor(() => expect(exposed('selectedRow')).toEqual(ROWS[1]));

    // A second id's exposed-value write (the same store call a second mounted
    // Table's own selection would make) must not leak into or clobber the
    // first table's state, and vice versa.
    store().setExposedValues(ID2, 'components', { selectedRow: ROWS[2], selectedRowId: 2 }, MODULE_ID);
    await drain();
    expect(store().getExposedValueOfComponent(ID2, MODULE_ID)?.selectedRow).toEqual(ROWS[2]);
    expect(exposed('selectedRow')).toEqual(ROWS[1]);
  });
});
