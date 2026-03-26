import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';

const initialState = {
  activeRightSideBarTab: null,
  isRightSidebarOpen: false,
  isRightSidebarPinned: false,
  isCanvasHeaderSelected: false,
  isCanvasFooterSelected: false,
};

export const createRightSideBarSlice = (set, get) => ({
  ...initialState,
  setActiveRightSideBarTab: (tab) => {
    set(() => ({ activeRightSideBarTab: tab }), false, 'setActiveRightSideBarTab');
  },
  toggleRightSidebar: () =>
    set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen }), false, 'toggleRightSidebar'),
  setRightSidebarOpen: (open) => set(() => ({ isRightSidebarOpen: open }), false, 'setRightSidebarOpen'),
  toggleRightSidebarPin: () =>
    set((state) => ({ isRightSidebarPinned: !state.isRightSidebarPinned }), false, 'toggleRightSidebarPin'),
  setCanvasHeaderSelected: (selected) => {
    set(
      (state) => {
        state.isCanvasHeaderSelected = selected;
        if (selected) {
          state.activeRightSideBarTab = RIGHT_SIDE_BAR_TAB.CONFIGURATION;
          if (!state.isRightSidebarOpen) {
            state.isRightSidebarOpen = true;
          }
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
        if (selected) {
          state.activeRightSideBarTab = RIGHT_SIDE_BAR_TAB.CONFIGURATION;
          if (!state.isRightSidebarOpen) {
            state.isRightSidebarOpen = true;
          }
        }
      },
      false,
      'setCanvasFooterSelected'
    );
  },
});
