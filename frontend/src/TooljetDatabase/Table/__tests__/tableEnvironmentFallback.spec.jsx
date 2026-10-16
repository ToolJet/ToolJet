// Opening a table that the viewed environment does not have cannot load there - the server answers
// "not in <environment>". The table view falls back to Development, where every table exists, instead
// of requesting data that is never coming.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, waitFor, act } from '@/test/test-utils';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import Table from '@/TooljetDatabase/Table';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }) =>
      children
);

const DEVELOPMENT = { id: 'env-development', name: 'development', priority: 1 };
const STAGING = { id: 'env-staging', name: 'staging', priority: 2 };

const COLUMNS = [
  {
    Header: 'id',
    accessor: 'id',
    dataType: 'integer',
    constraints_type: { is_primary_key: true, is_not_null: true, is_unique: true },
  },
];

const tableIn = (...environmentsWithRelation) => ({
  id: 'table-1',
  table_name: 'orders',
  environments: [DEVELOPMENT, STAGING].map((env) => ({
    environment_id: env.id,
    has_relation: environmentsWithRelation.includes(env),
  })),
});

function renderTable(table) {
  const metadataEnvironments = [];
  server.use(
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableName', ({ request }) => {
      metadataEnvironments.push(new URL(request.url).searchParams.get('environment_id'));
      return HttpResponse.json({ result: { columns: [], foreign_keys: [], configurations: {} } });
    }),
    http.get('*/tooljet-db/proxy/:tableId', () => HttpResponse.json([], { headers: { 'content-range': '*/0' } }))
  );
  render(
    <TooljetDatabaseContext.Provider
      value={{
        organizationId: 'org-1',
        tables: [table],
        columns: COLUMNS,
        selectedTable: { id: table.id, table_name: table.table_name },
        selectedTableData: [],
        setSelectedTableData: () => {},
        setColumns: () => {},
        setConfigurations: () => {},
        setForeignKeys: () => {},
        foreignKeys: [],
        configurations: {},
        getConfigurationProperty: (_header, _property, fallback) => fallback,
        resetAll: () => {},
        handleRefetchQuery: () => {},
        loadingState: false,
        canEditTjdb: true,
        canEditSchema: false,
      }}
    >
      <Table collapseSidebar={false} />
    </TooljetDatabaseContext.Provider>
  );
  return { metadataEnvironments };
}

describe('Table | environment fallback', () => {
  beforeEach(() => {
    act(() => useTjdbStore.setState({ environments: [DEVELOPMENT, STAGING], selectedEnvironment: STAGING }));
  });

  afterEach(() => {
    act(() => useTjdbStore.setState({ environments: [], selectedEnvironment: null }));
  });

  it('should switch to Development, without requesting the table from staging, when staging does not have it', async () => {
    const { metadataEnvironments } = renderTable(tableIn(DEVELOPMENT));

    await waitFor(() => expect(useTjdbStore.getState().selectedEnvironment.id).toBe(DEVELOPMENT.id));
    await waitFor(() => expect(metadataEnvironments).toContain(DEVELOPMENT.id));
    expect(metadataEnvironments).not.toContain(STAGING.id);
  });

  it('should stay on staging when staging has the table', async () => {
    const { metadataEnvironments } = renderTable(tableIn(DEVELOPMENT, STAGING));

    await waitFor(() => expect(metadataEnvironments).toContain(STAGING.id));
    expect(useTjdbStore.getState().selectedEnvironment.id).toBe(STAGING.id);
  });
});
