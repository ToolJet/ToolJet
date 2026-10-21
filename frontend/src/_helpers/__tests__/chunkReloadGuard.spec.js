import { claimChunkReload, CHUNK_RELOAD_WINDOW_MS } from '../chunkReloadGuard';

describe('claimChunkReload', () => {
  const start = 1_800_000_000_000;

  beforeEach(() => sessionStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  test('allows the first automatic reload', () => {
    expect(claimChunkReload(start)).toBe(true);
  });

  test('refuses another reload within the window, so a chunk that keeps failing cannot loop', () => {
    claimChunkReload(start);

    expect(claimChunkReload(start + 2_000)).toBe(false);
    expect(claimChunkReload(start + CHUNK_RELOAD_WINDOW_MS - 1)).toBe(false);
  });

  test('allows a reload again once the window has passed, for the next deploy', () => {
    claimChunkReload(start);

    expect(claimChunkReload(start + CHUNK_RELOAD_WINDOW_MS)).toBe(true);
  });

  test('refuses to reload when session storage is unavailable', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(claimChunkReload(start)).toBe(false);
  });
});
