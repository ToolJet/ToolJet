import {
  enterNativeFullscreen,
  getFullscreenElement,
  isNativeFullscreenEnabled,
  shouldUseCssFullscreenFallback,
  toggleNativeFullscreen,
} from '../cameraFullscreen';

describe('camera fullscreen helpers', () => {
  it('uses CSS fallback when Fullscreen API is disabled (iPhone Safari)', () => {
    const doc = { fullscreenEnabled: false };
    expect(isNativeFullscreenEnabled(doc)).toBe(false);
    expect(shouldUseCssFullscreenFallback(doc)).toBe(true);
  });

  it('uses CSS fallback when Fullscreen API flags are missing', () => {
    const doc = {};
    expect(isNativeFullscreenEnabled(doc)).toBe(false);
    expect(shouldUseCssFullscreenFallback(doc)).toBe(true);
  });

  it('uses the native API when fullscreenEnabled is true (Android / desktop / iPad)', () => {
    const doc = { fullscreenEnabled: true };
    expect(isNativeFullscreenEnabled(doc)).toBe(true);
    expect(shouldUseCssFullscreenFallback(doc)).toBe(false);
  });

  it('uses the native API when only the webkit flag is present', () => {
    expect(isNativeFullscreenEnabled({ webkitFullscreenEnabled: true })).toBe(true);
    expect(shouldUseCssFullscreenFallback({ webkitFullscreenEnabled: true })).toBe(false);
  });

  it('reads prefixed fullscreen element properties', () => {
    const element = { id: 'camera' };
    expect(getFullscreenElement({ webkitFullscreenElement: element })).toBe(element);
  });

  it('calls requestFullscreen with the element as this', async () => {
    const calls = [];
    const element = {
      requestFullscreen() {
        calls.push(this);
        return Promise.resolve();
      },
    };

    await expect(enterNativeFullscreen(element)).resolves.toBe(true);
    expect(calls).toEqual([element]);
  });

  it('returns false when requestFullscreen is missing instead of no-op-awaiting undefined', async () => {
    await expect(enterNativeFullscreen({})).resolves.toBe(false);
  });

  it('exits native fullscreen when the same element is already fullscreen', async () => {
    const element = { id: 'camera' };
    const doc = {
      fullscreenElement: element,
      exitFullscreen: jest.fn().mockResolvedValue(undefined),
    };

    await expect(toggleNativeFullscreen(element, doc)).resolves.toBe(true);
    expect(doc.exitFullscreen).toHaveBeenCalledTimes(1);
  });
});
