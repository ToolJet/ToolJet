const initialState = {
  currentLayout: 'desktop',
  canvasWidth: 1092,
  canvasBackground: {},
  showToggleLayoutBtn: true,
  showUndoRedoBtn: true,
  showFullWidth: false,
};

export const createLayoutSlice = (set, get) => ({
  ...initialState,
  // A component hidden by the incoming layout gets unmounted by WidgetWrapper,
  // but its exposed value (often only computed on mount) is never cleared, so
  // it goes stale. Clear it for top-level components whose own visibility
  // flag now hides them — but, unlike a real deletion, leave the dependency
  // graph node/edges alone: the component still exists and will remount and
  // recompute its value the next time it's shown, and dependents can only
  // pick that up automatically if the edge to them survives the hide.
  clearExposedValuesHiddenByLayout: (nextLayout) => {
    const { modules, getCurrentPageComponents, getResolvedComponent, updateDependencyValues } = get();
    const displayProperty = nextLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop';

    Object.keys(modules || {}).forEach((moduleId) => {
      const components = getCurrentPageComponents(moduleId) || {};
      const exposedValuesByComponent = get().resolvedStore.modules[moduleId]?.exposedValues?.components;
      if (!exposedValuesByComponent) return;

      Object.keys(components).forEach((componentId) => {
        const existingExposedValue = exposedValuesByComponent[componentId];
        if (!existingExposedValue) return;

        const canShowInNextLayout = getResolvedComponent(componentId, null, moduleId)?.others?.[displayProperty];
        if (canShowInNextLayout !== false) return;

        const keys = Object.keys(existingExposedValue);
        set((state) => {
          delete state.resolvedStore.modules[moduleId].exposedValues.components[componentId];
        });
        keys.forEach((key) => updateDependencyValues(`components.${componentId}.${key}`, moduleId));
      });
    });
  },
  toggleCurrentLayout: (currentLayout) => {
    get().clearSelectedComponents();
    // temporaryLayouts hold the previous layout's reflow output (keyed only by
    // componentId, not layout). Clearing prevents desktop reflow results from
    // being applied to the mobile canonical (or vice versa) for the one frame
    // before useDynamicHeight re-fires.
    get().clearTemporaryLayouts();
    get().clearExposedValuesHiddenByLayout(currentLayout);
    set({ currentLayout }, false, {
      type: 'TOGGLE_CURRENT_LAYOUT',
      currentLayout,
    });
  },
  setCanvasWidth: (editorCanvasWidth) => set({ editorCanvasWidth }),
  setCanvasBackground: (canvasBackground) => set({ canvasBackground }),
  setCurrentLayout: (currentLayout) => {
    get().clearSelectedComponents();
    get().clearTemporaryLayouts();
    get().clearExposedValuesHiddenByLayout(currentLayout);
    set({ currentLayout }, false, 'setCurrentLayout');
  },
  setShowToggleLayoutBtn: (show) => set({ showToggleLayoutBtn: show }),
  setShowUndoRedoBtn: (show) => set({ showUndoRedoBtn: show }),
  setShowFullWidth: (show) => set({ showFullWidth: show }),
});
