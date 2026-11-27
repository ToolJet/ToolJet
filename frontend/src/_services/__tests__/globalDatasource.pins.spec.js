/**
 * @jest-environment node
 */

jest.mock('config', () => ({ apiUrl: 'http://localhost:3000' }), { virtual: true });
jest.mock('@/_helpers', () => ({
  authHeader: () => ({ Authorization: 'Bearer test' }),
  handleResponse: (res) => Promise.resolve(res),
}));
jest.mock('@/_helpers/active-branch', () => ({ getActiveBranchId: () => 'stale-store-branch' }));
// Same signature as the real helper, without the auth header (which pulls in the App Builder store).
jest.mock('@/_helpers/authRequestOptions', () => ({
  getAuthRequestOptions: (method = 'GET', body) => ({
    method,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  }),
}));

global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

const { globalDatasourceService } = require('../globalDatasource.service');

const lastCall = () => {
  const [url, options] = fetch.mock.calls[fetch.mock.calls.length - 1];
  return { url: new URL(url), method: options.method, body: options.body && JSON.parse(options.body) };
};

beforeEach(() => {
  fetch.mockClear();
});

describe('data source pins', () => {
  test('pinResources posts the ids with the branch from its argument', async () => {
    await globalDatasourceService.pinResources({ resourceType: 'data_source', resourceIds: ['d-1'], branchId: 'b-1' });
    const { url, method, body } = lastCall();
    expect(method).toBe('POST');
    expect(url.pathname).toBe('/v2/data-sources/pins');
    expect(body).toEqual({ resource_type: 'data_source', resource_ids: ['d-1'], branch_id: 'b-1' });
  });

  test('pinResources leaves out a null branch', async () => {
    await globalDatasourceService.pinResources({ resourceType: 'folder', resourceIds: ['f-1'], branchId: null });
    expect(lastCall().body).toEqual({ resource_type: 'folder', resource_ids: ['f-1'] });
  });

  test('unpinResource deletes the one pin, with the branch as a query param', async () => {
    await globalDatasourceService.unpinResource({ resourceType: 'folder', resourceId: 'f-1', branchId: 'b-1' });
    const { url, method } = lastCall();
    expect(method).toBe('DELETE');
    expect(url.pathname).toBe('/v2/data-sources/pins/folder/f-1');
    expect(url.searchParams.get('branch_id')).toBe('b-1');
  });

  test('unpinResource sends no query string without a branch', async () => {
    await globalDatasourceService.unpinResource({ resourceType: 'data_source', resourceId: 'd-1', branchId: null });
    expect(lastCall().url.search).toBe('');
  });

  test('reorderPins puts the full pin list in order', async () => {
    const pins = [
      { resource_type: 'folder', resource_id: 'f-1' },
      { resource_type: 'data_source', resource_id: 'd-1' },
    ];
    await globalDatasourceService.reorderPins({ pins, branchId: 'b-1' });
    const { url, method, body } = lastCall();
    expect(method).toBe('PUT');
    expect(url.pathname).toBe('/v2/data-sources/pins/order');
    expect(body).toEqual({ items: pins, branch_id: 'b-1' });
  });
});
