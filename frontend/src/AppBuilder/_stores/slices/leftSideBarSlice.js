const validSidebarItems = ['page', 'inspect', 'debugger', 'settings'];
const storedIsSidebarPinned = localStorage.getItem('isLeftSideBarPinned') === 'true' ? true : false;
const storedSelectedSidebarItem = !storedIsSidebarPinned
  ? null
  : localStorage.getItem('selectedSidebarItem') &&
    validSidebarItems.includes(localStorage.getItem('selectedSidebarItem'))
  ? localStorage.getItem('selectedSidebarItem')
  : 'page';

const initialState = {
  isLeftSideBarPinned: storedIsSidebarPinned,
  selectedSidebarItem: storedIsSidebarPinned ? storedSelectedSidebarItem : null,
  isSidebarOpen: storedIsSidebarPinned,
  pathToBeInspected: null,
};

export const createLeftSideBarSlice = (set, get) => ({
  ...initialState,
  setIsLeftSideBarPinned: (status) => {
    localStorage.setItem('isLeftSideBarPinned', status === true ? 'true' : 'false');
    set(() => ({ isLeftSideBarPinned: status }), false, 'setIsLeftSideBarPinned');
  },
  setSelectedSidebarItem: (selectedSidebarItem) =>
    set(() => ({ selectedSidebarItem }), false, 'setSelectedSidebarItem'),
  toggleLeftSidebar: (isSidebarOpen) =>
    set(
      () => ({ isSidebarOpen, ...(!isSidebarOpen && { selectedSidebarItem: null, pathToBeInspected: null }) }),
      false,
      'setIsSidebarOpen'
    ),
  setPathToBeInspected: (pathToBeInspected) => set(() => ({ pathToBeInspected }), false, 'setPathToBeInspected'),
  setComponentToInspect: (componentToInspect) => {
    const { setPathToBeInspected, setSelectedSidebarItem, toggleLeftSidebar, selectedSidebarItem } = get();
    setPathToBeInspected(['components', componentToInspect]);
    if (selectedSidebarItem !== 'inspect') {
      setSelectedSidebarItem('inspect');
      toggleLeftSidebar(true);
    }
  },
});
