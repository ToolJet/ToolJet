import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { QueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { server } from '@/test/msw/server';
import { act, cleanup, render, screen, userEvent, waitFor, within } from '@/test/test-utils';
import { useTjdbStore } from '../../../_stores/tjdbStore';
import { TooljetDatabaseContext } from '../../../context';
import { TableGrid, type TableGridProps } from '../TableGrid';
import type { GridColumn } from '../useTableGrid';

jest.mock('react-hot-toast', () => {
  const toast = jest.fn() as jest.Mock & { error: jest.Mock; success: jest.Mock };
  toast.error = jest.fn();
  toast.success = jest.fn();
  return { __esModule: true, default: toast, toast };
});

const column = (accessor: string, dataType: string, isPrimaryKey = false): GridColumn => ({
  Header: accessor,
  accessor,
  dataType,
  constraints_type: { is_primary_key: isPrimaryKey },
});

const COLUMNS = [column('id', 'serial', true), column('title', 'character varying')];
const ROWS = [
  { id: 1, title: 'one' },
  { id: 2, title: 'two' },
  { id: 3, title: 'three' },
];

const COMPOSITE_COLUMNS = [column('a', 'integer', true), column('b', 'integer', true), column('title', 'text')];
const COMPOSITE_ROWS = [
  { a: 1, b: 2, title: 'x' },
  { a: 1, b: 3, title: 'y' },
  { a: 3, b: 4, title: 'z' },
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

// The shared setup resets every zustand store in its own afterEach, which would update the grid while it is still
// mounted. Hooks of a describe run before the file's top-level ones, so unmounting here comes first.
describe('TableGrid | row selection', () => {
  afterEach(cleanup);

  const deleteRequests: URL[] = [];

  beforeEach(() => {
    deleteRequests.length = 0;
    (toast.error as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();
    useTjdbStore.getState().actions.resetStore();
    useTjdbStore.setState({ selectedEnvironment: { id: 'env-1', priority: 1 } });
    useTjdbStore.getState().actions.openTableView('table-1');
    server.use(
      http.delete('*/tooljet-db/proxy/:tableId', ({ request }) => {
        deleteRequests.push(new URL(request.url));
        return HttpResponse.json([]);
      })
    );
  });

  const ui = (props: Partial<TableGridProps> = {}) => (
    <TooljetDatabaseContext.Provider
      value={
        {
          selectedTable: { id: 'table-1', table_name: 'orders' },
          foreignKeys: [],
        } as unknown as React.ContextType<typeof TooljetDatabaseContext>
      }
    >
      <TableGrid columns={COLUMNS} rows={ROWS} isLoading={false} canEditSchema canSelectRows {...props} />
    </TooljetDatabaseContext.Provider>
  );

  const setup = (props: Partial<TableGridProps> = {}) => render(ui(props));

  const rowCheckbox = (rowId: string) =>
    within(screen.getByTestId(`grid-row-${rowId}`)).getByRole('checkbox', { name: 'Select row' });
  const headerCheckbox = () => screen.getByRole('checkbox', { name: 'Select all rows' });
  const bar = () => screen.queryByRole('toolbar', { name: 'Selected rows' });
  const getBar = () => screen.getByRole('toolbar', { name: 'Selected rows' });

  const selectRows = async (...rowIds: string[]) => {
    for (const id of rowIds) await userEvent.click(rowCheckbox(id));
  };

  describe('row selection | header checkbox', () => {
    it('selects every row on the page, then clears them', async () => {
      setup();

      await userEvent.click(headerCheckbox());

      ROWS.forEach(({ id }) => expect(rowCheckbox(String(id))).toBeChecked());
      expect(headerCheckbox()).toBeChecked();

      await userEvent.click(headerCheckbox());

      ROWS.forEach(({ id }) => expect(rowCheckbox(String(id))).not.toBeChecked());
      expect(headerCheckbox()).not.toBeChecked();
    });

    it('is indeterminate while only some rows are selected', async () => {
      setup();

      await selectRows('2');

      expect(headerCheckbox()).toHaveAttribute('data-state', 'indeterminate');
      expect(headerCheckbox()).toHaveAttribute('aria-checked', 'mixed');
    });

    it('clears the selection when clicked while indeterminate', async () => {
      setup();
      await selectRows('1', '2');

      await userEvent.click(headerCheckbox());

      ROWS.forEach(({ id }) => expect(rowCheckbox(String(id))).not.toBeChecked());
      expect(bar()).not.toBeInTheDocument();
    });

    it('turns checked when the last unselected row is selected by hand', async () => {
      setup();

      await selectRows('1', '2', '3');

      expect(headerCheckbox()).toBeChecked();
    });
  });

  describe('row selection | rows', () => {
    it('marks a selected row', async () => {
      setup();

      await selectRows('2');

      expect(screen.getByTestId('grid-row-2')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('grid-row-1')).not.toHaveAttribute('aria-selected', 'true');
    });

    it('unselects a row on a second click', async () => {
      setup();

      await selectRows('2', '2');

      expect(rowCheckbox('2')).not.toBeChecked();
      expect(bar()).not.toBeInTheDocument();
    });
  });

  describe('row selection | bar count', () => {
    it('shows no bar while nothing is selected', () => {
      setup();

      expect(bar()).not.toBeInTheDocument();
    });

    it('counts the selected rows', async () => {
      setup();

      await selectRows('1');
      expect(within(getBar()).getByText('1 row selected')).toBeInTheDocument();

      await selectRows('3');
      expect(within(getBar()).getByText('2 rows selected')).toBeInTheDocument();
    });

    it('clears the selection from the bar', async () => {
      setup();
      await selectRows('1', '2');

      await userEvent.click(within(getBar()).getByRole('button', { name: 'Clear' }));

      expect(bar()).not.toBeInTheDocument();
      ROWS.forEach(({ id }) => expect(rowCheckbox(String(id))).not.toBeChecked());
    });
  });

  describe('row selection | permission', () => {
    it('disables every checkbox without edit permission', () => {
      setup({ canSelectRows: false });

      expect(headerCheckbox()).toBeDisabled();
      ROWS.forEach(({ id }) => expect(rowCheckbox(String(id))).toBeDisabled());
    });

    it('keeps the checkboxes enabled with edit permission', () => {
      setup();

      expect(headerCheckbox()).toBeEnabled();
      ROWS.forEach(({ id }) => expect(rowCheckbox(String(id))).toBeEnabled());
    });
  });

  describe('row selection | clears when the view changes', () => {
    const change: Record<string, () => void> = {
      'the page': () => useTjdbStore.getState().actions.setPageCount(2),
      'the page size': () => useTjdbStore.getState().actions.setPageSize(100),
      'the filters': () =>
        useTjdbStore.getState().actions.setQueryFilters({ 0: { column: 'title', operator: 'eq', value: 'one' } }),
      'the sort': () => useTjdbStore.getState().actions.setSortFilters({ 0: { column: 'title', order: 'asc' } }),
      'the environment': () => useTjdbStore.setState({ selectedEnvironment: { id: 'env-2', priority: 2 } }),
      'the open table': () => useTjdbStore.getState().actions.openTableView('table-2'),
    };

    it.each(Object.keys(change))('after %s changes', async (name) => {
      setup();
      await selectRows('1', '2');
      expect(bar()).toBeInTheDocument();

      act(() => change[name]());

      expect(bar()).not.toBeInTheDocument();
      ROWS.forEach(({ id }) => expect(rowCheckbox(String(id))).not.toBeChecked());
    });

    it('does not bring the old selection back when the view returns', async () => {
      setup();
      await selectRows('1');

      act(() => useTjdbStore.getState().actions.setPageCount(2));
      act(() => useTjdbStore.getState().actions.setPageCount(1));

      expect(bar()).not.toBeInTheDocument();
      expect(rowCheckbox('1')).not.toBeChecked();
    });

    it('keeps the selection when the same rows arrive again', async () => {
      const { rerender } = setup();
      await selectRows('1');

      rerender(ui({ rows: ROWS.map((row) => ({ ...row })) }));

      expect(rowCheckbox('1')).toBeChecked();
    });
  });

  describe('row selection | delete', () => {
    const confirmDelete = async () => {
      await userEvent.click(within(getBar()).getByRole('button', { name: 'Delete' }));
      const dialog = await screen.findByRole('dialog');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    };

    it('asks first and sends nothing until confirmed', async () => {
      setup();
      await selectRows('1');

      await userEvent.click(within(getBar()).getByRole('button', { name: 'Delete' }));

      expect(await screen.findByText('Are you sure you want to delete the selected rows?')).toBeInTheDocument();
      expect(deleteRequests).toEqual([]);
    });

    it('sends nothing when the confirmation is cancelled', async () => {
      setup();
      await selectRows('1', '2');

      await userEvent.click(within(getBar()).getByRole('button', { name: 'Delete' }));
      const dialog = await screen.findByRole('dialog');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(deleteRequests).toEqual([]);
      expect(bar()).toBeInTheDocument();
      expect(rowCheckbox('1')).toBeChecked();
    });

    it('deletes by primary key with one in() filter for a single-column key', async () => {
      setup();
      await selectRows('1', '3');

      await confirmDelete();

      await waitFor(() => expect(deleteRequests).toHaveLength(1));
      expect(deleteRequests[0].pathname).toMatch(/\/tooljet-db\/proxy\/table-1$/);
      expect(deleteRequests[0].searchParams.get('id')).toBe('in.(1,3)');
      expect(deleteRequests[0].searchParams.get('environment_id')).toBe('env-1');
    });

    it('matches whole key tuples for a composite key', async () => {
      setup({ columns: COMPOSITE_COLUMNS, rows: COMPOSITE_ROWS });
      await selectRows('1\u00002', '3\u00004');

      await confirmDelete();

      await waitFor(() => expect(deleteRequests).toHaveLength(1));
      expect(deleteRequests[0].searchParams.get('or')).toBe('(and(a.eq.1,b.eq.2),and(a.eq.3,b.eq.4))');
      expect(deleteRequests[0].searchParams.has('a')).toBe(false);
    });

    it('quotes key values that PostgREST reserves', async () => {
      setup({
        rows: [
          { id: 'a,b', title: 'x' },
          { id: 'plain', title: 'y' },
        ],
      });
      await selectRows('a,b', 'plain');

      await confirmDelete();

      await waitFor(() => expect(deleteRequests).toHaveLength(1));
      expect(deleteRequests[0].searchParams.get('id')).toBe('in.("a,b",plain)');
    });

    it('toasts, refreshes the rows and clears the selection after a delete', async () => {
      const invalidate = jest.spyOn(QueryClient.prototype, 'invalidateQueries');
      setup();
      await selectRows('1', '2');

      await confirmDelete();

      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Deleted 2 rows from table "orders"'));
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['tjdb', 'rows'] });
      expect(bar()).not.toBeInTheDocument();
      expect(rowCheckbox('1')).not.toBeChecked();
      invalidate.mockRestore();
    });

    it('keeps the selection and shows the error when the delete fails', async () => {
      server.use(
        http.delete('*/tooljet-db/proxy/:tableId', () => HttpResponse.json({ message: 'nope' }, { status: 500 }))
      );
      setup();
      await selectRows('1');

      await confirmDelete();

      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect(toast.success).not.toHaveBeenCalled();
      expect(bar()).toBeInTheDocument();
      expect(rowCheckbox('1')).toBeChecked();
    });

    it('sends a timestamp key as stored, not as shown', async () => {
      const stamp = '2024-05-01T10:00:00.123456+00:00';
      setup({
        columns: [
          {
            ...column('created_at', 'timestamp with time zone', true),
            formatValue: () => '01/05/2024, 03:30 PM',
          },
          column('title', 'text'),
        ],
        rows: [{ created_at: stamp, title: 'x' }],
      });
      expect(screen.getByText('01/05/2024, 03:30 PM')).toBeInTheDocument();
      await selectRows(stamp);

      await confirmDelete();

      await waitFor(() => expect(deleteRequests).toHaveLength(1));
      expect(deleteRequests[0].searchParams.get('created_at')).toBe(`in.(${stamp})`);
      await waitFor(() => expect(bar()).not.toBeInTheDocument());
    });

    it.each([
      ['missing', { title: 'x' }, '0'],
      ['null', { id: null, title: 'x' }, 'null'],
    ])('sends nothing when a key value is %s', async (_name, row, rowId) => {
      setup({ rows: [row] });
      await selectRows(rowId);

      await confirmDelete();

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong - Record Id is incorrect'));
      expect(deleteRequests).toEqual([]);
      expect(toast.success).not.toHaveBeenCalled();
      expect(bar()).toBeInTheDocument();
    });

    it.each(['bigint', 'jsonb'])('cannot delete by a %s primary key', async (dataType) => {
      setup({ columns: [column('id', dataType, true), column('title', 'text')], rows: [{ id: 1, title: 'x' }] });
      await selectRows('1');

      expect(within(getBar()).getByRole('button', { name: 'Delete' })).toBeDisabled();
      expect(within(getBar()).getByTitle(new RegExp(dataType))).toBeInTheDocument();
    });

    it('says why Delete is off when the table has no primary key', async () => {
      setup({ columns: [column('title', 'text')], rows: [{ title: 'x' }] });
      await selectRows('0');

      expect(within(getBar()).getByTitle(/primary key/)).toBeInTheDocument();
    });

    it('shows no bar once rows can no longer be selected', async () => {
      const { rerender } = setup();
      await selectRows('1');

      rerender(ui({ canSelectRows: false }));

      expect(bar()).not.toBeInTheDocument();
    });

    it('cannot delete from a table without a primary key', async () => {
      setup({ columns: [column('title', 'text')], rows: [{ title: 'x' }] });
      await selectRows('0');

      expect(within(getBar()).getByRole('button', { name: 'Delete' })).toBeDisabled();
      expect(within(getBar()).getByText('1 row selected')).toBeInTheDocument();
    });
  });
});
