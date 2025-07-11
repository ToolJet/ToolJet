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
    const {
      setPathToBeInspected,
      setSelectedSidebarItem,
      toggleLeftSidebar,
      selectedSidebarItem,
      setSelectedNodePath,
    } = get();
    // setPathToBeInspected(['components', componentToInspect]);
    setSelectedNodePath(`components.${componentToInspect}`);
    if (selectedSidebarItem !== 'inspect') {
      setSelectedSidebarItem('inspect');
      toggleLeftSidebar(true);
    }
  },
  getComponentIdToAutoScroll: (componentId, moduleId = 'canvas') => {
    const { getCurrentPageComponents, getAllExposedValues, modalsOpenOnCanvas, getComponentTypeFromId } = get();
    const currentPageComponents = getCurrentPageComponents(moduleId);

    let targetComponentId = componentId;
    let current = componentId;
    const visited = new Set();
    let isInsideOpenModal = false;

    // Bubble up to the outermost parent to find the target component
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (visited.has(current)) break;
      visited.add(current);

      const parentId = currentPageComponents?.[current]?.component?.parent;
      if (!parentId) break;

      let isComponentVisibleInParent = true;
      let nextPossibleCandidate = parentId;

      // If the component exists inside a tab component
      const componentType = getComponentTypeFromId(parentId?.substring(0, 36));
      if (componentType === 'Tabs') {
        const tabIndex = parentId?.substring(37, parentId?.length); // Tab index inside which the component exists
        const { currentTab, setTab } = getAllExposedValues(moduleId).components?.[parentId?.substring(0, 36)] || {};
        nextPossibleCandidate = parentId;
        setTab(tabIndex);
        if (tabIndex !== currentTab) {
          isComponentVisibleInParent = false;
        }
      }

      // If the component exists inside a modal component
      if (currentPageComponents?.[parentId]?.component?.component === 'Modal') {
        nextPossibleCandidate = parentId;
        if (!modalsOpenOnCanvas.includes(parentId)) {
          isComponentVisibleInParent = false;
        }
      }

      // If the component exists inside the kanban component's modal
      if (parentId.endsWith('-modal')) {
        nextPossibleCandidate = parentId.replace(/-modal$/, ''); // Extract kanban id from parent id
        if (!modalsOpenOnCanvas.includes(parentId)) {
          isComponentVisibleInParent = false;
        }
      }

      // If the open modal contains the component
      if (modalsOpenOnCanvas[modalsOpenOnCanvas.length - 1] === parentId) {
        isInsideOpenModal = true;
      }

      if (!isComponentVisibleInParent) {
        targetComponentId = nextPossibleCandidate;
      }
      current = nextPossibleCandidate;
    }

    if (modalsOpenOnCanvas.length > 0 && !isInsideOpenModal) {
      const targetId = visited.size === 1 ? modalsOpenOnCanvas[modalsOpenOnCanvas.length - 1] : current;
      const componentName = currentPageComponents?.[targetId]?.component?.name;

      return {
        isAccessible: false,
        computedComponentId: componentName,
        isOnCanvas: visited.size === 1,
      };
    }

    return {
      isAccessible: true,
      computedComponentId: targetComponentId,
    };
  },
});
