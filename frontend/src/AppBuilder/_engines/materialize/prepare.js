/**
 * Materialization engine: the rows a `{{ }}` template reads, made ready before it is evaluated.
 *
 * A binding, a query's options or an event action's params can read a windowed ListView's `children`/`data`, which
 * hold only the rows it drew. Before such a template is evaluated, what it reads of them is found from its text (parsed
 * with acorn, as _stores/ast.js does; the analysis is kept per text, as expressions.js keeps its plans):
 *
 * - a row: `children[2900]`, or `data[<expression>]` whose index resolves (from the values as they are now) to a row.
 *   A row with every child computed (rows.js readRow) is read at once; one with a child that can only be read drawn
 *   is drawn first (ensureRowMounted: pinned, it stays drawn as a row the user clicked), and then read as it was drawn
 *   while the ListView's rows and row changes stay the same (other rows pinned after it may let it go);
 * - the whole list: `children`/`data` used without an index (passed to a query, `Object.keys(…)`), the ListView's entry
 *   used whole (`components.listview1`, passed on or returned), a key of the entry named by an expression that
 *   resolves to `children`/`data` (`components.listview1[variables.key]`; another key reads nothing), or an index or a
 *   key that can't be resolved before it is evaluated (a callback's variable: `[1, 2].map((i) => data[i])`). It is read
 *   in the background (materialize.js, `json` when it goes into a query's request), once its estimate is ready. The
 *   result is kept while the ListView's rows and row changes stay the same (by identity) and every row its `data` holds
 *   but doesn't draw shows what was read for it (readHolds: rows drawn as the user scrolls don't read it again), so the
 *   template evaluated again once it is ready finds it, with the rows drawn now as they are (withDrawnRows: what the
 *   user typed in them); a read refused (too slow, too large, a row that threw) is kept the same way, and logged once.
 *
 * The template is then evaluated in a scope where those ListView entries are plain objects: `{ ...entry, children:
 * { ...entry.children, [row]: … }, data: … }`, or with the whole list's `children`/`data`, in a copy of `components`
 * holding every other component as it was (`{{ { all: components, row: components.lv1.data[5] } }}` sends them all).
 * Never a Proxy.
 *
 * A value only tested (`components.lv1 ? … : …`, `components.lv1 && components.lv1.selectedRecord`), or a key of
 * children/data that is no row (`components.lv1.data.length`, `data["name"]`), reads nothing, and one passed through
 * `||`, `??` or `?:` is followed (usedAt). Nor are `components` used whole (`{{components}}`,
 * `{{Object.keys(components)}}`), a component named by an expression (`components[variables.name]`) or a template
 * binding its own `components` followed: they read the drawn rows, as they always did.
 *
 * prepareReads gives what to evaluate in, or a promise to wait for: a query or an action awaits it then runs; a binding
 * (prepareBinding) keeps its previous value meanwhile and is resolved again once the rows are ready (once, however
 * often it was evaluated meanwhile), so it never shows a value made of rows that weren't there (a row being drawn for
 * it isn't read before its widgets have mounted: they first show the template row's values). Such a binding reads rows
 * the ListView's children/data don't hold, so it is resolved again whenever the ListView's rows change
 * (listViewComponentSlice refreshListviewEstimate, for a ListView a template read: readByTemplates), unless it was
 * removed meanwhile. A read under way stops when its ListView unmounts or stops windowing (forgetListviewReads). A
 * script's rows (RunJS, JS transformations) are made ready through prepareReads too (scripts.js).
 * `{{ }}` resolved at once, with nothing to wait on (getResolvedValue: a Table's cells, a query's disable and confirm
 * expressions), gets what can be read at once (readyState): rows computed or as they were drawn for a template, the
 * whole list only while a read of it holds; else the drawn rows, as before.
 *
 * Only reads of windowed ListViews count (windowedReadsOf, listviewReadsIn, eventReadsIn): in a module with none, or
 * for a Form's data or a ListView's that draws every row, a template costs a check of the module, or of its cached
 * analysis, and is evaluated as before. An event's reads are those of the strings executeAction resolves, never of the
 * values an action carries (what a script passes to `actions.setVariable`).
 */
import { parse } from 'acorn';
import { ancestor, simple } from 'acorn-walk';
import { isEqual } from 'lodash';
import {
  getDynamicVariables,
  remember,
  removeNestedDoubleCurlyBraces,
  resolveCode,
  valueWithIds,
} from '@/AppBuilder/_engines/data/expressions';
import { registerResetter } from '@/AppBuilder/_stores/utils';
import { buildRow, MaterializationError } from './estimate';
import { hasWindowedListview, isRowOf, listviewRows, slotOf, slotsOf } from './rows';

// How often a whole-list read waiting for the ListView's estimate checks it again, and for how long at most.
const ESTIMATE_POLL_MS = 50;
const ESTIMATE_WAIT_MS = 10000;

const keyOf = (moduleId, listviewId) => `${moduleId}\u0000${listviewId}`;

// A ListView entry's keys holding its rows.
export const ROWS_KEYS = ['children', 'data'];

// ─── What a template reads ──────────────────────────────────────────────────────────────────────────────────────

const analyses = new Map();

// The data row a key names (`5`, `'5'`), else -1.
export const rowNumber = (value) => {
  const row = typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value) ? Number(value) : value;
  return Number.isInteger(row) && row >= 0 ? row : -1;
};

const propertyOf = (node) =>
  node.computed ? (node.property.type === 'Literal' ? node.property.value : null) : node.property.name;

// `components.<id>` / `components["<id>"]`: the id, else null.
const componentOf = (node) => {
  if (node.type !== 'MemberExpression' || node.object.type !== 'Identifier' || node.object.name !== 'components') {
    return null;
  }
  const id = propertyOf(node);
  return id === null || id === undefined ? null : String(id);
};

// Whether `parent` passes the value of `node` on as its own: `a || b`, `a ?? b`, the right of `&&`, `c ? a : b`, the
// last of `(x, a)`, `a?.b` as a whole, `await a`.
const passesOn = (node, parent) => {
  switch (parent?.type) {
    case 'LogicalExpression':
      return parent.operator !== '&&' || parent.right === node;
    case 'ConditionalExpression':
      return parent.test !== node;
    case 'SequenceExpression':
      return parent.expressions[parent.expressions.length - 1] === node;
    case 'ChainExpression':
    case 'AwaitExpression':
      return true;
    default:
      return false;
  }
};

/**
 * Where the value of `ancestors[at]` (an acorn-walk `ancestor` walk's ancestors, the node last) goes: `{ node, parent,
 * at }`, `node` the expression holding it as its own value (passesOn), at `ancestors[at]`, in `parent`.
 */
export const usedAt = (ancestors, at) => {
  while (passesOn(ancestors[at], ancestors[at - 1])) at -= 1;
  return { node: ancestors[at], parent: ancestors[at - 1], at };
};

// The member expression reading a key of a value used where `use` (usedAt) is, if any.
export const readerOf = ({ node, parent }) =>
  parent?.type === 'MemberExpression' && parent.object === node ? parent : null;

/**
 * Whether a value used where `use` (usedAt) is is only tested there (`if (…)`, `… ? :`, `typeof …`, `!…`,
 * `… === undefined`, the left of `&&`): nothing of it goes on.
 */
export const tested = ({ node, parent }) => {
  switch (parent?.type) {
    case 'IfStatement':
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'ForStatement':
    case 'ConditionalExpression':
      return parent.test === node;
    case 'UnaryExpression':
      return parent.operator !== 'delete';
    case 'BinaryExpression':
      return true;
    case 'LogicalExpression':
      return parent.operator === '&&' && parent.left === node;
    default:
      return false;
  }
};

const readsIn = (expression, reads) => {
  let ast;
  try {
    ast = parse(expression, { ecmaVersion: 2020 });
  } catch {
    return;
  }
  // Names the expression binds itself (a callback's parameters, its variables): an index using one can't be resolved
  // before it is evaluated. One named `components` isn't the app's: nothing is followed.
  const local = new Set();
  simple(ast, { VariablePattern: (node) => local.add(node.name) });
  if (local.has('components')) return;
  const usesLocal = (node) => {
    let uses = false;
    simple(node, {
      Identifier: (identifier) => {
        if (local.has(identifier.name)) uses = true;
      },
    });
    return uses;
  };
  const whole = (id) => reads.push({ id, row: null, index: null });
  ancestor(ast, {
    // A ListView's entry (`components` used whole, or a component named by an expression, isn't followed: it reads
    // the drawn rows, as it always did).
    MemberExpression(node, _state, ancestors) {
      const id = componentOf(node);
      if (id === null) return;
      const entry = usedAt(ancestors, ancestors.length - 1);
      const key = readerOf(entry);
      // The entry used whole: its rows too; only tested: nothing.
      if (!key) return tested(entry) ? undefined : whole(id);
      // A key of it that is an expression: its rows when it resolves (as the values are then) to children/data.
      if (propertyOf(key) === null) {
        if (usesLocal(key.property)) whole(id);
        else reads.push({ id, row: null, index: null, key: expression.slice(key.property.start, key.property.end) });
        return;
      }
      if (!ROWS_KEYS.includes(propertyOf(key))) return;
      const rows = usedAt(ancestors, entry.at - 1);
      const index = readerOf(rows);
      if (!index) return tested(rows) ? undefined : whole(id);
      if (!index.computed) return; // a key that is no row (`data.length`): nothing to read
      const { property } = index;
      if (property.type !== 'Literal') {
        if (usesLocal(property)) whole(id);
        else reads.push({ id, row: null, index: expression.slice(property.start, property.end) });
        return;
      }
      const row = rowNumber(property.value);
      if (row >= 0) reads.push({ id, row, index: null }); // a key that is no row (`data.name`): nothing to read
    },
  });
};

/**
 * What a template (component ids in it, as the store resolves it) reads of any ListView's children/data:
 * `[{ id, row, index, key }]` (`row`: a literal row; `index`: the source of an index expression; neither: the whole
 * list; `key`, when present: the source of an expression naming a key of the entry, the whole list only when it names
 * children/data), or null when it reads none. Kept per text.
 */
export const listviewReadsOf = (text) => {
  if (typeof text !== 'string' || !text.includes('components')) return null;
  return remember(analyses, text, () => {
    const reads = [];
    (getDynamicVariables(text) ?? []).forEach((part) => readsIn(removeNestedDoubleCurlyBraces(part), reads));
    return reads.length ? reads : null;
  });
};

// The reads (listviewReadsOf) of windowed ListViews, or null when there are none.
const windowed = (get, reads, moduleId) => {
  const slotted = reads?.filter((read) => slotsOf(get, read.id, moduleId));
  return slotted?.length ? slotted : null;
};

/**
 * What a template (ids in it) reads of the module's windowed ListViews' children/data (listviewReadsOf), or null when
 * it reads none, or the module has none: a binding reading a Form's data, or a ListView's that draws every row, is
 * resolved as before.
 */
export const windowedReadsOf = (get, text, moduleId) =>
  hasWindowedListview(get, moduleId) ? windowed(get, listviewReadsOf(text), moduleId) : null;

/**
 * What the `{{ }}` templates in `strings` (names in them, as the user wrote them) read of the module's windowed
 * ListViews (windowedReadsOf); null when nothing, or when the module has no windowed ListView.
 */
const readsOfStrings = (get, strings, moduleId) => {
  if (!hasWindowedListview(get, moduleId)) return null;
  const { componentNameIdMapping, queryNameIdMapping } = get().modules[moduleId] ?? {};
  const reads = [];
  strings((item) => {
    if (typeof item === 'string' && item.includes('{{'))
      reads.push(...(listviewReadsOf(valueWithIds(item, componentNameIdMapping, queryNameIdMapping)) ?? []));
  });
  return windowed(get, reads, moduleId);
};

/** What a query's options (every string in them) read of windowed ListViews (windowedReadsOf). */
export const listviewReadsIn = (get, options, moduleId) =>
  readsOfStrings(
    get,
    (visit) => {
      const walk = (item) => (item && typeof item === 'object' ? Object.values(item).forEach(walk) : visit(item));
      walk(options);
    },
    moduleId
  );

/**
 * What an event's action reads of windowed ListViews (windowedReadsOf): only the strings executeAction resolves (its
 * own, its query's or page's params, its control-component action's params), never a value an action carries (what a
 * script passes to `actions.setVariable`, the query a log comes from). Its `runOnlyIf` is read apart (`runOnlyIf`
 * true: only it), as it is resolved before the rest.
 */
export const eventReadsIn = (get, event, moduleId, { runOnlyIf = false } = {}) =>
  readsOfStrings(
    get,
    (visit) => {
      if (runOnlyIf) return visit(event.runOnlyIf);
      Object.keys(event).forEach((key) => key !== 'runOnlyIf' && visit(event[key]));
      event.queryParams?.forEach?.((pair) => pair?.forEach?.(visit));
      event.componentSpecificActionParams?.forEach?.((param) => visit(param?.value));
      if (event.parameters && typeof event.parameters === 'object') Object.values(event.parameters).forEach(visit);
    },
    moduleId
  );

// ─── Making them ready ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * What a read of the ListView's rows stays valid for: its rows and its row changes as the read began (by identity),
 * and its `data` (rows it drew to read them were written there meanwhile; see readHolds).
 */
const rowsInputsOf = (get, listviewId, moduleId) => {
  const mod = get().resolvedStore.modules[moduleId];
  return [
    listviewRows(get, listviewId, moduleId),
    mod?.listviewRowChanges?.[listviewId],
    mod?.exposedValues?.components?.[listviewId]?.data,
  ];
};

// Whether a row shows what was read for it: each value read of each of its children (its widget may expose more).
const showsRead = (shown, read) =>
  !!read &&
  Object.keys(read).every((name) => {
    const was = read[name];
    const is = shown?.[name];
    return was === is || (!!was && !!is && Object.keys(was).every((key) => isEqual(was[key], is[key])));
  });

/**
 * Whether a whole-list read (`known`: `{ inputs: rowsInputsOf as it ended, all }`) still holds: the same rows and row
 * changes, and every row the ListView's `data` holds but doesn't draw now shows what was read for it (rows drawn and
 * let go as the user scrolls don't read it again; a row let go after its props resolved to other values does). Rows
 * drawn now are read as they are (withDrawnRows). Its `data` is then kept as the read's, so the next check is by
 * identity.
 */
const readHolds = (get, listviewId, moduleId, known) => {
  const [rows, changes, data] = rowsInputsOf(get, listviewId, moduleId);
  const [readRows, readChanges, readData] = known.inputs;
  if (rows !== readRows || changes !== readChanges) return false;
  if (data === readData) return true;
  const drawn = new Set(slotsOf(get, listviewId, moduleId));
  const holds =
    !!known.all &&
    Object.keys(data ?? {}).every(
      (row) => drawn.has(Number(row)) || data[row] === readData?.[row] || showsRead(data[row], known.all.data[row])
    );
  if (holds) known.inputs = [rows, changes, data];
  return holds;
};

// A read's `all` → { data, slots, all }: with the rows drawn then, for the ListView's data and slots then.
const overlays = new WeakMap();

/**
 * Every row of a whole-list read (`all`: `{ children, data }`), the rows drawn now as the ListView's children/data
 * hold them (what the user typed in them, …): `all` itself when they show what was read.
 */
const withDrawnRows = (get, listviewId, moduleId, all) => {
  const exposed = get().resolvedStore.modules[moduleId]?.exposedValues?.components?.[listviewId];
  const slots = slotsOf(get, listviewId, moduleId) ?? [];
  const known = overlays.get(all);
  if (known?.data === exposed?.data && known.slots === slots) return known.all;
  const drawn = slots.filter(
    (row) => row >= 0 && exposed?.children?.[row] && exposed.data?.[row] && !showsRead(exposed.data[row], all.data[row])
  );
  let result = all;
  if (drawn.length) {
    const children = { ...all.children };
    const data = { ...all.data };
    drawn.forEach((row) => {
      children[row] = exposed.children[row];
      data[row] = exposed.data[row];
    });
    result = Object.freeze({ children: Object.freeze(children), data: Object.freeze(data) });
  }
  overlays.set(all, { data: exposed?.data, slots, all: result });
  return result;
};

// Per ListView: the last whole-list read, { inputs, json, all, error, pending }.
const wholes = new Map();
// Rows drawn for a template, as they were then: per ListView, { rows, changes, built: dataRow → buildRow's }.
const drawnRows = new Map();
// ListViews a template read rows of that they don't draw (readByTemplates).
const readers = new Set();
// Bindings waiting to be resolved again (prepareBinding): their keys.
const queued = new Set();

/** Whether a template read rows of the ListView it doesn't draw (resolved again when the ListView's rows change). */
export const readByTemplates = (listviewId, moduleId = 'canvas') => readers.has(keyOf(moduleId, listviewId));

// Resolves once the ListView's estimate is ready (or failed, or ESTIMATE_WAIT_MS passed: a read before then is refused
// for it), or the read is no longer wanted (`wanted()` false: the ListView unmounted, or stopped windowing).
const whenEstimated = (get, listviewId, moduleId, wanted) =>
  new Promise((resolve) => {
    const started = performance.now();
    const check = () => {
      if (!wanted()) return resolve();
      const est = get().estimateListviewRows(listviewId, {}, moduleId);
      if (est.ready || est.error || !est.windowed || performance.now() - started > ESTIMATE_WAIT_MS) resolve();
      else setTimeout(check, ESTIMATE_POLL_MS);
    };
    check();
  });

// A read that failed for a reason of its own (a row that threw while it was read): a refusal saying so.
const failedRead = (get, listviewId, moduleId, error) => {
  const name = get().getComponentNameFromId?.(listviewId, moduleId) ?? listviewId;
  return new MaterializationError('failed', `Reading ${name}'s rows failed: ${error?.message ?? error}`);
};

// The ListView's every row, in the background: `{ all }` when a read still valid has it, `{ error }` when one was
// refused, `{ pending }` while one is under way (started here, unless `start` is false: then null).
const wholeList = (get, listviewId, moduleId, json, start = true) => {
  const key = keyOf(moduleId, listviewId);
  const known = wholes.get(key);
  if (known?.pending) return start ? { pending: known.pending } : null;
  // A refusal because its estimate wasn't ready holds until it is.
  const stale = known?.error?.reason === 'not-ready' && get().estimateListviewRows(listviewId, {}, moduleId).ready;
  if (known && !stale && readHolds(get, listviewId, moduleId, known)) {
    if (known.error) return { error: known.error };
    if (known.json || !json) return { all: known.all };
  }
  if (!start) return null;
  const [rows, changes] = rowsInputsOf(get, listviewId, moduleId);
  const entry = { inputs: null, json, all: null, error: null, pending: null };
  const ended = () => {
    entry.pending = null;
    entry.inputs = [rows, changes, rowsInputsOf(get, listviewId, moduleId)[2]];
  };
  const wanted = () => wholes.get(key) === entry;
  wholes.set(key, entry);
  entry.pending = whenEstimated(get, listviewId, moduleId, wanted)
    .then(() => (wanted() ? get().materializeListviewRows(listviewId, { json }, moduleId) : null))
    .then(
      (all) => {
        entry.all = all;
        ended();
      },
      (error) => {
        ended();
        // Rows that changed while they were read, or a read cancelled: read again when asked again. Any other failure
        // (a row that threw) is kept as a refusal, as read again it would fail again.
        if (error instanceof MaterializationError && ['changed', 'cancelled'].includes(error.reason)) {
          if (wholes.get(key) === entry) wholes.delete(key);
          return;
        }
        const refusal = error instanceof MaterializationError ? error : failedRead(get, listviewId, moduleId, error);
        // The same refusal as before (the rows read again after they changed …) is the one already logged.
        const same = known?.error?.reason === refusal.reason && known.error.message === refusal.message;
        entry.error = same ? known.error : refusal;
      }
    );
  return { pending: entry.pending };
};

/**
 * Forgets the ListView's last whole-list read and the rows drawn for templates (it stopped windowing, or unmounted): a
 * read under way stops before it reads, and what waits for it is resolved again (finding the ListView as it is then).
 */
export const forgetListviewReads = (listviewId, moduleId = 'canvas') => {
  const key = keyOf(moduleId, listviewId);
  wholes.delete(key);
  drawnRows.delete(key);
  readers.delete(key);
};

// Rows being drawn for a template: one wait per row, however many templates read it. Until it is drawn, its widgets
// mounted (their first values are the template row's, before their props resolve for it), it isn't read.
const drawing = new Map();
const drawingKey = (moduleId, listviewId, dataRow) => `${keyOf(moduleId, listviewId)}\u0000${dataRow}`;

registerResetter(() => {
  wholes.clear();
  drawing.clear();
  drawnRows.clear();
  readers.clear();
  queued.clear();
});

// The row as it was drawn for a template, while the ListView's rows and row changes stay the same; else undefined.
const drawnRow = (get, listviewId, dataRow, moduleId) => {
  const known = drawnRows.get(keyOf(moduleId, listviewId));
  if (!known) return undefined;
  const [rows, changes] = rowsInputsOf(get, listviewId, moduleId);
  return known.rows === rows && known.changes === changes ? known.built.get(dataRow) : undefined;
};

// Reads a row just drawn for a template, kept for when it is let go (drawnRow).
const keepDrawnRow = (get, listviewId, dataRow, moduleId) => {
  const key = keyOf(moduleId, listviewId);
  const [rows, changes] = rowsInputsOf(get, listviewId, moduleId);
  let known = drawnRows.get(key);
  if (!known || known.rows !== rows || known.changes !== changes) {
    known = { rows, changes, built: new Map() };
    drawnRows.set(key, known);
  }
  const built = buildRow(get, listviewId, dataRow, moduleId);
  if (built && !built.uncomputed.length) known.built.set(dataRow, built);
};

const drawRow = (get, listviewId, dataRow, moduleId) => {
  const key = drawingKey(moduleId, listviewId, dataRow);
  if (!drawing.has(key)) {
    drawing.set(
      key,
      get()
        .ensureRowMounted(listviewId, dataRow, moduleId)
        .then(() => keepDrawnRow(get, listviewId, dataRow, moduleId))
        .catch(() => {}) // the row left the list, or the ListView unmounted: evaluated as it is then
        .finally(() => drawing.delete(key))
    );
  }
  return drawing.get(key);
};

/**
 * A copy of a template's `components` to put entries in, shaped as it is: a plain object for the store's (every
 * component an own key, as JSON.stringify, Object.keys and spread see them), and in a ListView row's scope (an overlay
 * inheriting the store's components: listViewComponentSlice prepareRowScope) an overlay of the same.
 */
const copyOf = (components) => {
  const proto = Object.getPrototypeOf(components);
  return proto === Object.prototype || proto === null
    ? { ...components }
    : Object.create(proto, Object.getOwnPropertyDescriptors(components));
};

// The row an index expression gives: -1 for a key that is no row, null when it can't be resolved (every row is read).
const indexRow = (index, state, customObjects) => {
  const [value, error] = resolveCode(index, state, customObjects, true);
  return error ? null : rowNumber(value);
};

// Whether a key expression of an entry names its rows (or can't be resolved: every row is read).
const namesRows = (key, state, customObjects) => {
  const [value, error] = resolveCode(key, state, customObjects, true);
  return !!error || ROWS_KEYS.includes(String(value));
};

/**
 * Makes ready what `reads` (listviewReadsOf) take of windowed ListViews: null when they read none, or nothing the
 * entries don't hold already (evaluate in `state` as before), `{ state }` to evaluate in (its `components` a copy, every
 * other component in it as it was: copyOf), `{ pending }` (a promise, never rejecting) when rows must be drawn or the
 * whole list read first (prepare again once it settles), or `{ error }` (a MaterializationError) when reading the whole
 * list was refused. `customObjects`: the template's custom variables (an index expression resolves with them). `json`:
 * the values go into a query's request. `wait` false: nothing is drawn or read in the background, only what can be read
 * at once is (readyState).
 */
export const prepareReads = (get, reads, state, customObjects, moduleId, { json = false, wait = true } = {}) => {
  if (!reads) return null;
  const needs = new Map();
  reads.forEach(({ id, row, index, key }) => {
    if (!slotsOf(get, id, moduleId)) return;
    if (key !== undefined && !namesRows(key, state, customObjects)) return;
    if (!needs.has(id)) needs.set(id, { whole: false, rows: new Set() });
    const need = needs.get(id);
    const dataRow = row ?? (index === null ? null : indexRow(index, state, customObjects));
    if (dataRow === null) need.whole = true;
    else if (dataRow >= 0) need.rows.add(dataRow);
  });
  if (!needs.size) return null;

  let components = null; // `state.components` with the entries made ready in place: made at the first one
  const waits = [];
  let error = null;
  needs.forEach(({ whole, rows }, id) => {
    const read = () => readers.add(keyOf(moduleId, id)); // rows it doesn't draw
    const entry = state.components?.[id] ?? {};
    const define = (value) => {
      components ??= copyOf(state.components ?? {});
      Object.defineProperty(components, id, { value, writable: true, enumerable: true, configurable: true });
    };
    if (whole) {
      read();
      const list = wholeList(get, id, moduleId, json, wait);
      if (list?.error) error ??= list.error;
      else if (list?.pending) waits.push(list.pending);
      else if (list) define({ ...entry, ...withDrawnRows(get, id, moduleId, list.all) });
      return;
    }
    let children = null;
    let data = null;
    rows.forEach((dataRow) => {
      if (!isRowOf(get, id, dataRow, moduleId)) return; // past the end: nothing, as before
      const draw = wait && drawing.get(drawingKey(moduleId, id, dataRow));
      if (draw) return waits.push(draw);
      // A drawn row, written into children: as it is.
      if (slotOf(get, id, dataRow, moduleId) >= 0 && entry.children?.[dataRow]) return;
      read();
      const built = drawnRow(get, id, dataRow, moduleId) ?? buildRow(get, id, dataRow, moduleId);
      if (built.uncomputed.length && wait) waits.push(drawRow(get, id, dataRow, moduleId));
      children ??= { ...entry.children };
      data ??= { ...entry.data };
      children[dataRow] = built.row;
      data[dataRow] = built.values;
    });
    if (children) define({ ...entry, children, data });
  });
  if (error) return { error };
  if (waits.length) return { pending: Promise.all(waits).then(() => {}) };
  // Nothing to read that the entries don't hold (rows drawn, past the end; the whole list, with `wait` false, not read
  // yet): evaluated in `state` as before.
  return components ? { state: { ...state, components } } : null;
};

/**
 * What `{{ }}` (`text`, ids in it) resolved at once resolves in (getResolvedValue): `[state, customObjects]`
 * themselves when it reads no windowed ListView's children/data, else with what can be read of them at once
 * (prepareReads, `wait` false); custom objects holding the state's components (runQuery passes its state as such) too.
 */
export const readyState = (get, text, state, customObjects, moduleId) => {
  const reads = windowedReadsOf(get, text, moduleId);
  const ready = reads && prepareReads(get, reads, state, customObjects, moduleId, { wait: false })?.state;
  if (!ready) return [state, customObjects];
  const holdsState = customObjects?.components === state.components;
  return [ready, holdsState ? { ...customObjects, components: ready.components } : customObjects];
};

/** Marks a refused read logged: true the first time (so it is logged once, not on every evaluation). */
const firstReport = (error) => {
  if (error.reported) return false;
  error.reported = true;
  return true;
};

/** What prepareBinding gives when the binding keeps its previous value (its rows aren't ready, or were refused). */
export const KEEP = Symbol('keep');

/**
 * For a binding whose template reads `reads` (listviewReadsOf): the state to resolve it in (`state` itself when it
 * reads no windowed ListView's children/data), or KEEP: its rows aren't ready, and `retry` runs once they are (it
 * resolves the binding again; once for its `key`, however often it was evaluated while they weren't); or reading them
 * was refused, and `report(error)` logs it (once per refusal).
 */
export const prepareBinding = (get, reads, state, customObjects, moduleId, retry, report, key = retry) => {
  const prepared = prepareReads(get, reads, state, customObjects, moduleId);
  if (!prepared) return state;
  if (prepared.state) return prepared.state;
  if (prepared.pending) {
    if (!queued.has(key)) {
      queued.add(key);
      prepared.pending.then(() => {
        queued.delete(key);
        retry();
      });
    }
  } else if (firstReport(prepared.error)) report(prepared.error);
  return KEEP;
};
