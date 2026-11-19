import React from 'react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import '@/test/setupMsw';
import { server } from '@/test/msw/server';

import type { ListResponse } from '../../dummyData/types';
import { reorderPinnedInPages, useReorderPinsInfinite } from '../hooks/useReorderPinsInfinite';
import { makeApp, makeFolder, makePage } from './fixtures';

jest.mock('react-hot-toast', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

const KEY = ['appsV2', { appType: 'front-end', pageSize: 2 }, 'infinite'];
const idsOf = (data?: InfiniteData<ListResponse>) => data?.pages.map((p) => p.items.map((i) => i.id));

// Pins span the page boundary: [p1 p2 | p3 f1].
const seed = (): InfiniteData<ListResponse> => ({
  pageParams: [1, 2],
  pages: [
    makePage([makeApp('p1', { pinned: true }), makeApp('p2', { pinned: true })], { page_size: 2, total: 4 }),
    makePage([makeApp('p3', { pinned: true }), makeFolder('f1')], { page: 2, page_size: 2, total: 4 }),
  ],
});

describe('reorderPinnedInPages', () => {
  test('moves a pin across a page boundary and keeps each page its size', () => {
    expect(idsOf(reorderPinnedInPages(seed(), 0, 2))).toEqual([
      ['p2', 'p3'],
      ['p1', 'f1'],
    ]);
  });

  test('leaves unpinned rows where they were', () => {
    expect(idsOf(reorderPinnedInPages(seed(), 2, 0))).toEqual([
      ['p3', 'p1'],
      ['p2', 'f1'],
    ]);
  });
});

describe('useReorderPinsInfinite', () => {
  const setup = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    queryClient.setQueryData(KEY, seed());
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useReorderPinsInfinite(), { wrapper });
    return { queryClient, result };
  };

  test('rewrites the cache at once and sends the full pin order', async () => {
    let body: unknown;
    server.use(
      http.put('http://localhost:3000/api/v2/pins/order', async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
      http.get('http://localhost:3000/api/v2/apps', () => HttpResponse.json(seed().pages[0]))
    );
    const { queryClient, result } = setup();

    act(() => result.current.mutate({ appType: 'front-end', queryKey: KEY, fromIndex: 0, toIndex: 2 }));

    await waitFor(() =>
      expect(idsOf(queryClient.getQueryData(KEY))).toEqual([
        ['p2', 'p3'],
        ['p1', 'f1'],
      ])
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(body).toMatchObject({
      type: 'front-end',
      items: [
        { resource_type: 'app', resource_id: 'p2' },
        { resource_type: 'app', resource_id: 'p3' },
        { resource_type: 'app', resource_id: 'p1' },
      ],
    });
  });

  test('restores the previous order when the request fails', async () => {
    server.use(
      http.put('http://localhost:3000/api/v2/pins/order', () => HttpResponse.json({ message: 'no' }, { status: 400 })),
      http.get('http://localhost:3000/api/v2/apps', () => HttpResponse.json(seed().pages[0]))
    );
    const { queryClient, result } = setup();

    act(() => result.current.mutate({ appType: 'front-end', queryKey: KEY, fromIndex: 0, toIndex: 2 }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(idsOf(queryClient.getQueryData(KEY))).toEqual([
      ['p1', 'p2'],
      ['p3', 'f1'],
    ]);
  });
});
