/**
 * @jest-environment node
 */

jest.mock('config', () => ({ apiUrl: 'http://localhost:3000' }), { virtual: true });
jest.mock('@/_helpers', () => ({
  authHeader: () => ({ Authorization: 'Bearer test' }),
  handleResponse: (res) => Promise.resolve(res),
}));
jest.mock('@/_helpers/active-branch', () => ({ getActiveBranchId: () => null }));

global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

const { dataqueryService } = require('../dataquery.service');

const sentBody = () => JSON.parse(fetch.mock.calls[0][1].body);

beforeEach(() => {
  fetch.mockClear();
});

describe('dataqueryService.run — cache refresh', () => {
  test('asks the server to refresh the cached response when refreshCache is set', async () => {
    await dataqueryService.run('q1', { a: 1 }, {}, 'v1', 'env1', 'view', undefined, true);
    expect(sentBody()).toEqual({ resolvedOptions: { a: 1 }, options: {}, cacheControl: 'refresh' });
  });

  test('sends no cache instruction for a plain run', async () => {
    await dataqueryService.run('q1', { a: 1 }, {}, 'v1', 'env1', 'view');
    expect(sentBody()).not.toHaveProperty('cacheControl');
  });

  test('sends the instruction on the public run endpoint too', async () => {
    await dataqueryService.run('q1', {}, {}, undefined, undefined, 'view', undefined, true);
    expect(fetch.mock.calls[0][0]).toBe('http://localhost:3000/data-queries/q1/run');
    expect(sentBody().cacheControl).toBe('refresh');
  });
});
