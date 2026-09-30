/**
 * Default sort column/direction (tj-ee#2082): the Table widget can be
 * configured to load already sorted. This is owned by a single effect in
 * TableExposedVariables.jsx that applies the configured column/direction via
 * the same setSort CSA action, whenever either setting changes.
 *
 * SCOPE: renders TableExposedVariables directly with a hand-built fake
 * `table`. The real react-table instance is only constructed by the full
 * Table -> TableContainer -> AppCanvas/Container chain, which is not
 * renderable in this suite (see integration/tableSelectedRow.spec.js).
 * The fake implements only the methods this component calls, and setSorting
 * mutates the fake's own state, so assertions read that state rather than a
 * bare spy call count.
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { TableExposedVariables } from '../_components/TableExposedVariables/TableExposedVariables';
import useTableStore from '../_stores/tableStore';

const tableState = () => useTableStore.getState();

const COLUMNS = [
  { id: 'col-name', columnDef: { accessorKey: 'name', header: 'Name' } },
  { id: 'col-age', columnDef: { accessorKey: 'age', header: 'Age' } },
];

/** Minimal fake of the subset of react-table's `table` instance this component touches. */
function createFakeTable() {
  let internalState = { sorting: [], globalFilter: '', columnFilters: [], columnSizing: {}, rowSelection: {} };
  const emptyRowModel = () => ({ rows: [] });
  return {
    getFilteredSelectedRowModel: emptyRowModel,
    getPaginationRowModel: emptyRowModel,
    getFilteredRowModel: emptyRowModel,
    getAllColumns: () => COLUMNS,
    getColumn: (id) => COLUMNS.find((col) => col.id === id),
    getState: () => internalState,
    setSorting: (updaterOrValue) => {
      const sorting = typeof updaterOrValue === 'function' ? updaterOrValue(internalState.sorting) : updaterOrValue;
      internalState = { ...internalState, sorting };
    },
    toggleAllRowsSelected: jest.fn(),
    setPageIndex: jest.fn(),
    setRowSelection: jest.fn(),
    setColumnFilters: jest.fn(),
    resetRowSelection: jest.fn(),
  };
}

let currentUnmount;

function renderTableExposedVariables(table) {
  const result = render(
    <TableExposedVariables
      id="t1"
      data={[]}
      setExposedVariables={jest.fn()}
      fireEvent={jest.fn()}
      table={table}
      componentName="table1"
      pageIndex={1}
      lastClickedRowRef={{ current: {} }}
      hasDataChanged={false}
      paginationBtnClicked={{ current: false }}
    />
  );
  currentUnmount = result.unmount;
  return result;
}

describe('Table default sort', () => {
  // Unmount before the store auto-reset (setupTests.js) runs its own afterEach -
  // otherwise the still-mounted component reacts to the reset outside act().
  afterEach(() => currentUnmount?.());

  test('applies the configured default column and direction on load', () => {
    tableState().initializeComponent('t1');
    tableState().setTableProperties('t1', { defaultSortColumn: 'age', defaultSortDirection: 'desc' });
    const table = createFakeTable();

    renderTableExposedVariables(table);

    expect(table.getState().sorting).toEqual([{ id: 'col-age', desc: true }]);
  });

  test('does not sort when direction is "auto"', () => {
    tableState().initializeComponent('t1');
    tableState().setTableProperties('t1', { defaultSortColumn: 'age', defaultSortDirection: 'auto' });
    const table = createFakeTable();

    renderTableExposedVariables(table);

    expect(table.getState().sorting).toEqual([]);
  });

  test('does not sort when no default column is configured', () => {
    tableState().initializeComponent('t1');
    tableState().setTableProperties('t1', { defaultSortColumn: '', defaultSortDirection: 'asc' });
    const table = createFakeTable();

    renderTableExposedVariables(table);

    expect(table.getState().sorting).toEqual([]);
  });

  test('reapplies when the setting is changed after the table has already loaded', () => {
    tableState().initializeComponent('t1');
    tableState().setTableProperties('t1', { defaultSortColumn: 'name', defaultSortDirection: 'asc' });
    const table = createFakeTable();
    renderTableExposedVariables(table);
    expect(table.getState().sorting).toEqual([{ id: 'col-name', desc: false }]);

    act(() => {
      tableState().setTableProperties('t1', { defaultSortColumn: 'age', defaultSortDirection: 'desc' });
    });

    expect(table.getState().sorting).toEqual([{ id: 'col-age', desc: true }]);
  });
});
