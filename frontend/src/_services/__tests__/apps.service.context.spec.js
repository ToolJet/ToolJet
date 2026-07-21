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
  test('TC1: page=0, type=module, context=picker includes &context=picker', async () => {
    await appsService.getAll(0, '', '', 'module', 'picker');
    const url = fetch.mock.calls[0][0];
    expect(url).toContain('type=module');
    expect(url).toContain('&context=picker');
  });

  test('TC2: page=1, type=module, context=picker includes &context=picker', async () => {
    await appsService.getAll(1, '', '', 'module', 'picker');
    const url = fetch.mock.calls[0][0];
    expect(url).toContain('type=module');
    expect(url).toContain('&context=picker');
  });

  test('TC3: page=0, type=module, no context — URL does NOT contain context', async () => {
    await appsService.getAll(0, '', '', 'module');
    const url = fetch.mock.calls[0][0];
    expect(url).toContain('type=module');
    expect(url).not.toContain('context');
  });

  test('TC4: page=1, type=front-end, no context — URL unchanged, no context param', async () => {
    await appsService.getAll(1, '', '', 'front-end');
    const url = fetch.mock.calls[0][0];
    expect(url).toContain('type=front-end');
    expect(url).not.toContain('context');
  });
});
