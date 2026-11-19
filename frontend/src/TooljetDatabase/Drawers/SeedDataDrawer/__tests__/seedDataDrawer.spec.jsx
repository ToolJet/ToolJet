// Seeding with SQL: a failure always reaches the user as readable text, and a successful run
// refreshes the grid the way every other TJDB mutation does - same filters, sort and page.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { toast } from 'react-hot-toast';
import { server } from '@/test/msw/server';
import { render, screen, waitFor, act } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { DEFAULT_VIEW, useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import { useTableRows, useInvalidateTableRows } from '@/TooljetDatabase/rows/useTableRows';
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

// The real rows query, wired exactly as TooljetDatabase/index.jsx wires it.
function Harness() {
  const { rows: selectedTableData } = useTableRows(SELECTED_TABLE.id);
  const handleRefetchQuery = useInvalidateTableRows();

  return (
    <TooljetDatabaseContext.Provider
      value={{
        organizationId: 'org-1',
        selectedTable: SELECTED_TABLE,
        columns: [],
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
      useTjdbStore.setState({
        selectedEnvironment: { id: 'env-development', name: 'development', priority: 1 },
        viewTableId: SELECTED_TABLE.id,
      })
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
    let rows = [{ id: 1 }, { id: 2 }];
    server.use(
      http.get('*/tooljet-db/proxy/:tableId', () =>
        HttpResponse.json(rows, { headers: { 'content-range': `*/${rows.length}` } })
      )
    );

    render(<Harness />);
    await waitFor(() => expect(screen.getByTestId('row-count')).toHaveTextContent('2'));
    rows = [];
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
        views: {
          [SELECTED_TABLE.id]: {
            ...DEFAULT_VIEW,
            queryFilters: { 0: { column: 'status', operator: 'eq', value: 'open' } },
            pageSize: 10,
            pageCount: 2,
          },
        },
      })
    );

    render(<Harness />);
    await waitFor(() => expect(proxyRequests).toHaveLength(1));
    await runSeedSql();

    // The first read is the grid opening; the second is the refresh after the seed run.
    await waitFor(() => expect(proxyRequests).toHaveLength(2));
    expect(proxyRequests[1].get('status')).toBe('eq.open');
    expect(proxyRequests[1].get('limit')).toBe('10');
    expect(proxyRequests[1].get('offset')).toBe('10');
  });
});
