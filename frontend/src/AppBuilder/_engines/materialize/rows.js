/**
 * Materialization engine: rows on demand.
 *
 * A long ListView draws only a window of its rows (see Widgets/Listview/rowSlots.js), yet every row's values and
 * actions are there to read and run. For a row that isn't drawn, a child whose type has an exposure module
 * (./widgets) is computed: `initial` of its props resolved for that row (`resolveRowChildInput`, in the scope the drawn
 * row would settle to), plus the changes the row's state actions made. Those changes are kept, sparse, in the store:
 *
 *   resolvedStore.modules[m].listviewRowChanges[lvId][dataRow][childId] = { values, basis, replay: [{ action, args }] }
 *
 * `basis` holds what the props gave each changed value when the action ran: once a prop gives another value, the
 * widget would have reset it, so the change no longer counts. The calls in `replay` run through the widgets' own
 * functions when the row is drawn again, so a widget's internal state matches.
 *
 * An action that needs the drawn widget (click, setFocus …) first gets its row a slot and holds it there while it
 * runs (`holdRowMounted`; the ListView draws a few held rows at a time, the other actions wait their turn). One that
 * leaves something in the widget that only the widget keeps (a typed value, focus) keeps the row drawn, as a row the
 * user typed in is (the last 50 such rows).
 *
 * A drawn row with changes is settled once its widgets have mounted: its recorded calls are replayed onto them, and
 * until then its children/data show the changes over what the new widgets exposed. That happens whenever new widgets
 * mount for it: drawn again after scrolling away, or in the same slot (the ListView showed its loading state:
 * `rowWidgetsUnmounted`). Changes that no longer count (a prop they overrode changed) are pruned from the store then.
 *
 * In a windowed ListView every function in `children[row]` is a wrapper that runs the action on that row through
 * `runRowAction` (the store's listViewComponentSlice): the widget a row drew with may have unmounted since. A drawn
 * row's state actions record their change whoever calls them: its children's slots expose them as `recordingAction`s.
 *
 * Every row at once (`children`/`data` as if every row were drawn) is materialize.js's, estimated first by estimate.js:
 * for it, the size of a ListView's row changes is kept here as they are written (sizeRowChanges), readRow can read a
 * drawn row as if it weren't, and as its data alone gives it (`headless`, `withoutChanges`: to measure a row),
 * descendantsOf / widgetsMountedIn list and count the widgets a drawn row mounts, and a hold (holdRowMounted) can be
 * let go before its row is drawn (an AbortSignal).
 *
 * An event's control-component action on a widget in a windowed ListView's rows (a child, or in a container of the
 * row: that one runs drawn) runs through runRowAction too, on the data row of the row it fired in (`controlRowOf`: the
 * firing widget's slot at that ListView's level, mapped through its slots as they were when it fired; row 0 when it
 * fired outside that ListView's rows). What scripts and `{{ }}` templates read of the rows is scripts.js's and
 * prepare.js's.
 *
 * Functions here take the store's `get`; the store actions built on them are in listViewComponentSlice.js.
 */
import { cloneDeep, isEqual, set as lodashSet } from 'lodash';
import { resolveDynamicValues, hasArrayNotation, parsePropertyPath } from '@/AppBuilder/_stores/utils';
import { sizeOf } from '@/AppBuilder/_engines/data/freeze';
import { exposureOf } from './widgets';

const SECTIONS = new Set(['properties', 'general', 'generalStyles', 'styles', 'validation', 'others']);
const NO_RELEASE = () => {};

const keyOf = (moduleId, listviewId) => `${moduleId}\u0000${listviewId}`;

// Mounted ListViews, by module and id: { windowed, rows, pinRow(row), holdRow(row) → release, keepRow(row) }.
// Listview.jsx keeps its entry current.
const listviews = new Map();
// Pending holdRowMounted checks: run on every store update (one store subscription for all of them, while there are
// any), and when a ListView mounts or unmounts or a replay ends.
const waiters = new Set();
const recheckWaiters = () => [...waiters].forEach((check) => check());
let unsubscribeWaiters = null;

const addWaiter = (check, subscribe) => {
  waiters.add(check);
  unsubscribeWaiters ??= subscribe(recheckWaiters);
};

const removeWaiter = (check) => {
  waiters.delete(check);
  if (waiters.size || !unsubscribeWaiters) return;
  unsubscribeWaiters();
  unsubscribeWaiters = null;
};

/** Registers a mounted ListView's handle; returns the unregister. */
export const registerListview = (moduleId, listviewId, handle) => {
  const key = keyOf(moduleId, listviewId);
  listviews.set(key, handle);
  recheckWaiters();
  return () => {
    if (listviews.get(key) === handle) listviews.delete(key);
    recheckWaiters();
  };
};

/** A mounted ListView's handle (see registerListview), or undefined. */
export const handleOf = (moduleId, listviewId) => listviews.get(keyOf(moduleId, listviewId));

const moduleOf = (get, moduleId) => get().resolvedStore.modules[moduleId];

const typeOf = (get, childId, moduleId) => get().getComponentDefinition(childId, moduleId)?.component?.component;

/** The data rows a windowed ListView's slots show, or null when it draws every row. */
export const slotsOf = (get, listviewId, moduleId) => moduleOf(get, moduleId)?.listviewSlots?.[listviewId] ?? null;

/** Whether the module has a windowed ListView (only then is any row of a ListView not drawn). */
export const hasWindowedListview = (get, moduleId) => {
  for (const _id in moduleOf(get, moduleId)?.listviewSlots ?? {}) return true;
  return false;
};

/** The changes recorded for a data row, by child id (undefined when none). */
export const rowChangesOf = (get, listviewId, dataRow, moduleId) =>
  moduleOf(get, moduleId)?.listviewRowChanges?.[listviewId]?.[dataRow];

/** The slot drawing `dataRow` (-1: not drawn). A ListView that isn't windowed draws row i in slot i. */
export const slotOf = (get, listviewId, dataRow, moduleId) => {
  const slots = slotsOf(get, listviewId, moduleId);
  return slots ? slots.indexOf(dataRow) : dataRow;
};

const slotExposure = (get, childId, slot, moduleId) => {
  const rows = moduleOf(get, moduleId)?.exposedValues?.components?.[childId];
  return Array.isArray(rows) ? rows[slot] : undefined;
};

/**
 * What a drawn row's child exposes, or undefined when the row isn't drawn (or the child hasn't mounted in it yet, or
 * its widget unmounted and the new one hasn't exposed its values yet).
 */
export const liveExposure = (get, listviewId, dataRow, childId, moduleId) => {
  const slot = slotOf(get, listviewId, dataRow, moduleId);
  if (slot < 0) return undefined;
  const live = slotExposure(get, childId, slot, moduleId);
  if (!slotsOf(get, listviewId, moduleId)) return live;
  // A slot that changed rows was cleared: until the new row's widget mounts (it exposes `id`), it holds nothing.
  return live?.id !== undefined && !unmountedIn(get, listviewId, slot, dataRow, childId, moduleId) ? live : undefined;
};

// A container's children for walking its tree: under its id, or under its slots' (a Tabs keeps its children under
// `${tabsId}-${tab}`, its SubContainers' ids). A child has one parent: its children are under one or the other.
const childrenIn = (get, moduleId) => {
  const { getContainerChildrenMapping, containerChildrenMapping } = get();
  const slotChildren = {};
  Object.keys(containerChildrenMapping ?? {}).forEach((key) => {
    const base = key.match(/([a-fA-F0-9-]{36})-.+/)?.[1];
    if (base) (slotChildren[base] ??= []).push(...(containerChildrenMapping[key] || []));
  });
  return (id) => {
    const children = getContainerChildrenMapping(id, moduleId);
    return children.length > 0 ? children : (slotChildren[id] ?? []);
  };
};

/**
 * Every widget inside a container's rows, at any depth (a Container's, a Form's, a Tabs' children too): the widget
 * definitions a drawn row of a ListView mounts.
 */
export const descendantsOf = (get, containerId, moduleId) => {
  const childrenOf = childrenIn(get, moduleId);
  const descendants = [];
  const collect = (id) =>
    childrenOf(id).forEach((childId) => {
      descendants.push(childId);
      collect(childId);
    });
  collect(containerId);
  return descendants;
};

/**
 * How many widgets a drawn row of a container mounts: every widget inside it (descendantsOf's), a repeating one's
 * (a ListView nested in the row) once for each of its rows, `repeatsOf(id)` (1 for any other widget).
 */
export const widgetsMountedIn = (get, containerId, moduleId, repeatsOf) => {
  const childrenOf = childrenIn(get, moduleId);
  const count = (id) => childrenOf(id).reduce((sum, childId) => sum + 1 + repeatsOf(childId) * count(childId), 0);
  return count(containerId);
};

/** The ListView's rows (the listItem of each), as it renders them. */
export const listviewRows = (get, listviewId, moduleId) => {
  const handle = handleOf(moduleId, listviewId);
  if (handle) return handle.rows;
  const { properties = {}, general = {} } = get().getResolvedComponent(listviewId, null, moduleId) ?? {};
  const merged = { ...general, ...properties };
  const data = merged.dataSourceSelector === 'rawJson' ? merged.data : merged.dataSourceSelector;
  return Array.isArray(data) ? data : [];
};

/**
 * Where an event's control-component action on a widget in a windowed ListView's rows (a child, or deeper in a
 * container of the row) runs: `{ listviewId, dataRow }`, the data row of the row the event fired in, or row 0 when it
 * fired outside that ListView's rows (as in a ListView that draws every row). A widget in a row fires with its index,
 * one slot per ListView around it (outermost first): the one at that ListView's level is mapped through its slots as
 * they were when the event fired (`firedSlots`: the module's listviewSlots then; the rows may have scrolled since,
 * while earlier actions ran). Null for a widget no windowed ListView holds (in a ListView that draws every row, or one inside
 * a row), or a slot showing no row; at once in a module with no windowed ListView.
 */
export const controlRowOf = (get, componentId, sourceId, sourceIndex, moduleId, firedSlots = undefined) => {
  if (!hasWindowedListview(get, moduleId)) return null;
  const state = get();
  const parentOf = (id) => state.getComponentDefinition(id, moduleId)?.component?.parent;
  const listOf = (id) => {
    const parent = parentOf(id);
    return parent ? state.findNearestSubcontainerAncestor(parent, moduleId) : null;
  };
  const listviewId = listOf(componentId);
  const slots = listviewId ? slotsOf(get, listviewId, moduleId) : null;
  if (!slots) return null;
  const lists = []; // the ListViews (and Kanbans) around the source, outermost first
  for (let id = sourceId && listOf(sourceId); id; id = listOf(id)) lists.unshift(id);
  const level = lists.indexOf(listviewId);
  const indices = Array.isArray(sourceIndex) ? sourceIndex : [sourceIndex];
  if (level < 0 || indices[level] === null || indices[level] === undefined) return { listviewId, dataRow: 0 };
  const dataRow = (firedSlots?.[listviewId] ?? slots)[indices[level]];
  return dataRow >= 0 ? { listviewId, dataRow } : null;
};

/** Whether `dataRow` is one of the ListView's rows. */
export const isRowOf = (get, listviewId, dataRow, moduleId) =>
  Number.isInteger(dataRow) && dataRow >= 0 && dataRow < listviewRows(get, listviewId, moduleId).length;

// ─── Row action wrappers ────────────────────────────────────────────────────────────────────────────────────────────

// Per ListView and data row: `${childId}|${action}` → wrapper, for the rows written into `children` (`keep`). A row's
// wrappers stay the same, so its children entry compares equal (isEqual, sameValue) when only the widget behind it
// changed. A row only read gets wrappers of its own (the kept ones, when it has them): reading rows keeps nothing.
const wrappers = new Map();

const wrapperOf = (get, listviewId, dataRow, childId, action, moduleId, keep) => {
  const lvKey = keyOf(moduleId, listviewId);
  const key = `${childId}|${action}`;
  const kept = wrappers.get(lvKey)?.get(dataRow)?.get(key);
  if (kept) return kept;
  const wrapper = (...args) => get().runRowAction(listviewId, dataRow, childId, action, args, moduleId);
  if (!keep) return wrapper;
  if (!wrappers.has(lvKey)) wrappers.set(lvKey, new Map());
  const byRow = wrappers.get(lvKey);
  if (!byRow.has(dataRow)) byRow.set(dataRow, new Map());
  byRow.get(dataRow).set(key, wrapper);
  return wrapper;
};

/**
 * `values` with every function a wrapper running it on that row of the ListView (its widget may be gone since).
 * `keep`: the row is written into `children` (its wrappers are kept, see wrapperOf).
 */
export const wrapRowActions = (get, listviewId, dataRow, childId, values, moduleId, keep = false) => {
  const wrapped = {};
  Object.entries(values).forEach(([key, value]) => {
    wrapped[key] =
      typeof value === 'function' ? wrapperOf(get, listviewId, dataRow, childId, key, moduleId, keep) : value;
  });
  return wrapped;
};

/**
 * A ListView's `children` entries with every function a kept row wrapper (wrapRowActions): what it wrote before it
 * drew its rows in slots holds the functions of widgets that unmount as it starts to. Keyed as `children` is.
 */
export const wrapRows = (get, listviewId, moduleId) => {
  const children = moduleOf(get, moduleId)?.exposedValues?.components?.[listviewId]?.children ?? {};
  const rows = {};
  Object.entries(children).forEach(([key, row]) => {
    const dataRow = Number(key);
    rows[key] = {};
    Object.entries(row ?? {}).forEach(([name, values]) => {
      rows[key][name] = wrapRowActions(get, listviewId, dataRow, values?.id, values ?? {}, moduleId, true);
    });
  });
  return rows;
};

// A drawn row's state action that records what it changes (listViewComponentSlice) → the widget's own function, which
// a replay runs (a replay isn't recorded again).
const ownActions = new WeakMap();

/** A drawn row's state action as its slot exposes it: `record(args)` (records, then runs `run`) in place of `run`. */
export const recordingAction = (run, record) => {
  const recording = (...args) => record(args);
  ownActions.set(recording, run);
  return recording;
};

const ownAction = (fn) => ownActions.get(fn) ?? fn;

// ─── A row's input, resolved without drawing it ─────────────────────────────────────────────────────────────────────

/**
 * What every undrawn row of a ListView resolves in, built once for the rows read together (a batch of row actions):
 * the exposed values, and the ListView's descendants (prepareRowScope walks the whole container tree).
 */
export const rowScopeBase = (get, listviewId, moduleId) => {
  const exposed = get().getAllExposedValues(moduleId);
  return { exposed, descendantIds: get().prepareRowScope(exposed.components, listviewId, moduleId)?.descendantIds };
};

// The scope a row's children resolve in when the row isn't drawn: every component's exposed values, with the
// ListView's descendants as they are in that row (an overlay of its own: a row's input keeps its scope). `fill(values)`
// sets them: a computed child's from `values` (childId → exposed values), any other's from its children[dataRow] entry
// (what the row last exposed), else nothing.
const rowScope = (get, listviewId, dataRow, moduleId, base = rowScopeBase(get, listviewId, moduleId)) => {
  const { exposed, descendantIds } = base;
  if (!descendantIds) return { state: exposed, fill: () => {} };
  // As prepareRowScope's: own writable properties over the frozen components.
  const scoped = Object.create(exposed.components);
  descendantIds.forEach((id) =>
    Object.defineProperty(scoped, id, { value: {}, writable: true, enumerable: true, configurable: true })
  );
  const entries = Object.values(exposed.components[listviewId]?.children?.[dataRow] ?? {});
  const byId = new Map(entries.map((entry) => [entry?.id, entry]));
  return {
    state: { ...exposed, components: scoped },
    fill: (values) =>
      descendantIds.forEach((id) => {
        scoped[id] = values.get(id) ?? byId.get(id) ?? {};
      }),
  };
};

// A child's resolved component for an undrawn row, as updateChildComponentResolvedValues resolves each row: every
// property in the dependency graph (the ones bound to something) resolved in the row's scope and validated; the
// others are the same on every row (the template's).
const resolveHeadless = (get, childId, scopedState, customResolvables, moduleId) => {
  const state = get();
  const stored = moduleOf(get, moduleId)?.components?.[childId];
  const resolved = { ...((Array.isArray(stored) ? stored[0] : stored) ?? {}) };
  const copied = new Set();
  state.getDirectDependencies(`components.${childId}`, moduleId).forEach((path) => {
    const [, , type, ...keys] = path.split('.');
    if (!SECTIONS.has(type) || !keys.length) return;
    const key = keys.join('.');
    const value = resolveDynamicValues(state.getNodeData(path, moduleId), scopedState, customResolvables, false, []);
    const validated = state.debugger.validateProperty(childId, type, key, value, moduleId, true);
    if (!copied.has(type)) {
      resolved[type] = { ...resolved[type] };
      copied.add(type);
    }
    if (hasArrayNotation(key)) {
      const propertyPath = parsePropertyPath(key);
      resolved[type][propertyPath[0]] = cloneDeep(resolved[type][propertyPath[0]]);
      lodashSet(resolved[type], propertyPath, validated);
    } else {
      resolved[type][key] = validated;
    }
  });
  return resolved;
};

// A child's input (see ./widgets/index.js) from its resolved component. `validateScope`: how validateWidget resolves
// its validation rules for the row (the drawn row's slot, or the undrawn row's scope).
const inputOf = (get, listviewId, childId, resolved, validateScope, moduleId) => {
  const state = get();
  const componentType = typeOf(get, childId, moduleId);
  const unresolvedValidation = state.getComponentDefinition(childId, moduleId)?.component?.definition?.validation;
  return {
    properties: { ...resolved?.general, ...resolved?.properties },
    styles: { ...resolved?.generalStyles, ...state.debugger.getDefaultStyles(resolved?.styles ?? {}, componentType) },
    general: resolved?.general,
    validation: resolved?.validation,
    validate: (value) =>
      get().validateWidget({
        widgetValue: value,
        validationObject: unresolvedValidation || {},
        componentType,
        nearestListviewId: listviewId,
        moduleId,
        ...validateScope,
      }),
  };
};

// A drawn row's child input: its resolved component in the store, validated in its slot.
const drawnInput = (get, listviewId, slot, childId, moduleId) =>
  inputOf(
    get,
    listviewId,
    childId,
    get().getResolvedComponent(childId, slot, moduleId),
    { customResolveObjects: get().getCustomResolvables(listviewId, slot, moduleId), rowIndex: slot },
    moduleId
  );

// An undrawn row's child input, in the row's scope.
const headlessInput = (get, listviewId, childId, scope, customResolveObjects, moduleId) =>
  inputOf(
    get,
    listviewId,
    childId,
    resolveHeadless(get, childId, scope.state, customResolveObjects, moduleId),
    { customResolveObjects, rowIndex: null, rowScope: scope.state },
    moduleId
  );

// Whether a child's bound props or validation read a component (itself, or a sibling in the row).
const readsComponents = (get, childId, moduleId) => {
  const state = get();
  const reads = (value) => JSON.stringify(value ?? null).includes('components');
  return (
    reads(state.getComponentDefinition(childId, moduleId)?.component?.definition?.validation) ||
    state
      .getDirectDependencies(`components.${childId}`, moduleId)
      .some((path) => reads(state.getNodeData(path, moduleId)))
  );
};

/**
 * A child's mount values from its module, or none when the module throws on this input: the drawn widget throws there
 * too, inside its error boundary, and exposes nothing, while its siblings are unaffected.
 */
const initialOf = (exposure, input, childId) => {
  try {
    return exposure.initial(input);
  } catch (error) {
    console.error(`Computing ${childId} for an undrawn row failed`, error);
    return {};
  }
};

/**
 * Computes an undrawn row's children that have an exposure module: `{ values, inputs, initials }`, each a Map by child
 * id (`values`: exposed values, with the row's changes). When a child reads a component (itself or a sibling), its
 * values depend on the others' (`dependent`): they are computed again with the ones just computed until they no longer
 * change, as the drawn row's settle once its widgets have exposed theirs.
 */
const computeRow = (get, listviewId, dataRow, moduleId, base, withoutChanges = false) => {
  const changes = withoutChanges ? undefined : rowChangesOf(get, listviewId, dataRow, moduleId);
  const customResolveObjects = { listItem: listviewRows(get, listviewId, moduleId)[dataRow] };
  const scope = rowScope(get, listviewId, dataRow, moduleId, base);
  const computed = get()
    .getContainerChildrenMapping(listviewId, moduleId)
    .map((childId) => [childId, exposureOf(typeOf(get, childId, moduleId))])
    .filter(([, exposure]) => exposure);
  const pass = (previous) => {
    scope.fill(previous);
    const next = { values: new Map(), inputs: new Map(), initials: new Map() };
    computed.forEach(([childId, exposure]) => {
      const input = headlessInput(get, listviewId, childId, scope, customResolveObjects, moduleId);
      const initial = initialOf(exposure, input, childId);
      next.inputs.set(childId, input);
      next.initials.set(childId, initial);
      next.values.set(childId, { ...initial, ...freshChange(exposure, changes?.[childId], initial, input).values });
    });
    return next;
  };
  let result = pass(new Map());
  const dependent = computed.some(([childId]) => readsComponents(get, childId, moduleId));
  for (let i = 0; dependent && i < computed.length; i++) {
    const next = pass(result.values);
    const same = isEqual(next.values, result.values);
    result = next;
    if (same) break;
  }
  // Validation run later (input.validate) sees the row as computed.
  scope.fill(result.values);
  return { ...result, dependent, scope, customResolveObjects };
};

/**
 * A ListView child's input for `dataRow` (see ./widgets/index.js): `{ properties, styles, general, validation,
 * validate }` as the widget would receive them in that row. A drawn row's are the ones in the store; an undrawn row's
 * are resolved for it, without writing to the store.
 */
export const resolveRowChildInput = (get, listviewId, dataRow, childId, moduleId = 'canvas') => {
  const slot = slotOf(get, listviewId, dataRow, moduleId);
  if (slot >= 0) return drawnInput(get, listviewId, slot, childId, moduleId);
  const computed = computeRow(get, listviewId, dataRow, moduleId);
  return (
    computed.inputs.get(childId) ??
    headlessInput(get, listviewId, childId, computed.scope, computed.customResolveObjects, moduleId)
  );
};

// ─── Changes ────────────────────────────────────────────────────────────────────────────────────────────────────────

const NO_CHANGE = { values: {}, basis: {}, replay: [] };

// Per ListView (keyOf): the estimated bytes of its row changes' values (sizeOf), in all and by data row (estimate.js).
const changeSizes = new Map();

/**
 * Keeps the size of a row's changes current: called after every write to them (recorded or pruned); adds the new size
 * to the ListView's total and takes the old one off. Returns the row's size now.
 */
export const sizeRowChanges = (get, listviewId, dataRow, moduleId) => {
  const key = keyOf(moduleId, listviewId);
  let bytes = 0;
  Object.values(rowChangesOf(get, listviewId, dataRow, moduleId) ?? {}).forEach((change) => {
    bytes += sizeOf(change.values);
  });
  if (!changeSizes.has(key)) changeSizes.set(key, { total: 0, byRow: new Map() });
  const sizes = changeSizes.get(key);
  sizes.total += bytes - (sizes.byRow.get(dataRow) ?? 0);
  if (bytes) sizes.byRow.set(dataRow, bytes);
  else sizes.byRow.delete(dataRow);
  return bytes;
};

/** The estimated bytes of a ListView's row changes: `{ total, byRow }` (data row → bytes), sizeRowChanges' figures. */
export const rowChangeSizes = (listviewId, moduleId) =>
  changeSizes.get(keyOf(moduleId, listviewId)) ?? { total: 0, byRow: new Map() };

/**
 * A child's recorded change without what its widget would have reset since: a value whose prop gives another value
 * than when the action ran (`initial` now vs `basis`; the widget sets it from the new prop), and the calls that set
 * one.
 */
export const freshChange = (exposure, change, initial, input) => {
  if (!change) return NO_CHANGE;
  const stale = Object.keys(change.values).filter((key) => !isEqual(initial[key], change.basis?.[key]));
  if (!stale.length) return change;
  const values = { ...change.values };
  const basis = { ...change.basis };
  stale.forEach((key) => {
    delete values[key];
    delete basis[key];
  });
  const sets = ({ action, args }) =>
    Object.keys(exposure.actions[action]?.({ ...initial, ...values }, args, input) ?? {});
  const replay = change.replay.filter((call) => !sets(call).some((key) => stale.includes(key)));
  return { values, basis, replay };
};

// A plain copy of a value for the store: arrays, plain objects, dates and primitives. Anything else (a function, a DOM
// node, a class instance) is left out.
const plainCopy = (value) => {
  if (Array.isArray(value)) return value.map(plainCopy);
  if (typeof value === 'function') return undefined;
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime());
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return undefined;
  const copy = {};
  Object.entries(value).forEach(([key, item]) => {
    const plain = plainCopy(item);
    if (plain !== undefined) copy[key] = plain;
  });
  return copy;
};

/**
 * A state action's args as the row keeps them (plainCopy): the change it records is computed from these, so what the
 * row reads before it is drawn again is what replaying them shows once it is.
 */
export const plainArgs = (args) => plainCopy(args);

/**
 * The change kept for a child of a row once the state action `action(args)` (plain: plainArgs) ran on it with `patch`:
 * its fresh change plus the patch. An action replaces its own earlier call (each sets the same values), so a child
 * keeps one per action.
 */
export const nextRowChange = ({ exposure, change, initial, input, action, args, patch }) => {
  const fresh = freshChange(exposure, change, initial, input);
  const basis = { ...fresh.basis };
  Object.keys(patch).forEach((key) => {
    basis[key] = initial[key];
  });
  return {
    values: { ...fresh.values, ...patch },
    basis,
    replay: [...fresh.replay.filter((call) => call.action !== action), { action, args }],
  };
};

/**
 * A row's data, like the ListView's `children[dataRow]`: `{ row: { [childName]: { ...values, id } }, uncomputed,
 * computed }`. A drawn row's children are what they expose; an undrawn row's children are computed from their exposure
 * module and the row's changes (`computed`: computeRow's, null when no child was computed). A child with no module
 * can't be computed: its `children[dataRow]` entry is used, if any, and its id is listed in `uncomputed` (see
 * uncomputedRowChildren). Functions are row action wrappers in a windowed ListView (and for computed children); `keep`:
 * the row is to be written into `children` (wrapRowActions). `base`: rowScopeBase, when rows are read together.
 * `options` (estimate.js, measuring a row): `headless`, read it as if it weren't drawn, whether or not it is (the
 * computed path); `withoutChanges`, as its data alone gives it (its recorded changes left out).
 */
export const readRow = (
  get,
  listviewId,
  dataRow,
  moduleId = 'canvas',
  keep = false,
  base = undefined,
  { headless = false, withoutChanges = false } = {}
) => {
  // A row past the end (or not a row index) has no values: nothing is made up for it.
  if (!isRowOf(get, listviewId, dataRow, moduleId)) return { row: undefined, uncomputed: [], computed: null };
  const state = get();
  const windowed = !!slotsOf(get, listviewId, moduleId);
  const children = moduleOf(get, moduleId)?.exposedValues?.components?.[listviewId]?.children;
  const row = {};
  const uncomputed = [];
  let computed = null;
  state.getContainerChildrenMapping(listviewId, moduleId).forEach((childId) => {
    const name = state.getComponentNameFromId(childId, moduleId);
    const live = !headless && liveExposure(get, listviewId, dataRow, childId, moduleId);
    if (live) {
      row[name] = {
        ...(windowed ? wrapRowActions(get, listviewId, dataRow, childId, live, moduleId, keep) : live),
        id: childId,
      };
      return;
    }
    const exposure = exposureOf(typeOf(get, childId, moduleId));
    if (!exposure) {
      uncomputed.push(childId);
      const stale = children?.[dataRow]?.[name];
      if (stale) {
        row[name] = { ...wrapRowActions(get, listviewId, dataRow, childId, stale, moduleId, keep), id: childId };
      }
      return;
    }
    computed ??= computeRow(get, listviewId, dataRow, moduleId, base, withoutChanges);
    const values = { ...computed.values.get(childId) };
    [...Object.keys(exposure.actions), ...exposure.liveActions].forEach((action) => {
      values[action] = wrapperOf(get, listviewId, dataRow, childId, action, moduleId, keep);
    });
    row[name] = { ...values, id: childId };
  });
  return { row, uncomputed, computed };
};

/**
 * The children of a row that readRow can't compute: not drawn in it, and with no exposure module. What it reads for
 * them is what they exposed when the row was last drawn, if it was.
 */
export const uncomputedRowChildren = (get, listviewId, dataRow, moduleId = 'canvas') =>
  get()
    .getContainerChildrenMapping(listviewId, moduleId)
    .filter(
      (childId) =>
        !exposureOf(typeOf(get, childId, moduleId)) && !liveExposure(get, listviewId, dataRow, childId, moduleId)
    );

/** A child's exposure module, and whether `action` is one of its state actions. */
export const actionKindOf = (get, childId, action, moduleId) => {
  const exposure = exposureOf(typeOf(get, childId, moduleId));
  return { exposure, isState: !!exposure && Object.hasOwn(exposure.actions, action) };
};

/**
 * Whether running `action` leaves something in the drawn widget that only the widget keeps (a typed value, focus): its
 * row then stays drawn for good. A child without a module doesn't say: its row is pinned (as a row the user clicked).
 */
export const keepsRow = (exposure, action) => !!exposure?.keepsRow?.includes(action);

// ─── Drawing a row on demand ─────────────────────────────────────────────────────────────────────────────────────

// Whether a child of the row in `slot` is drawn in the current layout (a hidden one mounts no widget, exposes nothing).
const shownIn = (get, childId, slot, moduleId) => {
  const state = get();
  const showKey = state.currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop';
  return !!(
    state.getResolvedComponent(childId, slot, moduleId)?.others?.[showKey] &&
    state.getComponentDefinition(childId, moduleId)?.layouts?.[state.currentLayout]
  );
};

// Whether the widgets of the row in `slot` have mounted: every child the row draws (shown in the current layout) has
// exposed its id and, for a child with a module, its actions (state and live).
const rowReady = (get, listviewId, slot, moduleId) => {
  const state = get();
  return state.getContainerChildrenMapping(listviewId, moduleId).every((childId) => {
    if (!shownIn(get, childId, slot, moduleId)) return true;
    const definition = state.getComponentDefinition(childId, moduleId);
    const live = slotExposure(get, childId, slot, moduleId);
    if (live?.id === undefined) return false;
    const exposure = exposureOf(definition.component?.component);
    return (
      !exposure ||
      [...Object.keys(exposure.actions), ...exposure.liveActions].every((action) => typeof live[action] === 'function')
    );
  });
};

// Per ListView (keyOf): slots whose row has mounted and had its changes replayed (slot → data row), and slots whose
// row's widgets unmounted while the row kept its slot (the ListView showed its loading state …): slot → { dataRow,
// stale: [[childId, key, fn]] }, a function each child's unmounted widget exposed. The slot holds them until the new
// widgets expose theirs: the row isn't drawn till then, and its changes are replayed once they have.
const settled = new Map();
const unmounted = new Map();
const settling = new Set();

const perListview = (map, moduleId, listviewId) => {
  const key = keyOf(moduleId, listviewId);
  if (!map.has(key)) map.set(key, new Map());
  return map.get(key);
};

const firstFunction = (exposure) => Object.keys(exposure ?? {}).find((key) => typeof exposure[key] === 'function');

// Whether the child in `slot` still exposes what its unmounted widget did (rowWidgetsUnmounted).
const unmountedIn = (get, listviewId, slot, dataRow, childId, moduleId) => {
  const entry = unmounted.get(keyOf(moduleId, listviewId))?.get(slot);
  if (entry?.dataRow !== dataRow) return false;
  const stale = entry.stale.find(([id]) => id === childId);
  return !!stale && ownAction(slotExposure(get, childId, slot, moduleId)?.[stale[1]]) === stale[2];
};

// Whether a child the row still has, and draws now, still shows what its unmounted widget exposed. A child hidden by
// the current layout, or removed, mounts no widget again: its stale function would never be replaced.
const stillUnmounted = (get, listviewId, slot, dataRow, moduleId) => {
  const entry = unmounted.get(keyOf(moduleId, listviewId))?.get(slot);
  if (entry?.dataRow !== dataRow) return false;
  const children = new Set(get().getContainerChildrenMapping(listviewId, moduleId));
  return entry.stale.some(
    ([childId]) =>
      children.has(childId) &&
      shownIn(get, childId, slot, moduleId) &&
      unmountedIn(get, listviewId, slot, dataRow, childId, moduleId)
  );
};

/**
 * The widgets of the row drawn in `slot` unmounted (Listview.jsx, as a row's subcontainer unmounts). A row that keeps
 * its slot (the ListView shows its loading state, or remounts) mounts new widgets there later: they show its props, so
 * it is settled again (its changes replayed) once they have exposed theirs. A row that left its slot is drawn afresh.
 */
export const rowWidgetsUnmounted = (get, listviewId, slot, dataRow, moduleId) => {
  if (slotsOf(get, listviewId, moduleId)?.[slot] !== dataRow) return;
  const marks = settled.get(keyOf(moduleId, listviewId));
  if (marks?.get(slot) === dataRow) marks.delete(slot);
  const stale = [];
  get()
    .getContainerChildrenMapping(listviewId, moduleId)
    .forEach((childId) => {
      const exposure = slotExposure(get, childId, slot, moduleId);
      const key = firstFunction(exposure);
      if (key) stale.push([childId, key, ownAction(exposure[key])]);
    });
  perListview(unmounted, moduleId, listviewId).set(slot, { dataRow, stale });
};

/** Forgets the slots that no longer show the row they settled with, or whose widgets unmounted (setListviewSlots). */
export const reconcileSettledRows = (listviewId, slots, moduleId) => {
  [settled, unmounted].forEach((map) =>
    map.get(keyOf(moduleId, listviewId))?.forEach((mark, slot, marks) => {
      if (slots[slot] !== (mark?.dataRow ?? mark)) marks.delete(slot);
    })
  );
};

/**
 * A drawn row whose widget ran a state action itself, and that had nothing to replay: settled, so the change just
 * recorded isn't replayed onto the widget that made it.
 */
export const markRowSettled = (listviewId, slot, dataRow, moduleId) => {
  if (unmounted.get(keyOf(moduleId, listviewId))?.get(slot)?.dataRow === dataRow) return;
  perListview(settled, moduleId, listviewId).set(slot, dataRow);
};

// The row count each ListView's settled rows and wrappers were last cut to (forgetListviewRows).
const cutAt = new Map();

/**
 * Forgets a windowed ListView's settled rows and row wrappers from data row `fromRow` on (all of them by default: it
 * left windowed mode, or unmounted). Runs on every slot write: it walks them only when the rows were cut shorter since,
 * and says whether it did (the store's row changes are cut with them).
 */
export const forgetListviewRows = (listviewId, moduleId, fromRow = 0) => {
  const key = keyOf(moduleId, listviewId);
  const last = cutAt.get(key);
  if (fromRow <= 0) {
    [settled, unmounted, wrappers, cutAt, changeSizes].forEach((map) => map.delete(key));
    return true;
  }
  cutAt.set(key, fromRow);
  if (last !== undefined && fromRow >= last) return false;
  [settled, unmounted].forEach((map) =>
    map.get(key)?.forEach((mark, slot, marks) => {
      if ((mark?.dataRow ?? mark) >= fromRow) marks.delete(slot);
    })
  );
  wrappers.get(key)?.forEach((_row, dataRow, byRow) => {
    if (dataRow >= fromRow) byRow.delete(dataRow);
  });
  const sizes = changeSizes.get(key);
  sizes?.byRow.forEach((bytes, dataRow) => {
    if (dataRow < fromRow) return;
    sizes.total -= bytes;
    sizes.byRow.delete(dataRow);
  });
  return true;
};

/** Whether a row's changes have calls to replay. */
export const hasReplay = (changes) => Object.values(changes ?? {}).some((change) => change.replay?.length);

/**
 * A drawn row's changes as they count now (each child's freshChange, with the props in its slot): `{ changes, stale }`,
 * `stale` when one no longer counts in full (what the store keeps is to be pruned).
 */
const drawnChanges = (get, listviewId, slot, dataRow, moduleId) => {
  const changes = {};
  let stale = false;
  Object.entries(rowChangesOf(get, listviewId, dataRow, moduleId) ?? {}).forEach(([childId, change]) => {
    const exposure = exposureOf(typeOf(get, childId, moduleId));
    const input = exposure && drawnInput(get, listviewId, slot, childId, moduleId);
    const fresh = exposure ? freshChange(exposure, change, initialOf(exposure, input, childId), input) : change;
    if (fresh !== change) stale = true;
    if (Object.keys(fresh.values).length || fresh.replay.length) changes[childId] = fresh;
  });
  return { changes, stale };
};

// Writes back a row's changes without what no longer counts (drawnChanges), after the store update running now.
const pruneChanges = (get, listviewId, dataRow, changes, moduleId) => {
  const seen = rowChangesOf(get, listviewId, dataRow, moduleId);
  queueMicrotask(() => get().replaceListviewRowChanges(listviewId, dataRow, seen, changes, moduleId));
};

/**
 * What a drawn row's children show until it is settled (its changes replayed onto its new widgets): childId → the
 * values its changes set. Null once settled, or with no changes. deriveRows writes them over what the new widgets
 * exposed, so children/data and their dependents don't go back to the props in between.
 */
export const unsettledRowValues = (get, listviewId, slot, dataRow, moduleId) => {
  if (!rowChangesOf(get, listviewId, dataRow, moduleId)) return null;
  if (settled.get(keyOf(moduleId, listviewId))?.get(slot) === dataRow) return null;
  const { changes } = drawnChanges(get, listviewId, slot, dataRow, moduleId);
  return new Map(Object.entries(changes).map(([childId, change]) => [childId, change.values]));
};

/**
 * Once the row drawn in `slot` has mounted, replays its recorded state actions through its widgets' own functions (in
 * order, once per mount; they aren't recorded again), so the widgets' state matches the row's changes. True once done.
 * A call that fails is skipped: the row still counts as settled, so nothing is replayed twice. Changes that no longer
 * count (a prop they overrode changed) are pruned from the store.
 */
export const settleRow = (get, listviewId, slot, dataRow, moduleId) => {
  const marks = perListview(settled, moduleId, listviewId);
  if (marks.get(slot) === dataRow) return true;
  const key = `${keyOf(moduleId, listviewId)}|${slot}|${dataRow}`;
  if (settling.has(key) || stillUnmounted(get, listviewId, slot, dataRow, moduleId)) return false;
  const remounted = unmounted.get(keyOf(moduleId, listviewId));
  if (remounted?.get(slot)?.dataRow === dataRow) remounted.delete(slot);
  if (!rowReady(get, listviewId, slot, moduleId)) return false;
  const { changes, stale } = drawnChanges(get, listviewId, slot, dataRow, moduleId);
  if (stale) pruneChanges(get, listviewId, dataRow, changes, moduleId);
  if (!hasReplay(changes)) {
    marks.set(slot, dataRow);
    return true;
  }
  settling.add(key);
  queueMicrotask(async () => {
    const inSlot = () => slotsOf(get, listviewId, moduleId)?.[slot] === dataRow;
    let left = false;
    try {
      for (const [childId, change] of Object.entries(rowChangesOf(get, listviewId, dataRow, moduleId) ?? {})) {
        const exposure = exposureOf(typeOf(get, childId, moduleId));
        if (!exposure) continue;
        const input = drawnInput(get, listviewId, slot, childId, moduleId);
        for (const { action, args } of freshChange(exposure, change, initialOf(exposure, input, childId), input)
          .replay) {
          left = !inSlot();
          if (left) return; // left before it was restored
          try {
            // The widget's own function: a replay isn't recorded again.
            await ownAction(slotExposure(get, childId, slot, moduleId)?.[action])?.(...args);
          } catch (error) {
            console.error(`Restoring ${action} on row ${dataRow} failed`, error);
          }
        }
      }
    } finally {
      settling.delete(key);
      // Settled only if it is still in its slot: one it left (during the last call too) is restored when drawn again.
      // One whose widgets unmounted meanwhile is settled again once the new ones have mounted.
      if (!left && inSlot()) {
        if (unmounted.get(keyOf(moduleId, listviewId))?.get(slot)?.dataRow === dataRow) {
          settleRow(get, listviewId, slot, dataRow, moduleId);
        } else marks.set(slot, dataRow);
      }
      recheckWaiters();
    }
  });
  return false;
};

/**
 * Settles the derived rows of a windowed ListView that have changes (deriveRows: `rows` are { listviewId, rowIndex:
 * slot, dataRow }). A row without changes costs nothing here.
 */
export const settleRows = (get, rows) =>
  rows.forEach(({ listviewId, rowIndex, dataRow, outerIndices, moduleId }) => {
    if (outerIndices.length === 0 && rowChangesOf(get, listviewId, dataRow, moduleId)) {
      settleRow(get, listviewId, rowIndex, dataRow, moduleId);
    }
  });

/**
 * Draws `dataRow` of the ListView and holds it drawn: resolves to the hold's release once the row is drawn, with its
 * widgets mounted and its changes replayed. A ListView that draws every row resolves at once. Rejects when the row
 * leaves the list (data or page changed) or the ListView unmounts before the row is drawn, or when `signal` (an
 * AbortSignal) aborts first (with its reason): the row is no longer held then.
 */
export const holdRowMounted = (get, subscribe, listviewId, dataRow, moduleId = 'canvas', signal = undefined) => {
  const notMounted = () => new Error(`ListView ${listviewId} is not mounted`);
  const notInList = () => new RangeError(`Row ${dataRow} is not in the list`);
  const first = handleOf(moduleId, listviewId);
  if (signal?.aborted) return Promise.reject(signal.reason);
  if (!first) return Promise.reject(notMounted());
  if (!isRowOf(get, listviewId, dataRow, moduleId)) return Promise.reject(notInList());
  if (!first.windowed && !slotsOf(get, listviewId, moduleId)) return Promise.resolve(NO_RELEASE);
  return new Promise((resolve, reject) => {
    let holder = null;
    let release = NO_RELEASE;
    const finish = (error) => {
      removeWaiter(check);
      signal?.removeEventListener('abort', aborted);
      if (!error) return resolve(release);
      release();
      reject(error);
    };
    const aborted = () => {
      if (waiters.has(check)) finish(signal.reason);
    };
    signal?.addEventListener('abort', aborted);
    const check = () => {
      if (!waiters.has(check)) return;
      const handle = handleOf(moduleId, listviewId);
      if (!handle) return finish(notMounted());
      if (!isRowOf(get, listviewId, dataRow, moduleId)) return finish(notInList());
      const slots = slotsOf(get, listviewId, moduleId);
      // Without slots: it left windowed mode, and draws every row (slot i is row i); or it is entering it.
      const drawn = slots
        ? slots.includes(dataRow) && settleRow(get, listviewId, slots.indexOf(dataRow), dataRow, moduleId)
        : !handle.windowed && rowReady(get, listviewId, dataRow, moduleId);
      if (drawn) return finish();
      // Not drawn yet: held by this ListView (again, when it remounted). It draws a few held rows at a time: the others
      // wait their turn (Listview.jsx holdRow).
      if (handle.windowed && handle !== holder) {
        release();
        holder = handle;
        release = handle.holdRow(dataRow);
      }
    };
    addWaiter(check, subscribe);
    check();
  });
};
