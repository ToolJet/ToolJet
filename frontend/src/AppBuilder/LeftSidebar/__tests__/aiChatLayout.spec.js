/**
 * @jest-environment node
 */

const { getAiChatMotionClassNames, getAiChatSurfaceState } = require('../aiChatLayout');

describe('AI chat surface placement', () => {
  test('opens AI chat in the right drawer and keeps an open left panel open', () => {
    expect(getAiChatSurfaceState('pages', true, true)).toEqual({
      isLeftPanelOpen: true,
      isRightChatOpen: true,
      isFabVisible: false,
      shouldMountLeftPanel: true,
    });
  });

  test('opens AI chat on its own when no left panel is open', () => {
    expect(getAiChatSurfaceState(null, false, true)).toEqual({
      isLeftPanelOpen: false,
      isRightChatOpen: true,
      isFabVisible: false,
      shouldMountLeftPanel: false,
    });
  });

  test('keeps ordinary tools in the left popover', () => {
    expect(getAiChatSurfaceState('pages', true, false)).toEqual({
      isLeftPanelOpen: true,
      isRightChatOpen: false,
      isFabVisible: true,
      shouldMountLeftPanel: true,
    });
  });

  test('closes the left panel only from its own state', () => {
    expect(getAiChatSurfaceState('pages', false, false).isLeftPanelOpen).toBe(false);
  });

  test('does not mount an empty left popover after the selection is cleared', () => {
    expect(getAiChatSurfaceState(null, false, false).shouldMountLeftPanel).toBe(false);
  });

  test('uses the dedicated bottom-up chat motion classes', () => {
    expect(getAiChatMotionClassNames()).toEqual({
      shell: 'ai-builder-chat-drawer',
      content: 'ai-builder-chat-content',
    });
  });
});
