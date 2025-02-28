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
  getComponentIdToAutoScroll: (componentId) => {
    const { getCurrentPageComponents, getAllExposedValues } = get();
    const currentPageComponents = getCurrentPageComponents();
    const component = currentPageComponents?.[componentId];
    let parentId = component?.component?.parent;

    if (!parentId) {
      return componentId;
    }

    // If the component exists inside a tab component
    const regForTabs = /-(?!\d{12}$)\d+$/; // Parent id for tabs follow the format 'id-index' and index is not UUIDv4 id segment
    if (regForTabs.test(parentId)) {
      const reg = /-(\d+)$/;
      const tabIndex = Number(parentId.match(reg)[1]); // Tab index inside which the component exists

      parentId = parentId.replace(regForTabs, ''); // Extract tab id from parent id
      const { currentTab } = getAllExposedValues().components[parentId];
      const activeTabIndex = Number(currentTab);

      if (tabIndex !== activeTabIndex) {
        return parentId;
      } else return componentId;
    }

    const parentExposedValues = getAllExposedValues().components[parentId];
    const parentComponent = currentPageComponents?.[parentId];

    // If the component exists inside a modal component
    if (parentComponent?.component?.component === 'Modal') {
      if (parentExposedValues?.show) {
        return componentId;
      } else return parentId;
    }

    // If the component exists inside the kanban component's modal
    if (parentId.endsWith('-modal')) {
      return parentId.replace(/-modal$/, ''); // Extract kanban id from parent id
    }

    // If the component exists inside any other component
    return componentId;
  },
});
