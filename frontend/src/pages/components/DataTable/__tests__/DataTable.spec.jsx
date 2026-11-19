import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { DataTable } from '../DataTable';
import { useDataTableContext } from '../DataTableContext';
import { useDataTableRowReorder } from '../Reorder';
import { getGridTemplateColumns } from '../getGridTemplateColumns';

const columns = [
  { id: 'name', header: 'Name', accessorKey: 'name', meta: { width: '200px', sortField: 'name', docked: true } },
  { id: 'owner', header: 'Owner', accessorKey: 'owner', meta: { width: '100px' } },
];
const data = [
  { id: 1, name: 'Alpha', owner: 'Ann', pinned: true },
  { id: 2, name: 'Beta', owner: 'Bob', pinned: false },
];
const getRowId = (item) => String(item.id);

const Row = ({ row }) => (
  <div role="row" data-testid={`row-${row.id}`}>
    {row.original.name}
  </div>
);

const renderTable = (props = {}) =>
  render(
    <DataTable
      columns={columns}
      data={data}
      getRowId={getRowId}
      ariaLabel="Test table"
      renderRow={(row) => <Row key={row.id} row={row} />}
      {...props}
    />
  );

describe('getGridTemplateColumns', () => {
  test('joins each column width into one grid template', () => {
    expect(getGridTemplateColumns(columns)).toBe('200px 100px');
  });
});

describe('DataTable', () => {
  test('flat table is a "grid" with one header cell per column and one row per item', () => {
    renderTable();

    expect(screen.getByRole('grid', { name: 'Test table' })).toBeInTheDocument();
    expect(screen.queryByRole('treegrid')).not.toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Name', 'Owner']);
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
    expect(screen.getByTestId('row-2')).toBeInTheDocument();
  });

  test('marks only the sorted column header with aria-sort', () => {
    renderTable({ sort: { field: 'name', direction: 'desc' } });

    const [nameHeader, ownerHeader] = screen.getAllByRole('columnheader');
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(ownerHeader).not.toHaveAttribute('aria-sort');
  });

  test('keeps the header and swaps the rows for the loading state while loading', () => {
    renderTable({ isLoading: true, loadingState: <p>Loading rows</p> });

    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getByText('Loading rows')).toBeInTheDocument();
    expect(screen.queryByTestId('row-1')).not.toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-busy', 'true');
  });

  test('replaces the whole table, header included, with the empty state', () => {
    renderTable({ emptyState: <p>Nothing here</p> });

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  test('renders the footer and overlay slots next to the table', () => {
    renderTable({ footer: <p>Footer</p>, overlay: <p>Overlay</p> });

    expect(screen.getByText('Footer')).toBeInTheDocument();
    expect(screen.getByText('Overlay')).toBeInTheDocument();
  });

  test('exposes the column template to rows through context', () => {
    const Probe = () => <p data-testid="template">{useDataTableContext().gridTemplateColumns}</p>;
    renderTable({ renderRow: (row) => <Probe key={row.id} /> });

    expect(screen.getAllByTestId('template')[0]).toHaveTextContent('200px 100px');
  });

  describe('expansion', () => {
    const expandableProps = {
      getRowCanExpand: (row) => row.original.id === 1,
      renderExpandedRow: (row) => <p data-testid={`children-${row.id}`}>children</p>,
    };

    test('becomes a "treegrid" once rows can expand', () => {
      renderTable({ ...expandableProps, expanded: {} });

      expect(screen.getByRole('treegrid', { name: 'Test table' })).toBeInTheDocument();
    });

    test('shows expanded content right after its row, and only for expanded rows', () => {
      renderTable({ ...expandableProps, expanded: { 1: true } });

      const table = screen.getByRole('treegrid');
      const order = within(table)
        .getAllByTestId(/^(row|children)-/)
        .map((node) => node.dataset.testid);
      expect(order).toEqual(['row-1', 'children-1', 'row-2']);
    });

    test('shows no expanded content while collapsed', () => {
      renderTable({ ...expandableProps, expanded: {} });

      expect(screen.queryByTestId('children-1')).not.toBeInTheDocument();
    });
  });

  test('renders a separator between rows when the page asks for one', () => {
    renderTable({ renderRowSeparator: (row, next) => (next ? <hr data-testid={`sep-${row.id}`} /> : null) });

    expect(screen.getByTestId('sep-1')).toBeInTheDocument();
    expect(screen.queryByTestId('sep-2')).not.toBeInTheDocument();
  });

  describe('reorder', () => {
    const DragRow = ({ row }) => {
      const { dragHandle } = useDataTableRowReorder(row);
      return (
        <div role="row" data-testid={`row-${row.id}`}>
          {dragHandle ? 'draggable' : 'fixed'}
        </div>
      );
    };
    const reorderProps = (isEnabled) => ({
      renderRow: (row) => <DragRow key={row.id} row={row} />,
      reorder: {
        isEnabled,
        isRowReorderable: (row) => row.original.pinned,
        getRowLabel: (row) => row.original.name,
        onReorder: jest.fn(),
      },
    });

    test('offers a drag handle only on reorderable rows while reordering is enabled', () => {
      renderTable(reorderProps(true));

      expect(screen.getByTestId('row-1')).toHaveTextContent('draggable');
      expect(screen.getByTestId('row-2')).toHaveTextContent('fixed');
    });

    test('offers no drag handle when the page disables reordering', () => {
      renderTable(reorderProps(false));

      expect(screen.getByTestId('row-1')).toHaveTextContent('fixed');
    });
  });
});
