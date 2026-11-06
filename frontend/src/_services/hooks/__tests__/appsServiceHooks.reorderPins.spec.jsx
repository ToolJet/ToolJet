import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';

import { server } from '@/test/msw/server';
import { useReorderPins } from '../appsServiceHooks';

jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const API = 'http://localhost:3000/api';
const ROOT_QUERY_KEY = ['appsV2', { appType: 'front-end', pageNo: 1 }];

const pinnedApp = { kind: 'app', id: 'app-1', name: 'Invoices', pinned: true };
const pinnedFolder = { kind: 'folder', id: 'folder-1', name: 'Onboarding', pinned: true };
const strayApp = { kind: 'app', id: 'app-2', name: 'Fleet', pinned: false };
const ROOT_PAGE = { items: [pinnedApp, pinnedFolder, strayApp], total: 3 };
const REORDERED = [pinnedFolder, pinnedApp, strayApp];

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  queryClient.setQueryData(ROOT_QUERY_KEY, ROOT_PAGE);
  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useReorderPins(), { wrapper });
  const reorder = () =>
    act(() => result.current.mutate({ appType: 'front-end', rootQueryKey: ROOT_QUERY_KEY, items: REORDERED }));
  const rootItemIds = () => queryClient.getQueryData(ROOT_QUERY_KEY).items.map((item) => item.id);
  return { result, reorder, rootItemIds };
}

describe('useReorderPins', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sends every pin, in the new order, with the app type', async () => {
    let body;
    server.use(
      http.put(`${API}/v2/pins/order`, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      })
    );
    const { result, reorder } = setup();

    reorder();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(body).toMatchObject({
      type: 'front-end',
      items: [
        { resource_type: 'folder', resource_id: 'folder-1' },
        { resource_type: 'app', resource_id: 'app-1' },
      ],
    });
  });

  test('shows the new order before the server answers', async () => {
    let respond;
    server.use(http.put(`${API}/v2/pins/order`, () => new Promise((resolve) => (respond = resolve))));
    const { reorder, rootItemIds } = setup();

    reorder();

    await waitFor(() => expect(rootItemIds()).toEqual(['folder-1', 'app-1', 'app-2']));
    respond(new HttpResponse(null, { status: 204 }));
  });

  test('restores the previous order and shows the error when the server rejects the reorder', async () => {
    server.use(
      http.put(`${API}/v2/pins/order`, () =>
        HttpResponse.json({ message: 'Pinned items changed; refetch and retry' }, { status: 400 })
      )
    );
    const { result, reorder, rootItemIds } = setup();

    reorder();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(rootItemIds()).toEqual(['app-1', 'folder-1', 'app-2']);
    expect(toast.error).toHaveBeenCalledWith('Pinned items changed; refetch and retry', expect.anything());
  });
});
