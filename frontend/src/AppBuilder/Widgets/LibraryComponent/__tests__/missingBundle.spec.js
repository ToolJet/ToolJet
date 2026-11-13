import { loadLibraryModule } from '../inlineRuntime';

jest.mock('config', () => ({ apiUrl: 'http://localhost:3055/api' }), { virtual: true });

describe('a library bundle that is missing from the server', () => {
  it('fails with the status and a short message about this code, not about a whole app', async () => {
    const realFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    const failure = await loadLibraryModule('/files/index.js', 'missing-1').catch((e) => e);
    global.fetch = realFetch;
    expect(failure.status).toBe(404);
    expect(failure.message).toBe("couldn't fetch this code (HTTP 404)");
    expect(failure.message).not.toMatch(/imported/);
  });
});
