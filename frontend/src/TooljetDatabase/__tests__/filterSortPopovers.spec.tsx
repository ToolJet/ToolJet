// The Filter and Sort popovers edit a draft and only write to the store on Apply. Rows are written as new
// objects: the store deep-freezes what it holds, so editing a stored row in place would throw.
import React from 'react';
import { render, screen, within, userEvent } from '@/test/test-utils';
import { TooljetDatabaseContext } from '@/TooljetDatabase/context';
import Filter from '../Filter';
import Sort from '../Sort';

const columns = [
  { Header: 'id', accessor: 'id', dataType: 'integer' },
  { Header: 'name', accessor: 'name', dataType: 'character varying' },
];

// jsdom lacks what Radix Select calls when it opens.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
});

const withContext = (ui: React.ReactElement) => (
  <TooljetDatabaseContext.Provider value={{ columns } as never}>{ui}</TooljetDatabaseContext.Provider>
);

async function pick(select: HTMLElement, option: string) {
  await userEvent.click(select);
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

function setupFilter(filters: Record<string, object> = {}) {
  const props = {
    filters,
    setFilters: jest.fn(),
    setFilterEnable: jest.fn(),
  };
  render(withContext(<Filter {...props} />));
  return props;
}

function setupSort(filters: Record<string, object> = {}) {
  const props = { filters, setFilters: jest.fn() };
  render(withContext(<Sort {...props} />));
  return props;
}

describe('Filter popover', () => {
  it('opens on a fresh row whose operation and value wait for a column, with Apply off', async () => {
    setupFilter();

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));

    expect(await screen.findByText('Records must match every condition.')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Operation' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Value' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeDisabled();
  });

  it('applies the finished condition as a new filters object', async () => {
    const { setFilters } = setupFilter();

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
    await pick(await screen.findByRole('combobox', { name: 'Column' }), 'name');
    await pick(screen.getByRole('combobox', { name: 'Operation' }), 'equals');
    await userEvent.type(screen.getByRole('textbox', { name: 'Value' }), 'saved');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(setFilters).toHaveBeenCalledWith({ 0: { column: 'name', operator: 'eq', value: 'saved' } });
  });

  it('keeps Apply off while a row is half filled', async () => {
    setupFilter();

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
    await pick(await screen.findByRole('combobox', { name: 'Column' }), 'id');

    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('discards the draft on Cancel', async () => {
    const { setFilters } = setupFilter();

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
    await pick(await screen.findByRole('combobox', { name: 'Column' }), 'id');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(setFilters).not.toHaveBeenCalled();
    expect(screen.queryByText('Records must match every condition.')).not.toBeInTheDocument();
  });

  it('adds and removes rows', async () => {
    setupFilter();

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Add filter' }));
    expect(screen.getAllByRole('combobox', { name: 'Column' })).toHaveLength(2);

    await userEvent.click(screen.getAllByRole('button', { name: 'Remove filter' })[0]);
    expect(screen.getAllByRole('combobox', { name: 'Column' })).toHaveLength(1);

    // Removing the last row leaves the empty state, and Add filter brings a row back.
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter' }));
    expect(screen.getByText('No filters applied')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add filter' }));
    expect(screen.getAllByRole('combobox', { name: 'Column' })).toHaveLength(1);
  });

  it('applies an emptied list once the applied filters are cleared', async () => {
    const { setFilters } = setupFilter({ 0: { column: 'id', operator: 'eq', value: '1' } });

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Clear all' }));
    expect(screen.getByText('No filters applied')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(setFilters).toHaveBeenCalledWith({});
  });
});

describe('Sort popover', () => {
  it('shows the empty state once the last row is removed, and Apply stays off', async () => {
    setupSort();

    await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Remove sort' }));

    expect(screen.getByText('No sorting applied')).toBeInTheDocument();
    expect(screen.getByText('Add a sort to order the records.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('starts a picked column as ascending and applies it', async () => {
    const { setFilters } = setupSort();

    await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
    expect(await screen.findByRole('combobox', { name: 'Order' })).toBeDisabled();
    await pick(screen.getByRole('combobox', { name: 'Column' }), 'name');
    expect(within(screen.getByRole('combobox', { name: 'Order' })).getByText('Ascending')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(setFilters).toHaveBeenCalledWith({ 0: { column: 'name', order: 'asc' } });
  });

  it('applies the order picked', async () => {
    const { setFilters } = setupSort();

    await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
    await pick(await screen.findByRole('combobox', { name: 'Column' }), 'id');
    await pick(screen.getByRole('combobox', { name: 'Order' }), 'Descending');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(setFilters).toHaveBeenCalledWith({ 0: { column: 'id', order: 'desc' } });
  });

  it('labels the first row "Sort by" and the following ones "Then by"', async () => {
    setupSort();

    await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
    expect(await screen.findByText('Sort by')).toBeInTheDocument();
    expect(screen.queryByText('Then by')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add sort' }));
    expect(screen.getAllByText('Sort by')).toHaveLength(1);
    expect(screen.getAllByText('Then by')).toHaveLength(1);

    await userEvent.click(screen.getAllByRole('button', { name: 'Remove sort' })[0]);
    expect(screen.getByText('Sort by')).toBeInTheDocument();
    expect(screen.queryByText('Then by')).not.toBeInTheDocument();
  });
});
