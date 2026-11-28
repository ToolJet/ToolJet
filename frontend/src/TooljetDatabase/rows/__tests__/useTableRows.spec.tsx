import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { server } from '@/test/msw/server';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { useTableRows, useInvalidateTableRows, patchCachedRow } from '../useTableRows';

jest.mock('react-hot-toast', () => {
  const toast = jest.fn() as jest.Mock & { error: jest.Mock; success: jest.Mock };
  toast.error = jest.fn();
  toast.success = jest.fn();
  return { __esModule: true, default: toast, toast };
});

const requests: URL[] = [];
const serveRows = (rows: unknown[], total: number) =>
  server.use(
    http.get('*/tooljet-db/proxy/:tableId', ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(rows, { headers: { 'content-range': `0-${rows.length - 1}/${total}` } });
    })
  );

const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderRows = (tableId: string | undefined, options?: { enabled?: boolean }) => {
  const client = newClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => ({ rows: useTableRows(tableId, options), invalidate: useInvalidateTableRows() }), {
    wrapper,
  });
};

beforeEach(() => {
  requests.length = 0;
  (toast.error as jest.Mock).mockClear();
  useTjdbStore.getState().actions.resetStore();
  useTjdbStore.setState({ selectedEnvironment: { id: 'env-staging', priority: 2 } });
  useTjdbStore.getState().actions.openTableView('table-1');
});

describe('useTableRows', () => {
  it('reads the open page of rows and the total from the content-range header', async () => {
    serveRows([{ id: 1 }, { id: 2 }], 414);

    const { result } = renderRows('table-1');

    await waitFor(() => expect(result.current.rows.rows).toEqual([{ id: 1 }, { id: 2 }]));
    expect(result.current.rows.total).toBe(414);
    expect(requests[0].searchParams.get('environment_id')).toBe('env-staging');
    expect(requests[0].searchParams.get('limit')).toBe('50');
  });

  it('refetches from page 1 when filters change in the store', async () => {
    serveRows([{ id: 1 }], 1);
    const { result } = renderRows('table-1');
    await waitFor(() => expect(result.current.rows.isLoading).toBe(false));

    act(() => {
      useTjdbStore.getState().actions.setPageCount(4);
    });
    await waitFor(() => expect(requests[requests.length - 1]?.searchParams.get('offset')).toBe('150'));

    act(() => {
      useTjdbStore.getState().actions.setQueryFilters({ 0: { column: 'tag', operator: 'eq', value: 'v1' } });
    });

    await waitFor(() => expect(requests[requests.length - 1]?.searchParams.get('tag')).toBe('eq.v1'));
    expect(requests[requests.length - 1]?.searchParams.get('offset')).toBe('0');
  });

  it('ends loading and shows the error when the read is refused', async () => {
    server.use(
      http.get('*/tooljet-db/proxy/:tableId', () =>
        HttpResponse.json({ statusCode: 403, message: 'Multi-environment is not enabled.' }, { status: 403 })
      )
    );

    const { result } = renderRows('table-1');

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(result.current.rows.isLoading).toBe(false);
    expect(result.current.rows.rows).toEqual([]);
  });

  it('sends no request while disabled', async () => {
    serveRows([{ id: 1 }], 1);

    const { result } = renderRows('table-1', { enabled: false });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requests).toHaveLength(0);
    expect(result.current.rows.isLoading).toBe(false);
  });

  it('waits for the view to be reset before reading a newly opened table', async () => {
    serveRows([{ id: 1 }], 1);
    act(() => {
      useTjdbStore.getState().actions.setQueryFilters({ 0: { column: 'only_in_table_1', operator: 'eq', value: 'x' } });
    });

    renderRows('table-2');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requests).toHaveLength(0);

    act(() => {
      useTjdbStore.getState().actions.openTableView('table-2');
    });

    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0].searchParams.has('only_in_table_1')).toBe(false);
  });

  it('refetches the same view when a write invalidates the rows', async () => {
    serveRows([{ id: 1 }], 1);
    const { result } = renderRows('table-1');
    await waitFor(() => expect(requests).toHaveLength(1));

    await act(() => result.current.invalidate());

    expect(requests).toHaveLength(2);
    expect(requests[1].search).toBe(requests[0].search);
  });
});

describe('patchCachedRow', () => {
  it('changes only the open table in the open environment, even where another table shares the primary key', () => {
    const client = newClient();
    const seed = (environmentId: string, tableId: string) =>
      client.setQueryData(['tjdb', 'rows', environmentId, tableId, 'limit=50&offset=0'], {
        rows: [{ id: 5, tag: 'old' }],
        total: 1,
      });
    seed('env-staging', 'table-1');
    seed('env-staging', 'table-2');
    seed('env-development', 'table-1');

    patchCachedRow(client, { environmentId: 'env-staging', tableId: 'table-1' }, (row) => row.id === 5, { tag: 'new' });

    const tagIn = (environmentId: string, tableId: string) =>
      client.getQueryData<{ rows: { tag: string }[] }>(['tjdb', 'rows', environmentId, tableId, 'limit=50&offset=0'])
        ?.rows[0].tag;
    expect(tagIn('env-staging', 'table-1')).toBe('new');
    expect(tagIn('env-staging', 'table-2')).toBe('old');
    expect(tagIn('env-development', 'table-1')).toBe('old');
  });
});
