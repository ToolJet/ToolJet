/**
 * Materialization engine: what reading every row of a long ListView at once would cost, known before anyone asks.
 *
 * Reading all rows (materialize.js) builds what `children`/`data` would hold if every row were drawn: for 5M rows that
 * can take minutes, run the tab out of memory, or make a JSON longer than a string can be (V8: ~536.8M characters).
 * So it is estimated first, from a profile of the ListView's rows kept here (by module and ListView, not in the store):
 *
 * - its data's size: the rows profile freezing recorded (freeze.js rowsProfileOf: each row's bytes, the 5 largest),
 *   else a sliced background scan by the same rule (not ready until it ends); plus the bytes of its row changes (rows.js
 *   sizeRowChanges);
 * - its 5 longest rows (by data bytes, changes included). A row whose changes make it larger than the 5th takes its
 *   place (until it is measured again, its figures are the most any measured row's come to, scaled up to its size).
 *   A measured row's figures never go down while what a row mounts stays the same: measured again, it keeps the larger
 *   of each; and a row with changes is measured as its data alone gives it too, the larger kept. So a row its changes
 *   shrink keeps its old figure, after a data reload or a widget edit too (over-estimating is the safe direction);
 * - what a drawn row mounts: the children readRow can't compute (no exposure module): with any, every row is drawn to
 *   be read. Taken from the store as it is now, so a child just added counts at once;
 * - each of the 5 longest measured in the background, a row per idle callback (when the idle period has room for it,
 *   or once it has waited long enough), once the ListView has data, and again when the rows or what a row mounts change
 *   (a widget added, removed or edited): until then the estimate isn't ready, as old figures would mix the old rows with
 *   the new. Watched through the store by identity (its container tree, its definitions), so a scroll or a query run
 *   costs a few comparisons. What the children resolve in otherwise (variables, queries …) isn't watched: the figures
 *   are the rows as they last read, and materialize.js checks memory, JSON length and its pace as it goes. A row's
 *   figures:
 *   - time: building it as materialize.js does (buildRow: readRow's computed path, then freezing it and its function-free
 *     copy), built once untimed (a first read is far slower than the rows after it), then timed twice, the slower
 *     kept; each timing reads it until the time taken stands out from the timer's tick
 *     (browsers coarsen it: 0.1 ms in Chrome, 1 ms in Firefox and Safari, 5 µs cross-origin isolated, against ~15 µs a
 *     row), at most TIMING_MS (Chrome: about 50 reads, Firefox and Safari: about 250; a binding with a side effect runs
 *     that often). Its JSON (`jsonMs`) too. A row that is drawn to be read adds DRAW_MS_PER_WIDGET for every widget it
 *     mounts (all of them are drawn, not only the ones that can't be computed): a ListView nested in it, once for each
 *     of its rows there;
 *   - memory: what the row takes in `children` (its values, a closure per action) and in `data` (only the objects
 *     withoutFunctions copies: the rest is shared);
 *   - JSON: the row's length in JSON.stringify of the result, `children` and `data` each holding its values.
 *   A child that can't be computed counts what it last exposed in that row, else an allowance: UNCOMPUTED_CHILD_BYTES /
 *   UNCOMPUTED_CHILD_CHARS for each widget it mounts (an inner ListView's in each of its rows), and its props as resolved
 *   for that row EXPOSED_COPIES times (a Table exposes its rows several times over; an inner ListView, for each of its
 *   children, in its children and data).
 *
 * estimate() is arithmetic over that profile: the 5 longest rows, and for every other row the most any of them comes to
 * per data byte at the 5th's size (at least the 5th's own figure, and never less than they came to before the 5
 * changed: a row that left the 5 is one of them): it never reads a row, and never profiles. Its time adds what the batches cost besides their rows: a row scope per slice
 * (rowScopeBase), or for rows that are drawn a render round per batch (DRAW_ROUND_MS). decide() says whether reading
 * them all fits in time, memory (the JSON's string too, for JSON) and string length, and in what batches; its refusal
 * names the ListView, the figures, and what to use instead (the data it's bound to).
 */
import { addRowToProfile, deepFreeze, newRowsProfile, rowsProfileOf, sizeOf } from '@/AppBuilder/_engines/data/freeze';
import { estimateBytes, formatBytes, headroom, OBJECT_BYTES, SLOT_BYTES } from '@/AppBuilder/_engines/data/memory';
import { forSliced, SLICE_MS } from '@/AppBuilder/_engines/data/slices';
import { idleQueue } from '@/AppBuilder/_engines/data/taskQueue';
import { withoutFunctions } from '@/_helpers/appUtils';
import { exposureOf } from './widgets';
import {
  descendantsOf,
  listviewRows,
  readRow,
  resolveRowChildInput,
  rowChangeSizes,
  rowChangesOf,
  rowScopeBase,
  sizeRowChanges,
  slotsOf,
  widgetsMountedIn,
} from './rows';

/** Drawing a row costs about this per widget it mounts (1.6 ms measured on the dev build, rounded up). */
export const DRAW_MS_PER_WIDGET = 2;
/**
 * A batch of drawn rows costs this besides its widgets: the ListView's render that holds them, the one that lets them
 * go, and their widgets unmounting. An allowance (not measured: it needs a browser); materialize.js measures its real
 * pace as it goes and stops when the rows left wouldn't fit the time allowed.
 */
export const DRAW_ROUND_MS = 4;
/** The least a child that can't be computed, and never exposed values in a row, is taken to add to it per widget. */
export const UNCOMPUTED_CHILD_BYTES = 1024;
export const UNCOMPUTED_CHILD_CHARS = 1024;
/**
 * How many times over such a child is taken to expose its props: a Table exposes its rows as currentData,
 * currentPageData, filteredData and updatedData.
 */
export const EXPOSED_COPIES = 4;
/**
 * Limits on reading every row: in the background, synchronously (blocking the page), and as JSON (characters: below
 * V8's ~536.8M-character string limit, with room to spare).
 */
export const LIMITS = { backgroundMs: 10000, syncMs: 2000, jsonChars: 500000000 };
/** Bytes a character of the result's JSON takes: a string with a character beyond Latin-1 takes 2 for each. */
export const JSON_BYTES_PER_CHAR = 2;
/** The result's JSON around its rows: {"children":{},"data":{}}. */
export const JSON_WRAPPER_CHARS = 25;

// A row's build is timed until the time taken is TICKS of the smallest step the clock was seen to take, or TIMING_MS
// (at most MAX_READS reads).
const TICKS = 8;
const TIMING_MS = 4;
const MAX_READS = 1000;
// The idle time a row's measuring needs (two timings and its JSON's); less is waited out, up to the idle timeout.
const STEP_MS = 3 * TIMING_MS;
/** A row action wrapper in `children`: a closure and its context (estimateBytes' rule: an object of 4 slots). */
export const FUNCTION_BYTES = estimateBytes({ objects: 1, slots: 4 });
// A batch of rows built in the background holds at most about this (the rows' result).
const BATCH_BYTES = 16 * 1024 * 1024;
const LONGEST = 5;
const FIGURES = ['timeMs', 'jsonMs', 'resultBytes', 'jsonChars', 'widgets'];

const keyOf = (moduleId, listviewId) => `${moduleId}\u0000${listviewId}`;

// Per ListView: { rows, inputs, structure, dataBytes, longest: [{ index, itemBytes, bytes, figures, measured,
// provisional }] (null while scanning), rest (a floor for every other row: what they came to before the 5 changed),
// baseMs (the row scope's time), scan, queued, error }.
const profiles = new Map();
// Per ListView: the unsubscribe of its store watch (profileListview on every store update).
const watches = new Map();

const typeOf = (get, childId, moduleId) => get().getComponentDefinition(childId, moduleId)?.component?.component;

// What the figures depend on besides the rows, each compared by identity: the app's container tree, and its
// definitions (any change to one is a new `pages`).
const inputsOf = (get, moduleId) => {
  const state = get();
  return [state.containerChildrenMapping, state.modules?.[moduleId]?.pages];
};

// What a drawn row mounts and how a row is read: `signature` (every widget in a row and its definition, by identity),
// and `drawnChildren` (the children readRow can't compute: with any, every row is drawn).
const structureOf = (get, listviewId, moduleId) => {
  const state = get();
  const widgets = descendantsOf(get, listviewId, moduleId);
  return {
    signature: [...widgets, ...widgets.map((id) => state.getComponentDefinition(id, moduleId))],
    drawnChildren: state
      .getContainerChildrenMapping(listviewId, moduleId)
      .filter((childId) => !exposureOf(typeOf(get, childId, moduleId))),
  };
};

const sameItems = (a, b) => a.length === b.length && a.every((item, i) => item === b[i]);

// Figures: the larger of each (`a` may be null), and scaled by `ratio`.
const maxFigures = (a, b) => (a ? Object.fromEntries(FIGURES.map((key) => [key, Math.max(a[key], b[key])])) : b);
const scaled = (figures, ratio) =>
  Object.fromEntries(
    FIGURES.map((key) => [key, key.endsWith('Ms') ? figures[key] * ratio : Math.ceil(figures[key] * ratio)])
  );

// Whether a row of the 5 longest is still to be measured (no figures yet, or provisional ones).
const uncalibrated = (entry) => !entry.figures || entry.provisional;

// Until a row that grew to `bytes` is measured again: the most any measured row's figures come to scaled up to its
// size (its own before it grew included). Null while no row is measured.
const provisionalFigures = (longest, bytes) =>
  longest.reduce(
    (figures, entry) =>
      entry.measured
        ? maxFigures(figures, scaled(entry.measured, Math.max(1, bytes / Math.max(1, entry.bytes))))
        : figures,
    null
  );

// What every row but the 5 longest is taken to come to: the most any of them (`figuresOf` each, null: left out) comes
// to per data byte at the 5th's size, and at least `floor`.
const restFiguresOf = (longest, floor, figuresOf = (entry) => entry.figures) => {
  const fifthBytes = longest[longest.length - 1]?.bytes ?? 0;
  return longest.reduce((most, entry) => {
    const figures = figuresOf(entry);
    return figures ? maxFigures(most, scaled(figures, Math.min(1, fifthBytes / Math.max(1, entry.bytes)))) : most;
  }, floor);
};

// A row's data bytes, its changes included, against the 5 longest: true when it is now one of them (to calibrate;
// meanwhile its figures are provisional). What the other rows came to so far stays a floor for them (`rest`): a row
// growing changes the 5 and their sizes, not those rows; and a row that leaves the 5 is one of them.
const rerank = (profile, dataRow, changeBytes) => {
  const { longest, rows } = profile;
  profile.rest = restFiguresOf(longest, profile.rest, (entry) => entry.measured);
  const entry = longest.find(({ index }) => index === dataRow);
  if (entry) {
    const bytes = entry.itemBytes + changeBytes;
    if (bytes <= entry.bytes) return false;
    entry.figures = provisionalFigures(longest, bytes) ?? entry.figures;
    entry.bytes = bytes;
  } else {
    if (dataRow >= rows.length) return false;
    const itemBytes = sizeOf(rows[dataRow]);
    const bytes = itemBytes + changeBytes;
    if (longest.length >= LONGEST && bytes <= longest[longest.length - 1].bytes) return false;
    const figures = provisionalFigures(longest, bytes);
    if (longest.length >= LONGEST) {
      const out = longest.pop();
      if (out.measured) profile.rest = maxFigures(profile.rest, out.measured);
    }
    longest.push({ index: dataRow, itemBytes, bytes, figures, measured: null });
  }
  const changed = longest.find(({ index }) => index === dataRow);
  changed.provisional = true;
  longest.sort((a, b) => b.bytes - a.bytes);
  return true;
};

// The 5 longest rows from a rows profile, with the rows whose changes make them longer.
const rank = (listviewId, moduleId, profile, recorded) => {
  profile.dataBytes = recorded.totalBytes;
  profile.longest = recorded.longest.map(({ index, bytes }) => ({
    index,
    itemBytes: bytes,
    bytes,
    figures: null,
    measured: null,
  }));
  rowChangeSizes(listviewId, moduleId).byRow.forEach((bytes, dataRow) => rerank(profile, dataRow, bytes));
};

// The bytes of the objects withoutFunctions copied (`copy` against `original`): the rest of `copy` is `original`'s.
const copiedBytes = (original, copy) => {
  if (copy === original || copy === null || typeof copy !== 'object') return 0;
  let bytes = OBJECT_BYTES;
  for (const key in copy) bytes += SLOT_BYTES + copiedBytes(original?.[key], copy[key]);
  return bytes;
};

// ms per call of `read`: called until the time taken is TICKS of the smallest step the clock was seen to take between
// two calls (its tick, or a call's time when that is longer), or TIMING_MS (MAX_READS calls at most).
const timeRead = (read) => {
  const start = performance.now();
  let last = start;
  let step = Infinity;
  let reads = 0;
  let elapsed = 0;
  do {
    read();
    reads += 1;
    const now = performance.now();
    if (now > last) step = Math.min(step, now - last);
    last = now;
    elapsed = now - start;
  } while (elapsed < TIMING_MS && elapsed < TICKS * step && reads < MAX_READS);
  return elapsed / reads;
};

/**
 * A row as materialize.js keeps it: `{ row, values, uncomputed }` (`row`: readRow's, frozen; `values`: it without
 * functions, frozen), or null past the end. `base`, `options`: readRow's. Measuring times this very function.
 */
export const buildRow = (get, listviewId, dataRow, moduleId, base = undefined, options = undefined) => {
  const { row, uncomputed } = readRow(get, listviewId, dataRow, moduleId, false, base, options);
  return row ? { row: deepFreeze(row), values: deepFreeze(withoutFunctions(row)), uncomputed } : null;
};

// The rows a ListView is given, as its props resolve them (rows.js listviewRows' rule).
const rowsGiven = (properties = {}) => {
  const data = properties.dataSourceSelector === 'rawJson' ? properties.data : properties.dataSourceSelector;
  return Array.isArray(data) ? data.length : 0;
};

// A row's figures (see the header) as `options` read it: its time, what its result takes in children and data, its
// JSON length, and the widgets it mounts when drawn.
const figuresOf = (get, listviewId, dataRow, moduleId, { rows, structure }, base, options) => {
  let built;
  const build = () => {
    built = buildRow(get, listviewId, dataRow, moduleId, base, options);
  };
  // Built once first: the first read of a row after a load is ~30x a steady one (its bindings compiled, its scope
  // cached), which is what the rows after it cost; timing it would estimate ten times the real pace (5M rows measured).
  build();
  const buildMs = Math.max(timeRead(build), timeRead(build));
  const { row, values, uncomputed } = built;
  let json = '';
  const jsonMs = timeRead(() => {
    json = JSON.stringify(values);
  });
  let functions = 0;
  Object.values(row).forEach((child) =>
    Object.values(child ?? {}).forEach((value) => {
      if (typeof value === 'function') functions += 1;
    })
  );
  // A ListView inside the row mounts its widgets once for each of its rows there.
  const inputs = new Map();
  const inputOf = (childId) => {
    if (!inputs.has(childId)) inputs.set(childId, resolveRowChildInput(get, listviewId, dataRow, childId, moduleId));
    return inputs.get(childId);
  };
  const repeats = (childId) =>
    typeOf(get, childId, moduleId) === 'Listview' ? rowsGiven(inputOf(childId).properties) : 1;
  const shown = new Set(Object.values(row).map((child) => child?.id));
  let unreadBytes = 0;
  let unreadChars = 0;
  uncomputed
    .filter((childId) => !shown.has(childId))
    .forEach((childId) => {
      const props = withoutFunctions(inputOf(childId).properties ?? {});
      const inner = get().getContainerChildrenMapping(childId, moduleId).length;
      const copies = EXPOSED_COPIES * (typeOf(get, childId, moduleId) === 'Listview' ? Math.max(1, inner) : 1);
      const mounted = 1 + repeats(childId) * widgetsMountedIn(get, childId, moduleId, repeats);
      unreadBytes += mounted * UNCOMPUTED_CHILD_BYTES + copies * sizeOf(props);
      unreadChars += mounted * UNCOMPUTED_CHILD_CHARS + copies * (JSON.stringify(props) ?? '').length;
    });
  const drawn = structure.drawnChildren.length > 0;
  const widgets = drawn ? widgetsMountedIn(get, listviewId, moduleId, repeats) : 0;
  return {
    timeMs: buildMs + widgets * DRAW_MS_PER_WIDGET,
    jsonMs,
    // Its entries in children and data, its values (in children; data shares them), and what data copies of them.
    resultBytes: 2 * SLOT_BYTES + sizeOf(row) + functions * FUNCTION_BYTES + copiedBytes(row, values) + unreadBytes,
    // `"<row>":` and a comma around the row's object, in children and in data.
    jsonChars: 2 * (json.length + unreadChars + String(rows.length).length + 4),
    widgets,
  };
};

// A row's figures: as it reads (its changes included) and, when it has changes, as its data alone gives it (a row
// its changes shrink still stands for the rows like it): the larger of each. Also times the row scope a slice builds.
const measureRow = (get, listviewId, dataRow, moduleId, profile) => {
  let base;
  profile.baseMs = Math.max(
    profile.baseMs,
    timeRead(() => {
      base = rowScopeBase(get, listviewId, moduleId);
    })
  );
  const measure = (options) => figuresOf(get, listviewId, dataRow, moduleId, profile, base, options);
  const figures = measure({ headless: true });
  return rowChangesOf(get, listviewId, dataRow, moduleId)
    ? maxFigures(figures, measure({ headless: true, withoutChanges: true }))
    : figures;
};

// Measures the next of the 5 longest rows that needs it: false when none does (or the profile is out of date). The
// profile is brought up to date first, should a store update not have reached it yet. A row measured before (for what
// a row mounts now) keeps the larger of its old and new figures.
const calibrateNext = (get, listviewId, moduleId, profile) => {
  if (profiles.get(keyOf(moduleId, listviewId)) !== profile) return false; // forgotten, or new rows
  if (profileListview(get, null, listviewId, moduleId) !== profile || profile.error) return false;
  const entry = profile.longest?.find(uncalibrated);
  if (!entry) return false;
  try {
    entry.measured = maxFigures(entry.measured, measureRow(get, listviewId, entry.index, moduleId, profile));
    entry.figures = entry.measured;
    entry.provisional = false;
  } catch (error) {
    profile.error = error;
    return false;
  }
  return true;
};

// Measures the rows that need it in the background, a row per idle callback that has room for it.
const scheduleCalibration = (get, listviewId, moduleId, profile) => {
  if (profile.queued || !profile.longest) return;
  profile.queued = true;
  const queue = idleQueue();
  const step = (deadline) => {
    if (deadline && !deadline.didTimeout && deadline.timeRemaining() < STEP_MS) return queue.schedule(step);
    if (calibrateNext(get, listviewId, moduleId, profile)) return queue.schedule(step);
    queue.close();
    profile.queued = false;
  };
  queue.schedule(step);
};

// Rows freezing couldn't profile (frozen before, or a page of them): measured by the same rule, a slice at a time.
const scanRows = (get, listviewId, moduleId, profile) => {
  const scanned = newRowsProfile();
  const { rows } = profile;
  profile.scan = forSliced(rows.length, (i) => addRowToProfile(scanned, i, sizeOf(rows[i])), { inline: false });
  profile.scan.then(() => {
    if (profiles.get(keyOf(moduleId, listviewId)) !== profile) return;
    profile.scan = null;
    rank(listviewId, moduleId, profile, scanned);
    scheduleCalibration(get, listviewId, moduleId, profile);
  });
};

/**
 * Keeps a windowed ListView's profile current: started by setListviewSlots once it has slots, then run on every store
 * update (`subscribe`) until forgetEstimate. New rows are profiled and measured in the background, and measured again
 * when what a row mounts changes (its figures dropped meanwhile). A few identity comparisons when nothing did. Returns
 * the profile, or null for a ListView that draws every row.
 */
export const profileListview = (get, subscribe, listviewId, moduleId = 'canvas') => {
  if (!slotsOf(get, listviewId, moduleId)) return null;
  const key = keyOf(moduleId, listviewId);
  if (subscribe && !watches.has(key)) {
    watches.set(
      key,
      subscribe(() => profileListview(get, null, listviewId, moduleId))
    );
  }
  const rows = listviewRows(get, listviewId, moduleId);
  const inputs = inputsOf(get, moduleId);
  let profile = profiles.get(key);
  if (profile?.rows === rows && sameItems(profile.inputs, inputs)) return profile;
  const structure = structureOf(get, listviewId, moduleId);
  if (profile?.rows !== rows) {
    profile?.scan?.cancel();
    profile = {
      rows,
      inputs,
      structure,
      dataBytes: 0,
      longest: null,
      rest: null,
      baseMs: 0,
      scan: null,
      queued: false,
      error: null,
    };
    profiles.set(key, profile);
    const recorded = rowsProfileOf(rows);
    if (recorded) rank(listviewId, moduleId, profile, recorded);
    else scanRows(get, listviewId, moduleId, profile);
  } else {
    profile.inputs = inputs;
    if (sameItems(profile.structure.signature, structure.signature)) return profile;
    // A widget in its rows was added, removed or edited: the old figures say nothing of the rows now (an Icon added
    // has every row drawn), so they go until the rows are measured again.
    profile.structure = structure;
    profile.error = null;
    profile.rest = null;
    profile.baseMs = 0;
    profile.longest?.forEach((entry) => {
      entry.figures = null;
      entry.measured = null;
      entry.provisional = false;
    });
  }
  scheduleCalibration(get, listviewId, moduleId, profile);
  return profile;
};

/**
 * A row's changes were written (recorded or pruned): their size is kept current (rows.js sizeRowChanges), and a row
 * they make longer than the 5th longest takes its place (and is calibrated).
 */
export const rowChangesWritten = (get, listviewId, dataRow, moduleId = 'canvas') => {
  const bytes = sizeRowChanges(get, listviewId, dataRow, moduleId);
  const profile = profiles.get(keyOf(moduleId, listviewId));
  if (!profile?.longest || profile.rows !== listviewRows(get, listviewId, moduleId)) return;
  if (rerank(profile, dataRow, bytes)) scheduleCalibration(get, listviewId, moduleId, profile);
};

/** Forgets a ListView's profile, and stops watching it (it stopped windowing, or unmounted). */
export const forgetEstimate = (listviewId, moduleId = 'canvas') => {
  const key = keyOf(moduleId, listviewId);
  profiles.get(key)?.scan?.cancel();
  profiles.delete(key);
  watches.get(key)?.();
  watches.delete(key);
};

const SOURCE = /^\{\{\s*(queries\.[\w$]+\.data|variables\.[\w$]+)\s*\}\}$/;

// The data the ListView is bound to, when its binding is just that ({{queries.q.data}}, {{variables.v}}).
const sourceOf = (get, listviewId, moduleId) => {
  const properties = get().getComponentDefinition(listviewId, moduleId)?.component?.definition?.properties ?? {};
  const selector = properties.dataSourceSelector?.value;
  const text = selector === undefined || selector === 'rawJson' ? properties.data?.value : selector;
  return typeof text === 'string' ? (text.trim().match(SOURCE)?.[1] ?? null) : null;
};

// Rows per batch: ~SLICE_MS of work by the time per row (`workMs` over all rows), a batch's result within BATCH_BYTES.
const batchRowsOf = (rows, workMs, rowBytes) => {
  const perRowMs = rows ? workMs / rows : 0;
  const byTime = perRowMs > 0 ? Math.floor(SLICE_MS / perRowMs) : rows;
  const byBytes = rowBytes > 0 ? Math.floor(BATCH_BYTES / rowBytes) : rows;
  return Math.max(1, Math.min(rows, byTime, byBytes));
};

/**
 * What reading every row of the ListView would cost: `{ ready, rows, timeMs, resultBytes, jsonChars, drawnWidgets,
 * batchRows, dataBytes, rowBytes (the largest row's result), drawnChildren (names of the children that need drawing),
 * listview, source, windowed, error }`. `json`: its rows are to be serialized (materialize.js measures each row's JSON
 * as it goes: its time counts). Not `ready` while its rows are still being profiled or measured (it was just given
 * data, or a widget in its rows changed), or when measuring failed (`error`). A ListView that draws every row costs
 * nothing more: its children/data hold every row. Arithmetic only: never reads a row.
 */
export const estimate = (get, listviewId, moduleId = 'canvas', { json = false } = {}) => {
  const current = listviewRows(get, listviewId, moduleId);
  const rows = current.length;
  const result = {
    ready: true,
    rows,
    timeMs: 0,
    resultBytes: 0,
    jsonChars: 0,
    drawnWidgets: 0,
    batchRows: Math.max(1, rows),
    dataBytes: 0,
    rowBytes: 0,
    drawnChildren: [],
    listview: get().getComponentNameFromId(listviewId, moduleId) ?? listviewId,
    source: sourceOf(get, listviewId, moduleId),
    windowed: false,
    error: null,
    json,
  };
  if (!slotsOf(get, listviewId, moduleId)) return result;
  result.windowed = true;
  const profile = profiles.get(keyOf(moduleId, listviewId));
  const longest = profile?.rows === current ? profile.longest : null;
  const unready = { ...result, ready: false, error: profile?.error ?? null };
  if (!longest || longest.some((entry) => !entry.figures)) return unready;
  // Measured for what a row mounts now (a store update the profile hasn't seen yet could have changed it).
  if (
    !sameItems(profile.inputs, inputsOf(get, moduleId)) &&
    !sameItems(profile.structure.signature, structureOf(get, listviewId, moduleId).signature)
  ) {
    return unready;
  }
  const restFigures = restFiguresOf(longest, profile.rest);
  const rest = Math.max(0, rows - longest.length);
  const total = (figure) =>
    longest.reduce((sum, { figures }) => sum + figures[figure], 0) + rest * (restFigures?.[figure] ?? 0);
  const { drawnChildren } = profile.structure;
  const drawn = drawnChildren.length > 0;
  const workMs = total('timeMs') + (json ? total('jsonMs') : 0);
  const rowBytes = Math.max(0, restFigures?.resultBytes ?? 0, ...longest.map(({ figures }) => figures.resultBytes));
  const batchRows = batchRowsOf(rows, workMs, rowBytes);
  // Besides the rows: a render round per batch of drawn rows, or a row scope per slice of computed ones.
  const overheadMs = drawn
    ? Math.ceil(rows / batchRows) * DRAW_ROUND_MS
    : Math.ceil(workMs / SLICE_MS) * profile.baseMs;
  return {
    ...result,
    timeMs: workMs + overheadMs,
    resultBytes: total('resultBytes'),
    jsonChars: total('jsonChars') + JSON_WRAPPER_CHARS,
    drawnWidgets: drawn ? total('widgets') : 0,
    batchRows,
    dataBytes: profile.dataBytes + rowChangeSizes(listviewId, moduleId).total,
    rowBytes,
    drawnChildren: drawnChildren.map((childId) => get().getComponentNameFromId(childId, moduleId) ?? childId),
  };
};

// ─── Deciding ───────────────────────────────────────────────────────────────────────────────────────────────────────

export class MaterializationError extends Error {
  constructor(reason, message, estimate) {
    super(message);
    this.name = 'MaterializationError';
    this.reason = reason;
    this.estimate = estimate;
  }
}

const count = (n) => n.toLocaleString('en-US');
// Rounded up: an estimate over a limit never reads as the limit.
const seconds = (ms) => `${ms >= 10000 ? count(Math.ceil(ms / 1000)) : Math.ceil(ms / 100) / 10} s`;
const millions = (n) => `${count(Math.round(n / 1e6))} million`;
const has = (est) => `${est.listview} has ${count(est.rows)} rows`;
const instead = (est) => `Use its source data instead${est.source ? ` (${est.source})` : ''}.`;

/** The bytes reading every row needs: its result, and (`json`) the JSON string made of it while it is alive. */
export const bytesNeeded = (est, json = false) => est.resultBytes + (json ? JSON_BYTES_PER_CHAR * est.jsonChars : 0);

/** The refusal when the rows' result (`bytes` of it still to build) no longer fits in the tab's free memory. */
export const memoryRefusal = (est, bytes = est.resultBytes, free = headroom(), json = false) => ({
  ok: false,
  reason: 'memory',
  message:
    `${has(est)}: reading all of its data${json ? ' as JSON' : ''} needs about ${formatBytes(bytes)}, more than the ` +
    `${formatBytes(Math.max(0, free))} this tab has free. ${instead(est)}`,
});

/**
 * The refusal when reading every row takes `ms` (`paced`: at the pace a read in progress has kept so far), more than
 * the time allowed in `mode`.
 */
export const timeRefusal = (est, ms, mode = 'background', paced = false) => {
  const sync = mode === 'sync';
  const limit = sync ? LIMITS.syncMs : LIMITS.backgroundMs;
  return {
    ok: false,
    reason: 'time',
    message:
      `${has(est)}: reading all of its data ${paced ? 'is taking longer than estimated: at its pace so far it ' : ''}` +
      `takes about ${seconds(ms)}, more than the ${seconds(limit)} allowed${sync ? ' synchronously' : ''}. ` +
      instead(est),
  };
};

/** The refusal when the rows' JSON comes to `chars` characters, more than LIMITS.jsonChars. */
export const sizeRefusal = (est, chars = est.jsonChars) => ({
  ok: false,
  reason: 'size',
  message:
    `${has(est)}: all of its data as JSON comes to about ${millions(chars)} characters, more than the ` +
    `${millions(LIMITS.jsonChars)} allowed (a string holds at most about 536 million). ${instead(est)}`,
});

/**
 * Whether every row of a ListView can be read (`est`: estimate()), in the background (`mode: 'background'`, up to
 * LIMITS.backgroundMs) or at once (`'sync'`, up to LIMITS.syncMs, computed rows only: drawing needs React commits),
 * within the tab's free memory (memory.js headroom: its reserve is the margin; for JSON, its string too), and as JSON
 * (`json`) under LIMITS.jsonChars. `{ ok: true, batchRows }` (rows per batch: ~SLICE_MS of work by the measured time
 * per row, a batch's result within BATCH_BYTES), else `{ ok: false, reason: 'not-ready' | 'needs-drawing' | 'time' |
 * 'memory' | 'size', message }`.
 */
export const decide = (est, { mode = 'background', json = false } = {}) => {
  const sync = mode === 'sync';
  const refuse = (reason, message) => ({ ok: false, reason, message });
  if (!est.ready) {
    return refuse(
      'not-ready',
      est.error
        ? `${est.listview}'s ${count(est.rows)} rows couldn't be measured: ${est.error.message}. ${instead(est)}`
        : `${est.listview}'s ${count(est.rows)} rows are still being measured. Try again in a moment, or use its ` +
            `source data instead${est.source ? ` (${est.source})` : ''}.`
    );
  }
  if (sync && est.drawnWidgets > 0) {
    return refuse(
      'needs-drawing',
      `${has(est)}: ${est.drawnChildren.join(', ')} can only be read by drawing each row, which can't be done ` +
        `synchronously. Read its rows in the background (await the result), or use its source data instead` +
        `${est.source ? ` (${est.source})` : ''}.`
    );
  }
  if (est.timeMs > (sync ? LIMITS.syncMs : LIMITS.backgroundMs)) return timeRefusal(est, est.timeMs, mode);
  const free = headroom();
  const needed = bytesNeeded(est, json);
  if (needed > free) return memoryRefusal(est, needed, free, json);
  if (json && est.jsonChars >= LIMITS.jsonChars) return sizeRefusal(est);
  return { ok: true, batchRows: est.batchRows ?? batchRowsOf(est.rows, est.timeMs, est.rowBytes) };
};
