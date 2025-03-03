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
    const { getCurrentPageComponents, getAllExposedValues, modalsOpenOnCanvas } = get();
    const currentPageComponents = getCurrentPageComponents();

    let candidate = componentId;
    let current = componentId;
    const visited = new Set();
    let closedUnusedModals = false; // Flag to check if we have closed all unused modals on the canvas

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (visited.has(current)) break;
      visited.add(current);

      const component = currentPageComponents?.[current];
      if (!component) break;

      const parentId = component?.component?.parent;
      if (!parentId) break;

      let isParentInactive = false;
      let newCandidate = candidate;

      // If the component exists inside a tab component
      const regForTabs = /-(?!\d{12}$)\d+$/; // Parent id for tabs follow the format 'id-index' and index is not UUIDv4 id segment
      if (regForTabs.test(parentId)) {
        const reg = /-(\d+)$/;
        const tabIndex = Number(parentId.match(reg)[1]); // Tab index inside which the component exists

        const tabId = parentId.replace(regForTabs, ''); // Extract tab id from parent id
        const { currentTab } = getAllExposedValues().components[tabId];
        const activeTabIndex = Number(currentTab);

        if (tabIndex !== activeTabIndex) {
          isParentInactive = true;
          newCandidate = tabId;
        }
      }

      const parentExposedValues = getAllExposedValues().components[parentId];

      // If the component exists inside a modal component
      if (currentPageComponents?.[parentId]?.component?.component === 'Modal') {
        // Close all modals that are open on the canvas until we get to the parent modal
        if (modalsOpenOnCanvas.length > 0 && !closedUnusedModals) {
          if (!modalsOpenOnCanvas.includes(parentId)) {
            modalsOpenOnCanvas.map((modalId) => getAllExposedValues().components[modalId]?.close());
          } else {
            const idx = modalsOpenOnCanvas.indexOf(parentId);
            modalsOpenOnCanvas.slice(idx + 1).map((modalId) => getAllExposedValues().components[modalId]?.close());
          }
          closedUnusedModals = true;
        }

        if (!parentExposedValues?.show) {
          isParentInactive = true;
          newCandidate = parentId;
        }
      }

      // If the component exists inside the kanban component's modal
      if (parentId.endsWith('-modal')) {
        isParentInactive = true;
        newCandidate = parentId.replace(/-modal$/, ''); // Extract kanban id from parent id
      }

      if (isParentInactive) {
        candidate = newCandidate;
        current = newCandidate;
      } else {
        current = parentId;
      }
    }

    // Close all modals that are open on the canvas if the component is not inside any of the modals
    if (modalsOpenOnCanvas.length > 0 && !closedUnusedModals) {
      modalsOpenOnCanvas.map((modalId) => getAllExposedValues().components[modalId]?.close());
    }

    return candidate;
  },
});
