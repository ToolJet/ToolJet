// The Tables panel replaces the legacy sidebar list. Row actions work on the row's table, not on the open one.
import '@/test/setupMsw';
import React, { useState } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, waitFor, within, userEvent, act } from '@/test/test-utils';
import {
  TooljetDatabaseProvider,
  type TjdbTable,
  type TooljetDatabaseContextValue,
} from '@/TooljetDatabase/TooljetDatabaseContext';
import { SCHEMA_ENV_TOOLTIP } from '@/TooljetDatabase/constants';
import { DEFAULT_VIEW, useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { useOpenTabs } from '../useOpenTabs';
import { useTablesLimit } from '../useTablesLimit';
import { TablesPanel } from '../TablesPanel';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
);

// The confirmation modal has its own specs: here it confirms at once, so an edit runs through to what the drawer does
// once the table is saved.
jest.mock('@/TooljetDatabase/MigrationConfirmModal/useMigrationModal', () => ({
  __esModule: true,
  default: () => ({
    modal: null,
    runMigration: (options: { run: (name: string) => Promise<unknown>; onSuccess: () => void }) => {
      Promise.resolve(options.run('migration')).then(() => options.onSuccess());
    },
  }),
}));

const ORDERS: TjdbTable = { id: 'orders-id', table_name: 'orders' };
const USERS: TjdbTable = { id: 'users-id', table_name: 'users' };
// Mixed case on purpose: search must ignore case on the table name too.
const INVOICES: TjdbTable = { id: 'invoices-id', table_name: 'Invoices' };

type Requests = {
  deleted: Array<{ name: string; migration: string | null }>;
  exported: object[];
  metadata: string[];
};

function serve({ tablesLimit = { current: 1, total: 10 } } = {}) {
  const tables = [ORDERS, USERS, INVOICES];
  const requests: Requests = { deleted: [], exported: [], metadata: [] };
  server.use(
    http.get('*/tooljet-db/organizations/:organizationId/tables', () => HttpResponse.json({ result: [...tables] })),
    http.get('*/tooljet-db/tables/limits/:organizationId', () => HttpResponse.json({ tablesCount: tablesLimit })),
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableId/dependents', () =>
      HttpResponse.json({ result: { count: 0, foreignKeyTables: [] } })
    ),
    http.delete('*/tooljet-db/organizations/:organizationId/table/:tableName', ({ params, request }) => {
      requests.deleted.push({
        name: params.tableName as string,
        migration: new URL(request.url).searchParams.get('migration_name'),
      });
      tables.splice(
        tables.findIndex((table) => table.table_name === params.tableName),
        1
      );
      return HttpResponse.json({});
    }),
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableName', ({ params }) => {
      requests.metadata.push(params.tableName as string);
      return HttpResponse.json({
        result: {
          columns: [
            {
              column_name: 'id',
              data_type: 'integer',
              column_default: "nextval('x_id_seq'::regclass)",
              constraints_type: { is_primary_key: true, is_not_null: true, is_unique: false },
            },
          ],
          foreign_keys: [],
          configurations: {},
        },
      });
    }),
    http.patch('*/tooljet-db/organizations/:organizationId/table/:tableName', () => HttpResponse.json({ result: {} })),
    http.get('*/tooljet-db/proxy/:tableId', () => HttpResponse.json([], { headers: { 'content-range': '0-0/0' } })),
    http.post('*/v2/resources/export', async ({ request }) => {
      requests.exported.push((await request.json()) as object);
      return HttpResponse.json({ tooljet_database: [] });
    })
  );
  return requests;
}

type HarnessProps = { canEditTjdb?: boolean; canEditSchema?: boolean; onCollapse?: () => void };

function Harness({ canEditTjdb = true, canEditSchema = true, onCollapse = () => {} }: HarnessProps) {
  const [tables, setTables] = useState<TjdbTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<Partial<TjdbTable>>({});
  const [tablesLoaded, setTablesLoaded] = useState(false);
  const [loadingState, setLoadingState] = useState(false);
  const tabs = useOpenTabs({ organizationId: 'org-1', tables, selectedTable, setSelectedTable });
  const { reached: tablesLimitReached } = useTablesLimit(tables.length, tablesLoaded);
  const value = {
    organizationId: 'org-1',
    canEditTjdb,
    canEditSchema,
    tables,
    setTables,
    selectedTable,
    setSelectedTable,
    ...tabs,
    tablesLimitReached,
    tablesLoaded,
    setTablesLoaded,
    loadingState,
    setLoadingState,
    columns: [],
    setColumns: () => {},
    foreignKeys: [],
    setForeignKeys: () => {},
    configurations: {},
    setConfigurations: () => {},
    selectedTableData: [],
    handleRefetchQuery: () => {},
  };
  return (
    <TooljetDatabaseProvider value={value as unknown as TooljetDatabaseContextValue}>
      <TablesPanel onCollapse={onCollapse} />
      <output data-testid="open-table">{selectedTable.table_name ?? ''}</output>
    </TooljetDatabaseProvider>
  );
}

const row = (name: string) => screen.getByRole('button', { name });
const openTable = () => screen.getByTestId('open-table');
const openMenuOf = async (name: string) => {
  await userEvent.click(screen.getByRole('button', { name: `${name} actions` }));
  return screen.findByRole('menu');
};

// The tabs a previous visit left in this browser.
const saveTabs = (ids: string[], activeId: string | null) =>
  window.localStorage.setItem('tjdb-open-tabs:org-1', JSON.stringify({ ids, activeId }));

beforeEach(() => {
  window.localStorage.clear();
  // Most tests start with orders open; the ones about a fresh visit clear it.
  saveTabs([ORDERS.id], ORDERS.id);
  window.URL.createObjectURL = jest.fn(() => 'blob:export');
  window.URL.revokeObjectURL = jest.fn();
  useTjdbStore.setState({ migrationsVersion: 0 });
});

describe('TablesPanel | list', () => {
  it('shows the title, the tables and their count, with the saved tab open', async () => {
    serve();
    render(<Harness />);

    expect(screen.getByRole('heading', { name: 'Database' })).toBeInTheDocument();
    await screen.findByRole('button', { name: 'orders' });
    expect(row('users')).toBeInTheDocument();
    expect(row('Invoices')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    await waitFor(() => expect(openTable()).toHaveTextContent('orders'));
  });

  it('opens no table on a first visit', async () => {
    window.localStorage.clear();
    serve();
    render(<Harness />);
    await screen.findByRole('button', { name: 'orders' });

    expect(openTable()).toHaveTextContent('');
  });

  it('opens the table the link names, on top of the saved tabs', async () => {
    serve();
    render(<Harness />, { route: `/workspace/database?table=${USERS.id}` });

    await waitFor(() => expect(openTable()).toHaveTextContent('users'));
  });

  it('drops a saved tab whose table no longer exists', async () => {
    saveTabs(['gone-id', USERS.id], 'gone-id');
    serve();
    render(<Harness />);

    await waitFor(() => expect(openTable()).toHaveTextContent('users'));
  });

  it('opens the table App Builder handed over, and clears the handoff', async () => {
    serve();
    window.localStorage.setItem('tableDetails', JSON.stringify(USERS));
    render(<Harness />);

    await waitFor(() => expect(openTable()).toHaveTextContent('users'));
    expect(window.localStorage.getItem('tableDetails')).toBeNull();
  });

  it('opens a table when its row is clicked', async () => {
    serve();
    render(<Harness />);
    await screen.findByRole('button', { name: 'users' });

    await userEvent.click(row('users'));

    expect(openTable()).toHaveTextContent('users');
  });

  it('filters by name ignoring case and surrounding spaces, and updates the count', async () => {
    serve();
    render(<Harness />);
    await screen.findByRole('button', { name: 'users' });

    await userEvent.type(screen.getByRole('textbox', { name: 'Search tables' }), '  INV');

    expect(row('Invoices')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'orders' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'users' })).not.toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('says so when no table matches the search', async () => {
    serve();
    render(<Harness />);
    await screen.findByRole('button', { name: 'users' });

    await userEvent.type(screen.getByRole('textbox', { name: 'Search tables' }), 'zzz');

    expect(screen.getByText('No tables match "zzz"')).toBeInTheDocument();
  });

  it('collapses through the collapse action', async () => {
    serve();
    const onCollapse = jest.fn();
    render(<Harness onCollapse={onCollapse} />);

    await userEvent.click(screen.getByRole('button', { name: 'Collapse tables panel' }));

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });
});

describe('TablesPanel | create table', () => {
  it('is enabled when the user can edit the schema', async () => {
    serve();
    render(<Harness />);

    expect(await screen.findByRole('button', { name: 'Create new table' })).toBeEnabled();
  });

  it('is disabled at the tables limit', async () => {
    serve({ tablesLimit: { current: 10, total: 10 } });
    render(<Harness />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Create new table' })).toBeDisabled());
  });

  it('explains the Development-only rule when the environment is the blocker', async () => {
    serve();
    render(<Harness canEditTjdb canEditSchema={false} />);
    const create = await screen.findByRole('button', { name: 'Create new table' });

    expect(create).toBeDisabled();
    // A disabled button swallows mouse events, so the hover target is its wrapper.
    await userEvent.hover(create.parentElement as HTMLElement);

    expect(await screen.findAllByText(SCHEMA_ENV_TOOLTIP)).not.toHaveLength(0);
  });

  it('does not show the environment tooltip when the user lacks the TJDB permission', async () => {
    serve();
    render(<Harness canEditTjdb={false} canEditSchema={false} />);
    const create = await screen.findByRole('button', { name: 'Create new table' });

    await userEvent.hover(create.parentElement as HTMLElement);
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));

    expect(screen.queryByText(SCHEMA_ENV_TOOLTIP)).not.toBeInTheDocument();
  });
});

describe('TablesPanel | row menu', () => {
  it('lists the five actions with Delete table last', async () => {
    serve();
    render(<Harness />);
    await screen.findByRole('button', { name: 'users' });

    const menu = await openMenuOf('users');

    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent)
    ).toEqual(['Edit table', 'Add new column', 'Export schema', 'Export data as CSV', 'Delete table']);
  });

  it('is available on a row that is not open, without opening that table', async () => {
    serve();
    render(<Harness />);
    await waitFor(() => expect(openTable()).toHaveTextContent('orders'));

    await openMenuOf('users');

    expect(openTable()).toHaveTextContent('orders');
  });

  it('disables the schema actions outside Development but keeps the exports', async () => {
    serve();
    render(<Harness canEditSchema={false} />);
    await screen.findByRole('button', { name: 'users' });

    const menu = await openMenuOf('users');

    expect(within(menu).getByRole('menuitem', { name: 'Edit table' })).toHaveAttribute('aria-disabled', 'true');
    expect(within(menu).getByRole('menuitem', { name: 'Add new column' })).toHaveAttribute('aria-disabled', 'true');
    expect(within(menu).getByRole('menuitem', { name: 'Delete table' })).toHaveAttribute('aria-disabled', 'true');
    expect(within(menu).getByRole('menuitem', { name: 'Export schema' })).not.toHaveAttribute('aria-disabled');
    expect(within(menu).getByRole('menuitem', { name: 'Export data as CSV' })).not.toHaveAttribute('aria-disabled');
  });

  it('exports the schema of the row it was opened on, not the open table', async () => {
    const requests = serve();
    render(<Harness />);
    await waitFor(() => expect(openTable()).toHaveTextContent('orders'));

    await openMenuOf('users');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Export schema' }));

    await waitFor(() => expect(requests.exported).toHaveLength(1));
    expect(requests.exported[0]).toMatchObject({ tooljet_database: [{ table_id: 'users-id' }] });
  });

  it('loads the schema of the row it was opened on when editing', async () => {
    const requests = serve();
    render(<Harness />);
    await waitFor(() => expect(openTable()).toHaveTextContent('orders'));

    await openMenuOf('users');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit table' }));

    await waitFor(() => expect(requests.metadata).toContain('users'));
    expect(requests.metadata).not.toContain('orders');
    expect(openTable()).toHaveTextContent('orders');
  });
});

describe('TablesPanel | edit table', () => {
  // Renames the table in the open drawer and saves it.
  const saveEdit = async () => {
    await userEvent.type(await screen.findByPlaceholderText('Enter table name'), '_2');
    await userEvent.click(screen.getByRole('button', { name: /Save changes/ }));
  };
  const FILTER = { 0: { column: 'status', operator: 'eq', value: 'open' } };

  it('forgets the saved view of the edited table, open or not, because the edit may drop the column it filters on', async () => {
    serve();
    render(<Harness />);
    await waitFor(() => expect(openTable()).toHaveTextContent('orders'));
    act(() =>
      useTjdbStore.setState({
        views: {
          [ORDERS.id]: { ...DEFAULT_VIEW, queryFilters: FILTER },
          [USERS.id]: { ...DEFAULT_VIEW, queryFilters: FILTER, pageCount: 3 },
        },
      })
    );

    await openMenuOf('users');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit table' }));
    await saveEdit();

    await waitFor(() => expect(useTjdbStore.getState().views[USERS.id]).toBeUndefined());
    expect(useTjdbStore.getState().views[ORDERS.id]).toBeDefined();
  });

  it('puts the open table back on its first page and default view', async () => {
    serve();
    render(<Harness />);
    await waitFor(() => expect(openTable()).toHaveTextContent('orders'));
    act(() => {
      useTjdbStore.getState().actions.openTableView(ORDERS.id);
      useTjdbStore.getState().actions.setQueryFilters(FILTER);
      useTjdbStore.getState().actions.setPageCount(4);
    });

    await openMenuOf('orders');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit table' }));
    await saveEdit();

    await waitFor(() => expect(useTjdbStore.getState().views[ORDERS.id]).toBeUndefined());
  });
});

describe('TablesPanel | delete table', () => {
  it('deletes the row it was opened on, records the migration, and keeps the open table', async () => {
    const requests = serve();
    render(<Harness />);
    await waitFor(() => expect(openTable()).toHaveTextContent('orders'));
    // Not the first table, so "keeps the open table" cannot pass by falling back to the first one.
    await userEvent.click(row('Invoices'));
    expect(openTable()).toHaveTextContent('Invoices');

    await openMenuOf('users');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete table' }));
    await userEvent.click(await screen.findByRole('button', { name: /delete/i }));

    await waitFor(() => expect(requests.deleted).toEqual([{ name: 'users', migration: 'Drop table "users"' }]));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'users' })).not.toBeInTheDocument());
    expect(openTable()).toHaveTextContent('Invoices');
    expect(useTjdbStore.getState().migrationsVersion).toBe(1);
  });

  it('moves to the neighbouring tab when the open table is the one deleted', async () => {
    saveTabs([ORDERS.id, USERS.id], ORDERS.id);
    serve();
    render(<Harness />);
    await waitFor(() => expect(openTable()).toHaveTextContent('orders'));

    await openMenuOf('orders');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete table' }));
    await userEvent.click(await screen.findByRole('button', { name: /delete/i }));

    await waitFor(() => expect(openTable()).toHaveTextContent('users'));
  });

  it('leaves no table open when the only open table is the one deleted', async () => {
    serve();
    render(<Harness />);
    await waitFor(() => expect(openTable()).toHaveTextContent('orders'));

    await openMenuOf('orders');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete table' }));
    await userEvent.click(await screen.findByRole('button', { name: /delete/i }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'orders' })).not.toBeInTheDocument());
    expect(openTable()).toHaveTextContent('');
  });
});
