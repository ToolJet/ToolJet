export const getAiChatSurfaceState = (selectedSidebarItem, isSidebarOpen) => ({
  isLeftPanelOpen: isSidebarOpen && selectedSidebarItem !== 'tooljetai',
  isRightChatOpen: isSidebarOpen && selectedSidebarItem === 'tooljetai',
  isFabVisible: !(isSidebarOpen && selectedSidebarItem === 'tooljetai'),
  shouldMountLeftPanel: Boolean(selectedSidebarItem && selectedSidebarItem !== 'tooljetai'),
});

export const getAiChatMotionClassNames = () => ({
  shell: 'ai-builder-chat-drawer',
  content: 'ai-builder-chat-content',
});
