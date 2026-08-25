/**
 * @jest-environment node
 */

jest.mock('config', () => ({ apiUrl: 'http://localhost:3000' }), { virtual: true });
jest.mock('query-string', () => ({}), { virtual: true });
jest.mock('@/_helpers', () => ({
  authHeader: () => ({ Authorization: 'Bearer test' }),
  handleResponse: (res) => Promise.resolve(res),
}));

// Capture fetch calls without actually making network requests
global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

const { appsService } = require('../apps.service');

beforeEach(() => {
  fetch.mockClear();
});

describe('appsService.getAll — context param', () => {
  test('appends context=picker for a module request on the first page', async () => {
    await appsService.getAll(0, '', '', 'module', 'picker');
    const url = fetch.mock.calls[0][0];
    expect(url).toContain('type=module');
    expect(url).toContain('&context=picker');
  });

  test('appends context=picker on later pages too, so paging keeps the filter', async () => {
    await appsService.getAll(1, '', '', 'module', 'picker');
    const url = fetch.mock.calls[0][0];
    expect(url).toContain('type=module');
    expect(url).toContain('&context=picker');
  });

  test('omits the context param entirely when no context is given', async () => {
    await appsService.getAll(0, '', '', 'module');
    const url = fetch.mock.calls[0][0];
    expect(url).toContain('type=module');
    expect(url).not.toContain('context');
  });

  test('leaves a front-end request untouched — context is module-only', async () => {
    await appsService.getAll(1, '', '', 'front-end');
    const url = fetch.mock.calls[0][0];
    expect(url).toContain('type=front-end');
    expect(url).not.toContain('context');
  });
});
