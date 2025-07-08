import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';

const initialState = {
  activeRightSideBarTab: null,
  isRightSidebarOpen: false,
  isRightSidebarPinned: false,
};

export const createRightSideBarSlice = (set) => ({
  ...initialState,
  setActiveRightSideBarTab: (tab) => set(() => ({ activeRightSideBarTab: tab }), false, 'setActiveRightSideBarTab'),
  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
  setRightSidebarOpen: (open) => set(() => ({ isRightSidebarOpen: open })),
  toggleRightSidebarPin: () => set((state) => ({ isRightSidebarPinned: !state.isRightSidebarPinned })),
});
