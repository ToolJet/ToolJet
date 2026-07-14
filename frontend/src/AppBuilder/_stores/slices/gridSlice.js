import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { debounce } from 'lodash';
import {
  bindModuleAwareGetResolvedComponent,
  buildReflowPatch,
  getDynamicElementSelector,
  getDynamicLayoutKey,
  getNextBubbleContext,
  getNextBubbleTargetId,
  normalizeLayoutContext,
  resolveContainerHeight,
  resolveWidgetMeasuredHeight,
  resolveWidgetVisibility,
  shouldBubbleToParent,
} from '../utils/dynamicHeightReflow';

// ─────────────────────────────────────────────────────────────────────────────
// Grid slice — owns the mutable reflow state for dynamic-height layout.
//
// State kept here:
//   - temporaryLayouts: per-widget override layouts (top/height) that the reflow
//     engine writes after every pass. WidgetWrapper reads these to override
//     canonical layouts during render. Cleared lazily (not on every reflow).
//   - draggingComponentId / resizingComponentId / isGroupDragging / isGroupResizing:
//     coarse UI flags consumed by mouse/keyboard handlers to decide whether to
//     select, reflow, or noop.
//   - reorderContainerChildren: incremented to trigger Tab-panel children to
//     re-order on tab switches.
//
// The meat of dynamic-height reflow lives in `flushReflows` below, fed by the
// `scheduleReflow` batcher.
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
  // Batch reflow scheduler. Collects adjustComponentPositions requests that
  // arrive in the same JS tick (e.g. 50 Tables in a ListView all reporting
  // height changes on data load), fires them in one shared rAF, and lets
  // flushReflows process them together — one setTemporaryLayouts write and
  // one incrementCanvasUpdater instead of N×2.
  const _pendingReflows = new Map();
  let _reflowRafId = null;

  const scheduleReflow = (id, layout, isContainer, contextIndices, moduleId) => {
    const ctxKey = contextIndices ? contextIndices.join('.') : '';
    const key = `${id}|${layout}|${isContainer ? '1' : '0'}|${ctxKey}|${moduleId || 'canvas'}`;
    _pendingReflows.set(key, { id, layout, isContainer, contextIndices, moduleId: moduleId || 'canvas' });
    if (_reflowRafId === null) {
      _reflowRafId = requestAnimationFrame(() => {
        _reflowRafId = null;
        const pending = [..._pendingReflows.values()];
        _pendingReflows.clear();
        get().flushReflows(pending);
      });
    }
  };

  return {
    ...initialState,
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
    deleteTemporaryLayouts: (componentId) => {
      const { temporaryLayouts } = get();
      const newLayouts = { ...temporaryLayouts };
      delete newLayouts[componentId];
      set(() => ({ temporaryLayouts: newLayouts }));
    },
    deleteContainerTemporaryLayouts: (containerId) => {
      const { deleteTemporaryLayouts, getCurrentPageComponents, currentLayout = 'desktop' } = get();
      deleteTemporaryLayouts(containerId);
      const currentPageComponents = getCurrentPageComponents();
      const height = currentPageComponents?.[containerId].layouts[currentLayout].height;
      const element = document.querySelector(`.ele-${containerId}`);
      if (element) {
        element.style.height = `${height}px`;
      }
    },

    // Clear temp layouts for a single container across all its subcontainer
    // contexts (widget-level key + every row-index / slot-suffixed key). Used
    // on dynamic-height toggle-off so the container's own inflated height
    // override is dropped and WidgetWrapper immediately reads canonical.
    //
    // Descendants' own temps are NOT cleared — a TextArea inside the container
    // keeps its own grown height (it's still grown), and a Button shifted to
    // accommodate that TextArea stays shifted (the shift is still accurate).
    // Descendants overflow/clip inside the now-canonical-sized container,
    // which is the expected non-dynamic semantics.
    //
    // `contextPrefix` scopes to a branch (e.g., a Listview nested inside a
    // parent row passes the parent row context so sibling rows stay untouched).
    // `null`/empty matches the container's key at any context.
    clearContainerTempLayouts: (containerId, contextPrefix = null) => {
      const normalizedPrefix = normalizeLayoutContext(contextPrefix);
      const prefix = normalizedPrefix ? normalizedPrefix.join('.') : null;
      const matches = (key) => {
        if (!prefix) {
          return key === containerId || key.startsWith(`${containerId}-`);
        }
        return key === `${containerId}-${prefix}` || key.startsWith(`${containerId}-${prefix}.`);
      };

      set((state) => {
        const next = {};
        let changed = false;
        for (const [key, value] of Object.entries(state.temporaryLayouts || {})) {
          if (matches(key)) {
            changed = true;
            continue;
          }
          next[key] = value;
        }
        return changed ? { temporaryLayouts: next } : {};
      });
    },

    // ───────────────────────────────────────────────────────────────────────────
    // flushReflows — the single entry point for dynamic-height reflow. Fed by the
    // `scheduleReflow` batcher, which coalesces requests from `useDynamicHeight`
    // (widget size/visibility/content/mount changes) into one animation frame.
    //
    // Processes a batch of requests together: `processOne` handles each widget and
    // queues bubble targets into nextBubbles (not immediate recursive store calls).
    // The while loop walks the entire bubble chain to completion before writing the
    // store — one setTemporaryLayouts + one incrementCanvasUpdater for the whole
    // reflow tree (instead of N×2).
    //
    // Per-widget flow (processOne):
    //   1. Resolve the changed widget's visibility and target height.
    //      - For container-like widgets (Container, Form, Tabs, Accordion,
    //        Listview, Modal body) `resolveContainerHeight` computes the target
    //        height from child layouts.
    //      - For leaf widgets `resolveWidgetMeasuredHeight` reads the rendered
    //        DOM `offsetHeight`; falls back to the last temp layout or canonical.
    //   2. Short-circuit for ModalV2 bodies: write a synthetic `-body` key into
    //      mergedPatch and return. Modal bodies aren't grid siblings, so the
    //      usual sibling-reflow path doesn't apply.
    //   3. Collect siblings (same `parent` id) and build visibility + resolved-
    //      height maps. `resolvedHeights[componentId]` is the changed widget's
    //      new target height; siblings use `calculateMoveableBoxHeightWithId` so
    //      top-label inputs keep their bumped height.
    //   4. Call `buildReflowPatch` (in dynamicHeightReflow.js) to produce
    //      `temporaryLayoutPatch`: per-sibling {top, height} overrides, merged
    //      into mergedPatch.
    //   5. Queue the parent context as a bubble target if appropriate, so child
    //      growth propagates upward (container / tab / listview row / form /
    //      accordion / canvas) on the next pass of the while loop.
    // ───────────────────────────────────────────────────────────────────────────
    flushReflows: (requests) => {
      const {
        getCurrentPageComponents,
        setTemporaryLayouts,
        incrementCanvasUpdater,
        getResolvedComponent,
        getComponentTypeFromId,
        getComponentDefinition,
        getExposedPropertyForAdditionalActions,
        getResolvedValue,
        getContainerChildrenMapping,
        getBaseParentId,
        calculateMoveableBoxHeightWithId,
      } = get();

      const baseTemporaryLayouts = get().temporaryLayouts;
      const mergedPatch = {};

      const processOne = (componentId, currentLayout, isContainer, contextIndices, nextBubbles, moduleId) => {
        try {
          const temporaryLayouts = { ...baseTemporaryLayouts, ...mergedPatch };
          const currentPageComponents = getCurrentPageComponents(moduleId);
          const componentType = getComponentTypeFromId(componentId, moduleId);
          const changedComponent = currentPageComponents?.[componentId];

          if (!changedComponent) return;

          const boundGetResolvedComponent = bindModuleAwareGetResolvedComponent(
            getResolvedComponent,
            getComponentTypeFromId,
            moduleId
          );
          const boundGetComponentDefinition = (id) => getComponentDefinition(id, moduleId);
          const boundGetExposedPropertyForAdditionalActions = (id, ctx, prop) =>
            getExposedPropertyForAdditionalActions(id, ctx, prop, moduleId);
          const boundCalculateMoveableBoxHeightWithId = (id, layout, stylesDef) =>
            calculateMoveableBoxHeightWithId(id, layout, stylesDef, moduleId);
          const boundGetResolvedValue = (value, customVars) => getResolvedValue(value, customVars, moduleId);

          const visibility = resolveWidgetVisibility({
            componentId,
            contextIndices,
            currentLayout,
            getResolvedComponent: boundGetResolvedComponent,
            getExposedPropertyForAdditionalActions: boundGetExposedPropertyForAdditionalActions,
          });

          const containerHeight = resolveContainerHeight({
            componentId,
            componentType,
            currentLayout,
            currentPageComponents,
            temporaryLayouts,
            contextIndices,
            visibility,
            getResolvedComponent: boundGetResolvedComponent,
            getResolvedValue: boundGetResolvedValue,
            getComponentDefinition: boundGetComponentDefinition,
            getContainerChildrenMapping,
            getExposedPropertyForAdditionalActions: boundGetExposedPropertyForAdditionalActions,
            calculateMoveableBoxHeightWithId: boundCalculateMoveableBoxHeightWithId,
          });

          const newHeight = resolveWidgetMeasuredHeight({
            componentId,
            componentType,
            currentLayout,
            currentPageComponents,
            temporaryLayouts,
            contextIndices,
            isContainer,
            visibility,
            containerHeight,
            calculateMoveableBoxHeightWithId: boundCalculateMoveableBoxHeightWithId,
          });

          if (componentType === 'ModalV2' && isContainer) {
            mergedPatch[getDynamicLayoutKey(componentId, contextIndices, '-body')] = {
              ...changedComponent.layouts[currentLayout],
              ...temporaryLayouts?.[getDynamicLayoutKey(componentId, contextIndices, '-body')],
              height: newHeight,
            };
            return;
          }

          if (componentType === 'Listview' && contextIndices && isContainer) {
            const scopedElement = document.querySelector(getDynamicElementSelector(componentId, contextIndices));
            if (!scopedElement) {
              mergedPatch[getDynamicLayoutKey(componentId, contextIndices)] = {
                ...changedComponent.layouts[currentLayout],
                ...temporaryLayouts?.[getDynamicLayoutKey(componentId, contextIndices)],
                height: newHeight,
              };
              const nextCtx = contextIndices.length > 1 ? contextIndices.slice(0, -1) : null;
              const selfKey = `${componentId}|${currentLayout}|${nextCtx ? nextCtx.join('.') : ''}`;
              nextBubbles.set(selfKey, { id: componentId, layout: currentLayout, contextIndices: nextCtx, moduleId });
              return;
            }
          }

          const parentId = changedComponent?.component?.parent ?? null;
          const siblingIds = Object.keys(currentPageComponents).filter(
            (id) => (currentPageComponents[id]?.component?.parent ?? null) === parentId
          );

          const visibleMap = siblingIds.reduce((acc, siblingId) => {
            acc[siblingId] = resolveWidgetVisibility({
              componentId: siblingId,
              contextIndices,
              currentLayout,
              getResolvedComponent: boundGetResolvedComponent,
              getExposedPropertyForAdditionalActions: boundGetExposedPropertyForAdditionalActions,
            });
            return acc;
          }, {});

          const inFlowMap = siblingIds.reduce((acc, siblingId) => {
            if (visibleMap[siblingId]) {
              acc[siblingId] = true;
              return acc;
            }
            const resolved = boundGetResolvedComponent(siblingId, contextIndices);
            acc[siblingId] = !(resolved?.properties?.collapseWhenHidden ?? false);
            return acc;
          }, {});

          const collapseWhenHiddenMap = siblingIds.reduce((acc, siblingId) => {
            const resolved = boundGetResolvedComponent(siblingId, contextIndices);
            acc[siblingId] = resolved?.properties?.collapseWhenHidden === true;
            return acc;
          }, {});

          const resolvedHeights = siblingIds.reduce((acc, siblingId) => {
            const existingTemp = temporaryLayouts?.[getDynamicLayoutKey(siblingId, contextIndices)];
            if (existingTemp?.height != null && existingTemp.height > 0) {
              acc[siblingId] = existingTemp.height;
              return acc;
            }
            const siblingDef = boundGetComponentDefinition(siblingId);
            acc[siblingId] = boundCalculateMoveableBoxHeightWithId(
              siblingId,
              currentLayout,
              siblingDef?.component?.definition?.styles
            );
            return acc;
          }, {});
          resolvedHeights[componentId] = newHeight;

          const { temporaryLayoutPatch } = buildReflowPatch({
            changedComponentId: componentId,
            componentIds: siblingIds,
            currentLayout,
            currentPageComponents,
            temporaryLayouts,
            contextIndices,
            inFlowMap,
            resolvedHeights,
            collapseWhenHiddenMap,
            calculateMoveableBoxHeightWithId: boundCalculateMoveableBoxHeightWithId,
            getComponentDefinition: boundGetComponentDefinition,
          });

          if (Object.keys(temporaryLayoutPatch).length === 0) return;

          if (isContainer && componentType !== 'Listview') {
            const element = document.querySelector(getDynamicElementSelector(componentId, contextIndices));
            if (element && visibility) element.style.height = `${newHeight}px`;
          }

          // Embedded ModuleContainer renders flush (WidgetWrapper forces top:0);
          // pin its temp top to 0 so the transform & canvas-height math match.
          // moduleId === 'canvas' is the module editor, where it keeps canonical top.
          if (componentType === 'ModuleContainer' && moduleId !== 'canvas') {
            const moduleContainerKey = getDynamicLayoutKey(componentId, contextIndices);
            if (temporaryLayoutPatch[moduleContainerKey]) {
              temporaryLayoutPatch[moduleContainerKey] = { ...temporaryLayoutPatch[moduleContainerKey], top: 0 };
            }
          }

          Object.assign(mergedPatch, temporaryLayoutPatch);

          const scopedElement = contextIndices
            ? document.querySelector(getDynamicElementSelector(componentId, contextIndices))
            : null;
          const nextBubbleTargetId = getNextBubbleTargetId({
            componentId,
            componentType,
            parentId,
            contextIndices,
            getBaseParentId,
            isScopedContextRenderable: !!scopedElement,
            currentPageComponents,
          });
          const nextBubbleContext = getNextBubbleContext(
            componentType,
            contextIndices,
            componentId,
            nextBubbleTargetId
          );
          const nextBubbleResolved = nextBubbleTargetId
            ? boundGetResolvedComponent(nextBubbleTargetId, nextBubbleContext)
            : null;
          const nextBubbleHasDynamicHeight = nextBubbleResolved?.properties?.dynamicHeight !== false;

          if (
            nextBubbleHasDynamicHeight &&
            shouldBubbleToParent({
              currentComponentId: componentId,
              nextComponentId: nextBubbleTargetId,
              currentContextIndices: contextIndices,
              nextContextIndices: nextBubbleContext,
            })
          ) {
            const bubbleKey = `${nextBubbleTargetId}|${currentLayout}|${
              nextBubbleContext ? nextBubbleContext.join('.') : ''
            }`;
            nextBubbles.set(bubbleKey, {
              id: nextBubbleTargetId,
              layout: currentLayout,
              contextIndices: nextBubbleContext,
              moduleId,
            });
          }
        } catch (error) {
          console.error('flushReflows: error processing component', componentId, error);
        }
      };

      const initialBubbles = new Map();
      for (const { id, layout, isContainer, contextIndices, moduleId } of requests) {
        processOne(id, layout, isContainer, contextIndices, initialBubbles, moduleId);
      }

      let bubblesToProcess = initialBubbles;
      while (bubblesToProcess.size > 0) {
        const nextBubbles = new Map();
        for (const { id, layout, contextIndices, moduleId } of bubblesToProcess.values()) {
          processOne(id, layout, true, contextIndices, nextBubbles, moduleId);
        }
        bubblesToProcess = nextBubbles;
      }

      if (Object.keys(mergedPatch).length > 0) {
        setTemporaryLayouts(mergedPatch);
        incrementCanvasUpdater();
      }
    },

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
