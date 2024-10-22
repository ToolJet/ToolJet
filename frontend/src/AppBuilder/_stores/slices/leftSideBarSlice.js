const initialState = {
  isLeftSideBarPinned: false,
  selectedSidebarItem: false,
  isSidebarOpen: false,
};

export const createLeftSideBarSlice = (set) => ({
  ...initialState,
  setIsLeftSideBarPinned: (status) => set(() => ({ isLeftSideBarPinned: status }), false, 'setIsLeftSideBarPinned'),
  setSelectedSidebarItem: (selectedSidebarItem) =>
    set(() => ({ selectedSidebarItem }), false, 'setSelectedSidebarItem'),
  toggleLeftSidebar: (isSidebarOpen) =>
    set(() => ({ isSidebarOpen, ...(!isSidebarOpen && { selectedSidebarItem: null }) }), false, 'setIsSidebarOpen'),
});
