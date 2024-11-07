import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';

const initialState = {
  activeRightSideBarTab: RIGHT_SIDE_BAR_TAB.COMPONENTS,
};

export const createRightSideBarSlice = (set) => ({
  ...initialState,
  setActiveRightSideBarTab: (tab) => set(() => ({ activeRightSideBarTab: tab }), false, 'setActiveRightSideBarTab'),
});
