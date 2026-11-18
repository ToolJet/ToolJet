import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { act, cleanup, render, screen, userEvent, waitFor } from '@/test/test-utils';
import { TooljetDatabaseContext } from '../../context';
import { useTjdbStore } from '../../_stores/tjdbStore';
import Table from '..';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
);

const DEVELOPMENT = { id: 'env-development', name: 'development', priority: 1 };
const COLUMNS = [
  {
    Header: 'id',
    accessor: 'id',
    dataType: 'serial',
    constraints_type: { is_primary_key: true, is_not_null: true, is_unique: true },
  },
  { Header: 'title', accessor: 'title', dataType: 'character varying', constraints_type: { is_not_null: false } },
];
const TABLE = {
  id: 'table-1',
  table_name: 'orders',
  environments: [{ environment_id: DEVELOPMENT.id, has_relation: true }],
};

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

describe('Table | add row on an empty page', () => {
  afterEach(cleanup);

  beforeEach(() => {
    act(() => useTjdbStore.setState({ environments: [DEVELOPMENT], selectedEnvironment: DEVELOPMENT }));
    server.use(
      http.get('*/tooljet-db/organizations/:organizationId/table/:tableName', () =>
        HttpResponse.json({ result: { columns: [], foreign_keys: [], configurations: {} } })
      ),
      http.get('*/tooljet-db/proxy/:tableId', () => HttpResponse.json([], { headers: { 'content-range': '*/0' } }))
    );
  });

  afterEach(() => {
    act(() => useTjdbStore.setState({ environments: [], selectedEnvironment: null }));
  });

  const ui = (rows: Record<string, unknown>[], totalRecords = rows.length) => (
    <TooljetDatabaseContext.Provider
      value={
        {
          organizationId: 'org-1',
          tables: [TABLE],
          columns: COLUMNS,
          selectedTable: { id: TABLE.id, table_name: TABLE.table_name },
          selectedTableData: rows,
          totalRecords,
          setColumns: () => {},
          setConfigurations: () => {},
          setForeignKeys: () => {},
          foreignKeys: [],
          configurations: {},
          getConfigurationProperty: (_header: string, _property: string, fallback: unknown) => fallback,
          handleRefetchQuery: () => {},
          rowsLoading: false,
          canEditTjdb: true,
          canEditSchema: false,
        } as unknown as React.ContextType<typeof TooljetDatabaseContext>
      }
    >
      <Table />
    </TooljetDatabaseContext.Provider>
  );

  // A draft with something typed in it, on a page that has a row.
  const openDraft = async () => {
    const view = render(ui([{ id: 1, title: 'one' }]));
    await userEvent.click(await screen.findByRole('button', { name: 'Add row' }));
    await userEvent.type(await screen.findByRole('textbox', { name: 'title' }), 'draft');
    return view;
  };

  const filterBy = (title: string) =>
    act(() =>
      useTjdbStore.getState().actions.setQueryFilters({ 0: { column: 'title', operator: 'eq', value: title } })
    );

  it('keeps the inline draft when a filter matches no row', async () => {
    const { rerender } = await openDraft();

    filterBy('nothing');
    rerender(ui([]));

    expect(await screen.findByRole('textbox', { name: 'title' })).toHaveValue('draft');
  });

  it('keeps the inline draft when the last row of a page is deleted but the table has more', async () => {
    const { rerender } = await openDraft();

    rerender(ui([], 25));

    expect(await screen.findByRole('textbox', { name: 'title' })).toHaveValue('draft');
  });

  it('shows no add row for a table that has no rows at all', async () => {
    const { rerender } = await openDraft();

    rerender(ui([]));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Add row' })).not.toBeInTheDocument());
    expect(screen.queryByRole('textbox', { name: 'title' })).not.toBeInTheDocument();
  });
});
