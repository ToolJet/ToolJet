// The tables quota is one request per change in the NUMBER of tables, not per new `tables` array.
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderHook, waitFor } from '@/test/test-utils';
import { useTablesLimit } from '../useTablesLimit';

function serve(tablesCount = { current: 1, total: 10 }) {
  const calls = { count: 0 };
  server.use(
    http.get('*/tooljet-db/tables/limits/:organizationId', () => {
      calls.count += 1;
      return HttpResponse.json({ tablesCount });
    })
  );
  return calls;
}

describe('useTablesLimit', () => {
  it('asks nothing until it is enabled', async () => {
    const calls = serve();
    const { rerender } = renderHook(({ enabled }) => useTablesLimit(0, enabled), { initialProps: { enabled: false } });

    expect(calls.count).toBe(0);
    rerender({ enabled: true });

    await waitFor(() => expect(calls.count).toBe(1));
  });

  it('asks again only when the number of tables changes', async () => {
    const calls = serve();
    const { rerender } = renderHook(({ count }) => useTablesLimit(count), { initialProps: { count: 3 } });
    await waitFor(() => expect(calls.count).toBe(1));

    rerender({ count: 3 });
    rerender({ count: 3 });
    expect(calls.count).toBe(1);

    rerender({ count: 4 });
    await waitFor(() => expect(calls.count).toBe(2));
  });

  it('reports the limit as reached only when every table is used', async () => {
    serve({ current: 10, total: 10 });
    const { result } = renderHook(() => useTablesLimit(10));

    await waitFor(() => expect(result.current.reached).toBe(true));
  });
});
