import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { debounce } from 'lodash';
import { createDynamicHeightScheduler } from '../dynamicHeight/scheduler';

// ─────────────────────────────────────────────────────────────────────────────
// Grid slice: the canvas's layout state while the app runs.
//
// State kept here:
//   - temporaryLayouts: where each widget is drawn right now ({ top, height },
//     or { height } for a flex child, a List view row or a modal body). The
//     dynamic height engine (dynamicHeight/engine.js) writes it, once per
//     frame, through the scheduler created below; WidgetWrapper lays it over
//     the saved layout. Saved layouts are never changed by it.
//   - draggingComponentId / resizingComponentId / isGroupDragging / isGroupResizing:
//     coarse UI flags consumed by mouse/keyboard handlers to decide whether to
//     select, move or do nothing.
//   - reorderContainerChildren: incremented to trigger Tab-panel children to
//     re-order on tab switches.
// ─────────────────────────────────────────────────────────────────────────────

const initialState = {
  triggerCanvasUpdater: 0,
  lastCanvasIdClick: '',
  lastCanvasClickPosition: null,
  temporaryLayouts: {},
  draggingComponentId: null,
  resizingComponentId: null,
  isGroupDragging: false,
  isGroupResizing: false,
  reorderContainerChildren: {
    containerId: null,
    triggerUpdate: 0,
  },
  flexContainerDropTarget: null,
};

export const createGridSlice = (set, get) => {
  // The app's dynamic height scheduler (dynamicHeight/scheduler.js): it owns the height registry and runs the
  // engine once per frame. One per store, kept here rather than in state: it holds pending work and DOM observers,
  // which are not app state. Widgets reach it through getDynamicHeightScheduler.
  const dynamicHeightScheduler = createDynamicHeightScheduler({ getState: get });

  // The old entry point, kept for its remaining callers (RenderWidget's collapse when hidden; moved in B3): a widget
  // asks to be sized again, and the scheduler runs the engine on the next frame. The layout and container flag the
  // old engine needed are worked out by the new one.
  const scheduleReflow = (id, _layout, _isContainer, contextIndices, moduleId) =>
    dynamicHeightScheduler.scheduleDynamicHeight({
      id,
      contextIndices: contextIndices ?? null,
      moduleId: moduleId || 'canvas',
    });

  return {
    ...initialState,
    getDynamicHeightScheduler: () => dynamicHeightScheduler,
    scheduleReflow,
    setFlexContainerDropTarget: (payload) =>
      set((state) => {
        const current = state.flexContainerDropTarget;
        if (
          current === payload ||
          (current?.flexContainerId === payload?.flexContainerId && current?.index === payload?.index)
        ) {
          return;
        }

        state.flexContainerDropTarget = payload;
      }),
    checkHoveredComponentDynamicHeight: (id) => {
      const { getResolvedComponent } = get();
      const resolvedProperties = getResolvedComponent(id)?.properties;
      const { dynamicHeight } = resolvedProperties || {};
      return dynamicHeight;
    },
    incrementCanvasUpdater: () =>
      set((state) => ({ triggerCanvasUpdater: state.triggerCanvasUpdater + 1 }), false, {
        type: 'incrementCanvasUpdater',
      }),
    debouncedIncrementCanvasUpdater: debounce(() => {
      get().incrementCanvasUpdater();
    }, 200),
    setDraggingComponentId: (id) => set(() => ({ draggingComponentId: id })),
    setResizingComponentId: (id) => set(() => ({ resizingComponentId: id })),
    setIsGroupDragging: (isGroupDragging) => set(() => ({ isGroupDragging: isGroupDragging })),
    setIsGroupResizing: (isGroupResizing) => set(() => ({ isGroupResizing: isGroupResizing })),
    moveComponentPosition: (direction) => {
      const { setComponentLayout, currentLayout, getSelectedComponentsDefinition, debouncedIncrementCanvasUpdater } =
        get();
      let layouts = {};
      const selectedComponents = getSelectedComponentsDefinition();
      selectedComponents.forEach((selectedComponent) => {
        const componentId = selectedComponent?.id;

        let top = selectedComponent.layouts?.[currentLayout].top;
        let left = selectedComponent?.layouts?.[currentLayout].left;
        const width = selectedComponent?.layouts?.[currentLayout]?.width;

        switch (direction) {
          case 'ArrowLeft':
            left = left - 1;
            break;
          case 'ArrowRight':
            left = left + 1;
            break;
          case 'ArrowDown':
            top = top + 10;
            break;
          case 'ArrowUp':
            top = top - 10;
            break;
        }

        if (left < 0 || top < 0 || left + width > NO_OF_GRIDS) {
          return;
        }

        const movedElement = document.getElementById(componentId);
        const parentElm = movedElement.closest('.real-canvas');
        if (selectedComponent?.component?.parent && parentElm.scrollHeight < top + movedElement.clientHeight) {
          return;
        }
        layouts = {
          ...layouts,
          [componentId]: {
            top,
            left,
          },
        };
      });
      setComponentLayout(layouts);
      debouncedIncrementCanvasUpdater();
    },
    setLastCanvasIdClick: (id) => set(() => ({ lastCanvasIdClick: id })),
    setLastCanvasClickPosition: (position) => {
      set({ lastCanvasClickPosition: position });
    },
    setTemporaryLayouts: (layouts) => set((state) => ({ temporaryLayouts: { ...state.temporaryLayouts, ...layouts } })),
    getTemporaryLayouts: () => get().temporaryLayouts,
    clearTemporaryLayouts: () => set(() => ({ temporaryLayouts: {} })),
    setReorderContainerChildren: (containerId) => {
      // Function to trigger reordering of specific container for tab navigation
      set((state) => ({
        reorderContainerChildren: { containerId, triggerUpdate: state.reorderContainerChildren.triggerUpdate + 1 },
      }));
    },
    handleCanvasContainerMouseUp: (e) => {
      const {
        clearSelectedComponents,
        isGroupResizing,
        isGroupDragging,
        setCanvasHeaderSelected,
        setCanvasFooterSelected,
        draggingComponentId,
        resizingComponentId,
      } = get();
      const selectedText = window.getSelection().toString();
      const isClickedOnSubcontainer =
        e.target.getAttribute('component-id') !== null && e.target.getAttribute('component-id') !== 'canvas';

      const isClickedOnCanvasHeader = e.target.getAttribute('component-id') === 'canvas-header';
      const isClickedOnCanvasFooter = e.target.getAttribute('component-id') === 'canvas-footer';

      const isMovingComponent = draggingComponentId || resizingComponentId || isGroupDragging || isGroupResizing;

      if (!isMovingComponent && isClickedOnCanvasHeader) {
        setCanvasHeaderSelected(true);
      } else if (!isMovingComponent && isClickedOnCanvasFooter) {
        setCanvasFooterSelected(true);
      }

      // Check if any inspector popover is currently open
      const isInspectorPopoverOpen = () => {
        const selector = [
          '#codehinter-preview-box-popover',
          '.inspector-select-options-popover',
          '.inspector-event-manager-popover',
          '.inspector-steps-options-popover',
          '.table-column-popover',
          '.table-action-popover',
          '.codebuilder-color-swatches-popover',
          '.boxshadow-picker-popover',
          '.color-picker-popover',
          '.dropdown-menu-container',
          '.inspector-select.react-select__menu-list',
          '.icon-widget-popover',
          '.inspector-header-actions-menu',
          '.nav-item-popover',
          '.nav-item-actions-popover',
          '.nav-add-menu-popover',
        ].join(',');
        return !!document.querySelector(selector);
      };

      if (
        !isClickedOnSubcontainer &&
        ['rm-container', 'real-canvas', 'modal'].includes(e.target.id) &&
        !selectedText &&
        !isInspectorPopoverOpen() &&
        !isGroupResizing &&
        !isGroupDragging
      ) {
        clearSelectedComponents();
      }
    },
  };
};
