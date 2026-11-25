import { isDynamicHeightLiveInEditor } from '@/AppBuilder/_stores/dynamicHeight/flags';
import { isCanvasInteractionV2Enabled, __resetCanvasInteractionFlagForTests } from '../flags';

jest.mock('@/AppBuilder/_stores/dynamicHeight/flags', () => ({
  isDynamicHeightLiveInEditor: jest.fn(() => false),
}));

const KEY = 'tj-canvas-interaction';

describe('isCanvasInteractionV2Enabled', () => {
  beforeEach(() => {
    window.localStorage.clear();
    isDynamicHeightLiveInEditor.mockReturnValue(false);
    __resetCanvasInteractionFlagForTests();
  });

  it('is off by default, so Jest and every browser that never set it run the Moveable path', () => {
    expect(isCanvasInteractionV2Enabled()).toBe(false);
  });

  it("is on only for exactly 'v2'", () => {
    window.localStorage.setItem(KEY, 'v2');
    expect(isCanvasInteractionV2Enabled()).toBe(true);

    for (const value of ['V2', 'on', 'true', '1', '']) {
      window.localStorage.setItem(KEY, value);
      __resetCanvasInteractionFlagForTests();
      expect(isCanvasInteractionV2Enabled()).toBe(false);
    }
  });

  it('reads the choice once per page load', () => {
    window.localStorage.setItem(KEY, 'v2');
    expect(isCanvasInteractionV2Enabled()).toBe(true);
    window.localStorage.removeItem(KEY);
    expect(isCanvasInteractionV2Enabled()).toBe(true);

    __resetCanvasInteractionFlagForTests();
    expect(isCanvasInteractionV2Enabled()).toBe(false);
  });

  it('is forced off while dynamic height runs live in the editor', () => {
    window.localStorage.setItem(KEY, 'v2');
    isDynamicHeightLiveInEditor.mockReturnValue(true);
    expect(isCanvasInteractionV2Enabled()).toBe(false);
  });

  it('stays off when localStorage cannot be read', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    try {
      expect(isCanvasInteractionV2Enabled()).toBe(false);
    } finally {
      getItem.mockRestore();
    }
  });
});
