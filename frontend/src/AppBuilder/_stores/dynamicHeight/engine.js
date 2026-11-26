import {
  bindModuleAwareGetResolvedComponent,
  getDynamicLayoutKey,
  normalizeLayoutContext,
  resolveWidgetVisibility,
} from '../utils/dynamicHeightReflow';
import { solveContainer } from './solver';
import { getContentSlotId, resolveContainerHeightV2 } from './containerHeight';
import { heightContractOf } from './contracts';

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
// What a container is, and how it sizes, comes from its height contract
// (contracts.js); nothing here names a widget type.
//
// Saved layouts are never written. Positions depend only on saved layouts and
// current heights, so the editor and the viewer always agree. Nothing here
// reads the DOM: a leaf without a fresh measurement keeps its last height.
// ─────────────────────────────────────────────────────────────────────────────

const ROOT_SLOT = '__root__';
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
    contractOf: (id) => heightContractOf(components[id]?.component?.component),
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
    // Row containers around a widget: each adds one row index to its context.
    rowAncestors: (id) => {
      let count = 0;
      let owner = scope.ownerOf(components[id]?.component?.parent);
      const seen = new Set([id]);
      while (owner && !seen.has(owner)) {
        seen.add(owner);
        if (scope.contractOf(owner)?.content === 'rows') count += 1;
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

const isProduction = () => process.env.NODE_ENV === 'production';

const isWidgetVisible = (scope, id, context) =>
  resolveWidgetVisibility({
    componentId: id,
    contextIndices: context,
    currentLayout: scope.currentLayout,
    getResolvedComponent: scope.getResolvedComponent,
    getExposedPropertyForAdditionalActions: scope.getExposed,
  });

// Last known height of a widget: its last written height when it sizes
// itself, otherwise the height the builder drew.
const knownHeight = (scope, id, context, tempLayout) => {
  const resolved = scope.getResolvedComponent(id, context);
  const sizesItself = resolved?.properties?.dynamicHeight || scope.contractOf(id)?.followsExpansion === true;
  if (sizesItself && tempLayout?.height > 0) return tempLayout.height;
  return scope.savedHeight(id);
};

// Editor POC: one slot as it is currently rendered: saved boxes, current flow
// heights and rendered tops. The editor uses it to turn a drop position into
// a saved one and to keep siblings where they are.
export const readRenderedSlot = (state, { moduleId = 'canvas', slotId = null, context = null, excludeIds = [] }) => {
  const scope = createModuleScope(state, moduleId, state.currentLayout);
  const temps = state.temporaryLayouts || {};
  const excluded = new Set(excludeIds);
  const siblings = [];
  const flow = new Map();
  const tops = new Map();
  for (const id of scope.childrenIndex.get(slotId ?? ROOT_SLOT) || []) {
    const layout = scope.savedLayout(id);
    if (!layout || excluded.has(id)) continue;
    const temp = temps[getDynamicLayoutKey(id, context, '', moduleId)];
    const collapsible = scope.getResolvedComponent(id, context)?.properties?.collapseWhenHidden === true;
    const visible = isWidgetVisible(scope, id, context);
    flow.set(id, !visible && collapsible ? 0 : knownHeight(scope, id, context, temp));
    tops.set(id, temp?.top ?? layout.top ?? 0);
    siblings.push({
      id,
      top: layout.top ?? 0,
      left: layout.left ?? 0,
      width: layout.width ?? 0,
      height: scope.savedHeight(id),
      collapsible,
      updatedAt: layout.updatedAt,
    });
  }
  return { siblings, tops, flowOf: (id) => flow.get(id) ?? 0 };
};

// `requests`: widgets whose height may have changed ({ id, layout, isContainer,
// contextIndices, moduleId }). `measuredHeights`: layout key → height already
// measured by the height registry. `fullModules`: modules whose saved layout
// changed, so every slot on their current page is solved again.
//
// A work item that throws is never dropped silently. Outside production the
// pass throws, so a broken engine fails tests and local runs. In production
// the rest of the pass is applied, the error is logged and `onError(moduleId,
// error)` lets the caller recover (the scheduler solves the module again).
// `editor` (editor POC): { modules: Set<moduleId in edit mode>, snapStep,
// revealedIds: Set }. In those modules rendered tops snap to `snapStep` (PDF
// Q6) and a selected collapsed widget is laid out as if visible (PDF Q51).
export const flushDynamicHeight = (
  get,
  { requests = [], measuredHeights = new Map(), fullModules = [], onError, editor } = {}
) => {
  const editorFor = (scope) => (editor?.modules?.has(scope.moduleId) ? editor : null);
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
  // Queueing above the bucket being drained would lose the item, so it is an
  // error rather than a silent skip.
  const buckets = [];
  const queued = new Set();
  let draining = -1;
  const enqueue = (priority, itemKey, item) => {
    if (queued.has(itemKey)) return;
    if (draining >= 0 && priority > draining) {
      throw new Error(`dynamic height: ${itemKey} queued at priority ${priority} while draining ${draining}`);
    }
    queued.add(itemKey);
    (buckets[priority] ||= []).push(item);
  };

  // A row container reports a row with the row index appended to its own
  // context.
  const isRow = (scope, id, context) =>
    scope.contractOf(id)?.content === 'rows' && (context?.length ?? 0) > scope.rowAncestors(id);

  const enqueueWidget = (scope, id, contextIndices, isContainer) => {
    const context = normalizeLayoutContext(contextIndices);
    // A row is the slot holding the row's children, one level below the
    // container, so it is placed before the container it resizes.
    if (isContainer && isRow(scope, id, context)) {
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

  const isVisible = isWidgetVisible;

  // Current rendered height of a widget, ignoring whether it is collapsed:
  // decided in this pass, else its last written height when it sizes itself,
  // else the height the builder drew.
  const currentHeight = (scope, id, context) => {
    const key = getDynamicLayoutKey(id, context, '', scope.moduleId);
    if (heights.has(key)) return heights.get(key);
    return knownHeight(scope, id, context, tempOf(key));
  };

  const childBoxes = (scope, slotId, context) => {
    const ids = scope.childrenIndex.get(slotId ?? ROOT_SLOT) || [];
    const boxes = [];
    const flow = new Map();
    for (const id of ids) {
      const layout = scope.savedLayout(id);
      if (!layout) continue;
      const collapsible = scope.getResolvedComponent(id, context)?.properties?.collapseWhenHidden === true;
      const visible = isVisible(scope, id, context) || editorFor(scope)?.revealedIds?.has(id) === true;
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
      contract: scope.contractOf(id),
      contextIndices: context,
      canonicalHeight: scope.savedLayout(id)?.height ?? 0,
      visibility,
      resolved,
      getExposedValue,
      solveSlot: (slotId) => solveSlot(scope, slotId, context).bottom,
      isListviewRow: isRow(scope, id, context),
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
    const contract = scope.contractOf(id);

    let height;
    if (isContainer) {
      height = containerHeight(scope, id, context, visibility);
      // The container's own layout may have changed (a child added, moved or
      // removed), so its content is placed again even if no child grew.
      if (contract?.content === 'grid') {
        const resolved = scope.getResolvedComponent(id, context);
        const getExposedValue = (property) => scope.getExposed(id, context, property);
        writeSlot(scope, getContentSlotId({ componentId: id, contract, resolved, getExposedValue }), context);
      }
    } else if (measuredHeights.has(key)) {
      height = measuredHeights.get(key);
    } else {
      height = currentHeight(scope, id, context);
    }

    // A portalled body is sized, and stops there: it is outside the grid.
    if (contract?.portal === true && isContainer) {
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

    if (owner && scope.contractOf(owner)?.content === 'flex') {
      // Flex children are placed by flex rules; only their heights matter.
      for (const id of ids) {
        const key = getDynamicLayoutKey(id, context, '', scope.moduleId);
        if (heights.has(key)) writeLayout(key, scope, id, { height: heights.get(key) });
      }
      return;
    }

    const { tops } = solveSlot(scope, slotId, context);
    const pinToTop = !slotId && scope.moduleId !== 'canvas';
    const step = editorFor(scope)?.snapStep;
    const snap = (top) => (step ? Math.round(top / step) * step : top);
    for (const id of ids) {
      if (!tops.has(id)) continue;
      // An embedded module's root renders flush with the instance.
      const pinned = pinToTop && scope.contractOf(id)?.moduleRoot === true;
      writeLayout(getDynamicLayoutKey(id, context, '', scope.moduleId), scope, id, {
        top: pinned ? 0 : snap(tops.get(id)),
        height: currentHeight(scope, id, context),
      });
    }
  };

  // ── slot: solve its children and queue the container that owns it ────────
  const processSlot = ({ scope, slotId, context }) => {
    writeSlot(scope, slotId, context);
    const owner = scope.ownerOf(slotId);
    const ownerContract = owner ? scope.contractOf(owner) : null;

    if (!owner) {
      touchedRoots.add(scope.moduleId);
      return;
    }

    // A row: record the row's height, then size the row container itself in
    // its own (outer) context.
    if (ownerContract?.content === 'rows' && context) {
      const rowHeight = containerHeight(scope, owner, context, true);
      writeLayout(getDynamicLayoutKey(owner, context, '', scope.moduleId), scope, owner, { height: rowHeight });
      const outerContext = context.length > 1 ? context.slice(0, -1) : null;
      enqueueWidget(scope, owner, outerContext, true);
      return;
    }

    const ownerResolved = scope.getResolvedComponent(owner, context);
    if (ownerResolved?.properties?.dynamicHeight === false && ownerContract?.followsExpansion !== true) return;
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
      if (slotId && (!owner || scope.contractOf(owner)?.content === 'rows')) continue;
      enqueueSlot(scope, slotId, null, owner ? scope.depthOf(owner) + 1 : 0);
    }
  }

  const failures = [];
  for (draining = buckets.length - 1; draining >= 0; draining--) {
    for (const item of buckets[draining] || []) {
      try {
        if (item.kind === 'widget') processWidget(item);
        else processSlot(item);
      } catch (error) {
        failures.push({ item, error });
      }
    }
  }

  if (failures.length > 0 && !isProduction()) throw failures[0].error;

  if (Object.keys(patch).length > 0) {
    state.setTemporaryLayouts(patch);
    // The canvas height follows the root's solved bottom; the canvas re-reads
    // it on this signal in both the editor and the viewer.
    if (touchedRoots.size > 0) get().incrementCanvasUpdater();
  }

  const failedModules = new Map();
  for (const { item, error } of failures) {
    console.error('dynamic height: could not process', item.kind, item.id ?? item.slotId, error);
    if (!failedModules.has(item.scope.moduleId)) failedModules.set(item.scope.moduleId, error);
  }
  for (const [moduleId, error] of failedModules) onError?.(moduleId, error);

  return patch;
};
