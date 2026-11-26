import { getContentSlotId, resolveContainerHeight } from './containerHeight';
import { getDynamicLayoutKey, normalizeLayoutContext } from './layoutKeys';
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
// are never touched, and nothing here reads the DOM.
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

// One pass over the store state it was created from. Everything it decides is
// kept here until `run` returns, so the store is written once.
const createPass = (state) => {
  const temporaryLayouts = state.temporaryLayouts || {};
  const queue = createWorkQueue();

  const scopes = new Map(); // moduleId → module scope (moduleScope.js)
  const measured = new Map(); // layout key → height the browser reported
  const heights = new Map(); // layout key → height decided in this pass
  const solvedCanvases = new Map(); // canvas key → { bottom }
  const solvedSlots = []; // canvas keys, in the order they were solved
  const patch = {}; // layout key → { top, height }
  let rootMoved = false;

  const scopeOf = (moduleId) => {
    if (!scopes.has(moduleId)) scopes.set(moduleId, createModuleScope(state, moduleId, state.currentLayout));
    return scopes.get(moduleId);
  };

  // On the page, drawn in this layout, and on a canvas that is drawn: the root,
  // or one whose owner is on the page. Anything else is not on screen.
  const isPlaced = (scope, id) => {
    if (!scope.savedLayout(id)) return false;
    const canvasId = scope.components[id].component?.parent;
    return canvasId == null || scope.ownerOf(canvasId) !== null;
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

  // Writes a widget's rendered top and height if either moved. Only these two:
  // its column and width always come from its saved layout.
  const write = (scope, id, key, top, height, onRoot) => {
    const drawn = temporaryLayouts[key];
    const drawnTop = drawn?.top ?? scope.savedLayout(id).top ?? 0;
    if (top === drawnTop && height === drawnHeight(scope, id, key)) return;
    patch[key] = { top, height };
    if (onRoot) rootMoved = true;
  };

  // Places the widgets on one canvas and writes the ones that moved. Solved
  // once per pass: a container asking for its content's bottom gets the same
  // answer its canvas was written with.
  const solveCanvas = (scope, canvasId, context) => {
    const canvasKey = canvasKeyOf(scope, canvasId, context);
    if (solvedCanvases.has(canvasKey)) return solvedCanvases.get(canvasKey);

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
    for (const { id, key, height } of placed) write(scope, id, key, tops.get(id), height, onRoot);

    const result = { bottom };
    solvedCanvases.set(canvasKey, result);
    solvedSlots.push(canvasKey);
    return result;
  };

  const containerHeight = (scope, id, context) => {
    const contract = scope.contractOf(id);
    const properties = scope.getResolvedComponent(id, context)?.properties ?? {};
    const currentTab = contract.contentSlot === 'activeTab' ? scope.currentTabOf(id, context) : undefined;
    const contentSlot = getContentSlotId({ componentId: id, contract, properties, currentTab });
    return resolveContainerHeight({
      componentType: scope.typeOf(id),
      properties,
      savedHeight: scope.savedHeight(id),
      visible: scope.isVisible(id, context),
      content: { gridBottom: () => solveCanvas(scope, contentSlot, context).bottom },
    });
  };

  // A widget: decide its height, then its canvas if that could have moved.
  const runWidget = ({ scope, id, context, asked }) => {
    if (!isPlaced(scope, id)) return;
    const key = layoutKeyOf(scope, id, context);
    const height = scope.contractOf(id)
      ? containerHeight(scope, id, context)
      : scope.knownHeight(id, context, measured.has(key) ? { height: measured.get(key) } : temporaryLayouts[key]);
    heights.set(key, height);

    // A widget that was asked about may take different room at the same height (it collapsed), so its canvas is
    // always solved. One reached from inside only matters if its height changed.
    if (asked || height !== drawnHeight(scope, id, key)) {
      queueCanvas(scope, scope.components[id].component?.parent, context, scope.depthOf(id));
    }
  };

  // A canvas: place its widgets, then size the container it belongs to.
  const runCanvas = ({ scope, canvasId, context }) => {
    solveCanvas(scope, canvasId, context);
    const owner = scope.ownerOf(canvasId);
    if (owner) queueWidget(scope, owner, context, false);
  };

  return {
    request({ id, contextIndices, moduleId = 'canvas', height }) {
      const scope = scopeOf(moduleId);
      const context = normalizeLayoutContext(contextIndices);
      if (height !== undefined) measured.set(layoutKeyOf(scope, id, context), height);
      queueWidget(scope, id, context, true);
    },
    run() {
      queue.drain((item) => (item.kind === 'widget' ? runWidget(item) : runCanvas(item)));
      return { patch, solvedSlots, rootMoved };
    },
  };
};

/**
 * Runs one pass and writes its result to the store.
 *
 * @param {() => object} getState  the App Builder store's getState
 * @param {object} options
 * @param {Array<{id: string, contextIndices?: Array<number>|null, moduleId?: string, height?: number}>} options.changes
 *   widgets whose height may have changed: with `height` when the browser measured it, without when something else
 *   changed (its visibility, its properties)
 * @returns {{patch: object, solvedSlots: Array<string>}}  what was written (layout key → { top, height }), and the
 *   canvases solved, innermost first
 */
export const flushDynamicHeight = (getState, { changes = [] } = {}) => {
  const pass = createPass(getState());
  for (const change of changes) pass.request(change);
  const { patch, solvedSlots, rootMoved } = pass.run();

  if (Object.keys(patch).length > 0) {
    getState().setTemporaryLayouts(patch);
    // The canvas's own height follows its lowest widget; it reads it again on this signal.
    if (rootMoved) getState().incrementCanvasUpdater();
  }
  return { patch, solvedSlots };
};
