// The left panel and the AI chat drawer are independent surfaces: each is driven only by its own
// state, so opening one never closes the other. 'tooljetai' is never a left-panel item.
const isLeftPanelItem = (selectedSidebarItem) => Boolean(selectedSidebarItem && selectedSidebarItem !== 'tooljetai');

export const getAiChatSurfaceState = (selectedSidebarItem, isSidebarOpen, isAiChatOpen = false) => ({
  isLeftPanelOpen: Boolean(isSidebarOpen) && isLeftPanelItem(selectedSidebarItem),
  isRightChatOpen: Boolean(isAiChatOpen),
  isFabVisible: !isAiChatOpen,
  shouldMountLeftPanel: isLeftPanelItem(selectedSidebarItem),
});

export const getAiChatMotionClassNames = () => ({
  shell: 'ai-builder-chat-drawer',
  content: 'ai-builder-chat-content',
});
