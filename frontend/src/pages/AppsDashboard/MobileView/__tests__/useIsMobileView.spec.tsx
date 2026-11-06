import { act, renderHook } from '@testing-library/react';

import { useIsMobileView } from '../hooks/useIsMobileView';

type Listener = (event: { matches: boolean }) => void;

function mockMatchMedia(initialMatches: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches: initialMatches,
    addEventListener: (_: string, fn: Listener) => listeners.add(fn),
    removeEventListener: (_: string, fn: Listener) => listeners.delete(fn),
  };
  const matchMedia = jest.fn(() => mql);
  window.matchMedia = matchMedia as unknown as typeof window.matchMedia;

  return {
    matchMedia,
    listenerCount: () => listeners.size,
    change: (matches: boolean) => {
      mql.matches = matches;
      listeners.forEach((fn) => fn({ matches }));
    },
  };
}

describe('useIsMobileView', () => {
  test('queries the 720px breakpoint', () => {
    const { matchMedia } = mockMatchMedia(true);

    renderHook(() => useIsMobileView());

    expect(matchMedia).toHaveBeenCalledWith('(max-width: 719.98px)');
  });

  test.each([true, false])('starts as %s when the media query matches that way', (matches) => {
    mockMatchMedia(matches);

    const { result } = renderHook(() => useIsMobileView());

    expect(result.current).toBe(matches);
  });

  test('follows the viewport across the breakpoint', () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobileView());

    act(() => media.change(true));
    expect(result.current).toBe(true);

    act(() => media.change(false));
    expect(result.current).toBe(false);
  });

  test('stops listening on unmount', () => {
    const media = mockMatchMedia(false);
    const { unmount } = renderHook(() => useIsMobileView());
    expect(media.listenerCount()).toBe(1);

    unmount();

    expect(media.listenerCount()).toBe(0);
  });
});
