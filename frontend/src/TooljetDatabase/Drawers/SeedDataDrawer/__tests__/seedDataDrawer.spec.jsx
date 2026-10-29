// Seeding with SQL: a failure always reaches the user as readable text, and a successful run
// refreshes the grid the way every other TJDB mutation does - same filters, sort and page.
import '@/test/setupMsw';
import React, { useState } from 'react';
import { http, HttpResponse } from 'msw';
import { toast } from 'react-hot-toast';
import { server } from '@/test/msw/server';
import { render, screen, waitFor, act } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import { usePostgrestQueryBuilder } from '@/TooljetDatabase/usePostgrestQueryBuilder';
import SeedDataDrawer from '@/TooljetDatabase/Drawers/SeedDataDrawer';

jest.mock('react-hot-toast', () => {
  const toast = jest.fn();
  toast.success = jest.fn();
  toast.error = jest.fn();
  return { __esModule: true, default: toast, toast };
});

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }) =>
      children
);

// CodeMirror is an external editor; a textarea with the same value/onChange contract stands in for it.
jest.mock('@/TooljetDatabase/_components/SqlEditor', () => ({ value, onChange }) => (
  <textarea aria-label="sql" value={value} onChange={(e) => onChange(e.target.value)} />
));

const SELECTED_TABLE = { id: 'table-1', table_name: 'orders' };

// The real row-fetching hook, wired exactly as TooljetDatabase/index.jsx wires it.
function Harness() {
  const [selectedTableData, setSelectedTableData] = useState([{ id: 1 }, { id: 2 }]);
  const [, setTotalRecords] = useState(0);
  const { handleRefetchQuery } = usePostgrestQueryBuilder({
    organizationId: 'org-1',
    selectedTable: SELECTED_TABLE,
    setSelectedTableData,
    setTotalRecords,
    setLoadingState: () => {},
  });

  return (
    <TooljetDatabaseContext.Provider
      value={{
        organizationId: 'org-1',
        selectedTable: SELECTED_TABLE,
        columns: [],
        setSelectedTableData,
        setTotalRecords,
        handleRefetchQuery,
      }}
    >
      <div data-testid="row-count">{selectedTableData.length}</div>
      <SeedDataDrawer isSeedDataDrawerOpen setIsSeedDataDrawerOpen={() => {}} />
    </TooljetDatabaseContext.Provider>
  );
}

async function runSeedSql() {
  await userEvent.type(await screen.findByLabelText('sql'), 'INSERT INTO {{self}} VALUES (1)');
  await userEvent.click(screen.getByRole('button', { name: 'Seed' }));
}

function serveSql(result) {
  server.use(
    http.post('*/tooljet-db/organizations/:organizationId/table/:tableId/sql', () => HttpResponse.json({ result }))
  );
}

describe('SeedDataDrawer', () => {
  beforeEach(() => {
    act(() =>
      useTjdbStore.setState({ selectedEnvironment: { id: 'env-development', name: 'development', priority: 1 } })
    );
  });

  test('should fall back to a generic message when a failed run carries no error text', async () => {
    serveSql({ status: 'failed' });

    render(<Harness />);
    await runSeedSql();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to run SQL', expect.anything()));
  });

  test('should empty the grid when the seed run leaves the table with no rows', async () => {
    serveSql({ status: 'ok' });
    server.use(
      http.get('*/tooljet-db/proxy/:tableId', () => HttpResponse.json([], { headers: { 'content-range': '*/0' } }))
    );

    render(<Harness />);
    expect(screen.getByTestId('row-count')).toHaveTextContent('2');
    await runSeedSql();

    await waitFor(() => expect(screen.getByTestId('row-count')).toHaveTextContent('0'));
  });

  test('should refresh the grid with the active filter and page', async () => {
    serveSql({ status: 'ok' });
    const proxyRequests = [];
    server.use(
      http.get('*/tooljet-db/proxy/:tableId', ({ request }) => {
        proxyRequests.push(new URL(request.url).searchParams);
        return HttpResponse.json([{ id: 11 }], { headers: { 'content-range': '10-10/11' } });
      })
    );
    act(() =>
      useTjdbStore.setState({
        queryFilters: { 0: { column: 'status', operator: 'eq', value: 'open' } },
        pageSize: 10,
        pageCount: 2,
      })
    );

    render(<Harness />);
    await runSeedSql();

    await waitFor(() => expect(proxyRequests).toHaveLength(1));
    expect(proxyRequests[0].get('status')).toBe('eq.open');
    expect(proxyRequests[0].get('limit')).toBe('10');
    expect(proxyRequests[0].get('offset')).toBe('10');
  });
});
