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
  return { path: new URL(url).pathname, method: options.method, body: JSON.parse(options.body) };
};

beforeEach(() => {
  fetch.mockClear();
});

describe('data source bulk calls', () => {
  test.each([
    [
      'bulkDeleteDataSources',
      { dataSourceIds: ['d-1', 'd-2'] },
      '/v2/data-sources/bulk-delete',
      { data_source_ids: ['d-1', 'd-2'] },
    ],
    [
      'bulkMoveDataSources',
      { dataSourceIds: ['d-1'], folderId: 'f-1' },
      '/v2/data-sources/bulk-move',
      { data_source_ids: ['d-1'], folder_id: 'f-1' },
    ],
    ['bulkRemoveDataSources', { dataSourceIds: ['d-1'] }, '/v2/data-sources/bulk-remove', { data_source_ids: ['d-1'] }],
    [
      'bulkDeleteDataSourceFolders',
      { folderIds: ['f-1'], mode: 'folder_only' },
      '/v2/data-sources/folders/bulk-delete',
      { folder_ids: ['f-1'], mode: 'folder_only' },
    ],
  ])('%s posts its ids with the branch from its argument', async (method, params, path, body) => {
    await globalDatasourceService[method]({ ...params, branchId: 'b-1' });
    expect(lastCall()).toEqual({ path, method: 'POST', body: { ...body, branch_id: 'b-1' } });
  });

  test('leaves the branch out on the default branch, never falling back to the store', async () => {
    await globalDatasourceService.bulkDeleteDataSources({ dataSourceIds: ['d-1'], branchId: null });
    expect(lastCall().body).toEqual({ data_source_ids: ['d-1'] });
  });
});
