import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';

const initialState = {
  activeRightSideBarTab: null,
  isRightSidebarOpen: false,
  isRightSidebarPinned: false,
  isCanvasHeaderSelected: false,
  isCanvasFooterSelected: false,
  // What the configuration panel is showing: { type: 'component', id } | { type: 'header' } | { type: 'footer' }.
  // Set when something is selected on the canvas; clearing the selection (an empty-canvas click)
  // leaves it alone, so the right side never changes on its own.
  rightPanelSubject: null,
};

// The right side shows one surface at a time — the right panel or the AI chat — so opening the
// right panel always closes the chat (see setAiChatOpen for the other direction).
export const createRightSideBarSlice = (set, get) => ({
  ...initialState,
  setActiveRightSideBarTab: (tab) => {
    set(() => ({ activeRightSideBarTab: tab }), false, 'setActiveRightSideBarTab');
  },
  toggleRightSidebar: () =>
    set(
      (state) => ({
        isRightSidebarOpen: !state.isRightSidebarOpen,
        ...(!state.isRightSidebarOpen && { isAiChatOpen: false }),
      }),
      false,
      'toggleRightSidebar'
    ),
  setRightSidebarOpen: (open) =>
    set(() => ({ isRightSidebarOpen: open, ...(open && { isAiChatOpen: false }) }), false, 'setRightSidebarOpen'),
  toggleRightSidebarPin: () =>
    set((state) => ({ isRightSidebarPinned: !state.isRightSidebarPinned }), false, 'toggleRightSidebarPin'),
  setCanvasHeaderSelected: (selected) => {
    set(
      (state) => {
        state.isCanvasHeaderSelected = selected;
        state.isCanvasFooterSelected = false;
        state.selectedComponents = [];
        if (selected) {
          state.rightPanelSubject = { type: 'header' };
          state.activeRightSideBarTab = RIGHT_SIDE_BAR_TAB.CONFIGURATION;
          if (!state.isRightSidebarOpen) {
            state.isRightSidebarOpen = true;
          }
          state.isAiChatOpen = false;
        }
      },
      false,
      'setCanvasHeaderSelected'
    );
  },
  setCanvasFooterSelected: (selected) => {
    set(
      (state) => {
        state.isCanvasFooterSelected = selected;
        state.isCanvasHeaderSelected = false;
        state.selectedComponents = [];
        if (selected) {
          state.rightPanelSubject = { type: 'footer' };
          state.activeRightSideBarTab = RIGHT_SIDE_BAR_TAB.CONFIGURATION;
          if (!state.isRightSidebarOpen) {
            state.isRightSidebarOpen = true;
          }
          state.isAiChatOpen = false;
        }
      },
      false,
      'setCanvasFooterSelected'
    );
  },
});
