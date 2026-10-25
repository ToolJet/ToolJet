import { loadLibraryCss } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';

// Published revision files are immutable and served with a year-long cache header; a dev slot's files
// change on every `tooljet library dev` push behind the same URL.
describe('inline runtime: browser caching of library files', () => {
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, text: async () => '.x{}' });
  });

  afterEach(() => fetchSpy.mockRestore());

  it('[LibraryComponent-CACHE-001] lets the browser cache a published revision file', async () => {
    // Break this catches: `cache: 'no-store'` on every fetch, which re-downloads the whole bundle on each
    // page load even though the server marks published files immutable.
    await loadLibraryCss('/files/v1/index.css', 'lib|v1|');
    expect(fetchSpy.mock.calls[0][1]?.cache).not.toBe('no-store');
  });

  it('[LibraryComponent-CACHE-002] always refetches a dev slot file', async () => {
    // Break this catches: a dev push showing the previous build because the browser served a cached copy.
    await loadLibraryCss('/files/dev/index.css', 'lib|dev:u1|7', { isDevBuild: true });
    expect(fetchSpy.mock.calls[0][1]?.cache).toBe('no-store');
  });
});
