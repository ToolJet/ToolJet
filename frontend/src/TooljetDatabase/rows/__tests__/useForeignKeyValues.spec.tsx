import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/test/msw/server';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { useForeignKeyValues } from '../useForeignKeyValues';

// The referenced column holds `total` ids; the server pages them by `limit` and `offset`.
const requests: URLSearchParams[] = [];
const serveIds = (total: number) =>
  server.use(
    http.get('*/tooljet-db/proxy/:tableId', ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      const offset = Number(params.get('offset') ?? 0);
      const limit = Number(params.get('limit') ?? 1000);
      const count = Math.max(0, Math.min(limit, total - offset));
      return HttpResponse.json(Array.from({ length: count }, (_, index) => ({ id: offset + index + 1 })));
    })
  );

const renderValues = (search = '') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useForeignKeyValues({ tableId: 'customers', column: 'id', isTextColumn: false, search }), {
    wrapper,
  });
};

beforeEach(() => {
  requests.length = 0;
  act(() => useTjdbStore.setState({ selectedEnvironment: { id: 'env-development', priority: 1 } }));
});

describe('useForeignKeyValues', () => {
  it('reads the first 50 values, in order, and says there are more', async () => {
    serveIds(120);
    const { result } = renderValues();

    await waitFor(() => expect(result.current.values).toHaveLength(50));
    expect(requests[0].get('limit')).toBe('50');
    expect(requests[0].get('offset')).toBe('0');
    expect(requests[0].get('order')).toBe('id.asc');
    expect(result.current.hasNextPage).toBe(true);
  });

  it('appends the next 50 on fetchNextPage and stops after a short page', async () => {
    serveIds(120);
    const { result } = renderValues();
    await waitFor(() => expect(result.current.values).toHaveLength(50));

    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.values).toHaveLength(100));
    expect(requests[1].get('offset')).toBe('50');

    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.values).toHaveLength(120));
    expect(requests[2].get('offset')).toBe('100');
    expect(result.current.values[119]).toBe('120');
    expect(result.current.hasNextPage).toBe(false);
  });

  it('has no next page when everything fits in the first', async () => {
    serveIds(3);
    const { result } = renderValues();

    await waitFor(() => expect(result.current.values).toEqual(['1', '2', '3']));
    expect(result.current.hasNextPage).toBe(false);
  });
});
