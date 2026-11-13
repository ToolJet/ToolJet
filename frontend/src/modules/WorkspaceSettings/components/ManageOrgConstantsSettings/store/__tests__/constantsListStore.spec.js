import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { useConstantsListStore, ITEMS_PER_PAGE } from '../constantsListStore';

const BASE = 'http://localhost:3000/api/v2/organization-constants';
const PARAMS = { environmentId: 'env-1', type: 'Global', sort: 'name_asc', source: ['workspace', 'env'] };

const item = (id) => ({ kind: 'constant', id, name: id.toUpperCase(), type: 'Global', source: 'workspace' });
const listPage = (items, extra = {}) => ({
  items,
  page: 1,
  page_size: ITEMS_PER_PAGE,
  total: items.length,
  counts: { secrets: 0, globals: items.length },
  ...extra,
});

const store = () => useConstantsListStore.getState();

// Hands each list request a promise the test resolves, so responses can arrive in any order.
function deferredListHandler() {
  const pending = [];
  server.use(
    http.get(BASE, ({ request }) => {
      const url = new URL(request.url);
      return new Promise((resolve) => pending.push({ url, respond: (body) => resolve(HttpResponse.json(body)) }));
    })
  );
  return pending;
}

const waitFor = async (predicate) => {
  for (let i = 0; i < 50 && !predicate(); i++) await new Promise((r) => setTimeout(r, 5));
  expect(predicate()).toBe(true);
};

describe('constantsListStore', () => {
  test('starts idle on page 1 with no search', () => {
    expect(store().query).toEqual({ page: 1, searchKey: '' });
    expect(store().root).toEqual({ items: [], meta: null, status: 'idle' });
    expect(store().rowSelection).toEqual({});
  });

  test('fetchList sends the store query with the caller filters and moves loading -> success', async () => {
    const pending = deferredListHandler();
    store().setSearch('api');
    store().setPage(3);

    const done = store().fetchList(PARAMS);
    expect(store().root.status).toBe('loading');
    await waitFor(() => pending.length === 1);

    expect(Object.fromEntries(pending[0].url.searchParams)).toEqual({
      environment_id: 'env-1',
      type: 'Global',
      search: 'api',
      source: 'workspace,env',
      sort: 'name_asc',
      page: '3',
      per_page: String(ITEMS_PER_PAGE),
    });

    pending[0].respond(listPage([item('a')], { page: 3, total: 101 }));
    await done;

    expect(store().root.status).toBe('success');
    expect(store().root.items).toEqual([item('a')]);
    expect(store().root.meta).toEqual({
      page: 3,
      page_size: ITEMS_PER_PAGE,
      total: 101,
      counts: { secrets: 0, globals: 1 },
    });
  });

  test('a failed fetch sets status error', async () => {
    server.use(http.get(BASE, () => HttpResponse.json({ message: 'boom' }, { status: 500 })));

    await store().fetchList(PARAMS);

    expect(store().root.status).toBe('error');
  });

  describe('a page past the end', () => {
    // Rows can disappear elsewhere between visits, leaving a remembered page number with nothing on it.
    const serve = (total) => {
      const requests = [];
      server.use(
        http.get(BASE, ({ request }) => {
          const url = new URL(request.url);
          requests.push(url);
          const page = Number(url.searchParams.get('page'));
          const lastPage = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
          const rows = page <= lastPage && total > 0 ? [item(`p${page}`)] : [];
          return HttpResponse.json(listPage(rows, { page, total }));
        })
      );
      return requests;
    };

    test('falls back to the last page that has rows', async () => {
      const requests = serve(120);
      store().setPage(5);

      await store().fetchList(PARAMS);

      expect(requests.map((url) => url.searchParams.get('page'))).toEqual(['5', '3']);
      expect(store().query.page).toBe(3);
      expect(store().root.items.map(({ id }) => id)).toEqual(['p3']);
      expect(store().root.status).toBe('success');
    });

    test('falls back to page 1 when nothing is left', async () => {
      const requests = serve(0);
      store().setPage(2);

      await store().fetchList(PARAMS);

      expect(requests.map((url) => url.searchParams.get('page'))).toEqual(['2', '1']);
      expect(store().query.page).toBe(1);
      expect(store().root.status).toBe('success');
      expect(store().root.meta.total).toBe(0);
    });

    test('leaves a page that exists alone', async () => {
      const requests = serve(120);
      store().setPage(3);

      await store().fetchList(PARAMS);

      expect(requests).toHaveLength(1);
      expect(store().query.page).toBe(3);
    });
  });

  test('an older response never overwrites a newer one', async () => {
    const pending = deferredListHandler();

    const first = store().fetchList({ ...PARAMS, type: 'Global' });
    await waitFor(() => pending.length === 1);
    const second = store().fetchList({ ...PARAMS, type: 'Secret' });
    await waitFor(() => pending.length === 2);

    pending[1].respond(listPage([item('secret')]));
    await second;
    pending[0].respond(listPage([item('global')]));
    await first;

    expect(store().root.items).toEqual([item('secret')]);
    expect(store().root.status).toBe('success');
  });

  test('setSearch and setPage reset what depends on them', () => {
    store().setPage(4);
    store().setRowSelection({ a: true });

    store().setSearch('db');
    expect(store().query).toEqual({ page: 1, searchKey: 'db' });
    expect(store().rowSelection).toEqual({});

    store().setRowSelection({ a: true });
    store().setPage(2);
    expect(store().query.page).toBe(2);
    expect(store().rowSelection).toEqual({});
  });

  test('setRowSelection accepts a value or an updater, clearSelection empties it', () => {
    store().setRowSelection({ a: true });
    store().setRowSelection((current) => ({ ...current, b: true }));
    expect(store().rowSelection).toEqual({ a: true, b: true });

    store().clearSelection();
    expect(store().rowSelection).toEqual({});
  });

  test('removeItems drops the rows, their selection and lowers the total', async () => {
    server.use(http.get(BASE, () => HttpResponse.json(listPage([item('a'), item('b'), item('c')]))));
    await store().fetchList(PARAMS);
    store().setRowSelection({ a: true, b: true });

    store().removeItems(['a', 'missing']);

    expect(store().root.items.map(({ id }) => id)).toEqual(['b', 'c']);
    expect(store().rowSelection).toEqual({ b: true });
    expect(store().root.meta.total).toBe(2);
  });

  describe('pins', () => {
    const named = (id, name, extra = {}) => ({ ...item(id), name, ...extra });
    const ITEMS = [named('a', 'Alpha'), named('b', 'Bravo'), named('c', 'Charlie'), named('d', 'Delta')];

    // Seeds the loaded page the pin actions compare against.
    const load = (items = ITEMS) => useConstantsListStore.setState({ root: { items, meta: null, status: 'success' } });

    test('starts with no pins for either tab', () => {
      expect(store().pins).toEqual({ Secret: [], Global: [] });
    });

    test('pinConstants inserts each id at the slot the current sort gives it', () => {
      load();
      store().pinConstants('Global', ['c', 'a'], 'name_asc');
      expect(store().pins.Global).toEqual(['a', 'c']);

      store().pinConstants('Global', ['b'], 'name_asc');
      expect(store().pins.Global).toEqual(['a', 'b', 'c']);

      store().pinConstants('Global', ['d'], 'name_desc');
      expect(store().pins.Global).toEqual(['d', 'a', 'b', 'c']);
    });

    test('pinConstants keeps each tab separate', () => {
      load();
      store().pinConstants('Secret', ['a'], 'name_asc');
      expect(store().pins).toEqual({ Secret: ['a'], Global: [] });
    });

    test('pinConstants is idempotent', () => {
      load();
      store().pinConstants('Global', ['b'], 'name_asc');
      store().pinConstants('Global', ['b', 'b'], 'name_asc');
      expect(store().pins.Global).toEqual(['b']);
    });

    test('pinConstants pins environment constants too, and skips ids that are not on the page', () => {
      load([...ITEMS, named('env:Global:X', 'X', { source: 'env' })]);
      store().pinConstants('Global', ['env:Global:X', 'missing', 'a'], 'name_asc');
      expect(store().pins.Global).toEqual(['a', 'env:Global:X']);
    });

    test('unpinConstants removes the ids and ignores unknown ones', () => {
      load();
      store().pinConstants('Global', ['a', 'b', 'c'], 'name_asc');
      store().unpinConstants('Global', ['b', 'nope']);
      expect(store().pins.Global).toEqual(['a', 'c']);
    });

    test('movePin reorders among the loaded pins', () => {
      load();
      store().pinConstants('Global', ['a', 'b', 'c'], 'name_asc');
      store().movePin('Global', 'a', 2);
      expect(store().pins.Global).toEqual(['b', 'c', 'a']);
    });

    test('removeItems prunes the removed ids from every tab', () => {
      useConstantsListStore.setState({ pins: { Secret: ['a', 's'], Global: ['a', 'b'] } });

      store().removeItems(['a']);

      expect(store().pins).toEqual({ Secret: ['s'], Global: ['b'] });
    });
  });

  describe('mutations', () => {
    const detail = { id: 'new', name: 'NEW', type: 'Global', values: [] };

    // Serves the list from `rows` and counts list requests, so a refetch is observable.
    function listFrom(rows) {
      const requests = [];
      server.use(
        http.get(BASE, ({ request }) => {
          requests.push(new URL(request.url));
          // A total that reaches the requested page, so none of these lists is past its end.
          return HttpResponse.json(listPage(rows(), { total: 3 * ITEMS_PER_PAGE }));
        })
      );
      return requests;
    }

    test('createConstant posts, refetches the current page and returns the detail', async () => {
      let rows = [item('a')];
      const requests = listFrom(() => rows);
      server.use(
        http.post(BASE, () => {
          rows = [item('a'), item('new')];
          return HttpResponse.json(detail, { status: 201 });
        })
      );
      store().setPage(2);
      await store().fetchList(PARAMS);

      await expect(store().createConstant({ name: 'NEW', type: 'Global', values: [] })).resolves.toEqual(detail);

      expect(requests).toHaveLength(2);
      expect(requests[1].searchParams.get('page')).toBe('2');
      expect(requests[1].searchParams.get('type')).toBe('Global');
      expect(store().root.items.map(({ id }) => id)).toEqual(['a', 'new']);
    });

    test('createConstant rethrows a 409 and does not refetch', async () => {
      const requests = listFrom(() => [item('a')]);
      server.use(http.post(BASE, () => HttpResponse.json({ message: 'Constant already exists' }, { status: 409 })));
      await store().fetchList(PARAMS);

      await expect(store().createConstant({ name: 'A', type: 'Global', values: [] })).rejects.toMatchObject({
        statusCode: 409,
      });
      expect(requests).toHaveLength(1);
      expect(store().root.status).toBe('success');
    });

    test('updateConstant patches and refetches', async () => {
      let body;
      const requests = listFrom(() => [item('a')]);
      server.use(
        http.patch(`${BASE}/a`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ ...detail, id: 'a' });
        })
      );
      await store().fetchList(PARAMS);

      const payload = { values: [{ environment_id: 'env-1', value: 'v2' }] };
      await expect(store().updateConstant('a', payload)).resolves.toMatchObject({ id: 'a' });

      expect(body).toEqual(payload);
      expect(requests).toHaveLength(2);
    });

    test('updateConstant rethrows errors', async () => {
      listFrom(() => [item('a')]);
      server.use(http.patch(`${BASE}/a`, () => HttpResponse.json({ message: 'nope' }, { status: 403 })));
      await store().fetchList(PARAMS);

      await expect(store().updateConstant('a', { values: [] })).rejects.toMatchObject({ statusCode: 403 });
    });

    test('bulkDeleteConstants deletes, clears the deleted rows from the selection and refetches', async () => {
      let rows = [item('a'), item('b')];
      const requests = listFrom(() => rows);
      server.use(
        http.post(`${BASE}/bulk-delete`, () => {
          rows = [item('b')];
          return HttpResponse.json({ deleted_ids: ['a'], skipped_ids: ['env:Global:B'] });
        })
      );
      await store().fetchList(PARAMS);
      store().setRowSelection({ a: true, 'env:Global:B': true });

      await expect(store().bulkDeleteConstants(['a', 'env:Global:B'])).resolves.toEqual({
        deleted_ids: ['a'],
        skipped_ids: ['env:Global:B'],
      });

      expect(store().rowSelection).toEqual({ 'env:Global:B': true });
      expect(requests).toHaveLength(2);
      expect(store().root.items.map(({ id }) => id)).toEqual(['b']);
    });

    test('bulkDeleteConstants steps back a page when it empties the current one', async () => {
      const requests = [];
      server.use(
        http.get(BASE, ({ request }) => {
          const url = new URL(request.url);
          requests.push(url);
          const page = Number(url.searchParams.get('page'));
          // Page 3 holds one row until it is deleted; page 2 is always full.
          const rows = page === 3 ? (requests.length === 1 ? [item('z')] : []) : [item('y')];
          // Two full pages once the last row of page 3 is deleted.
          return HttpResponse.json(listPage(rows, { page, total: page === 3 && rows.length ? 101 : 100 }));
        }),
        http.post(`${BASE}/bulk-delete`, () => HttpResponse.json({ deleted_ids: ['z'], skipped_ids: [] }))
      );
      store().setPage(3);
      await store().fetchList(PARAMS);

      await store().bulkDeleteConstants(['z']);

      expect(store().query.page).toBe(2);
      expect(requests.map((url) => url.searchParams.get('page'))).toEqual(['3', '3', '2']);
      expect(store().root.items.map(({ id }) => id)).toEqual(['y']);
    });

    test('bulkDeleteConstants rethrows errors', async () => {
      listFrom(() => [item('a')]);
      server.use(http.post(`${BASE}/bulk-delete`, () => HttpResponse.json({ message: 'nope' }, { status: 500 })));
      await store().fetchList(PARAMS);

      await expect(store().bulkDeleteConstants(['a'])).rejects.toMatchObject({ statusCode: 500 });
    });
  });
});
