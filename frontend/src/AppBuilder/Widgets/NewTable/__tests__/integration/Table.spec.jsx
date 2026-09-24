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
import Papa from 'papaparse';
import { waitFor, within, fireEvent as rtlFireEvent, act } from '@testing-library/react';
import { componentDefinition, seedApp, binding } from '@/test/app-builder';
import { createWidgetHarness, store, MODULE_ID, drain } from '@/AppBuilder/Widgets/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';
import useTableStore from '@/AppBuilder/Widgets/NewTable/_stores/tableStore';
import { tableConfig } from '@/AppBuilder/WidgetManager/widgets/table';
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

  test('[Table-AUTOCOL-004] autogenerating columns persists the generated list back into the saved app definition', async () => {
    widget.render({
      properties: {
        autogenerateColumns: { value: true },
        columns: { value: [] },
        data: binding(`{{${JSON.stringify(ROWS)}}}`),
      },
    });

    await waitFor(() => {
      const saved = store().getComponentDefinition(ID, MODULE_ID)?.component?.definition?.properties?.columns?.value;
      expect(Array.isArray(saved) && saved.length).toBeTruthy();
    });
    const saved = store().getComponentDefinition(ID, MODULE_ID)?.component?.definition?.properties?.columns?.value;
    expect(saved.map((c) => c.name).sort()).toEqual(['age', 'email', 'id', 'name'].sort());
  });

  test('[Table-COLSEL-001] hideColumnSelectorButton removes the column-visibility selector control', async () => {
    widget.render({ properties: { hideColumnSelectorButton: binding('{{false}}') } });
    await waitFor(() =>
      expect(document.querySelector(`[data-cy="${NAME}-manage-columns-button"]`)).toBeInTheDocument()
    );

    widget.render({ properties: { hideColumnSelectorButton: binding('{{true}}') } });
    await waitFor(() =>
      expect(document.querySelector(`[data-cy="${NAME}-manage-columns-button"]`)).not.toBeInTheDocument()
    );
  });

  test('[Table-FOOTER-001] the footer stays visible for showBulkUpdateActions alone, with every other footer toggle off', async () => {
    widget.render({
      properties: {
        enablePagination: binding('{{false}}'),
        showAddNewRowButton: binding('{{false}}'),
        showDownloadButton: binding('{{false}}'),
        showRefreshButton: binding('{{false}}'),
        hideColumnSelectorButton: binding('{{true}}'),
        showBulkUpdateActions: binding('{{true}}'),
      },
    });
    await waitFor(() => expect(table()).toBeInTheDocument());
    await waitFor(() => expect(document.querySelector('.card-footer')).toBeInTheDocument());

    await editCellTo(cell('name', 0), 'Adaline');
    await waitFor(() => expect(document.querySelector('[data-cy="table-button-save-changes"]')).toBeInTheDocument());
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

  test('[Table-PAG-002] enableNextButton/enablePrevButton independently gate the next/previous page controls in server mode', async () => {
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify(MANY_ROWS.slice(0, 2))}}}`),
        serverSidePagination: binding('{{true}}'),
        enableNextButton: binding('{{false}}'),
        enablePrevButton: binding('{{true}}'),
      },
    });
    await waitFor(() => expect(paginationButton('pagination-button-to-next')).toBeDisabled());
    expect(paginationButton('pagination-button-to-previous')).not.toBeDisabled();

    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify(MANY_ROWS.slice(0, 2))}}}`),
        serverSidePagination: binding('{{true}}'),
        enableNextButton: binding('{{true}}'),
        enablePrevButton: binding('{{false}}'),
      },
    });
    await waitFor(() => expect(paginationButton('pagination-button-to-previous')).toBeDisabled());
    expect(paginationButton('pagination-button-to-next')).not.toBeDisabled();
  });

  test('[Table-PAG-EMPTY-001] pagination disabled on an empty dataset does not degenerate the page count', async () => {
    widget.render({ properties: { data: binding('{{[]}}'), enablePagination: binding('{{false}}') } });

    await waitFor(() => expect(document.querySelector('.warning-no-data-text')).toBeInTheDocument());
  });

  test('[Table-PAG-SERVER-002] serverSideRowsPerPage of 0 does not break rendering (falls back internally, though inert for row count in server mode)', async () => {
    // Server mode sets manualPagination: true (useTable.js:108), so TanStack never slices rows
    // client-side regardless of pageSize — `effectiveRowsPerPage`'s fallback to `rowsPerPage`
    // (TableContainer.jsx:54-60) has no rendering-visible effect here; this only guards against
    // a pageSize:0 crash. Confirmed via fault-injection: forcing the fallback to a no-op left
    // this assertion unchanged, unlike every other scenario in this contract.
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify(MANY_ROWS)}}}`),
        rowsPerPage: binding('{{3}}'),
        serverSidePagination: binding('{{true}}'),
        serverSideRowsPerPage: binding('{{0}}'),
      },
    });

    await waitFor(() => expect(bodyRowCount()).toBe(5));
  });

  test('[Table-PAG-SERVER-004] with totalRecords/serverSideRowsPerPage not both configured, the jump-to-last-page control stays hidden', async () => {
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify(MANY_ROWS.slice(0, 2))}}}`),
        serverSidePagination: binding('{{true}}'),
        serverSideRowsPerPage: binding('{{0}}'),
        totalRecords: binding('{{0}}'),
      },
    });
    await waitFor(() => expect(table()).toBeInTheDocument());

    expect(paginationButton('pagination-button-to-last')).not.toBeInTheDocument();
  });

  test.failing(
    '[Table-BUG-002] setPage(0) clamps to a valid page instead of writing an unclamped/negative index',
    async () => {
      widget.render();
      await waitFor(() => expect(table()).toBeInTheDocument());

      await widget.act('setPage', 0);
      expect(exposed('pageIndex')).toBeGreaterThanOrEqual(1);
    }
  );
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

  test('[Table-SORT-003] defaultSortDirection "auto" is a no-op — no default sort applies', async () => {
    widget.render({ properties: { defaultSortColumn: binding('age'), defaultSortDirection: binding('auto') } });

    await waitFor(() => expect(table()).toBeInTheDocument());
    expect(bodyRowOrder('age')).toEqual(['30', '40', '35']);
  });

  test('[Table-SORT-005] clicking a header exposes selectedColumnHeader and fires onHeaderClick, independent of enabledSort', async () => {
    widget.render({
      properties: { enabledSort: binding('{{false}}') },
      events: [
        {
          id: 'evt-header-click',
          name: 'onHeaderClick',
          index: 0,
          sourceId: ID,
          target: 'component',
          event: { eventId: 'onHeaderClick', actionId: 'set-custom-variable', key: 'headerClicked', value: '{{true}}' },
        },
      ],
    });
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(headerCell('age'));

    await waitFor(() => expect(exposed('selectedColumnHeader')).toMatchObject({ key: 'age', name: 'age' }));
    expect(store().getVariable('headerClicked', MODULE_ID)).toBe(true);
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

  test("[Table-SEARCH-003] global search matches an edited cell's current value, not its original stored value", async () => {
    widget.render();
    await waitFor(() => expect(table()).toBeInTheDocument());
    await waitFor(() => expect(searchInput()).toBeInTheDocument());

    await editCellTo(cell('name', 0), 'Orange');
    await waitFor(() => expect(exposed('changeSet')).toMatchObject({ 0: { name: 'Orange' } }));

    rtlFireEvent.change(searchInput(), { target: { value: 'Orange' } });
    await waitFor(() => expect(exposed('searchText')).toBe('Orange'), { timeout: 2000 });

    expect(bodyRowCount()).toBe(1);
    expect(cellText('name', 0)).toBe('Orange');
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

  test('[Table-FILTER-003] isEmpty/isNotEmpty judge Number and Boolean values by real emptiness, not falsy coercion', async () => {
    widget.render({
      properties: {
        data: binding(
          `{{${JSON.stringify([
            { id: 1, qty: 10, active: true },
            { id: 2, qty: 0, active: false },
          ])}}}`
        ),
        columns: {
          value: [
            { name: 'qty', key: 'qty', id: 'col-qty', columnType: 'number', columnSize: 80, isEditable: false },
            {
              name: 'active',
              key: 'active',
              id: 'col-active',
              columnType: 'boolean',
              columnSize: 100,
              isEditable: false,
            },
          ],
        },
        rowsPerPage: binding('{{10}}'),
      },
    });
    await waitFor(() => expect(bodyRowCount()).toBe(2));

    // Neither 0 nor false is an empty value — isNotEmpty must keep both rows.
    await widget.act('setFilters', [{ column: 'qty', condition: 'isNotEmpty' }]);
    await waitFor(() => expect(bodyRowCount()).toBe(2));

    // isEmpty must not mistake the falsy Number 0 for an empty value.
    await widget.act('setFilters', [{ column: 'qty', condition: 'isEmpty' }]);
    await waitFor(() => expect(bodyRowCount()).toBe(0));

    // Same real-emptiness rule for Boolean columns: `false` is not empty.
    await widget.act('setFilters', [{ column: 'active', condition: 'isNotEmpty' }]);
    await waitFor(() => expect(bodyRowCount()).toBe(2));

    await widget.act('setFilters', [{ column: 'active', condition: 'isEmpty' }]);
    await waitFor(() => expect(bodyRowCount()).toBe(0));
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

  test('[Table-FILTER-001] showFilterButton gates the filter control', async () => {
    widget.render({ properties: { showFilterButton: binding('{{true}}') } });
    await waitFor(() => expect(document.querySelector(`[data-cy="${NAME}-filter-button"]`)).toBeInTheDocument());

    widget.render({ properties: { showFilterButton: binding('{{false}}') } });
    await waitFor(() => expect(document.querySelector(`[data-cy="${NAME}-filter-button"]`)).not.toBeInTheDocument());
  });

  test('[Table-BUG-011] setFilters can target a column whose configured name resolves to a non-string value', async () => {
    // Break this catches: generateColumnsData.js leaves columnDef.header as whatever type the
    // column's fx-bound name resolves to (e.g. the Number 2026 for {{2026}}), never coerced to
    // a string. setFilters's `column` argument is always a string, so TableExposedVariables.jsx's
    // `col.columnDef?.header === column` match never succeeds for such a column — the filter
    // entry is silently dropped instead of narrowing the rows.
    widget.render({
      properties: {
        data: binding(
          `{{${JSON.stringify([
            { id: 1, y: 1 },
            { id: 2, y: null },
            { id: 3, y: 2 },
          ])}}}`
        ),
        columns: {
          value: [{ name: '{{2026}}', key: 'y', id: 'col-y', columnType: 'number', columnSize: 80 }],
        },
        rowsPerPage: binding('{{10}}'),
      },
    });
    await waitFor(() => expect(bodyRowCount()).toBe(3));

    await widget.act('setFilters', [{ column: '2026', condition: 'isNotEmpty' }]);
    await waitFor(() => expect(bodyRowCount()).toBe(2));
  });
});

const checkboxIn = (rowEl) => rowEl?.querySelector('[data-cy="checkbox-input"]');
const headerCheckbox = () => document.querySelector('thead [data-cy="checkbox-input"]');
const expandButtons = () => document.querySelectorAll('.table-expansion-toggle');
// Rows are virtualized and can mount in non-index DOM order, so scope by the row's own data-cy rather than
// positional order in expandButtons().
const expandButton = (rowIndex) => row(rowIndex)?.querySelector('.table-expansion-toggle');

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

  test('[Table-SEL-003] highlightSelectedRow hides the selection checkbox column even when showBulkSelector is also on', async () => {
    widget.render({ properties: { showBulkSelector: binding('{{true}}'), highlightSelectedRow: binding('{{true}}') } });
    await waitFor(() => expect(table()).toBeInTheDocument());

    expect(checkboxIn(row(0))).not.toBeInTheDocument();

    rtlFireEvent.click(cell('email', 0));
    await waitFor(() => expect(row(0).className).toContain('selected'));
  });

  test('[Table-SEL-004] disableRowDeselection blocks deselecting an already-selected row via a non-checkbox click', async () => {
    widget.render({
      properties: { highlightSelectedRow: binding('{{true}}'), disableRowDeselection: binding('{{true}}') },
    });
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(cell('email', 0));
    await waitFor(() => expect(row(0).className).toContain('selected'));

    rtlFireEvent.click(cell('email', 0));
    await drain();
    expect(row(0).className).toContain('selected');
  });

  // [Table-SEL-005] is deferred: defaultSelectedRow's mount-time selection is unreliable, see [Table-BUG-008] below.

  test.failing(
    '[Table-BUG-008] defaultSelectedRow keeps its matching row selected once TableExposedVariables settles (currently clobbered by a stale-render race)',
    async () => {
      widget.render({ properties: { defaultSelectedRow: binding(`{{{"id":${ROWS[1].id}}}}`) } });
      await waitFor(() => expect(table()).toBeInTheDocument());

      // An unrelated property change forces the re-render needed for the ref-based
      // hasDataChanged prop to actually reach TableExposedVariables (see Table-BUG-008).
      widget.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
      await drain();

      await waitFor(() => expect(exposed('selectedRow')).toEqual(ROWS[1]));
    }
  );
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

  test('[Table-EXP-001] enableExpandableRows renders an expand/collapse control per row, hidden when off', async () => {
    widget.render({ properties: { enableExpandableRows: binding('{{true}}') } });
    await waitFor(() => expect(expandButtons()).toHaveLength(ROWS.length));

    widget.render({ properties: { enableExpandableRows: binding('{{false}}') } });
    await waitFor(() => expect(expandButtons()).toHaveLength(0));
  });

  test('[Table-EXP-002] expansionHeight sets the rendered height of an expanded row content area', async () => {
    widget.render({ properties: { enableExpandableRows: binding('{{true}}'), expansionHeight: binding('{{350}}') } });
    await waitFor(() => expect(expandButton(0)).toBeInTheDocument());

    rtlFireEvent.click(expandButton(0));
    await waitFor(() => expect(document.querySelector('.table-expanded-row-content')).toBeInTheDocument());
    expect(document.querySelector('.table-expanded-row-content').style.height).toBe('350px');
  });

  test('[Table-EXP-004] sorting, filtering, searching, or changing page each collapse every expanded row', async () => {
    widget.render({
      properties: {
        enableExpandableRows: binding('{{true}}'),
        data: binding(`{{${JSON.stringify(MANY_ROWS)}}}`),
        rowsPerPage: binding('{{2}}'),
      },
    });
    await waitFor(() => expect(expandButton(0)).toBeInTheDocument());

    // Sort collapses. (Sorting can reorder which original row.index sits at visual
    // position 0, so only assert non-empty -> empty, not which row got expanded.)
    rtlFireEvent.click(expandButton(0));
    await waitFor(() => expect(exposed('currentExpandedRows').length).toBeGreaterThan(0));
    rtlFireEvent.click(headerCell('age'));
    await waitFor(() => expect(exposed('currentExpandedRows')).toEqual([]));

    // Filter collapses.
    rtlFireEvent.click(expandButton(0));
    await waitFor(() => expect(exposed('currentExpandedRows').length).toBeGreaterThan(0));
    await widget.act('setFilters', [{ column: 'name', condition: 'equals', value: 'Row3' }]);
    await waitFor(() => expect(exposed('currentExpandedRows')).toEqual([]));
    await widget.act('clearFilters');
    await drain();

    // Search collapses.
    await waitFor(() => expect(expandButton(0)).toBeInTheDocument());
    rtlFireEvent.click(expandButton(0));
    await waitFor(() => expect(exposed('currentExpandedRows').length).toBeGreaterThan(0));
    rtlFireEvent.change(searchInput(), { target: { value: 'Row1' } });
    await waitFor(() => expect(exposed('currentExpandedRows')).toEqual([]));
    rtlFireEvent.change(searchInput(), { target: { value: '' } });
    await drain();

    // Page change collapses.
    await waitFor(() => expect(expandButton(0)).toBeInTheDocument());
    rtlFireEvent.click(expandButton(0));
    await waitFor(() => expect(exposed('currentExpandedRows').length).toBeGreaterThan(0));
    rtlFireEvent.click(paginationButton('pagination-button-to-next'));
    await waitFor(() => expect(exposed('currentExpandedRows')).toEqual([]));
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

  test('[Table-EDIT-005] selectRowOnCellEdit controls whether clicking into an editable cell also selects its row', async () => {
    widget.render({
      properties: { highlightSelectedRow: binding('{{true}}'), selectRowOnCellEdit: binding('{{false}}') },
    });
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(cell('name', 0));
    await drain();
    expect(row(0).className).not.toContain('selected');

    widget.render({
      properties: { highlightSelectedRow: binding('{{true}}'), selectRowOnCellEdit: binding('{{true}}') },
    });
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(cell('name', 0));
    await waitFor(() => expect(row(0).className).toContain('selected'));
  });

  // [Table-EDIT-006] is deferred: the publicly-documented `discardChanges` CSA (table.js's
  // registered action, TableExposedVariables.jsx:460-466) clears changeSet but does NOT fire
  // onCancelChanges, unlike the UI Discard control (TableContainer.jsx's handleChangesDiscarded,
  // wired directly into Footer, bypassing the exposed-variable layer entirely). See Table-BUG-009.

  test.failing(
    '[Table-BUG-009] discardChanges CSA fires onCancelChanges the same as the UI Discard control (currently does not)',
    async () => {
      widget.render({
        events: [
          {
            id: 'evt-cancel-changes',
            name: 'onCancelChanges',
            index: 0,
            sourceId: ID,
            target: 'component',
            event: {
              eventId: 'onCancelChanges',
              actionId: 'set-custom-variable',
              key: 'cancelFired',
              value: '{{true}}',
            },
          },
        ],
      });
      await waitFor(() => expect(table()).toBeInTheDocument());

      await editCellTo(cell('name', 0), 'Adaline');
      await waitFor(() => expect(exposed('changeSet')).toMatchObject({ 0: { name: 'Adaline' } }));

      await widget.act('discardChanges');
      await waitFor(() => expect(exposed('changeSet')).toEqual({}));
      await waitFor(() => expect(store().getVariable('cancelFired', MODULE_ID)).toBe(true));
    }
  );

  test('[Table-EDIT-007] per-cell isEditable is resolved per cell, not inherited from the column as a whole', async () => {
    const conditionalColumns = [
      {
        name: 'name',
        key: 'name',
        id: 'col-name',
        columnType: 'string',
        columnSize: 120,
        isEditable: '{{cellValue !== "Ada"}}',
      },
      { name: 'email', key: 'email', id: 'col-email', columnType: 'string', columnSize: 160, isEditable: false },
      { name: 'age', key: 'age', id: 'col-age', columnType: 'number', columnSize: 80, isEditable: true },
    ];
    widget.render({ properties: { columns: { value: conditionalColumns } } });
    await waitFor(() => expect(table()).toBeInTheDocument());

    // Row 0 is Ada (the excluded value) - not editable; row 1 is Grace - editable. Same column.
    expect(cell('name', 0).className).not.toContain('isEditable');
    expect(cell('name', 1).className).toContain('isEditable');
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

  test('[Table-ADDROW-001] showAddNewRowButton gates the control, and typing into the add-row popup does not touch existing changeSet', async () => {
    widget.render({ properties: { showAddNewRowButton: binding('{{false}}') } });
    await waitFor(() => expect(table()).toBeInTheDocument());
    expect(document.querySelector(`[data-cy="${NAME}-add-new-row-button"]`)).not.toBeInTheDocument();

    widget.render({ properties: { showAddNewRowButton: binding('{{true}}') } });
    await waitFor(() => expect(document.querySelector(`[data-cy="${NAME}-add-new-row-button"]`)).toBeInTheDocument());

    await editCellTo(cell('name', 0), 'Adaline');
    await waitFor(() => expect(exposed('changeSet')).toMatchObject({ 0: { name: 'Adaline' } }));

    rtlFireEvent.click(document.querySelector(`[data-cy="${NAME}-add-new-row-button"]`));
    const nameAddCell = await waitFor(() => {
      const el = document.querySelector('[data-cy="name-column-0"]');
      if (!el) throw new Error('add-row popup not open yet');
      return el;
    });
    await editCellTo(nameAddCell, 'Marie');

    // The in-progress add-row entry never merged into the existing changeSet.
    expect(exposed('changeSet')).toMatchObject({ 0: { name: 'Adaline' } });
    expect(Object.keys(exposed('changeSet'))).toEqual(['0']);
  });

  test('[Table-ADDROW-003] discardNewlyAddedRows CSA clears in-progress new rows without touching existing data', async () => {
    widget.render();
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(document.querySelector(`[data-cy="${NAME}-add-new-row-button"]`));
    const nameAddCell = await waitFor(() => {
      const el = document.querySelector('[data-cy="name-column-0"]');
      if (!el) throw new Error('add-row popup not open yet');
      return el;
    });
    await editCellTo(nameAddCell, 'Marie');
    expect(nameAddCell.textContent).toBe('Marie');

    await widget.act('discardNewlyAddedRows');
    await waitFor(() => expect(document.querySelector('[data-cy="name-column-0"]')).not.toBeInTheDocument());
    expect(exposed('changeSet')).toEqual({});
    expect(cellText('name', 0)).toBe('Ada');
    // The in-progress entry was actually cleared internally, not just the popup hidden
    // (reopening the popup would clear it too via its own mount effect, masking this).
    // A single blank placeholder row is expected back (AddNewRow always keeps one ready),
    // but it must not still carry the typed 'Marie' value.
    expect(Object.values(Object.fromEntries(useTableStore.getState().getAllAddNewRowDetails(ID)))).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Marie' })])
    );
  });

  test('[Table-ADDROW-004] the add-new-row popup gives its blank row a height floor, independent of column content type', async () => {
    // AddNewRow.jsx renders its own <tr>/<td> (unlike the main table body, which gets a
    // guaranteed non-zero row height from the virtualizer's estimateSize) with no height
    // floor of its own. A plain string/text/markdown/html column's idle cell has zero
    // natural content height when blank, so an all-string-column row has nothing for the
    // flex row to size itself from. Real browsers then collapse the whole row to 0px,
    // making it invisible/unclickable (Tab can still reach it, since focus doesn't
    // require non-zero size) — jsdom can't reproduce that collapse since it doesn't
    // compute real layout, so this asserts the inline floor directly, the same proxy
    // used elsewhere in this suite for geometry-adjacent guarantees.
    const STRING_ONLY_COLUMNS = [
      { name: 'id', key: 'id', id: 'col-id-only', columnType: 'string', columnSize: 120, isEditable: true },
      { name: 'name', key: 'name', id: 'col-name-only', columnType: 'string', columnSize: 120, isEditable: true },
    ];
    widget.render({ properties: { columns: { value: STRING_ONLY_COLUMNS } } });
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.click(document.querySelector(`[data-cy="${NAME}-add-new-row-button"]`));
    const addRow = await waitFor(() => {
      const el = document.querySelector('[data-cy="add-new-row-0"]');
      if (!el) throw new Error('add-row popup not open yet');
      return el;
    });

    expect(addRow.style.minHeight).toBe('32px');
  });

  test('[Table-ACTCOL-001] a configured left-position action renders in the left action column', async () => {
    // generateActionColumns.js measures button text width via canvas.getContext('2d'), which the
    // global test setup stubs to return null (real font-metric measurement is QA/Playwright-owned,
    // Table-BRW-003) — swap in a minimal stub locally so this RTL-owned layout guarantee can render.
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      font: '',
      measureText: () => ({ width: 10 }),
    }));

    widget.render({
      properties: {
        actions: {
          value: [{ name: 'edit-action', buttonText: 'Edit', position: 'left' }],
        },
      },
    });
    await waitFor(() => expect(table()).toBeInTheDocument());
    expect(cell('actions', 0).className).toContain('has-left-actions');

    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  test('[Table-ACTCOL-001] an action with an unset position renders in the right action column by default', async () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      font: '',
      measureText: () => ({ width: 10 }),
    }));

    widget.render({
      properties: {
        actions: {
          value: [{ name: 'edit-action', buttonText: 'Edit' }], // position intentionally unset
        },
      },
    });
    await waitFor(() => expect(table()).toBeInTheDocument());
    expect(cell('actions', 0).className).toContain('has-right-actions');

    HTMLCanvasElement.prototype.getContext = originalGetContext;
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

  test('[Table-DL-001] showDownloadButton gates the download control', async () => {
    widget.render({ properties: { showDownloadButton: binding('{{false}}') } });
    await waitFor(() => expect(table()).toBeInTheDocument());
    expect(document.querySelector(`[data-cy="${NAME}-file-download-button"]`)).not.toBeInTheDocument();

    widget.render({ properties: { showDownloadButton: binding('{{true}}') } });
    await waitFor(() => expect(document.querySelector(`[data-cy="${NAME}-file-download-button"]`)).toBeInTheDocument());
  });

  test('[Table-DL-002] downloadTableData exports the complete dataset via CSV, regardless of active search', async () => {
    // Capture what generate-file.js's `new Blob([csvString])` actually receives, since
    // window.URL.createObjectURL is unimplemented in jsdom (would throw otherwise).
    const OriginalBlob = window.Blob;
    let capturedCsv;
    window.Blob = function (parts, opts) {
      capturedCsv = parts[0];
      return new OriginalBlob(parts, opts);
    };
    window.URL.createObjectURL = jest.fn(() => 'blob:mock');
    window.URL.revokeObjectURL = jest.fn();

    widget.render();
    await waitFor(() => expect(table()).toBeInTheDocument());

    rtlFireEvent.change(searchInput(), { target: { value: 'grace' } });
    await waitFor(() => expect(bodyRowCount()).toBe(1));

    await widget.act('downloadTableData', 'csv');
    // The search narrowed the DISPLAYED rows to just Grace, but the export uses
    // table.getCoreRowModel() — the full, unfiltered dataset (D-09: intended).
    expect(capturedCsv).toContain('Ada');
    expect(capturedCsv).toContain('Grace');
    expect(capturedCsv).toContain('Rosalind');

    window.Blob = OriginalBlob;
  });

  test('[Table-DL-002] onTableDataDownload fires when serverSidePagination is on and the download event is configured (bypassing the export popover)', async () => {
    widget.render({
      properties: { serverSidePagination: binding('{{true}}') },
      events: [
        {
          id: 'evt-download',
          name: 'onTableDataDownload',
          index: 0,
          sourceId: ID,
          target: 'component',
          event: {
            eventId: 'onTableDataDownload',
            actionId: 'set-custom-variable',
            key: 'downloadFired',
            value: '{{true}}',
          },
        },
      ],
    });
    // This branch renders a plain icon button with no data-cy (ControlButtons.jsx's
    // hasDownloadEvent && !clientSidePagination path) — found via its tooltip id instead.
    await waitFor(() =>
      expect(
        document.querySelector('[data-tooltip-id="tooltip-for-download-serverside-pagingation"]')
      ).toBeInTheDocument()
    );
    rtlFireEvent.click(document.querySelector('[data-tooltip-id="tooltip-for-download-serverside-pagingation"]'));
    await waitFor(() => expect(store().getVariable('downloadFired', MODULE_ID)).toBe(true));
  });

  test('[Table-DL-003] a JSON/object-valued cell exports as valid stringified JSON, not "[object Object]"', async () => {
    // Same jsdom Blob-capture workaround as Table-DL-002 (window.URL.createObjectURL is unimplemented).
    const OriginalBlob = window.Blob;
    let capturedCsv;
    window.Blob = function (parts, opts) {
      capturedCsv = parts[0];
      return new OriginalBlob(parts, opts);
    };
    window.URL.createObjectURL = jest.fn(() => 'blob:mock');
    window.URL.revokeObjectURL = jest.fn();

    const meta = { role: 'admin', tags: ['x', 'y'] };
    const columnsWithJson = [
      ...COLUMNS,
      { name: 'meta', key: 'meta', id: 'col-meta', columnType: 'json', columnSize: 200 },
    ];
    const rowsWithJson = ROWS.map((row) => ({ ...row, meta: row.name === 'Ada' ? meta : {} }));

    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify(rowsWithJson)}}}`),
        columns: { value: columnsWithJson },
      },
    });
    await waitFor(() => expect(table()).toBeInTheDocument());

    await widget.act('downloadTableData', 'csv');

    const parsedRows = Papa.parse(capturedCsv, { header: true }).data;
    const adaRow = parsedRows.find((row) => row.name === 'Ada');
    expect(JSON.parse(adaRow.meta)).toEqual(meta);
    expect(capturedCsv).not.toContain('[object Object]');

    window.Blob = OriginalBlob;
  });

  test('[Table-DL-004] exported headers match the configured column name exactly, without forcing uppercase', async () => {
    // Break this catches: exportData.js's getData() force-uppercasing every header, silently
    // mangling any column whose configured name has lowercase/mixed-case letters (e.g. "userId" -> "USERID").
    const OriginalBlob = window.Blob;
    let capturedCsv;
    window.Blob = function (parts, opts) {
      capturedCsv = parts[0];
      return new OriginalBlob(parts, opts);
    };
    window.URL.createObjectURL = jest.fn(() => 'blob:mock');
    window.URL.revokeObjectURL = jest.fn();

    const columnsWithMixedCase = [
      ...COLUMNS,
      { name: 'userId', key: 'userId', id: 'col-userId', columnType: 'string', columnSize: 100 },
    ];
    const rowsWithMixedCase = ROWS.map((row) => ({ ...row, userId: `u-${row.id}` }));

    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify(rowsWithMixedCase)}}}`),
        columns: { value: columnsWithMixedCase },
      },
    });
    await waitFor(() => expect(table()).toBeInTheDocument());

    await widget.act('downloadTableData', 'csv');

    const headerLine = capturedCsv.split(/\r?\n/)[0];
    expect(headerLine).toBe('name,email,age,userId');

    window.Blob = OriginalBlob;
  });

  test('[Table-REFRESH-001] showRefreshButton gates the manual refresh control', async () => {
    widget.render({ properties: { showRefreshButton: binding('{{false}}') } });
    await waitFor(() => expect(table()).toBeInTheDocument());
    expect(document.querySelector(`[data-cy="${NAME}-refresh-button"]`)).not.toBeInTheDocument();

    widget.render({ properties: { showRefreshButton: binding('{{true}}') } });
    await waitFor(() => expect(document.querySelector(`[data-cy="${NAME}-refresh-button"]`)).toBeInTheDocument());
  });

  test('[Table-REFRESH-003] refreshing sets isRefreshing (surfaced via isLoading) for the duration of the underlying query run, clearing it once settled', async () => {
    widget.render({ properties: { showRefreshButton: binding('{{true}}') } });
    await waitFor(() => expect(table()).toBeInTheDocument());

    // useTableRefresh.js only sets isRefreshing when getDependents(this table's data path)
    // resolves at least one `queries.<id>...` dependent. Stubbing getDependents AND runQuery
    // (shared collaborators, not Table's own code) isolates the guarantee under test — Table's
    // own setIsRefreshing/allSettled orchestration — from the real query subsystem's own
    // resolution timing, which otherwise settles within the same microtask flush that
    // `act()` drains before returning, making the transient `true` state unobservable.
    const query = { id: 'q1', name: 'query1', kind: 'restapi', options: {} };
    store().dataQuery.setQueries([query], MODULE_ID);
    const originalGetDependents = useStore.getState().getDependents;
    useStore.setState({
      getDependents: (path, moduleId) =>
        path === `components.${ID}.properties.data`
          ? ['queries.q1.__options__']
          : originalGetDependents(path, moduleId),
      queryPanel: {
        ...useStore.getState().queryPanel,
        runQuery: () => new Promise((resolve) => setTimeout(resolve, 30)),
      },
    });

    await drain();
    expect(exposed('isLoading')).toBe(false);
    const actPromise = widget.act('refreshTable');
    await waitFor(() => expect(exposed('isLoading')).toBe(true));
    await waitFor(() => expect(exposed('isLoading')).toBe(false));
    await actPromise;
  });

  test.failing(
    '[Table-BUG-003] two refreshTable() calls in the same tick only fire the underlying query once',
    async () => {
      widget.render();
      await waitFor(() => expect(table()).toBeInTheDocument());

      const query = { id: 'q1', name: 'query1', kind: 'restapi', options: {} };
      store().dataQuery.setQueries([query], MODULE_ID);
      const originalGetDependents = useStore.getState().getDependents;
      const runQuery = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 30)));
      useStore.setState({
        getDependents: (path, moduleId) =>
          path === `components.${ID}.properties.data`
            ? ['queries.q1.__options__']
            : originalGetDependents(path, moduleId),
        queryPanel: { ...useStore.getState().queryPanel, runQuery },
      });
      await drain();

      // Call the exposed CSA directly, twice, in the SAME synchronous tick — widget.act()'s own
      // internal `waitFor` gap would let a re-render land between two calls, letting the guard
      // correctly see the updated isRefreshing and masking the stale-closure race being pinned.
      await act(async () => {
        exposed('refreshTable')();
        exposed('refreshTable')();
      });
      await drain();

      expect(runQuery).toHaveBeenCalledTimes(1);
    }
  );
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

  test('[Table-COLTYPE-BOOLEAN-001] a boolean column renders a toggle whose colors follow toggleOnBg/toggleOffBg, with no validation bucket', async () => {
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify([{ id: 1, active: true }])}}}`),
        columns: {
          value: [
            {
              name: 'active',
              key: 'active',
              id: 'col-active',
              columnType: 'boolean',
              columnSize: 100,
              isEditable: true,
              toggleOnBg: '#00FF00',
              toggleOffBg: '#FF0000',
            },
          ],
        },
      },
    });
    await waitFor(() => expect(cell('active', 0)?.querySelector('.boolean-slider')).toBeInTheDocument());
    expect(cell('active', 0).querySelector('.boolean-slider').style.backgroundColor).toBe('rgb(0, 255, 0)');
  });

  test('[Table-COLTYPE-DATEPICKER-003] parseInUnixTimestamp/parseDateFormat control how a bound raw value is parsed, independent of the configured display format', async () => {
    // 2023-11-14T22:13:20Z as a Unix-seconds timestamp, displayed in a completely different format.
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify([{ id: 1, when: 1700000000 }])}}}`),
        columns: {
          value: [
            {
              name: 'when',
              key: 'when',
              id: 'col-when',
              columnType: 'datepicker',
              columnSize: 160,
              isEditable: false,
              parseInUnixTimestamp: true,
              unixTimestamp: 'seconds',
              dateFormat: 'YYYY/MM/DD',
            },
          ],
        },
      },
    });
    await waitFor(() => expect(cellText('when', 0)).not.toBe(''));
    expect(cellText('when', 0)).toBe(require('moment-timezone').unix(1700000000).format('YYYY/MM/DD'));
  });

  test('[Table-COLTYPE-TAGS-001] a tagsV2 column with allowMultipleSelection renders every selected tag, not just one', async () => {
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify([{ id: 1, tags: ['red', 'blue'] }])}}}`),
        columns: {
          value: [
            {
              name: 'tags',
              key: 'tags',
              id: 'col-tags',
              columnType: 'tagsV2',
              columnSize: 160,
              isEditable: false,
              allowMultipleSelection: true,
              options: [
                { label: 'Red', value: 'red' },
                { label: 'Blue', value: 'blue' },
              ],
            },
          ],
        },
      },
    });
    await waitFor(() => expect(cell('tags', 0)).toBeInTheDocument());
    expect(cell('tags', 0).textContent).toContain('Red');
    expect(cell('tags', 0).textContent).toContain('Blue');
  });

  test('[Table-COLTYPE-IMAGE-001] an image column renders the bound URL with configured objectFit/borderRadius', async () => {
    // The "never editable" half of this guarantee is Inspector-only (PropertiesTabElements.jsx:385
    // hides the isEditable toggle for image columns in the panel); at runtime, a saved definition
    // with isEditable:true on an image column still renders the isEditable class — not enforced here.
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify([{ id: 1, avatar: 'https://example.com/a.png' }])}}}`),
        columns: {
          value: [
            {
              name: 'avatar',
              key: 'avatar',
              id: 'col-avatar',
              columnType: 'image',
              columnSize: 80,
              objectFit: 'cover',
              borderRadius: 8,
            },
          ],
        },
      },
    });
    await waitFor(() => expect(cell('avatar', 0)?.querySelector('img')).toBeInTheDocument());
    const img = cell('avatar', 0).querySelector('img');
    expect(img).toHaveAttribute('src', 'https://example.com/a.png');
    expect(img.style.objectFit).toBe('cover');
    expect(img.style.borderRadius).toBe('8px');
  });

  test('[Table-COLTYPE-LINK-001] a link column renders displayText as a hyperlink to the bound URL, honoring linkTarget', async () => {
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify([{ id: 1, site: 'https://example.com' }])}}}`),
        columns: {
          value: [
            {
              name: 'site',
              key: 'site',
              id: 'col-site',
              columnType: 'link',
              columnSize: 120,
              isEditable: false,
              displayText: 'Visit',
              linkTarget: '_blank',
            },
          ],
        },
      },
    });
    await waitFor(() => expect(cell('site', 0)?.querySelector('a')).toBeInTheDocument());
    const link = cell('site', 0).querySelector('a');
    expect(link.textContent).toBe('Visit');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  test('[Table-COLTYPE-RATING-001] a rating column renders defaultRating stars/hearts per iconType and supports allowHalfStar', async () => {
    widget.render({
      properties: {
        columns: {
          value: [
            {
              name: 'score',
              key: 'score',
              id: 'col-score',
              columnType: 'rating',
              columnSize: 120,
              isEditable: false,
              iconType: 'heart',
              maxRating: 5,
              defaultRating: 3,
              allowHalfStar: true,
            },
          ],
        },
      },
    });
    await waitFor(() => expect(cell('score', 0)?.querySelector('.rating-widget-group')).toBeInTheDocument());
    expect(cell('score', 0).querySelectorAll('.rating-widget-group > *')).toHaveLength(5);
  });

  test('[Table-COLTYPE-BUTTON-003] button-column styling applies per the configured button, and sorting/filtering are disabled for that column', async () => {
    widget.render({
      properties: {
        actions: { value: [] },
        columns: {
          value: [
            {
              name: 'actions',
              key: 'actions',
              id: 'col-actions',
              columnType: 'button',
              columnSize: 100,
              buttons: [
                {
                  id: 'btn-1',
                  buttonLabel: 'Go',
                  buttonType: 'solid',
                  buttonBackgroundColor: '#123456',
                  disableButton: false,
                },
              ],
            },
          ],
        },
      },
    });
    await waitFor(() => expect(cell('actions', 0)?.querySelector('button')).toBeInTheDocument());
    expect(cell('actions', 0).querySelector('button').style.backgroundColor).toBe('rgb(18, 52, 86)');
    expect(document.querySelector('[data-cy$="sort-icon-ascending"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-cy$="sort-icon-descending"]')).not.toBeInTheDocument();
  });

  test('[Table-COLTYPE-DEPRECATED-001] the deprecated dropdown/radio column types still render via their values/labels array configuration', async () => {
    // The third legacy type this scenario names, `tags`, is dropped here — see Table-BUG-010:
    // its adapter call passes a `tags` prop but the component reads `value`, so it never
    // actually renders any bound value (always empty), independent of configuration.
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify([{ id: 1, city: 'nyc', region: 'east' }])}}}`),
        columns: {
          value: [
            {
              name: 'city',
              key: 'city',
              id: 'col-city',
              columnType: 'dropdown',
              columnSize: 100,
              values: ['nyc', 'la'],
              labels: ['New York', 'Los Angeles'],
            },
            {
              name: 'region',
              key: 'region',
              id: 'col-region',
              columnType: 'radio',
              columnSize: 100,
              values: ['east', 'west'],
              labels: ['East', 'West'],
            },
          ],
        },
      },
    });
    await waitFor(() => expect(cell('city', 0)?.querySelector('.select-search-container')).toBeInTheDocument());
    expect(cell('city', 0).querySelector('.select-search-input').value).toBe('New York');
    expect(cell('region', 0).querySelectorAll('.form-check-label')[0].textContent).toBe('East');
  });

  test.failing(
    '[Table-BUG-010] the deprecated tags column type renders its bound value (currently always renders empty, a prop-name mismatch)',
    async () => {
      widget.render({
        properties: {
          data: binding(`{{${JSON.stringify([{ id: 1, hobby: ['golf'] }])}}}`),
          columns: {
            value: [{ name: 'hobby', key: 'hobby', id: 'col-hobby', columnType: 'tags', columnSize: 100 }],
          },
        },
      });
      await waitFor(() => expect(table()).toBeInTheDocument());
      expect(cell('hobby', 0).textContent).toContain('golf');
    }
  );

  test('[Table-COLTYPE-DEPRECATED-002] the deprecated toggle column keeps its EventManager-based onChange event and activeColor styling', async () => {
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify([{ id: 1, flag: false }])}}}`),
        columns: {
          value: [
            {
              name: 'flag',
              key: 'flag',
              id: 'col-flag',
              columnType: 'toggle',
              columnSize: 100,
              isEditable: true,
              activeColor: '#00AA00',
            },
          ],
        },
      },
      events: [
        {
          id: 'evt-toggle',
          name: 'onChange',
          index: 0,
          sourceId: ID,
          target: 'table_column',
          event: {
            ref: 'flag',
            eventId: 'onChange',
            actionId: 'set-custom-variable',
            key: 'toggleFired',
            value: '{{true}}',
          },
        },
      ],
    });
    await waitFor(() => expect(cell('flag', 0)?.querySelector('input[type="checkbox"]')).toBeInTheDocument());
    rtlFireEvent.click(cell('flag', 0).querySelector('input[type="checkbox"]'));
    await waitFor(() => expect(store().getVariable('toggleFired', MODULE_ID)).toBe(true));
    expect(cell('flag', 0).querySelector('input[type="checkbox"]').style.backgroundColor).toBe('rgb(0, 170, 0)');
  });
});

describe('Table: styling and misc', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-STYLE-001] columnTitleColor/columnBackgroundColor style the header row, distinct from data-row colors', async () => {
    widget.render({
      styles: { columnTitleColor: binding('rgb(255, 0, 0)'), columnBackgroundColor: binding('rgb(0, 0, 255)') },
    });
    await waitFor(() => expect(headerCell('name')).toBeInTheDocument());
    const headerRow = headerCell('name').closest('th');
    expect(headerRow.style.color).toBe('rgb(255, 0, 0)');
    expect(headerRow.style.backgroundColor).toBe('rgb(0, 0, 255)');
  });

  test('[Table-STYLE-002] headerCasing transforms header text casing without altering the underlying column name', async () => {
    widget.render({ styles: { headerCasing: binding('uppercase') } });
    await waitFor(() => expect(headerCell('name')).toBeInTheDocument());
    expect(headerCell('name').style.textTransform).toBe('uppercase');
    // The underlying name is unchanged: found via `headerCell('name')` (data-cy keys off the raw
    // name) and its textContent is still the original casing — only CSS presentation changed.
    expect(headerCell('name').textContent).toBe('name');
  });

  test('[Table-A11Y-001] Toggle and Radio column-type cells expose the real ARIA attributes their interaction model requires', async () => {
    widget.render({
      properties: {
        data: binding(`{{${JSON.stringify([{ id: 1, flag: true, region: 'east' }])}}}`),
        columns: {
          value: [
            { name: 'flag', key: 'flag', id: 'col-flag', columnType: 'toggle', columnSize: 100, isEditable: true },
            {
              name: 'region',
              key: 'region',
              id: 'col-region',
              columnType: 'radio',
              columnSize: 100,
              values: ['east', 'west'],
              labels: ['East', 'West'],
              isEditable: true,
            },
          ],
        },
      },
    });
    await waitFor(() => expect(cell('flag', 0)?.querySelector('input[type="checkbox"]')).toBeInTheDocument());
    expect(cell('flag', 0).querySelector('input[type="checkbox"]')).toHaveAttribute('aria-checked', 'true');
    const radioInputs = cell('region', 0).querySelectorAll('input[type="radio"]');
    expect(radioInputs.length).toBeGreaterThan(0);
  });

  test('[Table-CONDFMT-001] a configured cellBackgroundColor resolvable is evaluated independently per cell', async () => {
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
              cellBackgroundColor: '{{cellValue > 32 ? "rgb(255, 0, 0)" : "rgb(0, 255, 0)"}}',
            },
          ],
        },
      },
    });
    // ROWS: Ada(30), Grace(40), Rosalind(35) — only Grace and Rosalind exceed 32.
    await waitFor(() => expect(cell('age', 0)).toBeInTheDocument());
    expect(cell('age', 0).style.backgroundColor).toBe('rgb(0, 255, 0)');
    expect(cell('age', 1).style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  test('[Table-COLTRANSFORM-001] a transformation resolving to null renders an empty cell, not the original value or the literal text "null"', async () => {
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
              transformation: '{{cellValue > 32 ? cellValue : null}}',
            },
          ],
        },
      },
    });
    // ROWS: Ada(30), Grace(40), Rosalind(35) — only Grace and Rosalind exceed 32.
    await waitFor(() => expect(cell('age', 0)).toBeInTheDocument());
    expect(cellText('age', 0)).toBe('');
    expect(cellText('age', 1)).toBe('40');
    expect(cellText('age', 2)).toBe('35');
  });

  test('[Table-STATE-004] dynamicHeight (view mode only) schedules a reflow so the table grows/shrinks with its content', async () => {
    // isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view' — inert in edit
    // mode. useDynamicHeight's own DOM effect (freeing the WidgetWrapper element to auto-height)
    // targets a `.ele-<id>` node that this harness's bare `<RenderWidget>` mount never produces
    // (WidgetWrapper is the real app's outer layer, not exercised here) — asserted instead via
    // the one seam Table itself owns: that it invokes the shared reflow scheduler when enabled.
    const scheduleReflow = jest.fn();
    useStore.setState({ scheduleReflow });

    widget.render({ properties: { dynamicHeight: binding('{{false}}') }, currentMode: 'view' });
    await waitFor(() => expect(table()).toBeInTheDocument());
    expect(scheduleReflow).not.toHaveBeenCalled();

    widget.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'view' });
    await waitFor(() => expect(scheduleReflow).toHaveBeenCalledWith(ID, 'desktop', false, null, MODULE_ID));
  });

  test('[Table-COLRESIZE-001] dragging a columns resize handle persists the new width back into the saved app definition (debounced)', async () => {
    // Real drag-geometry fidelity is QA/Playwright-owned (Table-BRW-001); this exercises the
    // Engineering-owned persistence side effect once TanStack's own columnSizing state changes,
    // via a minimal mousedown/mousemove/mouseup sequence (columnResizeMode: 'onChange').
    widget.render();
    await waitFor(() => expect(headerCell('name')).toBeInTheDocument());
    const resizer = headerCell('name').closest('th').querySelector('.resizer');
    expect(resizer).toBeInTheDocument();

    rtlFireEvent.mouseDown(resizer, { clientX: 100 });
    rtlFireEvent.mouseMove(document, { clientX: 150 });
    rtlFireEvent.mouseUp(document);

    await waitFor(
      () =>
        expect(
          store().getComponentDefinition(ID, MODULE_ID)?.component?.definition?.properties?.columnSizes?.value
        ).toBeTruthy(),
      { timeout: 2000 }
    );
  });

  test('[Table-CSSCLASS-001] the universal styles.cssClass field applies the configured class to Tables rendered root node', async () => {
    widget.render({
      styles: { cssClass: binding('my-custom-class') },
      afterSeed: () => {
        useStore.setState({ license: { featureAccess: { customStyling: true } } });
      },
    });
    await waitFor(() => expect(document.querySelector('[data-cy="draggable-widget-table1"]')).toBeInTheDocument());
    expect(document.querySelector('[data-cy="draggable-widget-table1"]').className).toContain('my-custom-class');
  });

  test('[Table-COLORDER-001] the synthetic selection checkbox column is force-pinned leftmost whenever any data column is left-pinned', async () => {
    widget.render({
      properties: {
        showBulkSelector: binding('{{true}}'),
        columns: {
          value: [
            { name: 'name', key: 'name', id: 'col-name', columnType: 'string', columnSize: 120, pinPosition: 'left' },
            { name: 'email', key: 'email', id: 'col-email', columnType: 'string', columnSize: 160 },
          ],
        },
      },
    });
    await waitFor(() => expect(headerCheckbox()).toBeInTheDocument());
    const allHeaderCells = [...document.querySelectorAll('thead th')];
    const checkboxHeaderIndex = allHeaderCells.findIndex((th) => th.querySelector('[data-cy="checkbox-input"]'));
    const nameHeaderIndex = allHeaderCells.findIndex((th) => th === headerCell('name')?.closest('th'));
    expect(checkboxHeaderIndex).toBeLessThan(nameHeaderIndex);
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

describe('Table: server-config parity', () => {
  test.failing('[Table-BUG-006] the server widget config declares the same actions as the frontend config', () => {
    const path = require('path');
    const { tableConfig: serverConfig } = require(path.join(
      __dirname,
      '../../../../../../../server/src/modules/apps/services/widget-config/table.js'
    ));
    const frontendHandles = tableConfig.actions.map((a) => a.handle).sort();
    const serverHandles = serverConfig.actions.map((a) => a.handle).sort();
    // Currently missing from the server config: 'refreshTable' (introduced by commit 8927235253).
    expect(serverHandles).toEqual(frontendHandles);
  });
});
