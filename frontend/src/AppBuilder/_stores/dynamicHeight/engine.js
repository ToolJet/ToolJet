import { getContentSlotId, resolveContainerHeight } from './containerHeight';
import { resolveFlexContainerHeight } from './flexContainerHeight';
import { getDynamicLayoutKey, normalizeLayoutContext } from './layoutKeys';
import { listviewFallbackRowHeight, listviewRowCount, listviewRowHeight } from './listviewHeight';
import { createModuleScope } from './moduleScope';
import { solveContainer } from './solver';
import { createWorkQueue } from './workQueue';

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic height engine: turns a batch of height changes into one
// `temporaryLayouts` write.
//
// A pass starts from the widgets that changed (a measured height, or a request
// such as "its visibility changed") and works outwards:
//
//   widget  → its height for this pass: measured for a leaf, sized from its
//             content for a container (containerHeight.js)
//   canvas  → the widgets on it are placed by the solver, solved once per pass,
//             and every widget whose top or height moved is written
//   owner   → the container the canvas belongs to is sized again, and so on
//             up to the root canvas
//
// The work queue (workQueue.js) runs deeper work first, so a container is
// always sized after everything inside it. Work stops spreading at a widget
// whose height did not change: nothing outside it can have moved.
//
// What is written is only each widget's rendered top and height. Saved layouts
// are never touched, and nothing here reads the DOM: the one size the store
// cannot know, a FlexContainer's width, comes from the caller (`measureWidth`).
//
// How a container sizes and where its content goes comes from its height
// contract (contracts.js); nothing here names a widget type.
//
// List view rows: a List view's canvas is drawn once per row, and a widget in
// a row carries the row's index at the end of its context (`[row]`, or
// `[outer row, row]` in a nested list). A row is solved like any canvas, its
// height is written under the list's key at that row, and the list is then
// sized from its rows in its own (outer) context.
//
// A pass that fails on one widget throws outside production, so a broken
// engine fails tests and local runs. In production the rest of the pass is
// written, the failure is logged, and `onError` lets the caller recover.
// ─────────────────────────────────────────────────────────────────────────────

// The canvas key of the main canvas (and a module's root canvas): no widget id
// looks like this.
export const ROOT_CANVAS = '<root>';

// Work levels. A widget inside d containers runs at 2d + 1. The canvas holding
// it runs at 2d, after every widget on it. That canvas's owner sits inside
// d − 1 containers, so it runs at 2d − 1, right after its canvas.
const widgetLevel = (depth) => 2 * depth + 1;
const canvasLevel = (depth) => 2 * depth;

const layoutKeyOf = (scope, id, context) => getDynamicLayoutKey(id, context, '', scope.moduleId);
const canvasKeyOf = (scope, canvasId, context) =>
  getDynamicLayoutKey(canvasId ?? ROOT_CANVAS, context, '', scope.moduleId);

// The context a row's list is drawn in: the row's context without its own index.
const outerContextOf = (rowContext) => normalizeLayoutContext(rowContext.slice(0, -1));

const isProduction = () => process.env.NODE_ENV === 'production';

// One pass over the store state it was created from. Everything it decides is
// kept here until `run` returns, so the store is written once.
const createPass = (state, { measureWidth }) => {
  const temporaryLayouts = state.temporaryLayouts || {};
  const queue = createWorkQueue();

  const scopes = new Map(); // moduleId → module scope (moduleScope.js)
  const measured = new Map(); // layout key → height the browser reported
  const heights = new Map(); // layout key → height decided in this pass
  const solvedCanvases = new Map(); // canvas key → { bottom }
  const solvedSlots = []; // canvas keys, in the order they were solved
  const failures = []; // { item, error } of each item that threw
  const contexts = new Map(); // `<moduleId>|<widget id>` → every context it is drawn in (contextsOf)
  const patch = {}; // layout key → { top, height }, or { height } for a flex child or a modal body
  let rootMoved = false;

  const scopeOf = (moduleId) => {
    if (!scopes.has(moduleId)) scopes.set(moduleId, createModuleScope(state, moduleId, state.currentLayout));
    return scopes.get(moduleId);
  };

  // On the page, drawn in this layout, on a canvas that is drawn (the root, or
  // one whose owner is on the page), and with a row index for each List view
  // around it. Anything else is not on screen.
  const isPlaced = (scope, id, context) => {
    if (!scope.savedLayout(id)) return false;
    if ((context?.length ?? 0) !== scope.rowDepthOf(id)) return false;
    const canvasId = scope.components[id].component?.parent;
    return canvasId == null || scope.ownerOf(canvasId) !== null;
  };

  // How many rows a List view draws in a given context.
  const rowCountOf = (scope, list, context) => listviewRowCount(scope.getResolvedComponent(list, context)?.properties);

  // Every context a widget is drawn in: one per row of each List view around it (nested lists multiply), or just the
  // root context outside any list.
  // Cached per module: one module used twice shares its widget ids, not its rows.
  const contextsOf = (scope, id) => {
    const cacheKey = `${scope.moduleId}|${id}`;
    if (contexts.has(cacheKey)) return contexts.get(cacheKey);
    const list = scope.listAround(id);
    const drawnIn = list
      ? contextsOf(scope, list).flatMap((outer) =>
          Array.from({ length: rowCountOf(scope, list, outer) }, (_, row) => [...(outer ?? []), row])
        )
      : [null];
    contexts.set(cacheKey, drawnIn);
    return drawnIn;
  };

  // The height a widget is drawn at before this pass.
  const drawnHeight = (scope, id, key) => temporaryLayouts[key]?.height ?? scope.savedHeight(id);

  // The height a widget takes in this pass: decided by this pass, else the
  // height it is known to have.
  const currentHeight = (scope, id, context, key) =>
    heights.has(key) ? heights.get(key) : scope.knownHeight(id, context, temporaryLayouts[key]);

  const queueWidget = (scope, id, context, asked) => {
    const key = `widget|${layoutKeyOf(scope, id, context)}`;
    queue.add(widgetLevel(scope.depthOf(id)), key, { kind: 'widget', scope, id, context, asked });
  };

  // `depth` is the depth of the widgets on the canvas.
  const queueCanvas = (scope, canvasId, context, depth) => {
    const key = `canvas|${canvasKeyOf(scope, canvasId, context)}`;
    queue.add(canvasLevel(depth), key, { kind: 'canvas', scope, canvasId, context });
  };

  // Writes a widget's rendered top and height (`next`) if either moved. Only
  // these two: its column and width always come from its saved layout. A flex
  // child gets no top, since flex rules place it.
  const write = (scope, id, key, next, onRoot) => {
    const drawn = temporaryLayouts[key];
    const drawnTop = drawn?.top ?? scope.savedLayout(id).top ?? 0;
    const topMoved = 'top' in next && next.top !== drawnTop;
    if (!topMoved && next.height === drawnHeight(scope, id, key)) return;
    patch[key] = next;
    if (onRoot) rootMoved = true;
  };

  // A modal's body is drawn over the page, so only its height is written, under
  // its own `-body` key (ModalV2 reads it there).
  const writeBody = (scope, id, context, height) => {
    const bodyKey = getDynamicLayoutKey(id, context, '-body', scope.moduleId);
    if (temporaryLayouts[bodyKey]?.height !== height) patch[bodyKey] = { height };
  };

  // A FlexContainer's children: flex rules place them, so each only gets its
  // height. The container's own height comes from the flex layout (flexHeightOf).
  const placeFlexChildren = (scope, canvasId, context) => {
    for (const id of scope.childrenOf(canvasId)) {
      if (!scope.savedLayout(id)) continue;
      const key = layoutKeyOf(scope, id, context);
      write(scope, id, key, { height: currentHeight(scope, id, context, key) }, false);
    }
  };

  // Places the widgets on one canvas and writes the ones that moved. Solved
  // once per pass: a container asking for its content's bottom gets the same
  // answer its canvas was written with.
  const solveCanvas = (scope, canvasId, context) => {
    const canvasKey = canvasKeyOf(scope, canvasId, context);
    if (solvedCanvases.has(canvasKey)) return solvedCanvases.get(canvasKey);
    solvedSlots.push(canvasKey);

    const owner = scope.ownerOf(canvasId);
    if (owner && scope.contractOf(owner)?.content === 'flex') {
      placeFlexChildren(scope, canvasId, context);
      // No grid bottom: a FlexContainer's height comes from flexHeightOf.
      const result = { bottom: null };
      solvedCanvases.set(canvasKey, result);
      return result;
    }

    const boxes = [];
    const placed = []; // { id, key, height } of each box, to write after solving
    const flows = new Map(); // id → the room it takes: its height, or 0 when collapsed
    for (const id of scope.childrenOf(canvasId)) {
      const layout = scope.savedLayout(id);
      if (!layout) continue;
      const key = layoutKeyOf(scope, id, context);
      const height = currentHeight(scope, id, context, key);
      const collapsible = scope.isCollapsible(id, context);
      // Visibility is only read for a widget that collapses: it costs page lookups, and it changes nothing else here.
      flows.set(id, collapsible && !scope.isVisible(id, context) ? 0 : height);
      placed.push({ id, key, height });
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

    const { tops, bottom } = solveContainer(boxes, (id) => flows.get(id));
    const onRoot = canvasId == null;
    // An embedded module's root is drawn flush with the top of its instance. In the module editor (the module is the
    // main canvas) it stays where it is drawn.
    const pinsModuleRoot = onRoot && scope.moduleId !== 'canvas';
    for (const { id, key, height } of placed) {
      const top = pinsModuleRoot && scope.contractOf(id)?.moduleRoot ? 0 : tops.get(id);
      write(scope, id, key, { top, height }, onRoot);
    }

    const result = { bottom };
    solvedCanvases.set(canvasKey, result);
    return result;
  };

  // A FlexContainer's height, laid out by flex rules (flexContainerHeight.js) from its children's heights in this
  // pass. Its children are handed over as layout overrides of their own, so the store's map is never copied.
  const flexHeightOf = (scope, id, context) => {
    const childHeights = {};
    for (const childId of scope.childrenOf(id)) {
      const key = layoutKeyOf(scope, childId, context);
      childHeights[key] = { height: currentHeight(scope, childId, context, key) };
    }
    return resolveFlexContainerHeight({
      componentId: id,
      currentLayout: scope.currentLayout,
      contextIndices: context,
      moduleId: scope.moduleId,
      currentPageComponents: scope.components,
      temporaryLayouts: childHeights,
      wrapperWidth: measureWidth(id, context, scope.moduleId),
      getResolvedComponent: scope.getResolvedComponent,
      getExposedPropertyForAdditionalActions: scope.getExposed,
      getContainerChildrenMapping: scope.childrenOf,
      calculateMoveableBoxHeightWithId: (childId, layout, styles) =>
        state.calculateMoveableBoxHeightWithId(childId, layout, styles, scope.moduleId),
    });
  };

  // A List view's rows in one context: each row's height (decided in this pass, else as last written, else not sized
  // yet), and the height to assume for a row not sized yet: what the row's components fill as drawn.
  const rowsOf = (scope, list, context, properties) => {
    const rowHeights = Array.from({ length: listviewRowCount(properties) }, (_, row) => {
      const rowKey = layoutKeyOf(scope, list, [...(context ?? []), row]);
      return heights.has(rowKey) ? heights.get(rowKey) : temporaryLayouts[rowKey]?.height;
    });
    let templateBottom = 0;
    for (const childId of scope.childrenOf(list)) {
      const layout = scope.savedLayout(childId);
      if (layout) templateBottom = Math.max(templateBottom, (layout.top ?? 0) + (layout.height ?? 0));
    }
    const savedHeight = scope.savedHeight(list);
    return { rowHeights, fallbackRowHeight: listviewFallbackRowHeight({ templateBottom, properties, savedHeight }) };
  };

  // A row has been solved: its height is its content's bottom (listviewHeight.js), written under the list's key at
  // the row. Only the height: the List view draws its rows itself.
  const sizeRow = (scope, list, rowContext, contentBottom) => {
    const properties = scope.getResolvedComponent(list, outerContextOf(rowContext))?.properties;
    const height = listviewRowHeight({ contentBottom, properties, savedHeight: scope.savedHeight(list) });
    const rowKey = layoutKeyOf(scope, list, rowContext);
    heights.set(rowKey, height);
    if (temporaryLayouts[rowKey]?.height !== height) patch[rowKey] = { height };
  };

  // How tall a container is drawn (containerHeight.js). Its content is only measured if that decides the height.
  const containerHeight = (scope, id, context, key) => {
    const contract = scope.contractOf(id);
    const properties = scope.getResolvedComponent(id, context)?.properties ?? {};
    const currentTab = contract.contentSlot === 'activeTab' ? scope.currentTabOf(id, context) : undefined;
    const contentSlot = getContentSlotId({ componentId: id, contract, properties, currentTab });
    return resolveContainerHeight({
      componentType: scope.typeOf(id),
      properties,
      savedHeight: scope.savedHeight(id),
      visible: scope.isVisible(id, context),
      isExpanded: contract.followsExpansion ? scope.getExposed(id, context, 'isExpanded') : undefined,
      // A List view drawn in an outer list's row fits its rows both ways.
      isNestedInRow: context !== null,
      jsonSchemaForm: scope.isJsonSchemaForm(id),
      content: {
        gridBottom: () => solveCanvas(scope, contentSlot, context).bottom,
        rows: () => rowsOf(scope, id, context, properties),
        flexHeight: () => flexHeightOf(scope, id, context),
        // A Form generated from a JSON schema draws its own fields, so it is measured like a leaf.
        jsonSchemaHeight: () => (measured.has(key) ? measured.get(key) : drawnHeight(scope, id, key)),
      },
    });
  };

  // A leaf's height: the one the browser measured, if it sizes to its content, else the one it is known to have.
  const leafHeight = (scope, id, context, key) =>
    scope.knownHeight(id, context, measured.has(key) ? { height: measured.get(key) } : temporaryLayouts[key]);

  // A widget: decide its height, then its canvas if that could have moved.
  const runWidget = ({ scope, id, context, asked }) => {
    if (!isPlaced(scope, id, context)) return;
    const key = layoutKeyOf(scope, id, context);
    const contract = scope.contractOf(id);
    let height;
    if (contract?.portal) {
      // A modal: its body is sized from its content; its box on the canvas is its trigger, sized like a leaf.
      writeBody(scope, id, context, containerHeight(scope, id, context, key));
      height = leafHeight(scope, id, context, key);
    } else {
      height = contract ? containerHeight(scope, id, context, key) : leafHeight(scope, id, context, key);
    }
    heights.set(key, height);

    // A widget that was asked about may take different room at the same height (it collapsed), so its canvas is
    // always solved. One reached from inside only matters if its height changed.
    if (asked || height !== drawnHeight(scope, id, key)) {
      queueCanvas(scope, scope.components[id].component?.parent, context, scope.depthOf(id));
    }
  };

  // A canvas: place its widgets, then size the container it belongs to. A List view's canvas is one of its rows: the
  // row is sized, then the list in its own context.
  const runCanvas = ({ scope, canvasId, context }) => {
    const { bottom } = solveCanvas(scope, canvasId, context);
    const owner = scope.ownerOf(canvasId);
    if (!owner) return;
    if (scope.contractOf(owner)?.content === 'rows') {
      sizeRow(scope, owner, context, bottom);
      queueWidget(scope, owner, outerContextOf(context), false);
    } else {
      queueWidget(scope, owner, context, false);
    }
  };

  // A row of a List view asking to be sized: the list's id with the row's context, one index longer than the list's
  // own. Its canvas sits one level inside the list.
  const isRowOf = (scope, id, context) =>
    scope.contractOf(id)?.content === 'rows' && (context?.length ?? 0) > scope.rowDepthOf(id);

  return {
    request({ id, contextIndices, moduleId = 'canvas', height }) {
      const scope = scopeOf(moduleId);
      const context = normalizeLayoutContext(contextIndices);
      if (height !== undefined) measured.set(layoutKeyOf(scope, id, context), height);
      if (isRowOf(scope, id, context)) queueCanvas(scope, id, context, scope.depthOf(id) + 1);
      else queueWidget(scope, id, context, true);
    },
    // Every canvas on the module's page, after a saved layout changed: what moved is not known, so all of it is
    // placed again. Each owner is then sized as usual.
    requestModule(moduleId) {
      const scope = scopeOf(moduleId);
      for (const canvasId of scope.canvases()) {
        if (canvasId != null && !scope.ownerOf(canvasId)) continue; // its container is not on the page
        // A canvas is drawn wherever the widgets on it are: once per row inside a List view.
        const onIt = scope.childrenOf(canvasId)[0];
        for (const context of contextsOf(scope, onIt)) queueCanvas(scope, canvasId, context, scope.depthOf(onIt));
      }
    },
    run() {
      queue.drain((item) => {
        // One widget failing must not lose the rest of the pass; flushDynamicHeight decides what a failure means.
        try {
          if (item.kind === 'widget') runWidget(item);
          else runCanvas(item);
        } catch (error) {
          failures.push({ item, error });
        }
      });
      return { patch, solvedSlots, rootMoved, failures };
    },
  };
};

/**
 * Runs one pass and writes its result to the store.
 *
 * @param {() => object} getState  the App Builder store's getState
 * @param {object} options
 * @param {Array<{id: string, contextIndices?: Array<number>|null, moduleId?: string, height?: number}>} [options.changes]
 *   widgets whose height may have changed: with `height` when the browser measured it, without when something else
 *   changed (its visibility, its properties)
 * @param {Array<string>} [options.fullModules]  modules whose saved layout changed: every canvas on their page is
 *   placed again
 * @param {(id: string, contextIndices: Array<number>|null, moduleId: string) => number|null} [options.measureWidth]
 *   a FlexContainer's drawn width (padding included, border excluded), or null when unknown
 * @param {(moduleId: string, error: Error) => void} [options.onError]  in production, called once per module a
 *   widget failed in (outside production the pass throws instead)
 * @returns {{patch: object, solvedSlots: Array<string>}}  what was written (layout key → { top, height }), and the
 *   canvases solved, innermost first
 */
export const flushDynamicHeight = (
  getState,
  { changes = [], fullModules = [], measureWidth = () => null, onError } = {}
) => {
  const pass = createPass(getState(), { measureWidth });
  for (const change of changes) pass.request(change);
  for (const moduleId of fullModules) pass.requestModule(moduleId);
  const { patch, solvedSlots, rootMoved, failures } = pass.run();

  if (failures.length > 0 && !isProduction()) throw failures[0].error;

  if (Object.keys(patch).length > 0) {
    getState().setTemporaryLayouts(patch);
    // The canvas's own height follows its lowest widget; it reads it again on this signal.
    if (rootMoved) getState().incrementCanvasUpdater();
  }

  const failedModules = new Map(); // moduleId → its first failure
  for (const { item, error } of failures) {
    console.error('dynamic height: could not size', item.id ?? item.canvasId, error);
    if (!failedModules.has(item.scope.moduleId)) failedModules.set(item.scope.moduleId, error);
  }
  for (const [moduleId, error] of failedModules) onError?.(moduleId, error);

  return { patch, solvedSlots };
};
