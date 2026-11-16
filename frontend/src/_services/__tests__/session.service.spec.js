jest.mock('config', () => ({ apiUrl: 'http://localhost:3000' }), { virtual: true });
jest.mock('@/_helpers', () => ({
  authHeader: () => ({ Authorization: 'Bearer test' }),
  handleResponseWithoutValidation: (res) => Promise.resolve(res),
}));
jest.mock('@/_helpers/routes', () => ({
  getRedirectToWithParams: () => '/',
  getPathname: () => '/my-workspace',
  isCustomDomain: () => false,
}));
jest.mock('@/_helpers/utils', () => ({
  getWorkspaceId: () => 'my-workspace',
  stripTrailingSlash: (url) => url,
}));
jest.mock('@/AppBuilder/EmbedApp', () => ({ getPatToken: () => null }));

global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
// Capture the redirect instead of letting jsdom try to navigate.
delete window.location;
window.location = { href: '' };

// The viewer's cache module registers its IndexedDB name on import, as it does once a released app has loaded.
require('@/AppBuilder/_helpers/appDefinitionCache');
const { sessionService } = require('../session.service');

describe('sessionService.logout', () => {
  beforeEach(() => {
    fetch.mockClear();
    window.location.href = '';
  });

  test('still logs out and redirects when the browser cannot delete the app cache', async () => {
    global.indexedDB = {
      deleteDatabase: jest.fn(() => {
        throw new Error('simulated storage failure');
      }),
    };

    await sessionService.logout();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/session/logout', expect.anything());
    expect(window.location.href).toContain('login');
  });

  test('still logs out when IndexedDB is unavailable', async () => {
    delete global.indexedDB;

    await sessionService.logout();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/session/logout', expect.anything());
  });
});
