import React from 'react';
import { render, screen } from '@testing-library/react';
import useTableStore from '../../../_stores/tableStore';
import { Header } from '../Header';

const ID = 'header-chips-table';

// The bits of a TanStack table the header reads
const fakeTable = (columnFilters) => ({
  getState: () => ({ columnFilters }),
  getAllLeafColumns: () => [
    { id: 'c-name', columnDef: { header: 'Name', meta: { columnType: 'string' } } },
    { id: 'c-age', columnDef: { header: 'Age', meta: { columnType: 'number' } } },
  ],
});

function setup(columnFilters, props = {}) {
  useTableStore.getState().initializeComponent(ID);
  useTableStore.getState().setTableProperties(ID, {
    showFilterButton: true,
    defaultFilters: [
      { id: 'f1', column: 'c-name', condition: 'contains', value: 'Ja' },
      { id: 'f2', column: 'c-age', condition: 'gt', value: '' },
    ],
  });
  return render(
    <Header
      id={ID}
      table={fakeTable(columnFilters)}
      setFilters={jest.fn()}
      appliedFiltersLength={columnFilters.length}
      componentName="table1"
      darkMode={false}
      globalFilter=""
      setGlobalFilter={jest.fn()}
      setExposedVariables={jest.fn()}
      fireEvent={jest.fn()}
      {...props}
    />
  );
}

const APPLIED = [{ id: 'c-name', value: { column: 'Name', condition: 'contains', value: 'Jane' } }];

describe('Table-FILTERUI-051 the header chips follow the filters the table has applied', () => {
  test('Table-FILTERUI-051 shows the applied value even when the parent does not hand the list down', () => {
    // Break this catches: chips stuck on their placeholder (with the applied dot lit) when the header is not given the
    // applied filters as a prop, which is what happens with a parent that predates the prop.
    setup(APPLIED);

    expect(screen.getByRole('textbox', { name: 'Name contains value' })).toHaveValue('Jane');
    expect(screen.getByRole('textbox', { name: 'Age greater than value' })).toHaveValue('');
  });

  test('Table-FILTERUI-051 the table is the source of truth when both disagree', () => {
    // Break this catches: a stale list handed down winning over what the table has actually applied.
    setup(APPLIED, { appliedFilters: [] });

    expect(screen.getByRole('textbox', { name: 'Name contains value' })).toHaveValue('Jane');
  });
});
