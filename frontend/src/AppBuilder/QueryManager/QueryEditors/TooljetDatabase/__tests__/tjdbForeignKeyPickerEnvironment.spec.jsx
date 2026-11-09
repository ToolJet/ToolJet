// The foreign-key value picker lists rows of the referenced table. In the App Builder query editor
// those rows must come from the app's selected environment; on the TJDB dashboard (no editor
// environment in context) they come from the dashboard's own selection.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, waitFor, act } from '@/test/test-utils';
import { TooljetDatabaseContext } from '@/TooljetDatabase/context';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import SelectBox from '../SelectBox';

const STAGING = { id: 'env-staging', name: 'staging', priority: 2 };
const PRODUCTION = { id: 'env-production', name: 'production', priority: 3 };
const FOREIGN_KEYS = [
  {
    column_names: ['customer_id'],
    referenced_table_id: 'customers-table',
    referenced_table_name: 'customers',
    referenced_column_names: ['id'],
  },
];

function serveReferencedRows(requestedEnvironments) {
  server.use(
    http.get('*/tooljet-db/proxy/customers-table', ({ request }) => {
      requestedEnvironments.push(new URL(request.url).searchParams.get('environment_id'));
      return HttpResponse.json([{ id: 1 }], { headers: { 'content-range': '0-0/1' } });
    })
  );
}

const renderPicker = (contextValue) =>
  render(
    <TooljetDatabaseContext.Provider value={contextValue}>
      <SelectBox
        options={[]}
        scrollEventForColumnValues
        foreignKeys={FOREIGN_KEYS}
        cellColumnName="customer_id"
        organizationId="org-1"
        setReferencedColumnDetails={() => {}}
        setIsInitialForeignKeyDataLoaded={() => {}}
        setPageNumber={() => {}}
        setTotalRecords={() => {}}
        pageNumber={1}
        totalRecords={0}
      />
    </TooljetDatabaseContext.Provider>
  );

describe('TJDB foreign key value picker environment', () => {
  test('should read referenced rows from the app builder selected environment', async () => {
    const requestedEnvironments = [];
    serveReferencedRows(requestedEnvironments);

    renderPicker({ environmentId: STAGING.id });

    await waitFor(() => expect(requestedEnvironments).toEqual([STAGING.id]));
  });

  test('should read referenced rows from the dashboard selected environment outside the editor', async () => {
    const requestedEnvironments = [];
    serveReferencedRows(requestedEnvironments);
    act(() => useTjdbStore.setState({ selectedEnvironment: PRODUCTION }));

    renderPicker({});

    await waitFor(() => expect(requestedEnvironments).toEqual([PRODUCTION.id]));
  });
});
