import {
  BOX_PADDING,
  CONTAINER_FORM_CANVAS_PADDING,
  HIDDEN_COMPONENT_HEIGHT,
  MODAL_CANVAS_PADDING,
  SUBCONTAINER_CANVAS_BORDER_WIDTH,
  TAB_CANVAS_PADDING,
} from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { isTruthyOrZero } from '@/_helpers/appUtils';
import { isProperNumber } from '../utils';
import { resolveFlexContainerHeight } from './dynamicHeightReflowFlexContainer';

// Tabs tab-strip rendered height (49.5 ul + 0.5 border in Tabs.jsx).
const TABS_TAB_BAR_HEIGHT = 50;

// ═════════════════════════════════════════════════════════════════════════════
// Dynamic-Height Reflow — max-over-all-blockers layout engine.
//
// ── High-level model ────────────────────────────────────────────────────────
// For every reflow-triggering event (widget grew, shrunk, hid, shown, mounted)
// we recompute new `top`/`height` values for the widgets in the changed
// widget's horizontal lane downstream, write them to `temporaryLayouts`, then
// bubble the same process up to the parent container if needed.
//
// The whole layout rule is one line:
//
//   T.top = max over every blocker V above T of
//           (V.currentBottom + canonicalGap(V, T))
//
// where:
//   - "blocker" = any widget canonically above T that horizontally overlaps it
//   - V.currentBottom = V.currentTop + V.currentFlowHeight
//   - V.currentFlowHeight = 0 when V is out of flow (hidden AND
//     `collapseWhenHidden = true`); otherwise V's rendered height.
//   - canonicalGap(V, T) = T.canonical.top − V.canonical.top − V.canonical.height
//     (the AUTHORED visual gap — changes only when the user drags / resizes
//     in the editor, so it's a stable offset we can read off canonical layouts
//     every pass without any persistence.)
//
// Intuition:
//   - Grow: V.currentBottom goes up, max bumps T down by the same delta.
//   - Shrink: V.currentBottom goes down, max releases T UPWARD, but only as
//     far as the next-tightest blocker allows (original offset preserved
//     against whichever blocker is still the strictest).
//   - Hide (with collapseWhenHidden): V stops contributing as a floor
//     (currentFlowHeight = 0). Other blockers take over. Blocker with no
//     other visible blocker above it collapses into its canonical top.
//   - Show / grow / shrink cascade: processed top-to-bottom, so later widgets
//     see the freshly-computed bottom of earlier widgets as an updated blocker.
//
// No anchor selection, no absorbed-slot math, no stored gap map — the
// authored canonical layout is the single source of truth for offsets.
//
// ── Pipeline ────────────────────────────────────────────────────────────────
//   useDynamicHeight (hook)
//     → scheduleReflow → flushReflows (gridSlice)
//       → resolveWidgetVisibility / resolveContainerHeight /
//         resolveWidgetMeasuredHeight (this file)
//       → buildReflowPatch (this file) — returns temporary layout patch
//       → setTemporaryLayouts (gridSlice)
//       → getNextBubbleTargetId / shouldBubbleToParent (this file) — parent
//         propagation for containers, tabs, rows, forms, accordions
//
// ── Key concepts ────────────────────────────────────────────────────────────
//   Context (contextIndices):  null at the canvas root; an index array for
//     scoped sub-containers (Listview rows, nested rows, tab panes). Every
//     temporary-layout key includes the serialized context so the same
//     component id can have multiple layouts across row instances.
//
//   Connected lane:  starting from the changed widget, widgets below it in
//     sort order that horizontally overlap (with transitive bound-expansion)
//     are the "affected set". Widgets outside this set don't move in the pass.
//
//   In flow / out of flow:  a widget is in flow when it is visible, OR when
//     it's hidden but has NOT opted in to `collapseWhenHidden`. Out-of-flow
//     widgets stay in the blocker list — they just contribute a 0-height
//     constraint, so downstream widgets collapse up into the gap naturally.
// ═════════════════════════════════════════════════════════════════════════════

export const ROOT_LAYOUT_CONTEXT = 'root';

// normalizeLayoutContext — canonicalizes the incoming context input to either
// null (root canvas) or a non-empty array of indices. Used everywhere as the
// single source of truth for "am I in a subcontainer?".
export const normalizeLayoutContext = (contextIndices = null) => {
  if (contextIndices === null || contextIndices === undefined) {
    return null;
  }

  const indices = Array.isArray(contextIndices) ? contextIndices : [contextIndices];
  const normalized = indices.filter((value) => isTruthyOrZero(value));

  return normalized.length > 0 ? normalized : null;
};

// Serialized form used as the `data-layout-context` DOM attribute and inside
// map keys. Root maps to the literal "root".
export const serializeLayoutContext = (contextIndices = null) => {
  const normalized = normalizeLayoutContext(contextIndices);
  return normalized ? normalized.join('.') : ROOT_LAYOUT_CONTEXT;
};

// Key for `temporaryLayouts[...]` lookups. A suffix is used only by the Modal
// body short-circuit (suffix === '-body') — normal widget entries have no
// suffix.
export const getDynamicLayoutKey = (componentId, contextIndices = null, suffix = '') => {
  const normalized = normalizeLayoutContext(contextIndices);
  const baseKey = normalized ? `${componentId}-${normalized.join('.')}` : componentId;
  return suffix ? `${baseKey}${suffix}` : baseKey;
};

// Scoped DOM selector for a widget's moveable-box wrapper. Relies on
// `WidgetWrapper` emitting `data-layout-context`.
export const getDynamicElementSelector = (componentId, contextIndices = null) => {
  return `.ele-${componentId}[data-layout-context="${serializeLayoutContext(contextIndices)}"]`;
};

// Canonical layout merged with any temporary override. "Effective" = what the
// widget currently renders as, including reflow results. Use this anywhere you
// need the widget's CURRENT top/height.
export const getEffectiveLayout = (
  componentId,
  currentLayout,
  currentPageComponents,
  temporaryLayouts,
  contextIndices
) => {
  const component = currentPageComponents?.[componentId];
  const baseLayout = component?.layouts?.[currentLayout];

  if (!baseLayout) {
    return null;
  }

  const temporaryLayout = temporaryLayouts?.[getDynamicLayoutKey(componentId, contextIndices)] || {};
  return { ...baseLayout, ...temporaryLayout };
};

// The authored layout (from the app definition). Temp layouts are never
// written into this. Used whenever we need the "rest" position, not the
// current reflowed position.
export const getCanonicalLayout = (componentId, currentLayout, currentPageComponents) => {
  return currentPageComponents?.[componentId]?.layouts?.[currentLayout] || null;
};

// Module-aware resolved-component getter for the reflow engine. An embedded
// module's root ModuleContainer must take its `dynamicHeight` from the
// consuming ModuleViewer INSTANCE (resolved in the 'canvas' namespace) — the
// ModuleContainer's own property is only the module editor's drop-time
// default. Without this overlay, the dynamic-height opt-out gate in
// resolveContainerHeight (and the bubble gate in the reflow) pin the module
// root to its authored height whenever the module-editor default is off, even
// though the instance enabled dynamic height.
export const bindModuleAwareGetResolvedComponent = (getResolvedComponent, getComponentTypeFromId, moduleId) => {
  return (id, ctx) => {
    const resolved = getResolvedComponent(id, ctx, moduleId);
    if (moduleId !== 'canvas' && resolved?.properties && getComponentTypeFromId(id, moduleId) === 'ModuleContainer') {
      const instanceDynamicHeight = getResolvedComponent(moduleId, null, 'canvas')?.properties?.dynamicHeight;
      if (instanceDynamicHeight !== undefined && resolved.properties.dynamicHeight !== instanceDynamicHeight) {
        return { ...resolved, properties: { ...resolved.properties, dynamicHeight: instanceDynamicHeight } };
      }
    }
    return resolved;
  };
};

// Bottom edge helper. flowHeightOverride lets callers substitute a zero (for
// hidden widgets) without mutating the layout object.
export const getLayoutBottom = (layout, flowHeightOverride = null) => {
  if (!layout) {
    return null;
  }

  const effectiveHeight = flowHeightOverride ?? layout.height ?? 0;
  return (layout.top ?? 0) + effectiveHeight;
};

// Horizontal span overlap predicate. Covers every containment and edge
// case (A contains B, B contains A, left-edge overlap, right-edge overlap).
// Used for "same lane?" tests.
export const isHorizontallyOverlapping = (leftA, rightA, leftB, rightB) => {
  return (
    (leftA <= leftB && rightA >= rightB) ||
    (leftA >= leftB && rightA <= rightB) ||
    (leftA < leftB && rightA > leftB) ||
    (leftA < rightB && rightA > rightB)
  );
};

// Canonical-position sort: top ascending, then left ascending, then id as a
// deterministic tiebreaker. The output order is how widgets are processed
// during a reflow pass — top-to-bottom so each widget's new bottom is
// available as a potential anchor for widgets processed later.
export const sortByCanonicalPosition = (componentIds, currentLayout, currentPageComponents) => {
  return [...componentIds].sort((firstId, secondId) => {
    const firstLayout = getCanonicalLayout(firstId, currentLayout, currentPageComponents);
    const secondLayout = getCanonicalLayout(secondId, currentLayout, currentPageComponents);

    const firstTop = firstLayout?.top ?? 0;
    const secondTop = secondLayout?.top ?? 0;

    if (firstTop !== secondTop) {
      return firstTop - secondTop;
    }

    const firstLeft = firstLayout?.left ?? 0;
    const secondLeft = secondLayout?.left ?? 0;

    if (firstLeft !== secondLeft) {
      return firstLeft - secondLeft;
    }

    // updatedAt tiebreaker — for widgets sharing the exact same (top, left)
    // (e.g. multiple collapseWhenHidden widgets dropped on top of each other),
    // the most recently positioned widget renders at the bottom of the stack.
    // Server's createComponentWithLayout response exposes layout.updatedAt.
    const firstUpdatedAt = firstLayout?.updatedAt ? new Date(firstLayout.updatedAt).getTime() : null;
    const secondUpdatedAt = secondLayout?.updatedAt ? new Date(secondLayout.updatedAt).getTime() : null;

    if (firstUpdatedAt !== null && secondUpdatedAt !== null && firstUpdatedAt !== secondUpdatedAt) {
      return firstUpdatedAt - secondUpdatedAt;
    }

    return firstId.localeCompare(secondId);
  });
};

// Expand the changed widget's horizontal lane downstream. Starts from the
// changed widget, walks siblings sorted top-to-bottom, and greedily adds any
// widget whose horizontal span overlaps the running bounds. Left/right bounds
// widen as overlapping widgets are admitted, so transitively-connected
// widgets are pulled in even if they don't overlap the *original* changed
// widget's span. Widgets outside this set are not repositioned in the pass.
export const getConnectedLaneComponentIds = (
  sortedComponentIds,
  changedComponentId,
  currentLayout,
  currentPageComponents
) => {
  const changedIndex = sortedComponentIds.findIndex((componentId) => componentId === changedComponentId);

  if (changedIndex === -1) {
    return [];
  }

  const changedLayout = getCanonicalLayout(changedComponentId, currentLayout, currentPageComponents);
  if (!changedLayout) {
    return [];
  }

  let currentLeft = changedLayout.left;
  let currentRight = changedLayout.left + changedLayout.width;
  const connected = [changedComponentId];

  for (let index = changedIndex + 1; index < sortedComponentIds.length; index++) {
    const candidateId = sortedComponentIds[index];
    const candidateLayout = getCanonicalLayout(candidateId, currentLayout, currentPageComponents);

    if (!candidateLayout) {
      continue;
    }

    const candidateLeft = candidateLayout.left;
    const candidateRight = candidateLayout.left + candidateLayout.width;

    if (!isHorizontallyOverlapping(candidateLeft, candidateRight, currentLeft, currentRight)) {
      continue;
    }

    connected.push(candidateId);
    currentLeft = Math.min(currentLeft, candidateLeft);
    currentRight = Math.max(currentRight, candidateRight);
  }

  return connected;
};

// Visibility resolution:
//   exposed `isVisible`    →  (from runtime side-effects / events)
//   properties.visibility  →  (explicit)
//   styles.visibility      →  (legacy)
//   `others.showOn<Mobile|Desktop>` can force-false regardless of the above.
// Defaults to true when all sources are undefined.
export const resolveWidgetVisibility = ({
  componentId,
  contextIndices,
  currentLayout,
  getResolvedComponent,
  getExposedPropertyForAdditionalActions,
}) => {
  const component = getResolvedComponent(componentId, contextIndices);
  const displayProperty = currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop';
  const componentDisplay = component?.others?.[displayProperty];
  const exposedVisibility = getExposedPropertyForAdditionalActions(componentId, contextIndices, 'isVisible');

  let visibility = exposedVisibility ?? component?.properties?.visibility ?? component?.styles?.visibility;

  if (componentDisplay === false) {
    visibility = false;
  }

  return visibility ?? true;
};

// Container-specific extras added on top of the content-height calculation:
//   - Container/Accordion: padding, borders, header, and a flag that bypasses
//     content calc when a non-dynamic Accordion is expanded (it uses the
//     stored height directly).
//   - Form: either measured from the last fieldset (jsonSchema mode) or sum
//     of header/footer + 20px gutter.
//   - Tabs: flat 40px for the tab bar.
//   - Listview row context: subtract 40 to normalize against the widget-level
//     allowance added elsewhere.
const getExtraContainerHeight = ({
  componentId,
  componentType,
  contextIndices,
  element,
  currentMax,
  getResolvedComponent,
  getResolvedValue,
  getComponentDefinition,
  isAccordionExpanded,
  hideTabs,
}) => {
  let extraHeight = 0;
  let nextCurrentMax = currentMax;
  let skipContentHeightCalculation = false;

  if (componentType === 'Container' || componentType === 'Accordion') {
    const { properties = {} } = getResolvedComponent(componentId, contextIndices) || {};
    const { showHeader, headerHeight, dynamicHeight } = properties;

    extraHeight += BOX_PADDING * 2 + SUBCONTAINER_CANVAS_BORDER_WIDTH * 2 + CONTAINER_FORM_CANVAS_PADDING * 2;

    if (showHeader && isProperNumber(headerHeight)) {
      extraHeight += headerHeight + CONTAINER_FORM_CANVAS_PADDING + 3 + 1;
    }

    if (componentType === 'Accordion' && !dynamicHeight && isAccordionExpanded) {
      skipContentHeightCalculation = true;
    }
  } else if (componentType === 'Form') {
    const { properties = {} } = getResolvedComponent(componentId, contextIndices) || {};
    const { component } = getComponentDefinition(componentId);
    const generateFormFrom = component?.definition?.properties?.generateFormFrom?.value;
    const resolvedGenerateFormFrom = getResolvedValue(generateFormFrom);
    const { showHeader, showFooter, headerHeight, footerHeight } = properties;

    if (resolvedGenerateFormFrom === 'jsonSchema') {
      const lastFieldset = element?.querySelector('fieldset:last-child');
      if (lastFieldset) {
        nextCurrentMax = lastFieldset.offsetHeight;
      }
    } else {
      // FormUtils.getBodyHeight subtracts (headerHeight + 10) and
      // (footerHeight + 14) plus a 20px floor. To make body fit `currentMax`
      // tightly without overflow, add the same back here.
      extraHeight += 20;
      if (showHeader && isProperNumber(headerHeight)) {
        extraHeight += headerHeight + 10;
      }
      if (showFooter && isProperNumber(footerHeight)) {
        extraHeight += footerHeight + 14;
      }
    }
  } else if (componentType === 'Tabs') {
    // Tab pane chrome: TAB_CANVAS_PADDING (8) top + bottom around the
    // SubContainer canvas, plus the tab strip (50) unless `hideTabs` is on
    // (strip becomes `display:none`). +16 covers the .real-canvas
    // `calc(100% + 3.5px)` extension plus the ~7px scrollHeight overshoot
    // that growing leaf widgets (e.g. TextArea labels) report past their
    // moveable-box height.
    extraHeight = TAB_CANVAS_PADDING * 2 + 16 + (hideTabs ? 0 : TABS_TAB_BAR_HEIGHT);
  } else if (componentType === 'ModalV2') {
    // Modal body chrome: MODAL_CANVAS_PADDING (5) top + bottom around the
    // SubContainer canvas (stylesFactory.js modalBody) + safety for the
    // `.real-canvas` `calc(100% + 1px)` extension. Plus 12px per shown
    // header/footer slot — Modal.jsx composes totalHeight from the
    // *configured* header/footer heights, but each slot actually renders
    // ~10px taller (HorizontalSlot pad + 1px border), so that gap has to be
    // padded into the body content height or the body clips.
    const { properties = {} } = getResolvedComponent(componentId, contextIndices) || {};
    extraHeight = MODAL_CANVAS_PADDING * 2 + 8;
    if (properties.showHeader) extraHeight += 12;
    if (properties.showFooter) extraHeight += 12;
  } else if (componentType === 'ModuleContainer') {
    // Module root chrome: WidgetWrapper canvas-component padding (BOX_PADDING
    // top + bottom) plus the real-canvas 1px padding pair net of its
    // `calc(100% + 1px)` extension. Without this the canvas content box lands
    // exactly `childMax` minus chrome and the last widget clips/scrolls.
    extraHeight = BOX_PADDING * 2 + 2;
  } else if (componentType === 'Listview' && normalizeLayoutContext(contextIndices)) {
    // Listview row context: previously `-= 40` to cancel the historical +50
    // buffer (net +10 chrome per row). Buffer is gone, so set the row's
    // chrome directly: +15 covers each row's small internal padding plus
    // a sub-pixel/safety margin against children that report `scrollHeight`
    // a few px past their `offsetHeight` (e.g. label-bumped TextArea).
    extraHeight = 15;
  }

  return { extraHeight, currentMax: nextCurrentMax, skipContentHeightCalculation };
};

// Rendered row count in a Listview, respecting pagination.
const getListviewRenderedRowCount = (componentProperties = {}) => {
  const { dataSourceSelector, data, enablePagination = false, rowsPerPage = 10 } = componentProperties;
  const resolvedData = dataSourceSelector === 'rawJson' ? data : dataSourceSelector;
  const totalRows = Array.isArray(resolvedData) ? resolvedData.length : 0;

  if (!enablePagination) {
    return totalRows;
  }

  return Math.min(Number(rowsPerPage) || 10, totalRows);
};

// Compute a Listview widget's height from its rows' temporary layouts. Why
// not from the DOM? In deeply nested contexts (Textarea → ListView → Tabs →
// ListView), an outer Listview's DOM may not reflect inner growth yet, but
// the row-level temp layouts are authoritative — they were just written by
// the row-context reflow pass. This function aggregates those heights back up
// into a single widget height that bubble targets can consume.
export const resolveListviewHeightFromRows = ({
  componentId,
  contextIndices,
  component,
  currentLayout,
  currentPageComponents,
  temporaryLayouts,
}) => {
  const componentProperties = component?.properties || {};
  const rowCount = getListviewRenderedRowCount(componentProperties);
  const context = normalizeLayoutContext(contextIndices);
  const baseRowHeight =
    componentProperties.rowHeight ?? getCanonicalLayout(componentId, currentLayout, currentPageComponents)?.height ?? 0;
  const mode = componentProperties.mode ?? 'list';
  const positiveColumns = Math.max(Number(componentProperties.columns) || 1, 1);
  const rowHeights = Array.from({ length: rowCount }, (_, rowIndex) => {
    const rowContext = [...(context || []), rowIndex];
    const rowLayout = temporaryLayouts?.[getDynamicLayoutKey(componentId, rowContext)];
    return rowLayout?.height ?? baseRowHeight;
  });

  // Grid mode: widest band per row group (columns-many rows stack horizontally).
  // List mode: straight sum of row heights.
  const stackedRowsHeight =
    mode === 'grid'
      ? rowHeights.reduce((totalHeight, rowHeight, rowIndex) => {
          if (rowIndex % positiveColumns !== 0) {
            return totalHeight;
          }

          const bandHeights = rowHeights.slice(rowIndex, rowIndex + positiveColumns);
          return totalHeight + Math.max(...bandHeights, 0);
        }, 0)
      : rowHeights.reduce((totalHeight, rowHeight) => totalHeight + rowHeight, 0);

  // Fixed allowances: per-row bottom border (list mode only), pagination bar,
  // outer chrome (7px padding × 2 = 14 + 1px outer border × 2 = 2 + 2 safety
  // for `.real-canvas` `calc(100% + 1px)` extension and rounding drift).
  const borderAllowance = componentProperties.showBorder && mode === 'list' ? rowCount : 0;
  const paginationAllowance = componentProperties.enablePagination ? 61 : 0;
  const outerPaddingAllowance = 18;

  return stackedRowsHeight + borderAllowance + paginationAllowance + outerPaddingAllowance;
};

// Compute a container widget's target height from its children. Called on the
// changed widget when it's a container (Container, Form, Tabs, Accordion,
// Listview, ModalV2 body).
//
// Per container type:
//   - Listview with context not renderable: falls back to configured rowHeight.
//   - Listview at root OR row-context renderable: delegates to
//     resolveListviewHeightFromRows so deep nesting bubbles correctly.
//   - Accordion collapsed: just header height (or zero if hidden).
//   - Tabs: resolve the active tab (DOM attr → exposed state → default → first
//     visible) and measure children inside that panel only.
//   - Others: max(child bottoms) + container chrome.
export const resolveContainerHeight = ({
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
}) => {
  const canonicalLayout = getCanonicalLayout(componentId, currentLayout, currentPageComponents);
  let containerHeight = canonicalLayout?.height ?? 0;
  const context = normalizeLayoutContext(contextIndices);
  const scopedWrapperElement = document.querySelector(getDynamicElementSelector(componentId, context));
  const isScopedContextRenderable = !!scopedWrapperElement;

  // A Listview inside a context whose DOM isn't available (e.g., inactive tab)
  // falls back to the configured row height.
  if (componentType === 'Listview' && context && !isScopedContextRenderable) {
    const component = getResolvedComponent(componentId, context);
    containerHeight = component?.properties?.rowHeight ?? containerHeight;
  }

  // Explicit dynamic-height opt-out: the container stays at its authored
  // height and does NOT derive height from children. This is the toggle-off
  // pathway — any leftover row / child temps from a prior dynamic run are
  // simply ignored (they remain in store, dormant, until dynamic turns back
  // on and the normal reflow overwrites them).
  //
  // Listview row-context retains `rowHeight` (set above) as its floor so the
  // non-dynamic row still matches the configured row size.
  //
  // Accordion is excluded: its expand/collapse pull-up must not depend on
  // the dynamicHeight toggle. The non-dynamic expanded path is still honored
  // downstream via skipContentHeightCalculation in getExtraContainerHeight,
  // and the collapsed path (header height only) needs to run for siblings to
  // pull up.
  const gatedComponent = getResolvedComponent(componentId, context);
  if (gatedComponent?.properties?.dynamicHeight === false && componentType !== 'Accordion') {
    return containerHeight;
  }

  // Listview widget-level (no context) OR a renderable row context:
  //
  // Compute the row-sum-based height from per-row temp layouts. This is
  // what lets nested dynamic growth (Textarea → row temp → sum) propagate,
  // and it lets shrinkage (Accordion collapse) propagate too.
  //
  // We deliberately do NOT mix in a DOM offsetHeight reading here. Doing so
  // reads a stale value during the bubble rAF (React hasn't re-rendered
  // list-items yet, so offsetHeight still reflects pre-shrink sizes), which
  // causes `max(rowSum, dom)` to pick the stale larger value and block
  // legitimate shrinkage from propagating upward. We also do NOT floor at
  // canonical.height — the authored size is just the user's initial guess,
  // and dynamic height is supposed to fit real content in either direction.
  //
  // For this to match rendered reality, Listview's outer styling must NOT
  // inflate the widget beyond its content (no authored-height minHeight,
  // no flex-grow-1 forcing row fill). See Listview.jsx for the matching
  // CSS change.
  if (componentType === 'Listview' && (!context || isScopedContextRenderable)) {
    const component = getResolvedComponent(componentId, context);
    const stacked = resolveListviewHeightFromRows({
      componentId,
      contextIndices,
      component,
      currentLayout,
      currentPageComponents,
      temporaryLayouts,
    });
    // Widget level (!context): floor at the listview's authored canonical
    // height so the widget never silently shrinks below what the user
    // designed in the editor. Row-level calls still return the stacked
    // value as-is (their own floor at rowHeight is enforced via the first
    // IF above + the max(currentMax+10, containerHeight) at the end).
    if (!context) {
      return Math.max(stacked, canonicalLayout?.height ?? 0);
    }
    return stacked;
  }

  const component = getResolvedComponent(componentId, context);
  const isAccordionExpanded = getExposedPropertyForAdditionalActions(componentId, context, 'isExpanded') ?? true;

  // Collapsed accordion: header only (zero if widget itself is hidden).
  if (componentType === 'Accordion' && !isAccordionExpanded) {
    const { properties = {} } = component || {};
    const { showHeader, headerHeight } = properties;

    if (!visibility) {
      return 0;
    }

    if (showHeader && isProperNumber(headerHeight)) {
      return headerHeight + CONTAINER_FORM_CANVAS_PADDING + 3 + 2;
    }

    return 0;
  }

  if (!visibility) {
    return containerHeight;
  }

  // FlexContainer must branch before the generic grid-container path below.
  // The code below this point intentionally reads child grid positions and
  // computes max child bottom; doing that for flex children would ignore flex
  // stacking/wrapping and can leave downstream siblings overlapping grown
  // content in viewer mode.
  if (componentType === 'FlexContainer') {
    return resolveFlexContainerHeight({
      componentId,
      currentLayout,
      currentPageComponents,
      temporaryLayouts,
      contextIndices: context,
      getResolvedComponent,
      getContainerChildrenMapping,
      getExposedPropertyForAdditionalActions,
      calculateMoveableBoxHeightWithId,
      getComponentDefinition,
      getCanonicalLayout,
      getDynamicElementSelector,
      getEffectiveLayout,
      resolveWidgetVisibility,
    });
  }

  // ModalV2 uses a global class (modal is portal'd out), all others use a
  // scoped selector.
  const dynamicSelector =
    componentType === 'ModalV2'
      ? `.dynamic-${componentId}`
      : `${getDynamicElementSelector(componentId, context)} .dynamic-${componentId}`;
  const element = document.querySelector(dynamicSelector);

  let modifiedComponentId = componentId;
  let childContext = context;

  // Tabs: resolve active tab and pretend the container id is `<id>-<tabId>`
  // when looking up children. Fallback chain handles nested/inactive cases
  // where the DOM attribute isn't present.
  if (componentType === 'Tabs') {
    const activeTabFromElement = element?.getAttribute('activetab');
    const activeTabFromExposedState = getExposedPropertyForAdditionalActions(componentId, context, 'currentTab');
    const configuredTabs = component?.properties?.tabItems || component?.properties?.tabs;
    const firstVisibleTabId = Array.isArray(configuredTabs)
      ? configuredTabs.find((tabItem) => tabItem?.visible !== false)?.id ?? configuredTabs[0]?.id
      : null;
    const activeTab =
      activeTabFromElement ?? activeTabFromExposedState ?? component?.properties?.defaultTab ?? firstVisibleTabId;

    if (isTruthyOrZero(activeTab)) {
      modifiedComponentId = `${componentId}-${activeTab}`;
    }
  }

  // Build per-child layout snapshot (canonical + effective + flow-participation).
  // A child is "in flow" if it's visible OR it's hidden but has NOT opted in to
  // `collapseWhenHidden`. Only out-of-flow children contribute 0 to the
  // max-bottom reduce; hidden-but-in-flow children still hold their authored
  // slot so the container's computed height stays stable.
  const componentLayouts = getContainerChildrenMapping(modifiedComponentId).reduce((accumulator, childId) => {
    const childLayout = getCanonicalLayout(childId, currentLayout, currentPageComponents);
    if (!childLayout) {
      return accumulator;
    }

    const childVisibility = resolveWidgetVisibility({
      componentId: childId,
      contextIndices: childContext,
      currentLayout,
      getResolvedComponent,
      getExposedPropertyForAdditionalActions,
    });
    const childResolved = getResolvedComponent(childId, childContext);
    const childCollapseWhenHidden = childResolved?.properties?.collapseWhenHidden ?? false;
    const childInFlow = childVisibility || !childCollapseWhenHidden;
    const effectiveLayout = getEffectiveLayout(
      childId,
      currentLayout,
      currentPageComponents,
      temporaryLayouts,
      childContext
    );

    return {
      ...accumulator,
      [childId]: {
        canonical: childLayout,
        effective: effectiveLayout,
        inFlow: childInFlow,
      },
    };
  }, {});

  // Floor each child's flow height at `calculateMoveableBoxHeightWithId` —
  // for top-label input widgets this adds the +20px label bump that
  // WidgetWrapper applies at render time. Without this, a Dropdown (which
  // never calls useDynamicHeight and therefore never writes a temp) reports
  // its canonical height here and the container sizes ~20px too short,
  // clipping the bottom of the control.
  let currentMax = Object.entries(componentLayouts).reduce((maxHeight, [childId, layoutEntry]) => {
    const effectiveLayout = layoutEntry?.effective;
    if (!effectiveLayout) {
      return maxHeight;
    }

    let flowHeight = 0;
    if (layoutEntry?.inFlow) {
      flowHeight = effectiveLayout.height ?? 0;
      if (typeof calculateMoveableBoxHeightWithId === 'function') {
        const childDefinition = getComponentDefinition?.(childId);
        const childStylesDefinition = childDefinition?.component?.definition?.styles;
        const bumpedHeight = calculateMoveableBoxHeightWithId(childId, currentLayout, childStylesDefinition);
        if (typeof bumpedHeight === 'number') {
          flowHeight = Math.max(flowHeight, bumpedHeight);
        }
      }
    }
    return Math.max(maxHeight, (effectiveLayout.top ?? 0) + flowHeight);
  }, 0);

  const {
    extraHeight,
    currentMax: nextCurrentMax,
    skipContentHeightCalculation,
  } = getExtraContainerHeight({
    componentId: modifiedComponentId,
    componentType,
    contextIndices: componentType === 'Tabs' ? null : context,
    element,
    currentMax,
    getResolvedComponent,
    getResolvedValue,
    getComponentDefinition,
    isAccordionExpanded,
    hideTabs: component?.properties?.hideTabs === true,
  });

  currentMax = nextCurrentMax;

  if (skipContentHeightCalculation) {
    return containerHeight;
  }

  // Every container type's `extraHeight` now accounts for its own chrome
  // (Container/Accordion: padding+border+header; Form: header/footer/body
  // gutter; Tabs: strip + pane padding; ModalV2: body padding + borders).
  // Floor at canonical so the container never drops below its authored size.
  //
  // Exception: a dynamic-height ModuleContainer must fit its content in BOTH
  // directions. Flooring at the authored height would keep the module root
  // tall after a collapseWhenHidden child hides and shrinks the content, so
  // the inner canvas (updateCanvasBottomHeight) never shrinks either. The
  // module canvas enforces its own 40px minimum, so dropping the floor here
  // is safe. `component` is the module-aware resolved component, so
  // `dynamicHeight` already reflects the consuming ModuleViewer instance.
  if (componentType === 'ModuleContainer' && component?.properties?.dynamicHeight === true) {
    return currentMax + extraHeight;
  }
  return Math.max(currentMax + extraHeight, containerHeight);
};

// The changed widget's target height:
//   - Container-like widget: delegate to `containerHeight` (already computed).
//   - Leaf widget: DOM `offsetHeight`, falling back to the last temp height,
//     then canonical, then zero.
//   - Hidden: return the existing stored height so the widget's last known
//     size is preserved (needed for show-restore and for container height
//     calculations that skip 0-flow children).
// Note: Listview widget (no row context) is always treated as a container;
// Listview in a row context is treated as a leaf from this function's POV.
export const resolveWidgetMeasuredHeight = ({
  componentId,
  componentType,
  currentLayout,
  currentPageComponents,
  temporaryLayouts,
  contextIndices,
  isContainer,
  visibility,
  containerHeight,
  calculateMoveableBoxHeightWithId,
}) => {
  if (isContainer && (componentType !== 'Listview' || normalizeLayoutContext(contextIndices))) {
    return containerHeight;
  }

  const element = document.querySelector(getDynamicElementSelector(componentId, contextIndices));
  const existingHeight = getEffectiveLayout(
    componentId,
    currentLayout,
    currentPageComponents,
    temporaryLayouts,
    contextIndices
  )?.height;

  // Fallback when the DOM can't be measured (invisible widget, hidden ancestor
  // subtree, or missing element). Prefer the calc-bumped canonical so top-
  // aligned input widgets don't get pinned at their raw authored height (40)
  // — WidgetWrapper renders them at the bumped height (60) once visible, and
  // a temp.height written here becomes the finalHeight on visibility flip.
  const fallbackHeight = () => {
    if (typeof calculateMoveableBoxHeightWithId === 'function') {
      const definition = currentPageComponents?.[componentId];
      const stylesDefinition = definition?.component?.definition?.styles;
      const calc = calculateMoveableBoxHeightWithId(componentId, currentLayout, stylesDefinition);
      if (typeof calc === 'number') return calc;
    }
    return getCanonicalLayout(componentId, currentLayout, currentPageComponents)?.height ?? 0;
  };

  // Invisible widget: we can't measure it, so return what WidgetWrapper would
  // render it at when visible — calc-bumped canonical. Floor any prior temp at
  // this value too: a stale temp written before the bump (or under a previous
  // alignment) must not pin the widget below its rendered visible height,
  // because temp.height becomes finalHeight on the next visibility flip.
  if (!visibility) {
    const bumped = fallbackHeight();
    if (existingHeight != null) return Math.max(existingHeight, bumped);
    return bumped;
  }

  // Hidden ancestor subtree (inactive tab pane, collapsed accordion, closed
  // modal) → offsetHeight reads 0 even though the widget itself is visible
  // per its visibility flag. Returning that 0 would write temp.height=0 and
  // poison every subsequent reflow: gridSlice's resolvedHeights treats 0 as
  // a valid existing value (0 != null) and replays it for siblings, which
  // collapse to height:0 in WidgetWrapper. Fall through to the last known /
  // calc-bumped canonical height so the widget keeps its slot until it's
  // actually measurable.
  if (element && element.offsetParent === null) {
    return existingHeight ?? fallbackHeight();
  }

  // Same anti-poisoning guard for the show transition: when a widget with
  // an inner `height:100%` child (e.g., NewTable) flips from hidden to
  // visible, the outer wrapper is briefly set to `height:auto` by
  // useDynamicHeight before this measurement runs. With inner `100%`
  // resolving against an auto parent, the layout pass returns ~0px for one
  // frame. Trusting that 0 would propagate as delta = 0 − priorHeight, e.g.,
  // -350, collapsing every downstream sibling above its canonical top.
  // Treat 0 as "not yet measurable" and prefer the last known / canonical
  // height instead — no visible widget legitimately renders at 0.
  const measuredHeight = element?.offsetHeight;
  if (measuredHeight === 0) {
    return existingHeight ?? fallbackHeight();
  }

  return measuredHeight ?? existingHeight ?? fallbackHeight();
};

// Blocker enumeration — returns every widget canonically above `targetId`
// that horizontally overlaps it, in canonical-top order. Every blocker,
// whether in-flow or out-of-flow, contributes to the target's position
// constraint.
//
// Out-of-flow widgets (hidden AND `collapseWhenHidden=true`) contribute with
// `currentFlowHeight = 0`, so their `currentBottom = currentTop`. This lets
// downstream widgets collapse up into their vacated slots naturally, without
// any special-case subtraction logic.
//
// Each blocker entry exposes:
//   - canonicalLayout          (authored layout — used to compute canonical
//                               gap to target)
//   - currentTop, currentBottom (for constraint math; currentBottom uses
//                                flow=0 for out-of-flow widgets)
export const getBlockers = ({
  targetId,
  targetCanonical,
  sortedComponentIds,
  currentLayout,
  currentPageComponents,
  temporaryLayouts,
  contextIndices,
  inFlowMap,
  computedLayouts,
  resolvedHeights,
  changedComponentId,
}) => {
  const result = [];
  if (!targetCanonical) return result;

  const targetIndex = sortedComponentIds.findIndex((componentId) => componentId === targetId);
  if (targetIndex <= 0) return result;

  const targetLeft = targetCanonical.left;
  const targetRight = targetCanonical.left + targetCanonical.width;

  for (let index = 0; index < targetIndex; index++) {
    const candidateId = sortedComponentIds[index];

    const candidateCanonical = getCanonicalLayout(candidateId, currentLayout, currentPageComponents);
    if (!candidateCanonical) continue;

    const candidateLeft = candidateCanonical.left;
    const candidateRight = candidateCanonical.left + candidateCanonical.width;
    if (!isHorizontallyOverlapping(candidateLeft, candidateRight, targetLeft, targetRight)) continue;

    const candidateLayout =
      computedLayouts[candidateId] ||
      getEffectiveLayout(candidateId, currentLayout, currentPageComponents, temporaryLayouts, contextIndices);
    if (!candidateLayout) continue;

    const isInFlow = inFlowMap[candidateId] !== false;
    // For the CHANGED widget, trust its freshly-resolved height — it may
    // have legitimately shrunk below its authored canonical (e.g., an
    // Accordion collapsing from 400 → 63). Flooring at canonical would
    // make downstream widgets read it as still-expanded. Other blockers
    // keep the canonical floor as a safety net; dropping it universally
    // destabilized nested Listview contexts where template widgets at
    // non-native contexts legitimately report different heights.
    //
    // Accordion blockers (whether or not they're the current pass's
    // changed widget) also skip the canonical floor — a previously-
    // collapsed accordion has temp height = headerHeight, well below
    // canonical, and flooring at canonical would re-inflate it, pushing
    // downstream siblings past their correct collapsed position when
    // an unrelated widget triggers reflow. Accordion's own
    // resolveContainerHeight already floors at canonical when expanded,
    // so trusting the temp here only takes effect for collapsed state.
    const candidateComponentType = currentPageComponents?.[candidateId]?.component?.component;
    const skipCanonicalFloor = candidateId === changedComponentId || candidateComponentType === 'Accordion';
    const measuredHeight = skipCanonicalFloor
      ? Math.max(candidateLayout?.height ?? 0, resolvedHeights?.[candidateId] ?? 0)
      : Math.max(candidateLayout?.height ?? 0, candidateCanonical?.height ?? 0, resolvedHeights?.[candidateId] ?? 0);
    const currentTop = candidateLayout?.top ?? candidateCanonical?.top ?? 0;
    const currentFlowHeight = isInFlow ? measuredHeight : 0;

    result.push({
      id: candidateId,
      canonicalLayout: candidateCanonical,
      currentTop,
      currentBottom: currentTop + currentFlowHeight,
      isInFlow,
    });
  }

  return result;
};

// Main reflow function. Returns the temporary-layout patch for every widget
// in the connected lane downstream of the changed widget.
//
// Processing order is top-to-bottom within the connected lane so each
// widget's freshly-computed layout feeds into the blocker list of widgets
// processed later.
//
// Two models based on what kind of change triggered the pass:
//
// ── GROW / SHRINK (changed widget is in flow) ───────────────────────────────
//   delta = changed.newHeight − changed.oldHeight
//   For every downstream widget T in the connected lane:
//     proposedTop = T.currentTop + delta
//     otherMax   = max over OTHER in-flow blockers V' of
//                   (V'.currentBottom + canonicalGap(V', T))
//     T.newTop   = max(proposedTop, otherMax, T.canonical.top)
//
//   Grow (delta > 0): proposedTop wins, T pushes down by delta regardless of
//     what other blockers look like. That's the "push no matter what" rule —
//     if one blocker above T grew, T moves down by that amount even if a
//     different blocker was already farther down.
//   Shrink (delta < 0): proposedTop drops. If another in-flow blocker was
//     holding T at a higher position, otherMax takes over and T stops there.
//     Canonical top floors the pull-up — we never go above authored
//     position.
//
// ── HIDE / SHOW (changed widget is out of flow, `collapseWhenHidden`) ───────
//   Falls back to max-over-blockers with slot subtraction:
//     For every in-flow blocker V above T, V's canonical gap to T shrinks
//     by the sum of "slot sizes" of out-of-flow blockers sitting canonically
//     between V and T (slot = next entry's canonical top − this one's
//     canonical top — includes both footprint and trailing gap). With no
//     in-flow blockers, T collapses into the topmost vacated slot.
//   This path is needed because hide/show is a per-T structural collapse,
//   not a uniform delta the way grow/shrink is.
export const buildReflowPatch = ({
  changedComponentId,
  componentIds,
  currentLayout,
  currentPageComponents,
  temporaryLayouts,
  contextIndices,
  inFlowMap,
  resolvedHeights,
  collapseWhenHiddenMap,
  calculateMoveableBoxHeightWithId,
  getComponentDefinition,
}) => {
  // Effective canonical height = `calculateMoveableBoxHeightWithId`, which
  // bumps top-aligned input widgets by TOP_ALIGNMENT_HEIGHT_INCREMENT (20px)
  // to make room for the label that stacks above the control. WidgetWrapper
  // already renders edit mode at this bumped height, so the author placed
  // downstream siblings relative to it. View mode (dynamic height) starts at
  // the raw canonical and grows to the bumped height — without this lookup,
  // reflow would propagate the bump as a +20 delta and push siblings past
  // their authored positions. Falls back to raw canonical when the calc
  // helpers aren't passed (defensive — every caller in this codebase passes
  // them) or for non-input widgets where the calc returns canonical anyway.
  const getEffectiveCanonicalHeight = (componentId) => {
    if (typeof calculateMoveableBoxHeightWithId === 'function') {
      const definition = getComponentDefinition?.(componentId);
      const stylesDefinition = definition?.component?.definition?.styles;
      const calc = calculateMoveableBoxHeightWithId(componentId, currentLayout, stylesDefinition);
      if (typeof calc === 'number') return calc;
    }
    return currentPageComponents?.[componentId]?.layouts?.[currentLayout]?.height ?? 0;
  };
  const sortedComponentIds = sortByCanonicalPosition(componentIds, currentLayout, currentPageComponents);
  const connectedIds = getConnectedLaneComponentIds(
    sortedComponentIds,
    changedComponentId,
    currentLayout,
    currentPageComponents
  );
  const computedLayouts = {};
  const temporaryLayoutPatch = {};

  // Debug: enable with `window.__DEBUG_REFLOW__ = true` in devtools. Prints
  // which widgets are seen, which ones make it into the connected lane, and
  // what top each target ends up at. Useful for diagnosing "widget X didn't
  // get pushed" — if X isn't in connectedIds, it's out of the lane.
  // eslint-disable-next-line no-undef
  const debug = typeof window !== 'undefined' && window.__DEBUG_REFLOW__;

  // Compute the changed widget's height delta ONCE. Used by the grow/shrink
  // path to push/pull every downstream widget by the same amount.
  const changedKey = getDynamicLayoutKey(changedComponentId, contextIndices);
  const changedCanonical = getCanonicalLayout(changedComponentId, currentLayout, currentPageComponents);
  const changedNewHeight = resolvedHeights[changedComponentId] ?? changedCanonical?.height ?? 0;
  // Old-height baseline is the calc-bumped canonical, NOT the raw canonical.
  // Author placed siblings relative to the bumped height (visible in editor),
  // so a view-mode widget rendering at the bumped height represents zero
  // delta — not a +20 growth.
  const changedOldHeight =
    temporaryLayouts?.[changedKey]?.height ?? getEffectiveCanonicalHeight(changedComponentId) ?? 0;
  const delta = changedNewHeight - changedOldHeight;
  const isChangedOutOfFlow = inFlowMap[changedComponentId] === false;
  // Accordion collapse is the one case where a widget shrinks far below
  // its authored canonical height (400 → 63 when the user collapses it).
  // The target's `collapsedCanonical` floor on otherMax would otherwise
  // pin downstream widgets at their authored position even though the
  // accordion between them shrunk. Scoping this to Accordion preserves
  // existing floor behavior for all other widget types (including Listview
  // rows, which rely on the floor to stay stable).
  const changedComponentType = currentPageComponents?.[changedComponentId]?.component?.component;
  const allowShrinkPullUp = changedComponentType === 'Accordion' && !isChangedOutOfFlow && delta < 0;

  if (debug) {
    // eslint-disable-next-line no-console
    console.log(
      '[reflow] changed:',
      changedComponentId,
      'delta:',
      delta,
      'outOfFlow:',
      isChangedOutOfFlow,
      'connectedIds:',
      connectedIds
    );
  }

  connectedIds.forEach((componentId) => {
    const targetCanonical = getCanonicalLayout(componentId, currentLayout, currentPageComponents);
    if (!targetCanonical) return;

    const targetKey = getDynamicLayoutKey(componentId, contextIndices);
    const existingTemp = temporaryLayouts?.[targetKey];
    const targetTopCanonical = targetCanonical.top ?? 0;
    const currentTop = existingTemp?.top ?? targetTopCanonical;

    const blockers = getBlockers({
      targetId: componentId,
      targetCanonical,
      sortedComponentIds,
      currentLayout,
      currentPageComponents,
      temporaryLayouts,
      contextIndices,
      inFlowMap,
      computedLayouts,
      resolvedHeights,
      changedComponentId,
    });

    // Out-of-flow slot sizes. Each out-of-flow blocker W's slot =
    // (next blocker's canonical top OR target.canonical.top) − W.canonical.top.
    // Includes W's footprint and its trailing gap to whatever sits below.
    const slotSize = new Map();
    const outOfFlowTopsById = new Map();
    for (let i = 0; i < blockers.length; i++) {
      const w = blockers[i];
      if (w.isInFlow) continue;
      const next = blockers[i + 1];
      const slotEnd = next?.canonicalLayout?.top ?? targetTopCanonical;
      const wTop = w.canonicalLayout?.top ?? 0;
      slotSize.set(w.id, slotEnd - wTop);
      outOfFlowTopsById.set(w.id, wTop);
    }
    const totalOutOfFlowSlot = Array.from(slotSize.values()).reduce((sum, s) => sum + s, 0);

    // Sum of Accordion shrinkage (canonical − current) for in-flow Accordion
    // blockers above target. An Accordion can legitimately render below its
    // authored height when collapsed; without this, the `collapsedCanonical`
    // floor below would inflate T's resting position back to its canonical
    // top, ignoring the collapsed accordion(s) above it. Restricted to
    // Accordion to keep Listview-row template heights (which can also drift
    // from canonical in nested contexts) from accidentally compressing the
    // floor.
    const totalAccordionShrinkage = blockers.reduce((sum, blocker) => {
      if (!blocker.isInFlow) return sum;
      const blockerComponentType = currentPageComponents?.[blocker.id]?.component?.component;
      if (blockerComponentType !== 'Accordion') return sum;
      const currentHeight = blocker.currentBottom - blocker.currentTop;
      const canonicalHeight = blocker.canonicalLayout?.height ?? 0;
      const shrinkage = canonicalHeight - currentHeight;
      return shrinkage > 0 ? sum + shrinkage : sum;
    }, 0);

    // Collapsed canonical: where T would sit at rest, with out-of-flow widgets
    // above it taking zero space AND in-flow collapsed Accordions contributing
    // only their current (header-only) height. This is the baseline we use
    // when T has no prior temp layout (e.g., initial mount with an already-
    // hidden blocker), and it's also the floor for `otherMax` so the in-flow
    // blocker loop doesn't inflate T past its true resting position.
    const collapsedCanonical = Math.max(0, targetTopCanonical - totalOutOfFlowSlot - totalAccordionShrinkage);

    // Shadowing: when an in-flow blocker fully covers the target's
    // horizontal lane, that blocker has already integrated every collapse
    // happening above it (its own reflow pass ran top-to-bottom earlier
    // and computed its `currentBottom` against the same out-of-flow set).
    // Far-up blockers ABOVE the shadower would re-apply that collapse
    // through canonical-gap math — but their slot-subtraction only counts
    // out-of-flow widgets that overlap the *target's* (narrower) lane, so
    // the cumulative gap they propose is too large. The shadower's
    // constraint is the truthful one for everything sitting below it.
    //
    // Pick the LOWEST (canonically closest to target) in-flow blocker
    // that fully covers target's lane. In-flow blockers strictly above
    // that shadower are skipped — their contribution is already baked
    // into the shadower's currentBottom.
    const targetLeft = targetCanonical.left ?? 0;
    const targetRight = targetLeft + (targetCanonical.width ?? 0);
    let shadowerCanonicalTop = -Infinity;
    let shadower = null;
    for (let si = blockers.length - 1; si >= 0; si--) {
      const v = blockers[si];
      if (!v.isInFlow) continue;
      const vLeft = v.canonicalLayout?.left ?? 0;
      const vWidth = v.canonicalLayout?.width ?? 0;
      const vRight = vLeft + vWidth;
      if (vLeft <= targetLeft && vRight >= targetRight) {
        shadowerCanonicalTop = v.canonicalLayout?.top ?? 0;
        shadower = v;
        break;
      }
    }

    // When a shadower exists, replace `collapsedCanonical` with a floor
    // anchored on the shadower. Reason: the original `collapsedCanonical`
    // sums every out-of-flow slot in target's lane — which double-counts
    // collapse that the shadower already absorbed. For widgets in narrow
    // lanes, the lane-specific OOF total is smaller than what the shadower
    // already integrated, so the original floor pins the target lower than
    // where the shadower-based gap would put it (e.g., button row drifts
    // below dropdown row in a multi-column layout). Anchoring the floor on
    // the shadower keeps row partners aligned without breaking the
    // structural-rest contract.
    let effectiveCollapsedCanonical = collapsedCanonical;
    if (shadower) {
      const shadowerCanonicalBottom = shadowerCanonicalTop + getEffectiveCanonicalHeight(shadower.id);
      let belowShadowerSubtraction = 0;
      for (const [uid, slot] of slotSize) {
        const uTop = outOfFlowTopsById.get(uid) ?? 0;
        if (uTop >= shadowerCanonicalBottom && uTop < targetTopCanonical) {
          belowShadowerSubtraction += slot;
        }
      }
      const shadowerFloor =
        shadower.currentBottom + (targetTopCanonical - shadowerCanonicalBottom) - belowShadowerSubtraction;
      effectiveCollapsedCanonical = Math.max(0, shadowerFloor);
    }

    // Baseline for delta propagation: existing temp if present (captures any
    // prior push/pull), otherwise the collapsed canonical (captures hide-
    // collapse on mount).
    //
    // For GROW/SHRINK (changed widget in flow), use the *plain*
    // `collapsedCanonical` — NOT `effectiveCollapsedCanonical`. The shadower
    // adjustment baked into the latter uses `shadower.currentBottom`, which
    // for the changed widget (or any blocker already pushed by it) already
    // includes the growth that `delta` is about to add via `proposedTop`.
    // Letting it leak in here double-counts the push and cascades downstream
    // — a 50→70 textarea grew the next widget's gap by 40 instead of 20, and
    // the widget below that by 60. The shadower floor still feeds `otherMax`
    // below, where it's combined via `max()` instead of added, so the narrow-
    // lane drift case (the original reason for the shadower fallback) stays
    // covered. HIDE/SHOW (out-of-flow) keeps the shadower-anchored fallback
    // because that path does no delta addition.
    const baseTop = existingTemp?.top ?? (isChangedOutOfFlow ? effectiveCollapsedCanonical : collapsedCanonical);

    let nextTop;

    if (componentId === changedComponentId) {
      // Changed widget: delta only moves DOWNSTREAM widgets. Its own top
      // stays where it was (preserving any push it had from widgets above).
      nextTop = baseTop;
    } else {
      // Delta from the changed widget only applies when that widget is in
      // flow (grow/shrink). When it's out of flow (hide), slot subtraction
      // and structural constraints do all the work.
      const effectiveDelta = isChangedOutOfFlow ? 0 : delta;
      const proposedTop = baseTop + effectiveDelta;

      // Max over every in-flow blocker (INCLUDING the changed widget). Each
      // canonical gap has out-of-flow slot subtraction applied, plus a
      // correction for the current-vs-canonical height delta of any in-flow
      // widgets W canonically between V and T.
      //
      // Why the in-flow correction? canonicalGap(V→T) = T.canonical.top −
      // V.canonical.bottom, which bakes in the authored heights of every
      // widget between V and T. If one of those widgets (e.g., an Accordion
      // between a Title and a Form) shrinks at runtime, the authored gap is
      // now too large — without this correction, an upstream blocker would
      // pin T at its authored position even though the widget between them
      // shrunk. Subtract each in-flow W's (canonical − current) so V's
      // effective constraint reflects the current rendered stack.
      //
      // Why include the changed widget? On SHOW (V transitions from out-of-
      // flow to in-flow with delta=0 because its height didn't change), we
      // still need V's larger "grown" constraint to push T back down. On
      // GROW, the delta-propagation proposedTop already reflects V's growth
      // via T's prior state — including V here doesn't double-push because
      // `max(proposedTop, otherMax)` picks the larger one, and at steady
      // state the two agree.
      //
      // `otherMax` starts at 0 (then is driven by in-flow blocker
      // constraints) ONLY when the changed widget is an Accordion that's
      // collapsing. In every other case, initialize at `collapsedCanonical`
      // so the floor-at-authored-top behavior is preserved. Flooring at
      // `collapsedCanonical` is the long-standing contract that widgets
      // (including Listview row templates) rely on to stay stable; only
      // the Accordion-shrink-below-canonical case needs to bypass it.
      let otherMax = allowShrinkPullUp ? 0 : effectiveCollapsedCanonical;
      let hasInFlowBlocker = false;
      for (let vi = 0; vi < blockers.length; vi++) {
        const v = blockers[vi];
        if (!v.isInFlow) continue;
        const vCanonicalTopForShadow = v.canonicalLayout?.top ?? 0;
        if (vCanonicalTopForShadow < shadowerCanonicalTop) continue;
        hasInFlowBlocker = true;
        const vCanonicalTop = v.canonicalLayout?.top ?? 0;
        const vCanonicalBottom = vCanonicalTop + getEffectiveCanonicalHeight(v.id);
        // Canonical-overlap correction (scoped to collapse-on-hide blockers
        // only — the dynamic-height grow/shrink path keeps its original
        // canonical math). When V opted into collapseWhenHidden AND target's
        // canonical top sits above V's canonical bottom, the only way the
        // author could draw that overlap is by placing T below V's
        // HIDDEN_COMPONENT_HEIGHT placeholder. Without this, canonicalGap
        // goes negative on V's show transition and pins T inside V; with it,
        // the gap reflects what the user actually drew against the placeholder.
        const blockerOptedIntoCollapse = collapseWhenHiddenMap?.[v.id] === true;
        const vCanonicalBottomForGap =
          blockerOptedIntoCollapse && targetTopCanonical < vCanonicalBottom
            ? vCanonicalTop + HIDDEN_COMPONENT_HEIGHT
            : vCanonicalBottom;
        let subtraction = 0;
        for (const [uid, slot] of slotSize) {
          const uTop = outOfFlowTopsById.get(uid) ?? 0;
          if (uTop >= vCanonicalBottom && uTop < targetTopCanonical) {
            subtraction += slot;
          }
        }
        // In-flow delta: subtract any in-flow Accordion (or the current pass's
        // changed widget) sitting canonically between V and T whose current
        // rendered height differs from canonical. Accounts for the case where
        // an upstream blocker V (like a Title) would pin T at its authored
        // position even though a widget W between them shrunk (e.g., an
        // Accordion that's collapsed in temp from a prior pass). Without this,
        // V's canonical gap to T overstates the real gap once W has shrunk.
        //
        // Restricted to (a) the changed widget and (b) Accordion blockers to
        // avoid affecting blocker math for unrelated widgets whose temp
        // heights legitimately differ from canonical in nested contexts (e.g.,
        // Listview row templates).
        //
        // The vertical-sandwich check (wTop >= vCanonicalBottom &&
        // wTop < targetTopCanonical) mirrors the out-of-flow slot
        // subtraction above. Without it, a sibling of V that sorts after
        // V only by left/id (same canonical top) would wrongly have its
        // shrinkage subtracted from V's gap — e.g., when Accordion
        // collapses next to a tall Container, Container's constraint on
        // a downstream Button must not be reduced by Accordion's shrink.
        let inFlowDelta = 0;
        for (let wi = vi + 1; wi < blockers.length; wi++) {
          const w = blockers[wi];
          if (!w.isInFlow) continue;
          const wComponentType = currentPageComponents?.[w.id]?.component?.component;
          const isShrinkableBlocker = w.id === changedComponentId || wComponentType === 'Accordion';
          if (!isShrinkableBlocker) continue;
          const wTop = w.canonicalLayout?.top ?? 0;
          if (wTop < vCanonicalBottom || wTop >= targetTopCanonical) continue;
          const wCurrentHeight = w.currentBottom - w.currentTop;
          // Use the effective canonical (calc-bumped) height for the same
          // reason as `changedOldHeight`/`vCanonicalBottom` above: for
          // top-aligned input widgets, the author placed siblings around the
          // bumped height, so a current rendering at that bumped height is
          // zero delta, not a +20 inflation. Without this swap, the sandwich
          // case (V above → W=changed top-label input → T below) would
          // re-introduce the same push that the other call sites fixed.
          const wCanonicalHeight = getEffectiveCanonicalHeight(w.id);
          inFlowDelta += wCurrentHeight - wCanonicalHeight;
        }
        const canonicalGap = targetTopCanonical - vCanonicalBottomForGap - subtraction;
        const constraint = v.currentBottom + canonicalGap + inFlowDelta;
        if (constraint > otherMax) otherMax = constraint;
      }
      if (allowShrinkPullUp && !hasInFlowBlocker) {
        otherMax = effectiveCollapsedCanonical;
      }

      // On hide transitions (changed is going out of flow), existing temp
      // reflects the pre-hide layout — T needs to collapse to the structural
      // position regardless of its prior temp. In that case, ignore the
      // delta-propagation baseline and use the structural max directly.
      nextTop = isChangedOutOfFlow ? Math.max(otherMax, effectiveCollapsedCanonical) : Math.max(proposedTop, otherMax);
    }

    const currentEffectiveLayout = getEffectiveLayout(
      componentId,
      currentLayout,
      currentPageComponents,
      temporaryLayouts,
      contextIndices
    );
    const nextHeight =
      componentId === changedComponentId
        ? changedNewHeight
        : resolvedHeights[componentId] ?? currentEffectiveLayout?.height ?? 0;

    // Merge order: canonical (base) < existing temp (carry over left/width
    // etc.) < new top/height. Anything we don't touch passes through.
    const nextLayout = {
      ...currentPageComponents?.[componentId]?.layouts?.[currentLayout],
      ...temporaryLayouts?.[getDynamicLayoutKey(componentId, contextIndices)],
      top: nextTop,
      height: nextHeight,
    };

    computedLayouts[componentId] = nextLayout;
    temporaryLayoutPatch[getDynamicLayoutKey(componentId, contextIndices)] = nextLayout;

    if (debug) {
      // eslint-disable-next-line no-console
      console.log(
        '[reflow]  target:',
        componentId,
        'canonicalTop:',
        targetTopCanonical,
        'nextTop:',
        nextTop,
        'blockers:',
        blockers.map((b) => ({ id: b.id, cBot: b.currentBottom, inFlow: b.isInFlow }))
      );
    }
  });

  return { temporaryLayoutPatch };
};

// Determine the context indices to use when bubbling to the parent.
//   - Root context: no bubbling needed at the context level.
//   - Listview widget-level bubble (nextBubbleTargetId === componentId):
//     pop one row-index off the context so we target the ancestor's context.
//   - Otherwise: pass the same context through (parent lives in the same
//     subcontainer scope).
export const getNextBubbleContext = (componentType, contextIndices, componentId, nextBubbleTargetId) => {
  const context = normalizeLayoutContext(contextIndices);

  if (!context) {
    return null;
  }

  if (componentType === 'Listview' && nextBubbleTargetId === componentId) {
    return context.length > 1 ? context.slice(0, -1) : null;
  }

  return context;
};

// Resolve the id to reflow next after the current widget's reflow finishes.
//
//   - Listview inside a non-renderable scoped context: self-bubble (widget-
//     level pass still needs to run once the row pass is done).
//   - Real component parent: use the base ancestor id resolved from
//     getBaseParentId — handles slot-like parent ids (`<id>-header`,
//     `<tabsId>-<tabId>`) by climbing to the actual ancestor component.
//   - Fallback: strip trailing `-suffix` segments until we find a real id.
export const getNextBubbleTargetId = ({
  componentId,
  componentType,
  parentId,
  contextIndices,
  getBaseParentId,
  isScopedContextRenderable = false,
  currentPageComponents,
}) => {
  if (componentType === 'Listview' && normalizeLayoutContext(contextIndices) && !isScopedContextRenderable) {
    return componentId;
  }

  const resolvedBaseParentId = getBaseParentId?.(parentId) || null;
  if (resolvedBaseParentId && currentPageComponents?.[resolvedBaseParentId]) {
    return resolvedBaseParentId;
  }

  if (parentId && currentPageComponents?.[parentId]) {
    return parentId;
  }

  // Fallback for slot-like ids (e.g., `<tabsId>-<tabId>`, `<id>-header`):
  // walk backward through dash-joined segments until a real component id
  // resolves.
  if (typeof parentId === 'string') {
    const parts = parentId.split('-');
    for (let index = parts.length - 1; index > 0; index--) {
      const candidateId = parts.slice(0, index).join('-');
      if (currentPageComponents?.[candidateId]) {
        return candidateId;
      }
    }
  }

  return resolvedBaseParentId || parentId;
};

// Guard against self-recursion: don't bubble when the next target is literally
// the same (component id, context) as the current pass. Handles the Listview
// widget-level → widget-level no-op and other degenerate chains.
export const shouldBubbleToParent = ({
  currentComponentId,
  nextComponentId,
  currentContextIndices,
  nextContextIndices,
}) => {
  if (!nextComponentId) {
    return false;
  }

  const currentContextKey = serializeLayoutContext(currentContextIndices);
  const nextContextKey = serializeLayoutContext(nextContextIndices);

  return !(currentComponentId === nextComponentId && currentContextKey === nextContextKey);
};
