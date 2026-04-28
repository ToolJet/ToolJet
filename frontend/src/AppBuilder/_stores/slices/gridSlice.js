import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { debounce } from 'lodash';
import {
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
// The meat of dynamic-height reflow lives in `adjustComponentPositions` below.
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
};

export const createGridSlice = (set, get) => ({
  ...initialState,
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
  // adjustComponentPositions — the single entry point for dynamic-height
  // reflow. Invoked by `useDynamicHeight` whenever a widget changes size,
  // visibility, content, or mounts.
  //
  // Flow:
  //   1. Resolve the changed widget's visibility and target height.
  //      - For container-like widgets (Container, Form, Tabs, Accordion,
  //        Listview, Modal body) `resolveContainerHeight` computes the target
  //        height from child layouts.
  //      - For leaf widgets `resolveWidgetMeasuredHeight` reads the rendered
  //        DOM `offsetHeight`; falls back to the last temp layout or canonical.
  //   2. Short-circuit for ModalV2 bodies: write a synthetic `-body` key into
  //      temporaryLayouts and return. Modal bodies aren't grid siblings, so the
  //      usual sibling-reflow path doesn't apply.
  //   3. Collect siblings (same `parent` id) and build visibility + resolved-
  //      height maps. `resolvedHeights[componentId]` is the changed widget's
  //      new target height; siblings use `calculateMoveableBoxHeightWithId` so
  //      top-label inputs keep their bumped height.
  //   4. Call `buildReflowPatch` (in dynamicHeightReflow.js) to produce
  //      `temporaryLayoutPatch`: per-sibling {top, height} overrides.
  //   5. Write the patch, bump `triggerCanvasUpdater`, then bubble to the
  //      parent context if appropriate. Bubbling re-runs the same flow on the
  //      parent (container / tab / listview row / form / accordion / canvas)
  //      so child growth propagates upward.
  // ───────────────────────────────────────────────────────────────────────────
  adjustComponentPositions: (componentId, currentLayout = 'desktop', isContainer = false, subContainerIndex = null) => {
    const {
      getCurrentPageComponents,
      setTemporaryLayouts,
      incrementCanvasUpdater,
      temporaryLayouts,
      adjustComponentPositions,
      getResolvedComponent,
      getComponentTypeFromId,
      getComponentDefinition,
      getExposedPropertyForAdditionalActions,
      getResolvedValue,
      getContainerChildrenMapping,
      getBaseParentId,
      calculateMoveableBoxHeightWithId,
    } = get();

    try {
      const currentPageComponents = getCurrentPageComponents();
      const componentType = getComponentTypeFromId(componentId);
      const contextIndices = normalizeLayoutContext(subContainerIndex);
      const changedComponent = currentPageComponents?.[componentId];

      if (!changedComponent) {
        return null;
      }

      // Resolve visibility from exposed state → properties.visibility → styles.visibility,
      // overridden to false by `others.showOnMobile/Desktop === false`.
      const visibility = resolveWidgetVisibility({
        componentId,
        contextIndices,
        currentLayout,
        getResolvedComponent,
        getExposedPropertyForAdditionalActions,
      });

      // Compute the container-derived target height. Only meaningful when the
      // changed widget is a container; leaf widgets ignore this.
      const containerHeight = resolveContainerHeight({
        componentId,
        componentType,
        currentLayout,
        currentPageComponents,
        temporaryLayouts,
        contextIndices,
        visibility,
        getResolvedComponent,
        getResolvedValue,
        getComponentDefinition,
        getContainerChildrenMapping,
        getExposedPropertyForAdditionalActions,
        calculateMoveableBoxHeightWithId,
      });

      // Target height for the changed widget. For containers: containerHeight.
      // For leaves: DOM offsetHeight (falls back to last temp or canonical).
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
      });

      // ModalV2 bodies aren't siblings in the grid — stash height on a synthetic
      // `-body` key and return without sibling reflow.
      if (componentType === 'ModalV2' && isContainer) {
        setTemporaryLayouts({
          [getDynamicLayoutKey(componentId, contextIndices, '-body')]: {
            ...changedComponent.layouts[currentLayout],
            ...temporaryLayouts?.[getDynamicLayoutKey(componentId, contextIndices, '-body')],
            height: newHeight,
          },
        });
        incrementCanvasUpdater();
        return null;
      }

      // Listview with a non-null context: could be either
      //   (a) a ROW context (no scoped DOM element exists for this listview
      //       at this context — we're just computing ONE row's height), or
      //   (b) a WIDGET context (the scoped DOM element DOES exist — this is
      //       a nested inner Listview rendered inside its parent Listview's
      //       row; the inner listview's wrapper lives at that parent-row
      //       context).
      //
      // (a) needs the short-circuit: write the row's temp and self-bubble
      // up one context level. Running the sibling reflow or normal bubble
      // here would (1) reflow siblings of the Listview at the wrong level
      // and (2) use the Listview's widget canonical height as the delta
      // baseline against a row-level newHeight.
      //
      // (b) needs the FULL flow: sibling reflow at this context (so the
      // inner listview's grown height pushes other template widgets in the
      // parent row) AND a normal bubble to the parent Listview at the SAME
      // context (so the parent's row temp gets updated). Without this, an
      // inner listview's growth never reaches the outer listview's row
      // tempstack and the outer listview refuses to grow.
      if (componentType === 'Listview' && contextIndices && isContainer) {
        const scopedElement = document.querySelector(getDynamicElementSelector(componentId, contextIndices));
        const isAtWidgetContext = !!scopedElement;
        if (!isAtWidgetContext) {
          setTemporaryLayouts({
            [getDynamicLayoutKey(componentId, contextIndices)]: {
              ...changedComponent.layouts[currentLayout],
              ...temporaryLayouts?.[getDynamicLayoutKey(componentId, contextIndices)],
              height: newHeight,
            },
          });
          incrementCanvasUpdater();
          const nextBubbleContext = contextIndices.length > 1 ? contextIndices.slice(0, -1) : null;
          adjustComponentPositions(componentId, currentLayout, true, nextBubbleContext);
          return null;
        }
        // Widget context (nested inner listview). Fall through to normal
        // flow so sibling reflow + parent bubble run with the current
        // context preserved.
      }

      // Sibling scope: widgets sharing the same `parent` id. Canvas-level
      // widgets have parent === null.
      const parentId = changedComponent?.component?.parent ?? null;
      const siblingIds = Object.keys(currentPageComponents).filter((id) => {
        const siblingParentId = currentPageComponents[id]?.component?.parent ?? null;
        return siblingParentId === parentId;
      });

      // visibleMap = true rendered visibility. Used when we need to know
      // "is the widget currently shown on screen?".
      const visibleMap = siblingIds.reduce((accumulator, siblingId) => {
        accumulator[siblingId] = resolveWidgetVisibility({
          componentId: siblingId,
          contextIndices,
          currentLayout,
          getResolvedComponent,
          getExposedPropertyForAdditionalActions,
        });
        return accumulator;
      }, {});

      // inFlowMap = "does this widget occupy layout flow right now?".
      // Equals visibility UNLESS the widget has opted in to `collapseWhenHidden`,
      // in which case hidden widgets drop out of flow and downstream siblings
      // collapse up. When `collapseWhenHidden` is false (default), a hidden
      // widget still holds its authored slot for reflow anchor math, so
      // siblings stay where they are.
      const inFlowMap = siblingIds.reduce((accumulator, siblingId) => {
        if (visibleMap[siblingId]) {
          accumulator[siblingId] = true;
          return accumulator;
        }
        const siblingResolved = getResolvedComponent(siblingId, contextIndices);
        const collapseWhenHidden = siblingResolved?.properties?.collapseWhenHidden ?? false;
        accumulator[siblingId] = !collapseWhenHidden;
        return accumulator;
      }, {});

      // Per-sibling collapseWhenHidden flag. Used by buildReflowPatch to gate
      // the placeholder-height correction in canonicalGap math — only widgets
      // that opted into collapse-on-hide can have been authored against the
      // HIDDEN_COMPONENT_HEIGHT placeholder, so the correction is scoped here.
      const collapseWhenHiddenMap = siblingIds.reduce((accumulator, siblingId) => {
        const siblingResolved = getResolvedComponent(siblingId, contextIndices);
        accumulator[siblingId] = siblingResolved?.properties?.collapseWhenHidden === true;
        return accumulator;
      }, {});

      // resolvedHeights[sibling] = the sibling's CURRENT height. Prefer any
      // existing temp-layout height (siblings that previously grew via their
      // own dynamic-height pass), so a reflow triggered by a different widget
      // doesn't erase the grown height. Fall back to the authored/moveable-
      // box height when no temp exists (covers top-label-alignment height
      // bumps for inputs).
      //
      // The changed widget overrides with its freshly-measured `newHeight`
      // below.
      const resolvedHeights = siblingIds.reduce((accumulator, siblingId) => {
        const existingTemp = temporaryLayouts?.[getDynamicLayoutKey(siblingId, contextIndices)];
        if (existingTemp?.height != null) {
          accumulator[siblingId] = existingTemp.height;
          return accumulator;
        }
        const siblingDefinition = getComponentDefinition(siblingId);
        const siblingStylesDefinition = siblingDefinition?.component?.definition?.styles;
        accumulator[siblingId] = calculateMoveableBoxHeightWithId(siblingId, currentLayout, siblingStylesDefinition);
        return accumulator;
      }, {});
      resolvedHeights[componentId] = newHeight;

      // Main reflow — max-over-blockers model. For each target in the
      // connected lane, the target's top is the max of `(V.currentBottom +
      // effectiveGap(V, target))` over every in-flow blocker V above it,
      // where effectiveGap subtracts the footprints of any out-of-flow
      // blockers sitting between V and the target. Returns per-sibling
      // layout overrides.
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
      });

      if (Object.keys(temporaryLayoutPatch).length === 0) {
        return null;
      }

      // For non-Listview containers we also set the DOM element's height
      // directly so its inner canvas reflows the same frame — Listview rows
      // drive their own heights via per-row subcontainers.
      if (isContainer && componentType !== 'Listview') {
        const element = document.querySelector(getDynamicElementSelector(componentId, contextIndices));
        if (element && visibility) {
          element.style.height = `${newHeight}px`;
        }
      }

      setTemporaryLayouts(temporaryLayoutPatch);

      incrementCanvasUpdater();

      // ── Bubble to parent ───────────────────────────────────────────────
      // Parent propagation is how child height changes reach Tabs/Form/
      // Accordion/Listview/Container/Canvas. getNextBubbleTargetId handles:
      //   - Listview row-context vs Listview widget-context (separate steps).
      //   - slot-like parent ids ("<id>-header", "<tabsId>-<tabId>") → resolve
      //     to the real ancestor component id via getBaseParentId / suffix trim.
      // shouldBubbleToParent guards against self-recursion when the next
      // target resolves back to the current (componentId, contextIndices).
      const scopedElement = contextIndices
        ? document.querySelector(getDynamicElementSelector(componentId, contextIndices))
        : null;
      const isScopedContextRenderable = !!scopedElement;
      const nextBubbleTargetId = getNextBubbleTargetId({
        componentId,
        componentType,
        parentId,
        contextIndices,
        getBaseParentId,
        isScopedContextRenderable,
        currentPageComponents,
      });
      const nextBubbleContext = getNextBubbleContext(componentType, contextIndices, componentId, nextBubbleTargetId);

      // If the next bubble target is a container-like parent with dynamic
      // height DISABLED, stop bubbling. A fixed-height container is an
      // isolation boundary — children growing inside should not resize the
      // container and push its siblings. Children overflow / clip / scroll
      // inside instead.
      const nextBubbleResolved = nextBubbleTargetId
        ? getResolvedComponent(nextBubbleTargetId, nextBubbleContext)
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
        adjustComponentPositions(nextBubbleTargetId, currentLayout, true, nextBubbleContext);
      }

      return temporaryLayoutPatch;
    } catch (error) {
      console.error('Error adjusting component positions:', error);
      return null;
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
});
