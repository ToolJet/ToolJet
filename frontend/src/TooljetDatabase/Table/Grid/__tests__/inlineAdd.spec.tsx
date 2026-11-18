import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
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

const column = (accessor: string, dataType: string, extra: Partial<GridColumn> = {}): GridColumn => ({
  Header: accessor,
  accessor,
  dataType,
  constraints_type: { is_primary_key: false, is_not_null: false },
  ...extra,
});

const COLUMNS: GridColumn[] = [
  column('id', 'serial', { constraints_type: { is_primary_key: true, is_not_null: true } }),
  column('title', 'character varying'),
  column('views', 'integer'),
  column('published', 'boolean'),
  column('status', 'character varying', { column_default: 'new' }),
  column('code', 'character varying', { constraints_type: { is_not_null: true } }),
];
const ROWS = [{ id: 1, title: 'First post', views: 10, published: true, status: 'new', code: 'a' }];

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
describe('TableGrid | inline add row', () => {
  afterEach(cleanup);

  const posts: Record<string, unknown>[] = [];
  let refusal: { status: number; body: Record<string, unknown> } | null = null;
  const handleRefetchQuery = jest.fn();

  beforeEach(() => {
    posts.length = 0;
    refusal = null;
    handleRefetchQuery.mockClear();
    (toast.error as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();
    useTjdbStore.getState().actions.resetStore();
    useTjdbStore.setState({ selectedEnvironment: { id: 'env-1', priority: 1 } });
    useTjdbStore.getState().actions.openTableView('table-1');
    server.use(
      http.post('*/tooljet-db/proxy/:tableId', async ({ request }) => {
        posts.push((await request.json()) as Record<string, unknown>);
        return refusal ? HttpResponse.json(refusal.body, { status: refusal.status }) : HttpResponse.json([{ id: 2 }]);
      })
    );
  });

  const setup = (props: Partial<TableGridProps> = {}) =>
    render(
      <TooljetDatabaseContext.Provider
        value={
          {
            selectedTable: { id: 'table-1', table_name: 'orders' },
            foreignKeys: [],
            handleRefetchQuery,
          } as unknown as React.ContextType<typeof TooljetDatabaseContext>
        }
      >
        <TableGrid columns={COLUMNS} rows={ROWS} isLoading={false} canEditSchema canAddRows {...props} />
      </TooljetDatabaseContext.Provider>
    );

  const openRow = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Add row' }));
    return screen.getByRole('row', { name: 'New row' });
  };
  const field = (name: string) => screen.getByRole('textbox', { name });

  it('has no add row footer without permission to add rows', () => {
    setup({ canAddRows: false });

    expect(screen.queryByRole('button', { name: 'Add row' })).not.toBeInTheDocument();
  });

  it('opens a row of fields: Auto for generated columns, the default value, NULL or Required for the rest', async () => {
    setup();

    const row = await openRow();

    expect(within(row).getByText('Auto')).toBeInTheDocument();
    expect(field('title')).toHaveAttribute('placeholder', 'NULL');
    expect(field('status')).toHaveAttribute('placeholder', 'new');
    expect(field('code')).toHaveAttribute('placeholder', 'Required');
    expect(within(row).getByRole('combobox', { name: 'published' })).toHaveValue('');
    expect(field('title')).toHaveFocus();
  });

  it('sends only the cells that were filled in on Enter, then opens a fresh row', async () => {
    setup();
    await openRow();

    await userEvent.type(field('title'), 'Hello');
    await userEvent.type(field('views'), '5');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'published' }), 'false');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(handleRefetchQuery).toHaveBeenCalledTimes(1));
    expect(posts).toEqual([{ title: 'Hello', views: '5', published: false }]);
    expect(toast.success).toHaveBeenCalledWith('Row created successfully');
    expect(screen.getByRole('row', { name: 'New row' })).toBeInTheDocument();
    await waitFor(() => expect(field('title')).toHaveValue(''));
    expect(field('title')).toHaveFocus();
  });

  it('saves from the Save row button', async () => {
    setup();
    await openRow();

    await userEvent.type(field('title'), 'Hello');
    await userEvent.click(screen.getByRole('button', { name: 'Save row' }));

    await waitFor(() => expect(posts).toEqual([{ title: 'Hello' }]));
  });

  it('stays on the draft, with the values and the error on the offending cell, when the server refuses it', async () => {
    refusal = { status: 409, body: { code: '23505', message: 'duplicate key value violates orders.title' } };
    setup();
    await openRow();
    await userEvent.type(field('title'), 'Hello');
    await userEvent.type(field('views'), '5');

    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent('Value already exists');
    expect(handleRefetchQuery).not.toHaveBeenCalled();
    expect(field('title')).toHaveValue('Hello');
    expect(field('views')).toHaveValue('5');
    expect(field('title')).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(field('title')).toHaveFocus());
  });

  it('clears the error of a cell once it is edited, and saves again', async () => {
    refusal = { status: 409, body: { code: '23505', message: 'duplicate key value violates orders.title' } };
    setup();
    await openRow();
    await userEvent.type(field('title'), 'Hello');
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('alert');

    refusal = null;
    await userEvent.type(field('title'), '2');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(posts).toHaveLength(2));
    expect(posts[1]).toEqual({ title: 'Hello2' });
  });

  it('shows a refusal that names no column on the row, and toasts it', async () => {
    refusal = { status: 451, body: { message: 'Your plan has reached its rows limit' } };
    setup();
    await openRow();
    await userEvent.type(field('title'), 'Hello');

    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent('Your plan has reached its rows limit');
    expect(toast.error).toHaveBeenCalledWith('Your plan has reached its rows limit');
    expect(field('title')).toHaveValue('Hello');
  });

  it('closes the draft on Escape or Cancel, sending nothing', async () => {
    setup();
    await openRow();
    await userEvent.type(field('title'), 'Hello');

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('row', { name: 'New row' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add row' })).toHaveFocus();

    await openRow();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('row', { name: 'New row' })).not.toBeInTheDocument();
    expect(posts).toEqual([]);
    expect(handleRefetchQuery).not.toHaveBeenCalled();
  });

  it('starts from an empty draft after it was cancelled', async () => {
    setup();
    await openRow();
    await userEvent.type(field('title'), 'Hello');
    await userEvent.keyboard('{Escape}');

    await openRow();

    expect(field('title')).toHaveValue('');
  });

  it('drops the draft when the environment changes', async () => {
    setup();
    await openRow();

    act(() => useTjdbStore.setState({ selectedEnvironment: { id: 'env-2', priority: 2 } }));

    expect(screen.queryByRole('row', { name: 'New row' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add row' })).toBeInTheDocument();
  });
});
