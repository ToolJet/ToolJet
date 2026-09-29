import { renderHook } from '@testing-library/react';
import { useMenuWidth } from '../useMenuWidth';

const VIEWPORT_CLAMP = 'calc(100vw - 24px)';
const CONTENT_CLAMP = 'min(520px, calc(100vw - 24px))';

describe('useMenuWidth (PopoverMenu)', () => {
  describe('matchField', () => {
    test('pins width and minWidth to the trigger width, viewport-clamps maxWidth', () => {
      const { result } = renderHook(() => useMenuWidth('matchField', undefined, 120));

      expect(result.current).toEqual({ width: '120px', minWidth: '120px', maxWidth: VIEWPORT_CLAMP });
    });

    test('with no trigger width measured yet, only the viewport clamp applies', () => {
      const { result } = renderHook(() => useMenuWidth('matchField', undefined, undefined));

      expect(result.current).toEqual({ width: undefined, minWidth: undefined, maxWidth: VIEWPORT_CLAMP });
    });
  });

  describe('matchContent', () => {
    test('does not force a width or a minWidth floor, only clamps maxWidth', () => {
      const { result } = renderHook(() => useMenuWidth('matchContent', undefined, 32));

      expect(result.current).toEqual({ maxWidth: CONTENT_CLAMP });
      expect(result.current.width).toBeUndefined();
      expect(result.current.minWidth).toBeUndefined();
    });

    // Break this catches: a wide trigger (e.g. a full-width button) forcing the menu to stay
    // that wide via a minWidth floor, even when the content itself is much narrower.
    test('a wide trigger does not force the menu to stay that wide', () => {
      const { result } = renderHook(() => useMenuWidth('matchContent', undefined, 380));

      expect(result.current).toEqual({ maxWidth: CONTENT_CLAMP });
    });
  });

  describe('custom', () => {
    test('a numeric string is treated as pixels', () => {
      const { result } = renderHook(() => useMenuWidth('custom', '300', 120));

      expect(result.current).toEqual({ width: '300px', maxWidth: VIEWPORT_CLAMP });
    });

    test('a non-numeric string (e.g. a percentage) passes through untouched', () => {
      const { result } = renderHook(() => useMenuWidth('custom', '50%', 120));

      expect(result.current).toEqual({ width: '50%', maxWidth: VIEWPORT_CLAMP });
    });

    test('a numeric value is treated as pixels', () => {
      const { result } = renderHook(() => useMenuWidth('custom', 256, 120));

      expect(result.current).toEqual({ width: '256px', maxWidth: VIEWPORT_CLAMP });
    });

    // Break this catches: an empty custom value silently making the popover width collapse to 0/none.
    test('an empty custom value falls back to match-field sizing instead of collapsing', () => {
      const { result } = renderHook(() => useMenuWidth('custom', '', 120));

      expect(result.current).toEqual({ width: '120px', minWidth: '120px', maxWidth: VIEWPORT_CLAMP });
    });
  });
});
