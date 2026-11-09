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

  // QA item 19: a stylesheet that failed to load was kept as "no stylesheet" for the rest of the session, so a component
  // that loaded on a retry drew unstyled.
  it('[LibraryComponent-CACHE-003] fetches a stylesheet again after a failed load', async () => {
    // Break this catches: a failed stylesheet load cached, which no retry can get past.
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 503, text: async () => '' });
    expect(await loadLibraryCss('/files/v2/index.css', 'lib|v2|')).toBeNull();
    expect(await loadLibraryCss('/files/v2/index.css', 'lib|v2|')).toBe('.x{}');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('[LibraryComponent-CACHE-004] fetches a stylesheet again after a network error', async () => {
    // Break this catches: a dropped connection cached as "no stylesheet".
    fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect(await loadLibraryCss('/files/v3/index.css', 'lib|v3|')).toBeNull();
    expect(await loadLibraryCss('/files/v3/index.css', 'lib|v3|')).toBe('.x{}');
  });

  it('[LibraryComponent-CACHE-005] keeps a loaded stylesheet: it is fetched once', async () => {
    // Break this catches: the fix dropping every cached stylesheet, so each instance fetches it again.
    await loadLibraryCss('/files/v4/index.css', 'lib|v4|');
    await loadLibraryCss('/files/v4/index.css', 'lib|v4|');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('[LibraryComponent-CACHE-006] keeps a missing stylesheet (404) as none: it is fetched once', async () => {
    // Break this catches: a library that ships no stylesheet fetching the missing file again for every instance.
    fetchSpy.mockResolvedValue({ ok: false, status: 404, text: async () => '' });
    await loadLibraryCss('/files/v5/index.css', 'lib|v5|');
    expect(await loadLibraryCss('/files/v5/index.css', 'lib|v5|')).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
