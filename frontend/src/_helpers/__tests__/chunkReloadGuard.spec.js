import { claimChunkReload, CHUNK_RELOAD_WINDOW_MS, isChunkLoadError } from '../chunkReloadGuard';

describe('isChunkLoadError', () => {
  test('recognises a JS chunk that failed to load', () => {
    const error = Object.assign(new Error('Loading chunk 814 failed.'), { name: 'ChunkLoadError' });

    expect(isChunkLoadError(error)).toBe(true);
  });

  test("recognises rspack's CSS chunk failure, which is a plain Error with a code", () => {
    const error = Object.assign(new Error('Loading CSS chunk 814 failed.'), { code: 'CSS_CHUNK_LOAD_FAILED' });

    expect(isChunkLoadError(error)).toBe(true);
  });

  test('ignores other errors', () => {
    expect(isChunkLoadError(new TypeError("Cannot read properties of undefined (reading 'name')"))).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});

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
