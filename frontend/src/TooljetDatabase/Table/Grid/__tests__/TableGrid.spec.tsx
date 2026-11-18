import React from 'react';
import { act, fireEvent, render, screen, within } from '@/test/test-utils';
import { DEFAULT_VIEW, useTjdbStore } from '../../../_stores/tjdbStore';
import { TooljetDatabaseContext } from '../../../context';
import { TableGrid, type TableGridProps } from '../TableGrid';
import type { GridColumn } from '../useTableGrid';

const column = (accessor: string, dataType: string, isPrimaryKey = false): GridColumn => ({
  Header: accessor,
  accessor,
  dataType,
  constraints_type: { is_primary_key: isPrimaryKey },
});

const COLUMNS: GridColumn[] = [
  column('id', 'serial', true),
  column('title', 'character varying'),
  column('views', 'integer'),
  column('published', 'boolean'),
];

const ROWS = [
  { id: 1, title: 'First post', views: 10, published: true },
  { id: 2, title: null, views: null, published: false },
];

// jsdom has no layout, so the virtualizer sees a 0px viewport and mounts no rows.
beforeAll(() => {
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 1000,
    height: 600,
    top: 0,
    left: 0,
    right: 1000,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
  jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600);
});

afterAll(() => jest.restoreAllMocks());

const setup = (props: Partial<TableGridProps> = {}) =>
  render(<TableGrid columns={COLUMNS} rows={ROWS} isLoading={false} canEditSchema {...props} />);

const setSort = (sortFilters: Record<string, { column: string; order: string }>) =>
  useTjdbStore.setState({ viewTableId: 'table-1', views: { 'table-1': { ...DEFAULT_VIEW, sortFilters } } });

describe('TableGrid | header', () => {
  it('keeps the Cypress hooks of the previous grid', () => {
    setup();

    expect(screen.getByTestId('grid-row-1').querySelector('[data-cy="id-1-column-title-table-cell"]')).not.toBeNull();
    expect(document.querySelector('[data-cy="title-column-header"]')).not.toBeNull();
  });

  it("fills rows already on screen when the table's columns arrive after its rows", () => {
    const { rerender } = render(<TableGrid columns={[]} rows={ROWS} isLoading={false} canEditSchema />);

    rerender(<TableGrid columns={COLUMNS} rows={ROWS} isLoading={false} canEditSchema />);

    expect(within(screen.getByTestId('grid-row-1')).getByText('First post')).toBeInTheDocument();
  });

  it('fills mounted rows when a column is added to the open table', () => {
    // The same rows array both times: only the columns change.
    const rows = ROWS.map((row) => ({ ...row, slug: 'first' }));
    const { rerender } = setup({ rows });

    rerender(
      <TableGrid
        columns={[...COLUMNS, column('slug', 'character varying')]}
        rows={rows}
        isLoading={false}
        canEditSchema
      />
    );

    expect(within(screen.getByTestId('grid-row-1')).getByText('first')).toBeInTheDocument();
  });

  it('shows each column name', () => {
    setup();

    const header = screen.getByRole('row', { name: /id.*title.*views.*published/ });
    ['id', 'title', 'views', 'published'].forEach((name) => expect(within(header).getByText(name)).toBeInTheDocument());
  });

  it('marks the primary key column', () => {
    setup();

    const marked = screen.getAllByLabelText('Primary key');
    expect(marked).toHaveLength(1);
    expect(within(screen.getByRole('columnheader', { name: /id/ })).getByLabelText('Primary key')).toBe(marked[0]);
  });

  it('marks a foreign key column', () => {
    render(
      <TooljetDatabaseContext.Provider
        value={
          { selectedTable: {}, foreignKeys: [{ column_names: ['views'] }] } as unknown as React.ContextType<
            typeof TooljetDatabaseContext
          >
        }
      >
        <TableGrid columns={COLUMNS} rows={ROWS} isLoading={false} canEditSchema />
      </TooljetDatabaseContext.Provider>
    );

    expect(
      within(screen.getByRole('columnheader', { name: /views/ })).getByLabelText('Foreign key')
    ).toBeInTheDocument();
  });
});

describe('TableGrid | row ids', () => {
  it('falls back to the row index when the rows do not carry the primary key yet', () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    setup({ rows: [{ title: 'a' }, { title: 'b' }] });

    expect(screen.getByTestId('grid-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('grid-row-1')).toBeInTheDocument();
    expect(errors).not.toHaveBeenCalledWith(expect.stringContaining('same key'), expect.anything(), expect.anything());
    errors.mockRestore();
  });

  it('joins the key values of a composite primary key', () => {
    setup({
      columns: [column('a', 'integer', true), column('b', 'integer', true)],
      rows: [{ a: 1, b: 2 }],
    });

    expect(screen.getByTestId('grid-row-1\u00002')).toBeInTheDocument();
  });
});

describe('TableGrid | sort indicator', () => {
  it('shows the direction without a number for a single sort', () => {
    setSort({ '0': { column: 'title', order: 'desc' } });
    setup();

    const title = screen.getByRole('columnheader', { name: /title/ });
    expect(within(title).getByLabelText('Sorted descending')).toBeInTheDocument();
    expect(within(title).queryByTestId('sort-priority')).not.toBeInTheDocument();
  });

  it('numbers the sorts by priority when more than one is applied', () => {
    setSort({ '0': { column: 'title', order: 'asc' }, '2': { column: 'views', order: 'desc' } });
    setup();

    const title = screen.getByRole('columnheader', { name: /title/ });
    const views = screen.getByRole('columnheader', { name: /views/ });
    expect(within(title).getByLabelText('Sorted ascending')).toBeInTheDocument();
    expect(within(title).getByTestId('sort-priority')).toHaveTextContent('1');
    expect(within(views).getByLabelText('Sorted descending')).toBeInTheDocument();
    expect(within(views).getByTestId('sort-priority')).toHaveTextContent('2');
    expect(within(screen.getByRole('columnheader', { name: /published/ })).queryByLabelText(/Sorted/)).toBeNull();
  });
});

describe('TableGrid | cells', () => {
  it('shows NULL for a missing value', () => {
    setup();

    const row = screen.getByTestId('grid-row-2');
    expect(within(row).getAllByText('NULL')).toHaveLength(2);
  });

  it('shows booleans as text', () => {
    setup();

    expect(within(screen.getByTestId('grid-row-1')).getByText('true')).toBeInTheDocument();
    expect(within(screen.getByTestId('grid-row-2')).getByText('false')).toBeInTheDocument();
  });

  it('right-aligns numbers and leaves text left-aligned', () => {
    setup();

    const row = screen.getByTestId('grid-row-1');
    expect(within(row).getByText('10').closest('[role="gridcell"]')).toHaveClass('tw-justify-end');
    expect(within(row).getByText('First post').closest('[role="gridcell"]')).not.toHaveClass('tw-justify-end');
  });
});

describe('TableGrid | footer and gating', () => {
  it('shows the add column cell only when the schema is editable', () => {
    const { unmount } = setup({ canEditSchema: true });
    expect(screen.getByRole('button', { name: 'Add column' })).toBeInTheDocument();
    unmount();

    setup({ canEditSchema: false });
    expect(screen.queryByRole('button', { name: 'Add column' })).not.toBeInTheDocument();
  });

  it('gives the add column cell a stable Cypress hook', () => {
    setup({ canEditSchema: true });

    expect(screen.getByRole('button', { name: 'Add column' })).toHaveAttribute('data-cy', 'add-column-button');
  });

  it('shows the add row footer only when rows can be added', () => {
    const { unmount } = setup({ canAddRows: true });
    expect(screen.getByRole('button', { name: 'Add row' })).toBeInTheDocument();
    unmount();

    setup({ canAddRows: false });
    expect(screen.queryByRole('button', { name: 'Add row' })).not.toBeInTheDocument();
  });
});

describe('TableGrid | loading', () => {
  it('shows the skeleton instead of rows while loading', () => {
    setup({ isLoading: true });

    expect(screen.getByTestId('grid-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('grid-row-1')).not.toBeInTheDocument();
  });
});

describe('TableGrid | refetch', () => {
  it('shows a progress bar and dims the rows while a refetch runs behind them', () => {
    setup({ isRefetching: true });

    expect(screen.getByRole('progressbar', { name: 'Refreshing rows' })).toBeInTheDocument();
    expect(screen.getByRole('rowgroup')).toHaveClass('tw-opacity-60');
    expect(screen.getByRole('grid')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows no bar and full-strength rows when idle', () => {
    setup();

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('rowgroup')).not.toHaveClass('tw-opacity-60');
  });
});

describe('TableGrid | column widths', () => {
  const inTable = (ui: React.ReactElement) => (
    <TooljetDatabaseContext.Provider
      value={
        { selectedTable: { id: 'table-1' }, organizationId: 'ws-1', foreignKeys: [] } as unknown as React.ContextType<
          typeof TooljetDatabaseContext
        >
      }
    >
      {ui}
    </TooljetDatabaseContext.Provider>
  );
  const KEY = 'tjdb-col-widths:ws-1:table-1';
  const grid = () => inTable(<TableGrid columns={COLUMNS} rows={ROWS} isLoading={false} canEditSchema />);
  const savedWidths = () => JSON.parse(window.localStorage.getItem(KEY) ?? 'null');

  beforeEach(() => window.localStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  it('opens a table with the widths saved for it', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ title: 333, removed: 500 }));
    render(grid());

    expect(screen.getByRole('columnheader', { name: /title/ })).toHaveStyle({ width: '333px' });
    expect(screen.getByRole('columnheader', { name: /views/ })).toHaveStyle({ width: '200px' });
  });

  it('opens with default widths when storage throws', () => {
    const getItem = Storage.prototype.getItem;
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key: string) {
      if (key === KEY) throw new Error('blocked');
      return getItem.call(this, key);
    });
    render(grid());

    expect(screen.getByRole('columnheader', { name: /title/ })).toHaveStyle({ width: '200px' });
  });

  it('saves when a resize ends, not while the handle moves', () => {
    render(grid());
    const handle = screen.getByRole('separator', { name: 'Resize title column' });

    fireEvent.mouseDown(handle, { clientX: 100 });
    fireEvent.mouseMove(document, { clientX: 150 });
    expect(screen.getByRole('columnheader', { name: /title/ })).toHaveStyle({ width: '250px' });
    expect(savedWidths()).toBeNull();

    fireEvent.mouseUp(document, { clientX: 150 });

    expect(savedWidths()).toEqual({ title: 250 });
  });

  it('forgets a width that was reset to the default', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ title: 333 }));
    render(grid());

    fireEvent.doubleClick(screen.getByRole('separator', { name: 'Resize title column' }));

    expect(savedWidths()).toBeNull();
  });

  it('does not save without a workspace and table to save under', () => {
    render(<TableGrid columns={COLUMNS} rows={ROWS} isLoading={false} canEditSchema />);

    fireEvent.mouseDown(screen.getByRole('separator', { name: 'Resize title column' }), { clientX: 100 });
    fireEvent.mouseMove(document, { clientX: 150 });
    fireEvent.mouseUp(document, { clientX: 150 });

    expect(window.localStorage.length).toBe(0);
  });
});

describe('TableGrid | scroll position', () => {
  const scroller = () => screen.getByRole('grid');
  const tableGrid = (props: Partial<TableGridProps> = {}) => (
    <TooljetDatabaseContext.Provider
      value={
        { selectedTable: { id: 'table-1' }, foreignKeys: [] } as unknown as React.ContextType<
          typeof TooljetDatabaseContext
        >
      }
    >
      <TableGrid columns={COLUMNS} rows={ROWS} isLoading={false} canEditSchema {...props} />
    </TooljetDatabaseContext.Provider>
  );

  beforeEach(() => act(() => useTjdbStore.setState({ viewTableId: 'table-1' })));
  afterEach(() => jest.useRealTimers());

  it("waits for the view to be this table's before scrolling, since rows of another view can be on screen", () => {
    act(() => useTjdbStore.setState({ viewTableId: 'table-2' }));
    render(tableGrid({ initialScrollTop: 240 }));
    expect(scroller().scrollTop).toBe(0);

    act(() => useTjdbStore.setState({ viewTableId: 'table-1' }));

    expect(scroller().scrollTop).toBe(240);
  });

  it("reports no position while the view is another table's", () => {
    jest.useFakeTimers();
    act(() => useTjdbStore.setState({ viewTableId: 'table-2' }));
    const onScrollEnd = jest.fn();
    render(tableGrid({ onScrollEnd }));

    scroller().scrollTop = 100;
    fireEvent.scroll(scroller());
    jest.advanceTimersByTime(500);

    expect(onScrollEnd).not.toHaveBeenCalled();
  });

  it('scrolls to the saved position once the rows are on screen', () => {
    const { rerender } = render(tableGrid({ rows: [], isLoading: true, initialScrollTop: 240 }));
    expect(scroller().scrollTop).toBe(0);

    rerender(tableGrid({ initialScrollTop: 240 }));

    expect(scroller().scrollTop).toBe(240);
  });

  it('restores only once: later changes of the saved position leave the scroll alone', () => {
    const { rerender } = render(tableGrid({ initialScrollTop: 240 }));
    scroller().scrollTop = 600;

    rerender(tableGrid({ initialScrollTop: 10 }));

    expect(scroller().scrollTop).toBe(600);
  });

  it('reports the position once scrolling pauses', () => {
    jest.useFakeTimers();
    const onScrollEnd = jest.fn();
    render(tableGrid({ onScrollEnd }));

    scroller().scrollTop = 100;
    fireEvent.scroll(scroller());
    jest.advanceTimersByTime(100);
    scroller().scrollTop = 160;
    fireEvent.scroll(scroller());
    jest.advanceTimersByTime(100);
    expect(onScrollEnd).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);

    expect(onScrollEnd).toHaveBeenCalledTimes(1);
    expect(onScrollEnd).toHaveBeenCalledWith(160);
  });

  it('reports nothing after the grid is gone', () => {
    jest.useFakeTimers();
    const onScrollEnd = jest.fn();
    const { unmount } = render(tableGrid({ onScrollEnd }));
    fireEvent.scroll(scroller());

    unmount();
    jest.advanceTimersByTime(500);

    expect(onScrollEnd).not.toHaveBeenCalled();
  });
});
