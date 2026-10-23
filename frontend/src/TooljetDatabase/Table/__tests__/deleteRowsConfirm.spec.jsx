// Deleting rows is irreversible, so it asks first - in ToolJet's own confirm dialog, like every other
// destructive TJDB action, not the browser's native confirm().
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import Table from '@/TooljetDatabase/Table';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }) =>
      children
);

const COLUMNS = [
  {
    Header: 'id',
    accessor: 'id',
    dataType: 'integer',
    constraints_type: { is_primary_key: true, is_not_null: true, is_unique: true },
  },
];

function renderTable(deleteRequests) {
  server.use(
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableName', () =>
      HttpResponse.json({ result: { columns: [], foreign_keys: [], configurations: {} } })
    ),
    http.get('*/tooljet-db/proxy/:tableId', () => HttpResponse.json([], { headers: { 'content-range': '*/0' } })),
    http.delete('*/tooljet-db/proxy/:tableId', ({ request }) => {
      deleteRequests.push(new URL(request.url).searchParams.get('id'));
      return HttpResponse.json([]);
    })
  );
  return render(
    <TooljetDatabaseContext.Provider
      value={{
        organizationId: 'org-1',
        tables: [],
        columns: COLUMNS,
        selectedTable: { id: 'table-1', table_name: 'orders' },
        selectedTableData: [{ id: 7 }],
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
        canEditSchema: true,
      }}
    >
      <Table collapseSidebar={false} />
    </TooljetDatabaseContext.Provider>
  );
}

async function selectRowAndDelete(container) {
  const rowCheckbox = await waitFor(() => {
    const checkbox = container.querySelectorAll('tbody input[type="checkbox"]')[0];
    expect(checkbox).toBeTruthy();
    return checkbox;
  });
  await userEvent.click(rowCheckbox);
  await userEvent.click(container.querySelector('[data-cy="delete-row-records-button"]'));
}

describe('Deleting table rows', () => {
  beforeEach(() => {
    window.confirm = jest.fn(() => true);
  });

  test('should ask in the confirm dialog and delete nothing until confirmed', async () => {
    const deleteRequests = [];
    const { container } = renderTable(deleteRequests);

    await selectRowAndDelete(container);

    expect(await screen.findByText('Are you sure you want to delete the selected rows?')).toBeInTheDocument();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(deleteRequests).toEqual([]);
  });

  test('should delete the selected rows once confirmed', async () => {
    const deleteRequests = [];
    const { container } = renderTable(deleteRequests);

    await selectRowAndDelete(container);
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteRequests).toEqual(['in.(7)']));
  });
});
