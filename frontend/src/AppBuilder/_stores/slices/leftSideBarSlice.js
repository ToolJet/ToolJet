const validSidebarItems = ['pages', 'components', 'queries', 'libraries', 'dependencies', 'apphistory', 'settings'];
const storedIsSidebarPinned = localStorage.getItem('isLeftSideBarPinned') === 'true' ? true : false;
const storedSelectedSidebarItem = !storedIsSidebarPinned
  ? null
  : localStorage.getItem('selectedSidebarItem') &&
      validSidebarItems.includes(localStorage.getItem('selectedSidebarItem'))
    ? localStorage.getItem('selectedSidebarItem')
    : 'pages';

const initialState = {
  isLeftSideBarPinned: storedIsSidebarPinned,
  selectedSidebarItem: storedIsSidebarPinned ? storedSelectedSidebarItem : null,
  isSidebarOpen: storedIsSidebarPinned,
  pathToBeInspected: null,
  // One-shot deep link into the Dependencies panel: { kind: 'component' | 'query' | 'variable', id }.
  // The panel owns its own selection, so this only seeds it — DependencyViewer clears the
  // field once consumed, which is what lets the same entity be requested twice in a row.
  dependencyPanelSelection: null,
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
      () => ({
        isSidebarOpen,
        ...(!isSidebarOpen && {
          selectedSidebarItem: null,
          pathToBeInspected: null,
          dependencyPanelSelection: null,
        }),
      }),
      false,
      'setIsSidebarOpen'
    ),
  // The AI chat is the 'tooljetai' left panel. Opening it replaces whichever left panel is showing;
  // closing it empties the left slot only when the chat is what's in it.
  setAiChatOpen: (open) => {
    if (open) {
      set(() => ({ selectedSidebarItem: 'tooljetai', isSidebarOpen: true }), false, 'setAiChatOpen');
      return;
    }
    const { selectedSidebarItem, isSidebarOpen, toggleLeftSidebar } = get();
    if (selectedSidebarItem === 'tooljetai' && isSidebarOpen) toggleLeftSidebar(false);
  },
  setPathToBeInspected: (pathToBeInspected) => set(() => ({ pathToBeInspected }), false, 'setPathToBeInspected'),
  setComponentToInspect: (componentToInspect) =>
    get().queryPanel.openRuntimeInspector(`components.${componentToInspect}`),
  clearDependencyPanelSelection: () =>
    set(() => ({ dependencyPanelSelection: null }), false, 'clearDependencyPanelSelection'),
  /**
   * Open the Dependencies panel focused on one entity. Mirrors setComponentToInspect,
   * which does the same for the state inspector.
   *
   * An entity with no relationships is filtered out of the panel's lists by design, so the
   * panel falls back to the full list — the deep link is a request, not a guarantee.
   */
  setEntityToViewDependencies: (selection) => {
    const { setSelectedSidebarItem, toggleLeftSidebar } = get();
    set(() => ({ dependencyPanelSelection: selection }), false, 'setEntityToViewDependencies');
    setSelectedSidebarItem('dependencies');
    toggleLeftSidebar(true);
  },
  /**
   * Where "Go to component" should land. A child of a closed modal resolves to the modal (the only
   * part of it on the canvas); a tab child gets its tab switched to; anything outside an open modal
   * is reported as not accessible, with the name of the modal that is in the way.
   */
  getComponentIdToAutoScroll: (componentId, moduleId = 'canvas') => {
    const { getCurrentPageComponents, getAllExposedValues, modalsOpenOnCanvas } = get();
    const currentPageComponents = getCurrentPageComponents(moduleId) ?? {};
    const exposedComponents = getAllExposedValues(moduleId).components ?? {};

    // A parent is either a component id or one of its slots: "<id>-<tab id>", "<id>-header", "<id>-modal", …
    const ownerIdOf = (slotId) => (slotId.length > 36 ? slotId.slice(0, 36) : slotId);
    const typeOf = (id) => currentPageComponents[id]?.component?.component;
    const nameOf = (id) => currentPageComponents[id]?.component?.name;

    // Modal and Kanban register their open slot in modalsOpenOnCanvas; ModalV2 only exposes `show`.
    const openModalIds = [
      ...modalsOpenOnCanvas.map(ownerIdOf),
      ...Object.keys(currentPageComponents).filter((id) => typeOf(id) === 'ModalV2' && exposedComponents[id]?.show),
    ];
    const isSlotOpen = (slotId) =>
      typeOf(ownerIdOf(slotId)) === 'ModalV2'
        ? openModalIds.includes(ownerIdOf(slotId))
        : modalsOpenOnCanvas.includes(slotId);

    let targetComponentId = componentId;
    let current = componentId;
    const visited = new Set();
    let isInsideOpenModal = false;
    let closedModalId = null;

    // Bubble up to the outermost parent to find the target component
    while (!visited.has(current)) {
      visited.add(current);

      const parentSlotId = currentPageComponents[current]?.component?.parent;
      if (!parentSlotId) break;
      const parentId = ownerIdOf(parentSlotId);
      const parentType = typeOf(parentId);

      // Inside a tab: switch to it, which puts the component on screen.
      if (parentType === 'Tabs') {
        exposedComponents[parentId]?.setTab?.(parentSlotId.slice(37));
      }

      const isModalSlot = parentType === 'Modal' || parentType === 'ModalV2' || parentSlotId.endsWith('-modal');
      if (isModalSlot) {
        if (isSlotOpen(parentSlotId)) {
          isInsideOpenModal = true;
        } else {
          targetComponentId = parentId;
          closedModalId = parentId;
        }
      }

      current = parentId;
    }

    if (openModalIds.length > 0 && !isInsideOpenModal) {
      return {
        isAccessible: false,
        computedComponentId: nameOf(closedModalId ?? openModalIds[openModalIds.length - 1]),
        isOnCanvas: !closedModalId,
      };
    }

    return {
      isAccessible: true,
      computedComponentId: targetComponentId,
    };
  },
});
