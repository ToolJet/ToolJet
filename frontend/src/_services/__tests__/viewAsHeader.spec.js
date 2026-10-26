/**
 * @jest-environment node
 */

jest.mock('config', () => ({ apiUrl: 'http://localhost:3000' }), { virtual: true });
jest.mock('@/_helpers', () => ({
  authHeader: () => ({ Authorization: 'Bearer test' }),
  handleResponse: (res) => Promise.resolve(res),
}));
jest.mock('@/_helpers/active-branch', () => ({ appendBranchParam: (url) => url }));

global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

const { appVersionService } = require('../appVersion.service');
const { dataqueryService } = require('../dataquery.service');

const SALES = { kind: 'group', id: '11111111-1111-4111-8111-111111111111', label: 'Sales' };
const headersOf = (callIndex = 0) => fetch.mock.calls[callIndex][1].headers;

// The server only honours the header in preview (view mode); sending it anywhere else would be
// noise at best and a rejected request at worst.
describe('View as request header', () => {
  beforeEach(() => fetch.mockClear());

  it.each([
    ['loading the app', () => appVersionService.getAppVersionData('app', 'version', 'view', SALES)],
    ['listing queries', () => dataqueryService.getAll('version', 'view', SALES)],
    ['running a query', () => dataqueryService.run('query', {}, {}, 'version', 'env', 'view', undefined, SALES)],
  ])('is sent when %s in preview', async (_label, call) => {
    await call();

    expect(headersOf()).toMatchObject({ Authorization: 'Bearer test', 'x-tj-view-as': `group:${SALES.id}` });
  });

  it.each([
    ['loading the app', () => appVersionService.getAppVersionData('app', 'version', 'edit', SALES)],
    ['listing queries', () => dataqueryService.getAll('version', 'edit', SALES)],
    ['running a query', () => dataqueryService.run('query', {}, {}, 'version', 'env', 'edit', undefined, SALES)],
  ])('is not sent when %s in the editor', async (_label, call) => {
    await call();

    expect(headersOf()).not.toHaveProperty('x-tj-view-as');
  });

  it.each([
    ['loading the app', () => appVersionService.getAppVersionData('app', 'version', 'view')],
    ['listing queries', () => dataqueryService.getAll('version', 'view')],
    ['running a query', () => dataqueryService.run('query', {}, {}, 'version', 'env', 'view')],
  ])('is not sent when %s without a simulation', async (_label, call) => {
    await call();

    expect(headersOf()).not.toHaveProperty('x-tj-view-as');
  });
});
