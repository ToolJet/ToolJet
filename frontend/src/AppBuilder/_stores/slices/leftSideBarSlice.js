const selectedItem = localStorage.getItem('selectedSidebarItem');
const isLeftSideBarPinned = !!selectedItem;
const selectedSidebarItem = selectedItem;

const initialState = {
  isSidebarOpen: isLeftSideBarPinned || !!selectedSidebarItem,
  isLeftSideBarPinned,
  selectedSidebarItem,
};

export const createLeftSideBarSlice = (set, get) => ({
  ...initialState,
  setIsLeftSideBarPinned: (status) => {
    status
      ? localStorage.setItem('selectedSidebarItem', get().selectedSidebarItem)
      : localStorage.removeItem('selectedSidebarItem');

    set(() => ({ isLeftSideBarPinned: status }));
  },
  setSelectedSidebarItem: (selectedSidebarItem) =>
    set(() => ({ selectedSidebarItem }), false, 'setSelectedSidebarItem'),
  toggleLeftSidebar: (isSidebarOpen) =>
    set(() => ({ isSidebarOpen, ...(!isSidebarOpen && { selectedSidebarItem: null }) }), false, 'setIsSidebarOpen'),
});
