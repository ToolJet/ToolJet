/**
 * @jest-environment node
 */

jest.mock('config', () => ({ apiUrl: 'http://localhost:3000' }), { virtual: true });
jest.mock('@/_helpers', () => ({
  authHeader: () => ({ Authorization: 'Bearer test' }),
  handleResponse: (res) => Promise.resolve(res),
}));
jest.mock('@/_helpers/active-branch', () => ({ getActiveBranchId: () => 'stale-store-branch' }));
jest.mock('@/_helpers/authRequestOptions', () => ({ getAuthRequestOptions: () => ({ method: 'GET' }) }));

global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

const { globalDatasourceService } = require('../globalDatasource.service');
const { dataSourcesQueryOptions, dataSourcesInfiniteQueryOptions } = require('../globalDatasource.queries');

beforeEach(() => {
  fetch.mockClear();
});

describe('globalDatasourceService.getAllV2', () => {
  test('sends the params as the v2 query string, with the branch from its argument', async () => {
    await globalDatasourceService.getAllV2({ pageNo: 2, pageSize: 50, search: 'orders', branchId: 'b-1' });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/v2/data-sources');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: '2',
      page_size: '50',
      search: 'orders',
      branch_id: 'b-1',
    });
  });

  test('leaves out unset params and never reads the branch from the store', async () => {
    await globalDatasourceService.getAllV2({ pageNo: 1, pageSize: 50, branchId: null });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.searchParams.has('branch_id')).toBe(false);
    expect(url.searchParams.has('folder_id')).toBe(false);
    expect(url.searchParams.has('search')).toBe(false);
  });

  test('passes folder_id for a folder-mode call', async () => {
    await globalDatasourceService.getAllV2({ folderId: 'f-1', pageNo: 1, pageSize: 20, branchId: null });
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get('folder_id')).toBe('f-1');
  });
});

describe('dataSourcesQueryOptions', () => {
  test('every param is in the query key, so a change refetches', () => {
    const base = { pageNo: 1, pageSize: 50, search: '', branchId: 'b-1' };
    const key = (overrides) => JSON.stringify(dataSourcesQueryOptions({ ...base, ...overrides }).queryKey);

    expect(key({})).toBe(key({}));
    expect(key({ pageNo: 2 })).not.toBe(key({}));
    expect(key({ search: 'orders' })).not.toBe(key({}));
    expect(key({ branchId: 'b-2' })).not.toBe(key({}));
    expect(key({ folderId: 'f-1' })).not.toBe(key({}));
  });

  test('queryFn requests the page for its own params', async () => {
    const options = dataSourcesQueryOptions({ pageNo: 3, branchId: 'b-1' });
    await options.queryFn({ signal: undefined });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.searchParams.get('page')).toBe('3');
    expect(url.searchParams.get('page_size')).toBe('50');
    expect(url.searchParams.get('branch_id')).toBe('b-1');
  });
});

describe('dataSourcesInfiniteQueryOptions', () => {
  const options = dataSourcesInfiniteQueryOptions({ folderId: 'f-1', branchId: 'b-1' });

  test('stays apart from the paged entry but under the same prefix', () => {
    const paged = dataSourcesQueryOptions({ folderId: 'f-1', branchId: 'b-1' });
    expect(options.queryKey[0]).toBe(paged.queryKey[0]);
    expect(options.queryKey).toContain('infinite');
  });

  test('asks for the next page while page * page_size < total', () => {
    expect(options.getNextPageParam({ page: 1, page_size: 20, total: 45 })).toBe(2);
    expect(options.getNextPageParam({ page: 2, page_size: 20, total: 45 })).toBe(3);
  });

  test('stops on the last page', () => {
    expect(options.getNextPageParam({ page: 3, page_size: 20, total: 45 })).toBeUndefined();
    expect(options.getNextPageParam({ page: 1, page_size: 20, total: 20 })).toBeUndefined();
  });

  test('queryFn sends the page param with the folder and the folder page size', async () => {
    await options.queryFn({ pageParam: 2, signal: undefined });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.searchParams.get('folder_id')).toBe('f-1');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('page_size')).toBe('20');
  });
});
