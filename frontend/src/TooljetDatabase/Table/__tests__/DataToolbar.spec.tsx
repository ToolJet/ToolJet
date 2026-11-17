import React from 'react';
import { render, screen, userEvent, within } from '@/test/test-utils';
import { DataToolbar, type DataToolbarProps } from '../DataToolbar';

const FILTERS = [
  { id: '0', label: 'title equals "filters"' },
  { id: '1', label: 'tag equals "feature"' },
  { id: '2', label: 'description equals "release"' },
  { id: '3', label: 'release_category equals "Bug Fixes"' },
  { id: '4', label: 'id greater than 20' },
];

function setup(props: Partial<DataToolbarProps> = {}) {
  const handlers = { onRemoveFilter: jest.fn(), onClearFilters: jest.fn(), onOpenHistory: jest.fn() };
  render(
    <DataToolbar
      title="releasenotes"
      filterControl={<button>Filter control</button>}
      sortControl={<button>Sort control</button>}
      addData={<button>Add data</button>}
      {...handlers}
      {...props}
    />
  );
  return handlers;
}

describe('DataToolbar | default', () => {
  it('shows the table name and the right-hand controls', () => {
    setup();

    expect(screen.getByText('releasenotes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter control' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort control' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add data' })).toBeInTheDocument();
  });

  it('shows no chips and no clear action without filters', () => {
    setup();

    expect(screen.queryByRole('button', { name: 'Clear all filters' })).not.toBeInTheDocument();
    expect(screen.queryByText(/more$/)).not.toBeInTheDocument();
  });

  it('opens migration history', async () => {
    const { onOpenHistory } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Migration history' }));

    expect(onOpenHistory).toHaveBeenCalledTimes(1);
  });
});

describe('DataToolbar | filters', () => {
  it('shows a removable chip per filter and a clear-all action', async () => {
    const { onRemoveFilter, onClearFilters } = setup({ filters: FILTERS.slice(0, 2) });

    expect(screen.getByText('title equals "filters"')).toBeInTheDocument();
    expect(screen.getByText('tag equals "feature"')).toBeInTheDocument();
    expect(screen.queryByText(/more$/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remove tag equals "feature"' }));
    expect(onRemoveFilter).toHaveBeenCalledWith('1');

    await userEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('keeps the first two chips and collapses the rest into "+N more"', () => {
    setup({ filters: FILTERS });

    expect(screen.getByText('title equals "filters"')).toBeInTheDocument();
    expect(screen.getByText('tag equals "feature"')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+3 more' })).toBeInTheDocument();
    expect(screen.queryByText('description equals "release"')).not.toBeInTheDocument();
  });

  it('lists the collapsed filters in a popover, each removable', async () => {
    const { onRemoveFilter } = setup({ filters: FILTERS });

    await userEvent.click(screen.getByRole('button', { name: '+3 more' }));
    const popover = await screen.findByRole('dialog');

    expect(within(popover).getByText('description equals "release"')).toBeInTheDocument();
    expect(within(popover).getByText('id greater than 20')).toBeInTheDocument();

    await userEvent.click(within(popover).getByRole('button', { name: 'Remove id greater than 20' }));
    expect(onRemoveFilter).toHaveBeenCalledWith('4');
  });

  it('follows maxVisibleFilters', () => {
    setup({ filters: FILTERS, maxVisibleFilters: 4 });

    expect(screen.getByText('release_category equals "Bug Fixes"')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+1 more' })).toBeInTheDocument();
  });
});
