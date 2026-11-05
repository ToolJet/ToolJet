import {
  bindModuleAwareGetResolvedComponent,
  getDynamicLayoutKey,
  normalizeLayoutContext,
  resolveWidgetMeasuredHeight,
  resolveWidgetVisibility,
} from '../utils/dynamicHeightReflow';
import { solveContainer } from './solver';
import { getContentSlotId, resolveContainerHeightV2 } from './containerHeight';

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic-height engine — turns a batch of height changes into one
// temporaryLayouts write.
//
//   1. Every changed widget gets its current height: measured for leaf
//      widgets, computed from solved children for containers.
//   2. Every container slot that holds a changed widget is solved once with
//      the stateless solver; the result is written for all of its children.
//   3. The container that owns the slot is queued as changed, so growth moves
//      outwards. Work is ordered by depth, so a container is always solved
//      after everything inside it.
//
// Saved layouts are never written. Positions depend only on saved layouts and
// current heights, so the editor and the viewer always agree.
// ─────────────────────────────────────────────────────────────────────────────

const ROOT_SLOT = '__root__';
// Containers whose grid content is solved here; Listview rows and flex
// children are sized by their own rules.
const GRID_CONTAINER_TYPES = new Set(['Container', 'Form', 'Tabs', 'Accordion', 'ModalV2', 'ModuleContainer']);
const childrenIndexCache = new WeakMap();

// parent slot id → child ids, rebuilt only when the page's components change.
const getChildrenIndex = (components) => {
  let index = childrenIndexCache.get(components);
  if (index) return index;
  index = new Map();
  for (const [id, component] of Object.entries(components)) {
    const slot = component?.component?.parent ?? ROOT_SLOT;
    if (!index.has(slot)) index.set(slot, []);
    index.get(slot).push(id);
  }
  childrenIndexCache.set(components, index);
  return index;
};

const contextKey = (contextIndices) => (contextIndices ? contextIndices.join('.') : '');

const createModuleScope = (state, moduleId, currentLayout) => {
  const components = state.getCurrentPageComponents(moduleId) || {};
  const getResolvedComponent = bindModuleAwareGetResolvedComponent(
    state.getResolvedComponent,
    state.getComponentTypeFromId,
    moduleId
  );
  const getExposed = (id, contextIndices, property) =>
    state.getExposedPropertyForAdditionalActions(id, contextIndices, property, moduleId);
  const getComponentDefinition = (id) => state.getComponentDefinition(id, moduleId);
  const savedHeightCache = new Map();
  const depthCache = new Map();

  const scope = {
    moduleId,
    currentLayout,
    components,
    childrenIndex: getChildrenIndex(components),
    getResolvedComponent,
    getExposed,
    getComponentDefinition,
    getResolvedValue: (value, customVars) => state.getResolvedValue(value, customVars, moduleId),
    calculateMoveableBoxHeightWithId: (id, layout, styles) =>
      state.calculateMoveableBoxHeightWithId(id, layout, styles, moduleId),
    typeOf: (id) => components[id]?.component?.component,
    savedLayout: (id) => components[id]?.layouts?.[currentLayout],
    // Saved height as the editor draws it (top-label inputs get their label row).
    savedHeight: (id) => {
      if (savedHeightCache.has(id)) return savedHeightCache.get(id);
      const styles = getComponentDefinition(id)?.component?.definition?.styles;
      const height = state.calculateMoveableBoxHeightWithId(id, currentLayout, styles, moduleId);
      const value = typeof height === 'number' ? height : (scope.savedLayout(id)?.height ?? 0);
      savedHeightCache.set(id, value);
      return value;
    },
    ownerOf: (slotId) => {
      if (!slotId) return null;
      const baseId = state.getBaseParentId(slotId);
      return components[baseId] ? baseId : null;
    },
    // Listviews around a widget: each adds one row index to its context.
    listviewAncestors: (id) => {
      let count = 0;
      let owner = scope.ownerOf(components[id]?.component?.parent);
      const seen = new Set([id]);
      while (owner && !seen.has(owner)) {
        seen.add(owner);
        if (scope.typeOf(owner) === 'Listview') count += 1;
        owner = scope.ownerOf(components[owner]?.component?.parent);
      }
      return count;
    },
    depthOf: (id) => {
      if (depthCache.has(id)) return depthCache.get(id);
      let depth = 0;
      let owner = scope.ownerOf(components[id]?.component?.parent);
      const seen = new Set([id]);
      while (owner && !seen.has(owner)) {
        seen.add(owner);
        depth += 1;
        owner = scope.ownerOf(components[owner]?.component?.parent);
      }
      depthCache.set(id, depth);
      return depth;
    },
  };
  return scope;
};

// `requests`: widgets whose height may have changed ({ id, layout, isContainer,
// contextIndices, moduleId }). `measuredHeights`: layout key → height already
// measured by the height registry. `fullModules`: modules whose saved layout
// changed, so every slot on their current page is solved again.
export const flushDynamicHeight = (get, { requests = [], measuredHeights = new Map(), fullModules = [] } = {}) => {
  const state = get();
  const baseTemps = state.temporaryLayouts || {};
  const patch = {};
  const tempOf = (key) => (key in patch ? patch[key] : baseTemps[key]);
  // Legacy helpers read temporaryLayouts as a plain object; give them this
  // pass's results without copying the whole map. The store's object is
  // frozen, and a proxy may not report a different value for a frozen
  // property of its target, so the target is an empty object.
  const temporaryLayouts = new Proxy(
    {},
    {
      get: (_, key) => tempOf(key),
      has: (_, key) => key in patch || key in baseTemps,
      ownKeys: () => [...new Set([...Reflect.ownKeys(baseTemps), ...Reflect.ownKeys(patch)])],
      getOwnPropertyDescriptor: (_, key) =>
        key in patch || key in baseTemps
          ? { value: tempOf(key), writable: false, enumerable: true, configurable: true }
          : undefined,
    }
  );

  const scopes = new Map();
  const scopeFor = (moduleId, layout) => {
    const scopeKey = `${moduleId}|${layout}`;
    if (!scopes.has(scopeKey)) scopes.set(scopeKey, createModuleScope(state, moduleId, layout));
    return scopes.get(scopeKey);
  };

  // Heights decided in this pass, by layout key.
  const heights = new Map();
  const solvedSlots = new Map();
  const touchedRoots = new Set();

  // Work items keyed by priority: a widget at depth d is 2d+1, the slot that
  // holds depth-d widgets is 2d. Higher priority runs first, and new work is
  // only ever queued at a lower priority, so one downward sweep finishes it.
  const buckets = [];
  const queued = new Set();
  const enqueue = (priority, itemKey, item) => {
    if (queued.has(itemKey)) return;
    queued.add(itemKey);
    (buckets[priority] ||= []).push(item);
  };

  // A Listview row reports with its row index appended to the Listview's own
  // context.
  const isListviewRow = (scope, id, context) =>
    scope.typeOf(id) === 'Listview' && (context?.length ?? 0) > scope.listviewAncestors(id);

  const enqueueWidget = (scope, id, contextIndices, isContainer) => {
    const context = normalizeLayoutContext(contextIndices);
    // A row is the slot holding the row's children, one level below the
    // Listview, so it is placed before the Listview it resizes.
    if (isContainer && isListviewRow(scope, id, context)) {
      enqueueSlot(scope, id, context, scope.depthOf(id) + 1);
      return;
    }
    const priority = 2 * scope.depthOf(id) + 1;
    const key = `w|${scope.moduleId}|${scope.currentLayout}|${id}|${contextKey(context)}`;
    enqueue(priority, key, { kind: 'widget', scope, id, context, isContainer });
  };

  const enqueueSlot = (scope, slotId, context, depth) => {
    const key = `s|${scope.moduleId}|${scope.currentLayout}|${slotId ?? ROOT_SLOT}|${contextKey(context)}`;
    enqueue(2 * depth, key, { kind: 'slot', scope, slotId, context });
  };

  const isVisible = (scope, id, context) =>
    resolveWidgetVisibility({
      componentId: id,
      contextIndices: context,
      currentLayout: scope.currentLayout,
      getResolvedComponent: scope.getResolvedComponent,
      getExposedPropertyForAdditionalActions: scope.getExposed,
    });

  // Current rendered height of a widget, ignoring whether it is collapsed.
  const currentHeight = (scope, id, context) => {
    const key = getDynamicLayoutKey(id, context, '', scope.moduleId);
    if (heights.has(key)) return heights.get(key);
    const resolved = scope.getResolvedComponent(id, context);
    const sizesItself = resolved?.properties?.dynamicHeight || scope.typeOf(id) === 'Accordion';
    const tempHeight = tempOf(key)?.height;
    if (sizesItself && tempHeight > 0) return tempHeight;
    return scope.savedHeight(id);
  };

  const childBoxes = (scope, slotId, context) => {
    const ids = scope.childrenIndex.get(slotId ?? ROOT_SLOT) || [];
    const boxes = [];
    const flow = new Map();
    for (const id of ids) {
      const layout = scope.savedLayout(id);
      if (!layout) continue;
      const collapsible = scope.getResolvedComponent(id, context)?.properties?.collapseWhenHidden === true;
      const visible = isVisible(scope, id, context);
      flow.set(id, !visible && collapsible ? 0 : currentHeight(scope, id, context));
      boxes.push({
        id,
        top: layout.top ?? 0,
        left: layout.left ?? 0,
        width: layout.width ?? 0,
        height: scope.savedHeight(id),
        collapsible,
        updatedAt: layout.updatedAt,
      });
    }
    return { boxes, flow };
  };

  const solveSlot = (scope, slotId, context) => {
    const key = `${scope.moduleId}|${scope.currentLayout}|${slotId ?? ROOT_SLOT}|${contextKey(context)}`;
    if (solvedSlots.has(key)) return solvedSlots.get(key);
    const { boxes, flow } = childBoxes(scope, slotId, context);
    const result = { ...solveContainer(boxes, (id) => flow.get(id)), flow };
    solvedSlots.set(key, result);
    return result;
  };

  const writeLayout = (key, scope, id, next) => {
    const existing = tempOf(key);
    const saved = scope.savedLayout(id);
    if (existing) {
      if (Object.keys(next).every((field) => existing[field] === next[field])) return;
    } else if (Object.keys(next).every((field) => saved?.[field] === next[field])) {
      return;
    }
    patch[key] = { ...saved, ...existing, ...next };
  };

  const containerHeight = (scope, id, context, visibility) => {
    const resolved = scope.getResolvedComponent(id, context);
    const componentType = scope.typeOf(id);
    const getExposedValue = (property) => scope.getExposed(id, context, property);
    const generateFormFrom = scope.getComponentDefinition(id)?.component?.definition?.properties?.generateFormFrom;
    return resolveContainerHeightV2({
      componentId: id,
      componentType,
      contextIndices: context,
      canonicalHeight: scope.savedLayout(id)?.height ?? 0,
      visibility,
      resolved,
      getExposedValue,
      solveSlot: (slotId) => solveSlot(scope, slotId, context).bottom,
      isListviewRow: isListviewRow(scope, id, context),
      legacyArgs: {
        componentId: id,
        componentType,
        currentLayout: scope.currentLayout,
        currentPageComponents: scope.components,
        temporaryLayouts,
        contextIndices: context,
        visibility,
        isJsonSchemaForm: scope.getResolvedValue(generateFormFrom?.value) === 'jsonSchema',
        getResolvedComponent: scope.getResolvedComponent,
        getResolvedValue: scope.getResolvedValue,
        getComponentDefinition: scope.getComponentDefinition,
        getContainerChildrenMapping: state.getContainerChildrenMapping,
        getExposedPropertyForAdditionalActions: scope.getExposed,
        calculateMoveableBoxHeightWithId: scope.calculateMoveableBoxHeightWithId,
        moduleId: scope.moduleId,
      },
    });
  };

  // ── widget: decide its height, then queue the slot it sits in ─────────────
  const processWidget = ({ scope, id, context, isContainer }) => {
    const component = scope.components[id];
    if (!component || !scope.savedLayout(id)) return;
    const key = getDynamicLayoutKey(id, context, '', scope.moduleId);
    const visibility = isVisible(scope, id, context);
    const componentType = scope.typeOf(id);

    let height;
    if (isContainer) {
      height = containerHeight(scope, id, context, visibility);
      // The container's own layout may have changed (a child added, moved or
      // removed), so its content is placed again even if no child grew.
      if (GRID_CONTAINER_TYPES.has(componentType)) {
        const resolved = scope.getResolvedComponent(id, context);
        const getExposedValue = (property) => scope.getExposed(id, context, property);
        writeSlot(scope, getContentSlotId({ componentId: id, componentType, resolved, getExposedValue }), context);
      }
    } else if (measuredHeights.has(key)) {
      height = measuredHeights.get(key);
    } else {
      height = resolveWidgetMeasuredHeight({
        componentId: id,
        currentLayout: scope.currentLayout,
        currentPageComponents: scope.components,
        temporaryLayouts,
        contextIndices: context,
        isContainer: false,
        visibility,
        calculateMoveableBoxHeightWithId: scope.calculateMoveableBoxHeightWithId,
        moduleId: scope.moduleId,
      });
    }

    // A Modal's body is portalled out of the grid: size it, and stop there.
    if (componentType === 'ModalV2' && isContainer) {
      writeLayout(getDynamicLayoutKey(id, context, '-body', scope.moduleId), scope, id, { height });
      return;
    }

    heights.set(key, height);
    const slotId = component.component?.parent ?? null;
    enqueueSlot(scope, slotId, context, scope.depthOf(id));
  };

  // Writes the solved positions of one slot's children.
  const writtenSlots = new Set();
  const writeSlot = (scope, slotId, context) => {
    const slotKey = `${scope.moduleId}|${scope.currentLayout}|${slotId ?? ROOT_SLOT}|${contextKey(context)}`;
    if (writtenSlots.has(slotKey)) return;
    writtenSlots.add(slotKey);
    const owner = scope.ownerOf(slotId);
    const ids = scope.childrenIndex.get(slotId ?? ROOT_SLOT) || [];

    if (owner && scope.typeOf(owner) === 'FlexContainer') {
      // Flex children are placed by flex rules; only their heights matter.
      for (const id of ids) {
        const key = getDynamicLayoutKey(id, context, '', scope.moduleId);
        if (heights.has(key)) writeLayout(key, scope, id, { height: heights.get(key) });
      }
      return;
    }

    const { tops } = solveSlot(scope, slotId, context);
    const pinToTop = !slotId && scope.moduleId !== 'canvas';
    for (const id of ids) {
      if (!tops.has(id)) continue;
      // An embedded module's root renders flush with the instance.
      const pinned = pinToTop && scope.typeOf(id) === 'ModuleContainer';
      writeLayout(getDynamicLayoutKey(id, context, '', scope.moduleId), scope, id, {
        top: pinned ? 0 : tops.get(id),
        height: currentHeight(scope, id, context),
      });
    }
  };

  // ── slot: solve its children and queue the container that owns it ────────
  const processSlot = ({ scope, slotId, context }) => {
    writeSlot(scope, slotId, context);
    const owner = scope.ownerOf(slotId);
    const ownerType = owner ? scope.typeOf(owner) : null;

    if (!owner) {
      touchedRoots.add(scope.moduleId);
      return;
    }

    // A Listview row: record the row's height, then size the Listview itself
    // in its own (outer) context.
    if (ownerType === 'Listview' && context) {
      const rowHeight = containerHeight(scope, owner, context, true);
      writeLayout(getDynamicLayoutKey(owner, context, '', scope.moduleId), scope, owner, { height: rowHeight });
      const outerContext = context.length > 1 ? context.slice(0, -1) : null;
      enqueueWidget(scope, owner, outerContext, true);
      return;
    }

    const ownerResolved = scope.getResolvedComponent(owner, context);
    if (ownerResolved?.properties?.dynamicHeight === false && ownerType !== 'Accordion') return;
    enqueueWidget(scope, owner, context, true);
  };

  for (const { id, layout, isContainer, contextIndices, moduleId } of requests) {
    enqueueWidget(scopeFor(moduleId || 'canvas', layout), id, contextIndices, isContainer);
  }

  for (const moduleId of fullModules) {
    const scope = scopeFor(moduleId, state.currentLayout);
    for (const slot of scope.childrenIndex.keys()) {
      const slotId = slot === ROOT_SLOT ? null : slot;
      const owner = scope.ownerOf(slotId);
      if (slotId && (!owner || scope.typeOf(owner) === 'Listview')) continue;
      enqueueSlot(scope, slotId, null, owner ? scope.depthOf(owner) + 1 : 0);
    }
  }

  for (let priority = buckets.length - 1; priority >= 0; priority--) {
    for (const item of buckets[priority] || []) {
      try {
        if (item.kind === 'widget') processWidget(item);
        else processSlot(item);
      } catch (error) {
        console.error('dynamic height: could not process', item.kind, item.id ?? item.slotId, error);
      }
    }
  }

  if (Object.keys(patch).length === 0) return patch;
  state.setTemporaryLayouts(patch);
  // The canvas height follows the root's solved bottom; the canvas re-reads
  // it on this signal in both the editor and the viewer.
  if (touchedRoots.size > 0) get().incrementCanvasUpdater();

  return patch;
};
