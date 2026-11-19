// Panel row actions work on the row's table, not on whichever table the grid has open. The scope hands the forms a
// context for the target table; nothing written there may reach the open table's state.
import '@/test/setupMsw';
import React, { type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, waitFor, userEvent } from '@/test/test-utils';
import {
  TooljetDatabaseProvider,
  useTooljetDatabaseContext,
  type TjdbTable,
  type TooljetDatabaseContextValue,
} from '@/TooljetDatabase/TooljetDatabaseContext';
import type { TableColumn } from '../editTableFormData';
import { TableSchemaScope } from '../TableSchemaScope';

const ORDERS: TjdbTable = { id: 'orders-id', table_name: 'orders' };
const USERS: TjdbTable = { id: 'users-id', table_name: 'users' };

const SCHEMAS: Record<string, { columns: object[]; foreign_keys: object[]; configurations: object }> = {
  orders: {
    columns: [
      { column_name: 'id', data_type: 'integer', column_default: "nextval('orders_id_seq'::regclass)" },
      { column_name: 'total', data_type: 'integer' },
    ],
    foreign_keys: [{ constraint_name: 'fk_orders_user' }],
    configurations: {},
  },
  users: {
    columns: [
      { column_name: 'id', data_type: 'integer', column_default: "nextval('users_id_seq'::regclass)" },
      { column_name: 'email', data_type: 'character varying' },
    ],
    foreign_keys: [],
    configurations: {},
  },
};

function serve(rowsByTableId: Record<string, object[]> = {}) {
  server.use(
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableName', ({ params }) => {
      const schema = SCHEMAS[params.tableName as string];
      return schema
        ? HttpResponse.json({ result: schema })
        : HttpResponse.json({ message: 'no such table' }, { status: 500 });
    }),
    http.get('*/tooljet-db/proxy/:tableId', ({ params }) =>
      HttpResponse.json(rowsByTableId[params.tableId as string] ?? [], { headers: { 'content-range': '0-0/0' } })
    )
  );
}

// What the open table (ORDERS) holds in the page's context, with spies on every setter the scope must not reach.
function openTableContext(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    organizationId: 'org-1',
    canEditTjdb: true,
    canEditSchema: true,
    selectedTable: ORDERS,
    tables: [ORDERS, USERS],
    columns: [{ Header: 'open_column' }],
    foreignKeys: [{ constraint_name: 'open_fk' }],
    configurations: { open: true },
    selectedTableData: [{ id: 1 }],
    setTables: jest.fn(),
    setColumns: jest.fn(),
    setForeignKeys: jest.fn(),
    setConfigurations: jest.fn(),
    setSelectedTable: jest.fn(),
    handleRefetchQuery: jest.fn(),
    ...overrides,
  };
}
type OpenTableContext = ReturnType<typeof openTableContext>;

let seen: TooljetDatabaseContextValue;
const Probe = () => {
  seen = useTooljetDatabaseContext();
  return (
    <div>
      <span data-testid="table">{seen.selectedTable.table_name}</span>
      <span data-testid="columns">{(seen.columns as TableColumn[]).map((column) => column.Header).join(',')}</span>
      <span data-testid="fks">
        {(seen.foreignKeys as Array<{ constraint_name: string }>).map((fk) => fk.constraint_name).join(',')}
      </span>
      <span data-testid="rows">{seen.selectedTableData.length}</span>
      <button type="button" onClick={() => seen.setForeignKeys([{ constraint_name: 'written' }])}>
        write fks
      </button>
      <button type="button" onClick={() => seen.setColumns([{ Header: 'written_column' }])}>
        write columns
      </button>
      <button type="button" onClick={() => seen.setConfigurations({ written: true })}>
        write configurations
      </button>
      <button type="button" onClick={() => seen.handleRefetchQuery({}, {}, 1, 50)}>
        refetch
      </button>
    </div>
  );
};

const withPage = (page: OpenTableContext, ui: ReactNode) => (
  <TooljetDatabaseProvider value={page as unknown as TooljetDatabaseContextValue}>{ui}</TooljetDatabaseProvider>
);

const renderScope = (
  page: OpenTableContext,
  target: TjdbTable,
  props: { fallback?: ReactNode; onError?: () => void } = {}
) =>
  render(
    withPage(
      page,
      <TableSchemaScope table={target} {...props}>
        <Probe />
      </TableSchemaScope>
    )
  );

describe('TableSchemaScope | target is not the open table', () => {
  beforeEach(() => serve());

  it('exposes the target table schema instead of the open table one', async () => {
    renderScope(openTableContext(), USERS);

    await waitFor(() => expect(screen.getByTestId('columns')).toHaveTextContent('id,email'));
    expect(screen.getByTestId('table')).toHaveTextContent('users');
    expect(screen.getByTestId('fks')).toHaveTextContent('');
  });

  it('shows the fallback until the schema has loaded, then the children', async () => {
    renderScope(openTableContext(), USERS, { fallback: <div>loading schema</div> });

    expect(screen.getByText('loading schema')).toBeInTheDocument();
    expect(screen.queryByTestId('columns')).not.toBeInTheDocument();
    await screen.findByTestId('columns');
    expect(screen.queryByText('loading schema')).not.toBeInTheDocument();
  });

  it('keeps foreign key, column and configuration writes local', async () => {
    const page = openTableContext();
    renderScope(page, USERS);
    await screen.findByTestId('columns');

    await userEvent.click(screen.getByText('write fks'));
    await userEvent.click(screen.getByText('write columns'));
    await userEvent.click(screen.getByText('write configurations'));

    expect(screen.getByTestId('fks')).toHaveTextContent('written');
    expect(screen.getByTestId('columns')).toHaveTextContent('written_column');
    expect(page.setForeignKeys).not.toHaveBeenCalled();
    expect(page.setColumns).not.toHaveBeenCalled();
    expect(page.setConfigurations).not.toHaveBeenCalled();
  });

  it('does not refetch the open table grid', async () => {
    const page = openTableContext();
    renderScope(page, USERS);
    await screen.findByTestId('columns');

    await userEvent.click(screen.getByText('refetch'));

    expect(page.handleRefetchQuery).not.toHaveBeenCalled();
  });

  it('reports the target table rows, not the open table ones', async () => {
    serve({ 'users-id': [{ id: 7, email: 'a@b.c' }] });
    renderScope(openTableContext({ selectedTableData: [] }), USERS);

    await waitFor(() => expect(screen.getByTestId('rows')).toHaveTextContent('1'));
  });

  it('reports an empty target table as having no rows', async () => {
    renderScope(openTableContext({ selectedTableData: [{ id: 1 }] }), USERS);

    await screen.findByTestId('columns');
    expect(screen.getByTestId('rows')).toHaveTextContent('0');
  });

  it('loads again when the target changes', async () => {
    const page = openTableContext();
    const { rerender } = renderScope(page, USERS);
    await waitFor(() => expect(screen.getByTestId('columns')).toHaveTextContent('id,email'));

    rerender(
      withPage(
        page,
        <TableSchemaScope table={{ id: 'other-id', table_name: 'orders' }}>
          <Probe />
        </TableSchemaScope>
      )
    );

    await waitFor(() => expect(screen.getByTestId('columns')).toHaveTextContent('id,total'));
  });

  it('reports a failed load and renders nothing', async () => {
    const onError = jest.fn();
    renderScope(openTableContext(), { id: 'ghost-id', table_name: 'ghost' }, { onError });

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('columns')).not.toBeInTheDocument();
  });
});

describe('TableSchemaScope | target is the open table', () => {
  beforeEach(() => serve());

  it('writes through to the open table state as well as the scope', async () => {
    const page = openTableContext();
    renderScope(page, ORDERS);
    await screen.findByTestId('columns');

    await userEvent.click(screen.getByText('write fks'));
    await userEvent.click(screen.getByText('write columns'));
    await userEvent.click(screen.getByText('write configurations'));

    expect(page.setForeignKeys).toHaveBeenCalledWith([{ constraint_name: 'written' }]);
    expect(page.setColumns).toHaveBeenCalledWith([{ Header: 'written_column' }]);
    expect(page.setConfigurations).toHaveBeenCalledWith({ written: true });
    expect(screen.getByTestId('fks')).toHaveTextContent('written');
  });

  it('refetches the open table grid', async () => {
    const page = openTableContext();
    renderScope(page, ORDERS);
    await screen.findByTestId('columns');

    await userEvent.click(screen.getByText('refetch'));

    expect(page.handleRefetchQuery).toHaveBeenCalledWith({}, {}, 1, 50);
  });
});
