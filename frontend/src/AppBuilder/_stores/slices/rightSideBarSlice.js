const initialState = {
  activeRightSideBarTab: null,
  isRightSidebarOpen: false,
  isRightSidebarPinned: false,
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
});
