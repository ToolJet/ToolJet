/**
 * @jest-environment node
 */

const { getAiChatMotionClassNames, getAiChatSurfaceState } = require('../aiChatLayout');

describe('AI chat surface placement', () => {
  test('opens AI chat in the right drawer without opening the left popover', () => {
    expect(getAiChatSurfaceState('tooljetai', true)).toEqual({
      isLeftPanelOpen: false,
      isRightChatOpen: true,
      isFabVisible: false,
      shouldMountLeftPanel: false,
    });
  });

  test('keeps ordinary tools in the left popover', () => {
    expect(getAiChatSurfaceState('pages', true)).toEqual({
      isLeftPanelOpen: true,
      isRightChatOpen: false,
      isFabVisible: true,
      shouldMountLeftPanel: true,
    });
  });

  test('closes both surfaces when the sidebar state is closed', () => {
    expect(getAiChatSurfaceState('tooljetai', false)).toEqual({
      isLeftPanelOpen: false,
      isRightChatOpen: false,
      isFabVisible: true,
      shouldMountLeftPanel: false,
    });
  });

  test('does not mount an empty left popover after the selection is cleared', () => {
    expect(getAiChatSurfaceState(null, false).shouldMountLeftPanel).toBe(false);
  });

  test('uses the dedicated bottom-up chat motion classes', () => {
    expect(getAiChatMotionClassNames()).toEqual({
      shell: 'ai-builder-chat-drawer',
      content: 'ai-builder-chat-content',
    });
  });
});
