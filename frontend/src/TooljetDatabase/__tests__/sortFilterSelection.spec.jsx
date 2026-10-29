// The Sort and Filter popovers keep their rows in the immer-backed TJDB store, which deep-freezes
// everything it holds. Picking a column / order / operator must therefore write a new row object -
// editing the stored one in place throws, the pick is dropped, and the dropdown stays empty.
import React from 'react';
import { render, screen, act } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TooljetDatabaseContext } from '@/TooljetDatabase/context';
import { useTjdbStore, useTjdbActions } from '@/TooljetDatabase/_stores/tjdbStore';
import { SortForm } from '@/TooljetDatabase/Forms/SortForm';
import { FilterForm } from '@/TooljetDatabase/Forms/FilterForm';

const columns = [
  { Header: 'id', accessor: 'id', dataType: 'integer' },
  { Header: 'name', accessor: 'name', dataType: 'varchar' },
];

function SortRow() {
  const filters = useTjdbStore((state) => state.sortFilters);
  const { setSortFilters } = useTjdbActions();
  return (
    <TooljetDatabaseContext.Provider value={{ columns }}>
      <SortForm {...filters[0]} filters={filters} index="0" setFilters={setSortFilters} />
    </TooljetDatabaseContext.Provider>
  );
}

function FilterRow() {
  const filters = useTjdbStore((state) => state.queryFilters);
  const { setQueryFilters } = useTjdbActions();
  return (
    <TooljetDatabaseContext.Provider value={{ columns }}>
      <FilterForm {...filters[0]} filters={filters} index="0" setFilters={setQueryFilters} generateMessage={() => ''} />
    </TooljetDatabaseContext.Provider>
  );
}

describe('TJDB sort and filter dropdowns', () => {
  beforeEach(() => {
    act(() => {
      useTjdbStore.getState().actions.setSortFilters({ 0: {} });
      useTjdbStore.getState().actions.setQueryFilters({ 0: {} });
    });
  });

  it('should apply the column picked in the sort form', async () => {
    const user = userEvent.setup();
    render(<SortRow />);

    await user.click(screen.getByText('Select column'));
    await user.click(await screen.findByText('name'));

    expect(useTjdbStore.getState().sortFilters[0].column).toBe('name');
    expect(screen.queryByText('Select column')).not.toBeInTheDocument();
  });

  it('should apply the order picked in the sort form', async () => {
    const user = userEvent.setup();
    render(<SortRow />);

    await user.click(screen.getByText('Select order'));
    await user.click(await screen.findByText('Descending'));

    expect(useTjdbStore.getState().sortFilters[0].order).toBe('desc');
    expect(screen.queryByText('Select order')).not.toBeInTheDocument();
  });

  it('should keep an operator picked while the typed value is still debouncing', async () => {
    jest.useFakeTimers();
    try {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<FilterRow />);

      await user.type(screen.getByPlaceholderText('Enter value'), '42');
      act(() => useTjdbStore.getState().actions.setQueryFilters({ 0: { operator: 'gt' } }));
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(useTjdbStore.getState().queryFilters[0]).toMatchObject({ operator: 'gt', value: '42' });
    } finally {
      jest.useRealTimers();
    }
  });

  it('should apply the column picked in the filter form', async () => {
    const user = userEvent.setup();
    render(<FilterRow />);

    // Column and operator share the "Select.." placeholder; column is the first.
    await user.click(screen.getAllByText('Select..')[0]);
    await user.click(await screen.findByText('name'));

    expect(useTjdbStore.getState().queryFilters[0].column).toBe('name');
  });
});
