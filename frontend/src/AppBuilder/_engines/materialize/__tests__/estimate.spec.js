/**
 * Estimating what reading every row of a long ListView costs (../estimate.js), and the rows profile freezing records
 * for it (data/freeze.js rowsProfileOf).
 */
import { deepFreeze, deepFreezeInSlices, footprintOf, rowsProfileOf, sizeOf } from '@/AppBuilder/_engines/data/freeze';
import { estimateBytes } from '@/AppBuilder/_engines/data/memory';
import { withoutFunctions } from '@/_helpers/appUtils';
import {
  decide,
  DRAW_MS_PER_WIDGET,
  DRAW_ROUND_MS,
  estimate,
  EXPOSED_COPIES,
  forgetEstimate,
  FUNCTION_BYTES,
  LIMITS,
  MaterializationError,
  profileListview,
  rowChangesWritten,
  UNCOMPUTED_CHILD_BYTES,
  UNCOMPUTED_CHILD_CHARS,
} from '../estimate';
import { materializeAll } from '../materialize';
import { forgetListviewRows, listviewRows, readRow, resolveRowChildInput, slotsOf } from '../rows';

jest.mock('../rows', () => ({
  ...jest.requireActual('../rows'),
  readRow: jest.fn(),
  resolveRowChildInput: jest.fn(),
  rowScopeBase: jest.fn(() => ({})),
  listviewRows: jest.fn(),
  slotsOf: jest.fn(),
}));

// What freezing a value costs on the test clock (ms), when a test sets it.
let mockFreezeMs = 0;
jest.mock('@/AppBuilder/_engines/data/freeze', () => {
  const actual = jest.requireActual('@/AppBuilder/_engines/data/freeze');
  return {
    ...actual,
    deepFreeze: (value) => {
      mockAdvance(mockFreezeMs);
      return actual.deepFreeze(value);
    },
  };
});
const mockAdvance = (ms) => {
  clock += ms;
};

const MB = 1024 * 1024;
const GB = 1024 * MB;
const setMemory = (memory) => Object.defineProperty(performance, 'memory', { value: memory, configurable: true });
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const until = async (done) => {
  for (let i = 0; i < 100 && !done(); i++) await tick();
};

// ─── Rows profile (freeze.js) ───────────────────────────────────────────────────────────────────────────────────────

// { id, name } with a name of `chars` characters: 1 object, 2 slots.
const itemBytes = (chars) => estimateBytes({ objects: 1, slots: 2, chars });
const sizes = Array.from({ length: 2000 }, (_, i) => (i * 7919) % 500);
const makeRows = () => sizes.map((chars, id) => ({ id, name: 'x'.repeat(chars) }));
const top5 = () =>
  sizes
    .map((chars, index) => ({ index, bytes: itemBytes(chars) }))
    .sort((a, b) => b.bytes - a.bytes || a.index - b.index)
    .slice(0, 5);
const totalOf = () => sizes.reduce((sum, chars) => sum + itemBytes(chars), 0);
// The profile of `rows` by sizeOf, item by item: what freezing them must have recorded.
const profileBySizeOf = (rows) => {
  const items = rows.map((row, index) => ({ index, bytes: sizeOf(row) }));
  return {
    totalBytes: items.reduce((sum, { bytes }) => sum + bytes, 0),
    longest: items.sort((a, b) => b.bytes - a.bytes || a.index - b.index).slice(0, 5),
  };
};
// Rows like makeRows', with a long array in row 3 and an object with a long string deep in row 1700.
const makeNestedRows = () => {
  const rows = makeRows();
  rows[3] = { id: 3, inner: Array.from({ length: 1500 }, (_, i) => `ab${i}`) };
  rows[1700] = { id: 1700, deep: { list: [{ text: 'y'.repeat(3000) }] } };
  return rows;
};

describe('rowsProfileOf', () => {
  test('deepFreeze records each long array: total of its items, and its 5 largest, largest first', () => {
    const rows = makeRows();
    deepFreeze({ rows });
    expect(rowsProfileOf(rows)).toEqual({ totalBytes: totalOf(), longest: top5() });
    const nested = makeNestedRows();
    deepFreeze(nested);
    expect(rowsProfileOf(nested)).toEqual(profileBySizeOf(nested));
    expect(
      rowsProfileOf(nested)
        .longest.slice(0, 2)
        .map(({ index }) => index)
    ).toEqual([3, 1700]);
    expect(rowsProfileOf(nested[3].inner)).toEqual(profileBySizeOf(nested[3].inner));
  });

  test('deepFreezeInSlices records the same, its walk resumed across slices (an item holding a long array too)', async () => {
    let now = 0;
    // Every slice ends at its first check: the walk stops and resumes every 1024 items, inside row 3's array too.
    const clock = jest.spyOn(performance, 'now').mockImplementation(() => (now += 1000));
    const rows = makeNestedRows();
    const pending = deepFreezeInSlices([rows, { other: 1 }]);
    expect(pending).toBeInstanceOf(Promise);
    await pending;
    expect(clock.mock.calls.length).toBeGreaterThan(4);
    clock.mockRestore();
    expect(Object.isFrozen(rows) && Object.isFrozen(rows[3].inner) && Object.isFrozen(rows[1700].deep.list[0])).toBe(
      true
    );
    expect(rowsProfileOf(rows)).toEqual(profileBySizeOf(rows));
    expect(
      rowsProfileOf(rows)
        .longest.slice(0, 2)
        .map(({ index }) => index)
    ).toEqual([3, 1700]);
    expect(rowsProfileOf(rows[3].inner)).toEqual(profileBySizeOf(rows[3].inner));
  });

  test('long arrays of strings and numbers: the same profile, by deepFreeze and deepFreezeInSlices', async () => {
    const strings = () => Array.from({ length: 3000 }, (_, i) => 's'.repeat((i * 7919) % 300));
    const numbers = () => Array.from({ length: 3000 }, (_, i) => i * 1.5);
    const mixed = () => strings().map((item, i) => (i % 3 === 0 ? i : i % 3 === 1 ? item : { item }));
    for (const make of [strings, numbers, mixed]) {
      const frozen = make();
      deepFreeze({ frozen });
      expect(rowsProfileOf(frozen)).toEqual(profileBySizeOf(frozen));
      const sliced = make();
      await deepFreezeInSlices({ sliced });
      expect(rowsProfileOf(sliced)).toEqual(profileBySizeOf(sliced));
    }
    // Numbers count nothing: the first 5 are the largest.
    const all = numbers();
    deepFreeze(all);
    expect(rowsProfileOf(all).longest.map(({ index }) => index)).toEqual([0, 1, 2, 3, 4]);
  });

  test('no profile for a short array, one frozen before, or one holding an object frozen before at any depth', async () => {
    const short = deepFreeze(makeRows().slice(0, 1000));
    const before = Object.freeze(makeRows());
    deepFreeze({ before });
    const holding = makeRows();
    holding[10] = deepFreeze({ id: 10 });
    deepFreeze(holding);
    // Frozen deeper inside a row: freezing counted nothing of it, so its row would read too small.
    const deep = makeRows();
    deep[1500] = { id: 1500, payload: Object.freeze({ text: 'x'.repeat(100000) }) };
    deepFreeze(deep);
    const sliced = makeRows();
    sliced[1500] = { id: 1500, payload: Object.freeze({ text: 'x'.repeat(100000) }) };
    await deepFreezeInSlices({ sliced });
    expect(rowsProfileOf(short)).toBeUndefined();
    expect(rowsProfileOf(before)).toBeUndefined();
    expect(rowsProfileOf(holding)).toBeUndefined();
    expect(rowsProfileOf(deep)).toBeUndefined();
    expect(rowsProfileOf(sliced)).toBeUndefined();
  });

  test('footprintOf is what freezing counted, the long arrays included', async () => {
    const rows = makeNestedRows();
    const value = { rows, name: 'abc' };
    await deepFreezeInSlices(value);
    expect(footprintOf(value)).toBe(sizeOf(value));
  });
});

// ─── estimate() ─────────────────────────────────────────────────────────────────────────────────────────────────────

// A store with one windowed ListView lv1 (text1 in every row; or an Icon too) over `rows`. `get.subscribe` and
// `get.notify()` stand in for the store's subscription; `get.setChildren(lv1's, { container: its children })`.
const makeStore = ({ binding = '{{queries.restapi1.data}}', icon = false } = {}) => {
  const definitions = {
    lv1: {
      component: {
        component: 'Listview',
        definition: { properties: { dataSourceSelector: { value: 'rawJson' }, data: { value: binding } } },
      },
    },
    txt1: { component: { component: 'Text' } },
    ico1: { component: { component: 'Icon' } },
    ctr1: { component: { component: 'Container' } },
    lv2: { component: { component: 'Listview' } },
    in1: { component: { component: 'Text' } },
    in2: { component: { component: 'Text' } },
    in3: { component: { component: 'Button' } },
  };
  const names = { lv1: 'listview1', txt1: 'text1', ico1: 'icon1', ctr1: 'container1', lv2: 'listview2' };
  const state = {
    definitions,
    containerChildrenMapping: { lv1: icon ? ['txt1', 'ico1'] : ['txt1'] },
    modules: { canvas: { pages: [] } },
    resolvedStore: { modules: { canvas: { listviewRowChanges: { lv1: {} }, exposedValues: { variables: {} } } } },
    getContainerChildrenMapping: (id) => state.containerChildrenMapping[id] ?? [],
    getComponentDefinition: (id) => state.definitions[id],
    getComponentNameFromId: (id) => names[id],
  };
  const listeners = new Set();
  const get = () => state;
  get.subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  get.notify = () => listeners.forEach((listener) => listener());
  get.listeners = listeners;
  get.setChildren = (children, nested = {}) => {
    state.containerChildrenMapping = { lv1: children, ...nested };
  };
  return get;
};

// Row i takes its text's length / 10 ms to read (`msPerChar`), and reads as { text1: { text, setText, id } } (with its
// changes, unless read without them); an Icon, a Container or an inner ListView can't be computed, and has exposed
// nothing (`shown`: the rows where the Icon did, as `{ isVisible, click }`).
let clock = 0;
const readAs =
  (get, rows, { msPerChar = 0.1, shown = [] } = {}) =>
  (_get, _lv, dataRow, _moduleId, _keep, _base, options = {}) => {
    const changed = get().resolvedStore.modules.canvas.listviewRowChanges.lv1[dataRow]?.txt1?.values.text;
    const text = (options.withoutChanges ? undefined : changed) ?? rows[dataRow].name;
    clock += text.length * msPerChar;
    const uncomputed = get()
      .getContainerChildrenMapping('lv1')
      .filter((id) => ['ico1', 'ctr1', 'lv2'].includes(id));
    const row = { text1: { text, setText: () => {}, id: 'txt1' } };
    if (shown.includes(dataRow) && uncomputed.includes('ico1'))
      row.icon1 = { isVisible: true, click: () => {}, id: 'ico1' };
    return { row, uncomputed, computed: null };
  };

// What a row reading as { text1: { text, setText, id } } takes in the result, worked out from the objects themselves:
// `children[row]` holds the row, `data[row]` its copy without functions (which shares its strings); a closure for
// setText. Its JSON: the row in children and in data, under a key as long as the row count, and a comma after each.
const figure = (text, rowCount, timeMs = text.length / 10) => {
  const row = { text1: { text, setText: () => {}, id: 'txt1' } };
  const values = withoutFunctions(row);
  const shared = text.length + 'txt1'.length;
  const key = String(rowCount);
  return {
    timeMs,
    resultBytes: sizeOf({ children: row, data: values }) - estimateBytes({ objects: 1 }) - shared + FUNCTION_BYTES,
    jsonChars:
      JSON.stringify({ children: { [key]: row }, data: { [key]: values } }).length -
      JSON.stringify({ children: {}, data: {} }).length +
      2,
  };
};
// The estimate's arithmetic over rows' figures (`figures[i]` for row i's text): the 5 longest by data bytes, and for
// every other row the most any of them comes to per data byte at the 5th's size, or what `floor` (rows that left the 5)
// came to. {"children":{},"data":{}} around the rows.
const formula = (texts, figures, { bytesOf = (i) => sizeOf({ id: i, name: texts[i] }), floor = null } = {}) => {
  const order = texts
    .map((_, index) => ({ f: figures[index], index, bytes: bytesOf(index) }))
    .sort((a, b) => b.bytes - a.bytes || a.index - b.index)
    .slice(0, 5);
  const fifthBytes = order[order.length - 1]?.bytes ?? 0;
  const rest = Math.max(0, texts.length - order.length);
  const restOf = (key) =>
    Math.max(
      floor?.[key] ?? 0,
      ...order.map(({ f, bytes }) => {
        const value = f[key] * Math.min(1, fifthBytes / bytes);
        return key === 'timeMs' ? value : Math.ceil(value);
      })
    );
  const total = (key) => order.reduce((sum, { f }) => sum + f[key], 0) + rest * restOf(key);
  return {
    timeMs: total('timeMs'),
    resultBytes: total('resultBytes'),
    jsonChars: total('jsonChars') + 25,
    rest: { timeMs: restOf('timeMs'), resultBytes: restOf('resultBytes'), jsonChars: restOf('jsonChars') },
  };
};
const expected = (texts) =>
  formula(
    texts,
    texts.map((text) => figure(text, texts.length))
  );

const setup = (texts, options) => {
  const get = makeStore(options);
  const rows = texts.map((name, id) => ({ id, name }));
  if (rows.length > 1024) deepFreeze(rows);
  listviewRows.mockReturnValue(rows);
  slotsOf.mockReturnValue([0, 1, 2]);
  readRow.mockImplementation(readAs(get, rows, options));
  return { get, rows };
};

const ready = async (get) => {
  profileListview(get, get.subscribe, 'lv1');
  await until(() => estimate(get, 'lv1').ready);
  return estimate(get, 'lv1');
};

const writeChange = (get, dataRow, text) => {
  get().resolvedStore.modules.canvas.listviewRowChanges.lv1[dataRow] = {
    txt1: { values: { text }, basis: {}, replay: [] },
  };
  rowChangesWritten(get, 'lv1', dataRow);
};

const expectAtLeast = (estimated, floor) => {
  expect(estimated.timeMs).toBeGreaterThanOrEqual(floor.timeMs - 1e-6);
  expect(estimated.resultBytes).toBeGreaterThanOrEqual(floor.resultBytes);
  expect(estimated.jsonChars).toBeGreaterThanOrEqual(floor.jsonChars);
};

describe('estimate', () => {
  beforeEach(() => {
    clock = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => clock);
    resolveRowChildInput.mockImplementation(() => ({ properties: {} }));
  });
  afterEach(() => {
    forgetEstimate('lv1');
    forgetListviewRows('lv1', 'canvas');
    jest.restoreAllMocks();
    readRow.mockReset();
    mockFreezeMs = 0;
  });

  test('the 5 longest rows, plus for every other row the most one of them comes to at the 5th’s size; ready once calibrated', async () => {
    const texts = sizes.map((chars) => 'y'.repeat(chars));
    const { get } = setup(texts);
    expect(profileListview(get, get.subscribe, 'lv1')).not.toBeNull();
    expect(estimate(get, 'lv1').ready).toBe(false);
    const est = await ready(get);
    expect(est).toMatchObject({ ready: true, rows: 2000, drawnWidgets: 0, listview: 'listview1', windowed: true });
    expect(est.timeMs).toBeCloseTo(expected(texts).timeMs, 6);
    expect(est.resultBytes).toBe(expected(texts).resultBytes);
    expect(est.jsonChars).toBe(expected(texts).jsonChars);
    // Never below the 5th's own figure for every other row (the spec's bound).
    const fifth = figure(texts[top5()[4].index], 2000);
    expect(est.resultBytes).toBeGreaterThanOrEqual(
      top5().reduce((sum, { index }) => sum + figure(texts[index], 2000).resultBytes, 0) + 1995 * fifth.resultBytes
    );
    // Calibration read only the 5 longest (each read takes longer than a timing: twice each).
    expect(new Set(readRow.mock.calls.map((call) => call[2]))).toEqual(new Set(top5().map(({ index }) => index)));
    expect(readRow).toHaveBeenCalledTimes(10);
  });

  test('with fewer than 5 rows, the sum of all (rows frozen before are scanned first)', async () => {
    const texts = ['a', 'bbbbbbbbbb', 'cc'];
    const { get } = setup(texts);
    const est = await ready(get);
    expect(est.rows).toBe(3);
    expect(est.resultBytes).toBe(texts.reduce((sum, text) => sum + figure(text, 3).resultBytes, 0));
    expect(est.jsonChars).toBe(texts.reduce((sum, text) => sum + figure(text, 3).jsonChars, 0) + 25);
    expect(est.timeMs).toBeCloseTo(1.3, 6);
  });

  test('its time is building the row as materializeAll does: freezing it and its copy counts', async () => {
    const texts = Array.from({ length: 2000 }, () => 'y'.repeat(100));
    const { get } = setup(texts);
    // Each freeze takes 1 ms: a row costs its read (10 ms) and two freezes (the row, its copy without functions).
    mockFreezeMs = 1;
    const est = await ready(get);
    expect(est.timeMs).toBeCloseTo(2000 * (10 + 2), 6);
  });

  test('rows frozen before are scanned in the background, a slice at a time: not ready until the scan ends', async () => {
    const texts = sizes.map((chars) => 'y'.repeat(chars));
    const get = makeStore();
    const rows = Object.freeze(texts.map((name, id) => Object.freeze({ id, name })));
    listviewRows.mockReturnValue(rows);
    slotsOf.mockReturnValue([0]);
    readRow.mockImplementation(readAs(get, rows));
    expect(rowsProfileOf(rows)).toBeUndefined();
    // Every clock read moves 5 ms: a slice of the scan ends after about 512 rows.
    performance.now.mockImplementation(() => (clock += 5));
    const profile = profileListview(get, get.subscribe, 'lv1');
    const states = [];
    while (profile.scan) {
      states.push(estimate(get, 'lv1').ready);
      await tick();
    }
    expect(states.length).toBeGreaterThan(2);
    expect(states.every((isReady) => !isReady)).toBe(true);
    expect(readRow).not.toHaveBeenCalled();
    const est = await ready(get);
    expect(est.dataBytes).toBe(profileBySizeOf(rows).totalBytes);
    expect(new Set(readRow.mock.calls.map((call) => call[2]))).toEqual(new Set(top5().map(({ index }) => index)));
  });

  test('a row is timed over many reads: a coarse timer (1 ms ticks) still gives its time', async () => {
    const texts = Array.from({ length: 2000 }, () => 'y'.repeat(150));
    // 15 µs a read, on a clock that only moves in whole milliseconds (Firefox, Safari).
    const { get } = setup(texts, { msPerChar: 0.0001 });
    performance.now.mockImplementation(() => Math.floor(clock));
    const est = await ready(get);
    expect(est.timeMs).toBeGreaterThan(2000 * 0.015 * 0.7);
    expect(est.timeMs).toBeLessThan(2000 * 0.015 * 1.5);
    // Batches of about 8 ms of rows.
    expect(decide(est).batchRows).toBeGreaterThan(8 / 0.015 / 1.5);
    expect(decide(est).batchRows).toBeLessThan(8 / 0.015 / 0.7);
  });

  test('a row is read only as often as the timer needs: about 50 times on 0.1 ms ticks, a few on a fine one', async () => {
    const texts = Array.from({ length: 2000 }, () => 'y'.repeat(150));
    // 15 µs a read on Chrome's 0.1 ms ticks: 8 ticks take about 54 reads, twice a row.
    const chrome = setup(texts, { msPerChar: 0.0001 });
    performance.now.mockImplementation(() => Math.floor(clock * 10) / 10);
    const coarse = await ready(chrome.get);
    expect(readRow.mock.calls.length).toBeLessThanOrEqual(5 * 2 * 70);
    expect(coarse.timeMs).toBeGreaterThan(2000 * 0.015 * 0.85);
    expect(coarse.timeMs).toBeLessThan(2000 * 0.015 * 1.2);
    forgetEstimate('lv1');
    readRow.mockClear();
    // A clock as fine as a read (cross-origin isolated): 8 reads a timing.
    const fine = setup(texts, { msPerChar: 0.0001 });
    performance.now.mockImplementation(() => clock);
    const exact = await ready(fine.get);
    expect(readRow.mock.calls.length).toBeLessThanOrEqual(5 * 2 * 10);
    expect(exact.timeMs).toBeCloseTo(2000 * 0.015, 3);
  });

  test('measured only in an idle period with room for it (or once the idle timeout has passed)', async () => {
    let remaining = 0;
    let timedOut = false;
    const idle = jest.fn((callback) =>
      setTimeout(() => callback({ timeRemaining: () => remaining, didTimeout: timedOut }), 0)
    );
    global.requestIdleCallback = idle;
    global.cancelIdleCallback = clearTimeout;
    try {
      const { get } = setup(sizes.map((chars) => 'y'.repeat(chars)));
      profileListview(get, get.subscribe, 'lv1');
      await until(() => idle.mock.calls.length > 5);
      // Idle periods too short: waited out, nothing read.
      expect(readRow).not.toHaveBeenCalled();
      remaining = 50;
      await until(() => estimate(get, 'lv1').ready);
      expect(estimate(get, 'lv1').ready).toBe(true);
      // A page that is never idle long enough: measured once the timeout has passed.
      forgetEstimate('lv1');
      readRow.mockClear();
      remaining = 0;
      timedOut = true;
      await ready(get);
      expect(readRow).toHaveBeenCalledTimes(10);
    } finally {
      delete global.requestIdleCallback;
      delete global.cancelIdleCallback;
    }
  });

  test('a row its changes make longer takes the 5th place; one they shrink keeps its old figure', async () => {
    const texts = sizes.map((chars) => 'y'.repeat(chars));
    const { get } = setup(texts);
    const before = await ready(get);

    readRow.mockClear();
    writeChange(get, 1, 'z'.repeat(5000)); // row 1 is small: now the longest
    // Still ready: until row 1 is calibrated, its figures are the longest row's scaled up by its size.
    const provisional = estimate(get, 'lv1');
    expect(provisional.ready).toBe(true);
    expect(readRow).not.toHaveBeenCalled();
    await until(() => !profileListview(get, null, 'lv1').queued);
    const grown = estimate(get, 'lv1');
    expect(provisional.resultBytes).toBeGreaterThanOrEqual(grown.resultBytes);
    // Read with its changes, and as its data alone gives it.
    expect(readRow.mock.calls.map((call) => [call[2], !!call[6]?.withoutChanges])).toEqual([
      [1, false],
      [1, false],
      [1, true],
      [1, true],
    ]);
    // Row 1 joins the 5 by its data and changes; the old 5th leaves them, its figure a floor for the other rows.
    const fifthBefore = top5()[4].index;
    const figures = texts.map((text) => figure(text, 2000));
    figures[1] = figure('z'.repeat(5000), 2000);
    const bytesOf = (i) => sizeOf({ id: i, name: texts[i] }) + (i === 1 ? sizeOf({ text: 'z'.repeat(5000) }) : 0);
    // The floor: what the old 5th came to, and what every other row came to before (it can't go down).
    const old = figure(texts[fifthBefore], 2000);
    const { rest } = expected(texts);
    const floor = Object.fromEntries(Object.keys(rest).map((key) => [key, Math.max(old[key], rest[key])]));
    const want = formula(texts, figures, { bytesOf, floor });
    expect(grown.resultBytes).toBe(want.resultBytes);
    expect(grown.jsonChars).toBe(want.jsonChars);
    expect(grown.timeMs).toBeCloseTo(want.timeMs, 6);
    expect(grown.dataBytes).toBe(before.dataBytes + sizeOf({ text: 'z'.repeat(5000) }));
    expectAtLeast(grown, before);

    readRow.mockClear();
    writeChange(get, 1, 'short');
    const shrunk = estimate(get, 'lv1');
    expect(shrunk.ready).toBe(true);
    expect(readRow).not.toHaveBeenCalled();
    expect(shrunk.resultBytes).toBe(grown.resultBytes);
    expect(shrunk.dataBytes).toBe(before.dataBytes + sizeOf({ text: 'short' }));
  });

  test('the 5 longest shortened by their changes: the estimate keeps their old figures, after a reload or an edit too', async () => {
    // Rows 0-4 are the longest (1000-996 characters), every other row 900.
    const texts = Array.from({ length: 2000 }, (_, i) => 'y'.repeat(i < 5 ? 1000 - i : 900));
    const { get, rows } = setup(texts);
    const before = await ready(get);
    // The unchanged rows alone come to this.
    const unchanged = figure('y'.repeat(900), 2000);
    const floor = { timeMs: 1995 * unchanged.timeMs, resultBytes: 1995 * unchanged.resultBytes, jsonChars: 0 };

    [0, 1, 2, 3, 4].forEach((dataRow) => writeChange(get, dataRow, 'short'));
    await until(() => !profileListview(get, null, 'lv1').queued);
    const changed = estimate(get, 'lv1');
    expect(changed.ready).toBe(true);
    expectAtLeast(changed, before);
    expectAtLeast(changed, floor);

    // Its data reloaded (the same rows, a new array): its rows with changes are measured as their data gives them too.
    const reloaded = Object.freeze(rows.slice()); // frozen before: scanned
    listviewRows.mockReturnValue(reloaded);
    readRow.mockImplementation(readAs(get, reloaded));
    get.notify();
    await until(() => estimate(get, 'lv1').ready);
    expectAtLeast(estimate(get, 'lv1'), before);

    // A child's definition edited: every row measured again, the same way.
    get().definitions = { ...get().definitions, txt1: { component: { component: 'Text' } } };
    get().modules = { canvas: { pages: [] } };
    get.notify();
    expect(estimate(get, 'lv1').ready).toBe(false);
    await until(() => estimate(get, 'lv1').ready);
    expectAtLeast(estimate(get, 'lv1'), before);
    expect(decide(estimate(get, 'lv1'), { mode: 'sync' }).reason).toBe('time');
  });

  test('a row measured again keeps the larger of its figures: a faster read the second time lowers nothing', async () => {
    const texts = sizes.map((chars) => 'y'.repeat(chars));
    const { get, rows } = setup(texts);
    const before = await ready(get);
    // The longest row now reads 10 times faster, and its changes make it longer: measured again.
    readRow.mockImplementation(readAs(get, rows, { msPerChar: 0.01 }));
    writeChange(get, top5()[0].index, 'y'.repeat(sizes[top5()[0].index]));
    await until(() => !profileListview(get, null, 'lv1').queued);
    expectAtLeast(estimate(get, 'lv1'), before);
  });

  test('a row of the 5 whose changes only make its size larger leaves what every other row comes to as it was', async () => {
    // Row 0 is the longest and reads slowest per byte; the others read 0.1 ms a character.
    const texts = Array.from({ length: 2000 }, (_, i) => 'y'.repeat(i < 5 ? 1000 - i : 900));
    const { get, rows } = setup(texts);
    const read = readAs(get, rows);
    readRow.mockImplementation((...args) => {
      const result = read(...args);
      if (args[2] === 0) clock += 50;
      return result;
    });
    const before = await ready(get);
    // Its text replaced by one as long: it reads the same, its data and changes count twice its size.
    writeChange(get, 0, 'z'.repeat(1000));
    await until(() => !profileListview(get, null, 'lv1').queued);
    const after = estimate(get, 'lv1');
    expect(after.ready).toBe(true);
    expectAtLeast(after, before);
  });

  test('a row that grows past the 5th: the row it pushes out stays a floor for every other row', async () => {
    // Rows 0-4 are the longest; row 3 reads fast, row 4 (the 5th) slowly; the others are short.
    const texts = Array.from({ length: 2000 }, (_, i) => 'y'.repeat(i < 5 ? 1000 - i : 10));
    const { get, rows } = setup(texts);
    const read = readAs(get, rows, { msPerChar: 0.0001 });
    readRow.mockImplementation((...args) => {
      const result = read(...args);
      if (args[2] === 4) clock += 10;
      return result;
    });
    const before = await ready(get);
    writeChange(get, 10, 'z'.repeat(2000)); // row 10 joins the 5, row 4 leaves them
    await until(() => !profileListview(get, null, 'lv1').queued);
    const grown = estimate(get, 'lv1');
    expect(grown.ready).toBe(true);
    // Every other row (row 4 among them) still costs at least row 4's 10 ms, not the new 5th's (row 3: 0.1 ms); only
    // row 10's own figure is its measured one now.
    expect(before.timeMs).toBeGreaterThan(1995 * 10);
    expect(grown.timeMs).toBeGreaterThan(1995 * 10);
    expect(grown.timeMs).toBeGreaterThan(before.timeMs - 10.2);
  });

  test('a row that grows keeps the higher of its own figures and the longest row’s, scaled to its size', async () => {
    // Row 0 is the longest and reads fast; row 1, a little shorter, reads 1000 times slower.
    const texts = Array.from({ length: 2000 }, (_, i) => 'y'.repeat(i === 0 ? 1000 : i === 1 ? 990 : 10));
    const { get, rows } = setup(texts);
    const read = readAs(get, rows, { msPerChar: 0.00001 });
    readRow.mockImplementation((...args) => {
      const result = read(...args);
      if (args[2] === 1) clock += 10;
      return result;
    });
    const before = await ready(get);
    readRow.mockImplementation(() => new Promise(() => {})); // not measured again in this test
    get().resolvedStore.modules.canvas.listviewRowChanges.lv1[1] = {
      txt1: { values: { text: 'z' }, basis: {}, replay: [] },
    };
    rowChangesWritten(get, 'lv1', 1);
    const grown = estimate(get, 'lv1');
    expect(grown.ready).toBe(true);
    expectAtLeast(grown, before);
  });

  test('never touches a row: arithmetic over the profile, even for rows it has not profiled yet', async () => {
    const watched = (target, touched) =>
      new Proxy(target, {
        get: (array, key, receiver) => {
          if (typeof key === 'string' && /^\d+$/.test(key)) touched.add(Number(key));
          return Reflect.get(array, key, receiver);
        },
      });
    const touched = new Set();
    const target = sizes.map((chars, id) => ({ id, name: 'y'.repeat(chars) }));
    const rows = watched(target, touched);
    deepFreeze(rows);
    const get = makeStore();
    listviewRows.mockReturnValue(rows);
    slotsOf.mockReturnValue([0]);
    readRow.mockImplementation(readAs(get, target));
    await ready(get);
    expect(rowsProfileOf(rows)).toBeDefined();

    touched.clear();
    readRow.mockClear();
    performance.now.mockRestore();
    const start = performance.now();
    for (let i = 0; i < 100; i++) estimate(get, 'lv1');
    expect((performance.now() - start) / 100).toBeLessThan(1);
    expect(touched.size).toBe(0);
    expect(readRow).not.toHaveBeenCalled();

    // New rows, with changes recorded, that the ListView hasn't profiled yet: not ready, and still nothing read.
    const changes = get().resolvedStore.modules.canvas.listviewRowChanges.lv1;
    Array.from({ length: 50 }, (_, i) => i * 37).forEach((dataRow) => {
      changes[dataRow] = { txt1: { values: { text: 'z'.repeat(dataRow) }, basis: {}, replay: [] } };
      rowChangesWritten(get, 'lv1', dataRow);
    });
    const newTouched = new Set();
    const newRows = watched(Object.freeze(target.slice()), newTouched);
    listviewRows.mockReturnValue(newRows);
    expect(estimate(get, 'lv1').ready).toBe(false);
    expect(newTouched.size).toBe(0);
    expect(readRow).not.toHaveBeenCalled();
  });

  test('a drawn row costs DRAW_MS_PER_WIDGET for every widget it mounts, and a render round per batch', async () => {
    const texts = ['a', 'b'];
    const { get } = setup(texts, { icon: true });
    const est = await ready(get);
    expect(est.drawnChildren).toEqual(['icon1']);
    // Every widget of every row is drawn: 2 rows of 2.
    expect(est.drawnWidgets).toBe(4);
    // A row: 0.1 ms to read, 2 widgets drawn (4 ms); 8 ms batches hold 1 such row: 2 rounds.
    expect(decide(est).batchRows).toBe(1);
    expect(est.timeMs).toBeCloseTo(2 * (0.1 + 2 * DRAW_MS_PER_WIDGET) + 2 * DRAW_ROUND_MS, 6);
  });

  test('a windowed list drawn to be read fits the background limit: 2,001 rows of one Icon', async () => {
    const texts = Array.from({ length: 2001 }, () => 'y'.repeat(10));
    const { get } = setup(texts, { icon: true, msPerChar: 0.0015 });
    get.setChildren(['ico1']);
    const est = await ready(get);
    expect(est).toMatchObject({ drawnWidgets: 2001, drawnChildren: ['icon1'] });
    // 3 rows a batch (2.015 ms each): 667 rounds.
    expect(est.timeMs).toBeCloseTo(2001 * (0.015 + DRAW_MS_PER_WIDGET) + 667 * DRAW_ROUND_MS, 6);
    expect(est.timeMs).toBeLessThan(LIMITS.backgroundMs);
    expect(decide(est)).toMatchObject({ ok: true, batchRows: 3 });
  });

  test('widgets nested in a child (a Container’s) are drawn with the row: each counts, and editing one measures again', async () => {
    const texts = ['a', 'b', 'c'];
    const { get } = setup(texts);
    get.setChildren(['txt1', 'ctr1'], { ctr1: ['in1', 'in2', 'in3'] });
    const est = await ready(get);
    // A row mounts txt1, ctr1 and the 3 widgets in it.
    expect(est).toMatchObject({ drawnChildren: ['container1'], drawnWidgets: 3 * 5 });
    expect(est.timeMs).toBeCloseTo(3 * 0.1 + 3 * 5 * DRAW_MS_PER_WIDGET + 3 * DRAW_ROUND_MS, 6);

    readRow.mockClear();
    const state = get();
    state.definitions = { ...state.definitions, in2: { component: { component: 'Text' } } };
    state.modules = { canvas: { pages: [] } };
    get.notify();
    expect(estimate(get, 'lv1').ready).toBe(false);
    await ready(get);
    expect(new Set(readRow.mock.calls.map((call) => call[2]))).toEqual(new Set([0, 1, 2]));
  });

  test('a ListView nested in the row mounts its widgets once for each of its rows there, and exposes them all', async () => {
    // Row i's inner ListView has 10 × (i + 1) rows of 2 Texts, over listItem.items.
    const texts = ['a', 'b', 'c'];
    const { get } = setup(texts);
    get.setChildren(['txt1', 'lv2'], { lv2: ['in1', 'in2'] });
    const items = (dataRow) => Array.from({ length: 10 * (dataRow + 1) }, (_, k) => ({ k, label: `item ${k}` }));
    resolveRowChildInput.mockImplementation((_get, _lv, dataRow, childId) =>
      childId === 'lv2' ? { properties: { dataSourceSelector: 'rawJson', data: items(dataRow) } } : { properties: {} }
    );
    const est = await ready(get);
    // A row mounts txt1, lv2, and lv2's 2 Texts in each of its rows.
    const widgets = (dataRow) => 2 + 10 * (dataRow + 1) * 2;
    expect(est).toMatchObject({ drawnChildren: ['listview2'], drawnWidgets: widgets(0) + widgets(1) + widgets(2) });
    expect(est.timeMs).toBeGreaterThan((widgets(0) + widgets(1) + widgets(2)) * DRAW_MS_PER_WIDGET);
    // Never exposed: every widget it mounts, and its rows for each of its 2 children, several times over.
    const props = (dataRow) => ({ dataSourceSelector: 'rawJson', data: items(dataRow) });
    const allowance = (dataRow) =>
      (1 + 10 * (dataRow + 1) * 2) * UNCOMPUTED_CHILD_BYTES + EXPOSED_COPIES * 2 * sizeOf(props(dataRow));
    expect(est.resultBytes).toBe(texts.reduce((sum, text, i) => sum + figure(text, 3).resultBytes + allowance(i), 0));
    expect(allowance(2)).toBeGreaterThan(10 * sizeOf({ id: 2, name: 'c', items: items(2) }));
  });

  test('a child that needs drawing, just added: not ready (not at once either) until every row is measured again', async () => {
    const texts = sizes.map((chars) => 'y'.repeat(chars));
    const { get } = setup(texts, { msPerChar: 0.0001 });
    const before = await ready(get);
    expect(decide(before, { mode: 'sync' }).ok).toBe(true);

    get.setChildren(['txt1', 'ico1']);
    // Before the store update reaches the profile, and after.
    expect(estimate(get, 'lv1').ready).toBe(false);
    readRow.mockClear();
    const whileMeasuring = [];
    const read = readAs(
      get,
      texts.map((name, id) => ({ id, name })),
      { msPerChar: 0.0001 }
    );
    readRow.mockImplementation((...args) => {
      whileMeasuring.push(estimate(get, 'lv1').ready);
      return read(...args);
    });
    get.notify();
    const refused = decide(estimate(get, 'lv1'), { mode: 'sync' });
    expect(refused.reason).toBe('not-ready');
    const after = await ready(get);
    // The 5 rows measured again, none of the old figures mixed in meanwhile.
    expect(new Set(readRow.mock.calls.map((call) => call[2]))).toEqual(new Set(top5().map(({ index }) => index)));
    expect(whileMeasuring.every((isReady) => !isReady)).toBe(true);
    expect(after).toMatchObject({ drawnChildren: ['icon1'], drawnWidgets: 2000 * 2 });
    expect(after.timeMs).toBeGreaterThan(2000 * 2 * DRAW_MS_PER_WIDGET);
    expect(decide(after, { mode: 'sync' }).reason).toBe('needs-drawing');
  });

  test('a child that never exposed values in a row counts its props as resolved for it (at least the allowance)', async () => {
    const texts = ['x'.repeat(5000), 'b'];
    const { get, rows } = setup(texts, { icon: true });
    // The Icon is given its row's data (a tooltip, say).
    resolveRowChildInput.mockImplementation((_get, _lv, dataRow) => ({
      properties: { icon: 'IconHome2', tooltip: rows[dataRow].name, onClick: () => {} },
    }));
    const est = await ready(get);
    const props = (i) => ({ icon: 'IconHome2', tooltip: rows[i].name });
    const allowance = (i) => UNCOMPUTED_CHILD_BYTES + EXPOSED_COPIES * sizeOf(props(i));
    const chars = (i) => UNCOMPUTED_CHILD_CHARS + EXPOSED_COPIES * JSON.stringify(props(i)).length;
    expect(allowance(0)).toBeGreaterThan(EXPOSED_COPIES * 5000);
    expect(est.resultBytes).toBe(texts.reduce((sum, text, i) => sum + figure(text, 2).resultBytes + allowance(i), 0));
    expect(est.jsonChars).toBe(texts.reduce((sum, text, i) => sum + figure(text, 2).jsonChars + 2 * chars(i), 0) + 25);
  });

  test('a child that can’t be computed but exposed values in a row counts what it exposed there, not the allowance', async () => {
    const texts = ['x'.repeat(50), 'b'];
    // Row 0 was drawn: its Icon's last values are in children[0].
    const { get } = setup(texts, { icon: true, shown: [0] });
    const est = await ready(get);
    const row0 = {
      text1: { text: texts[0], setText: () => {}, id: 'txt1' },
      icon1: { isVisible: true, click: () => {}, id: 'ico1' },
    };
    const values0 = withoutFunctions(row0);
    const shared = texts[0].length + 'txt1'.length + 'ico1'.length;
    const exposed0 =
      sizeOf({ children: row0, data: values0 }) - estimateBytes({ objects: 1 }) - shared + 2 * FUNCTION_BYTES;
    const json0 =
      JSON.stringify({ children: { 2: row0 }, data: { 2: values0 } }).length -
      JSON.stringify({ children: {}, data: {} }).length +
      2;
    // Row 1's Icon never exposed values: the allowance (its props, here none, several times over).
    const allowance = UNCOMPUTED_CHILD_BYTES + EXPOSED_COPIES * sizeOf({});
    const chars = UNCOMPUTED_CHILD_CHARS + EXPOSED_COPIES * 2;
    expect(est.resultBytes).toBe(exposed0 + figure('b', 2).resultBytes + allowance);
    expect(est.jsonChars).toBe(json0 + figure('b', 2).jsonChars + 2 * chars + 25);
  });

  test('measured again in the background when its children’s definitions change, not when what they resolve in does', async () => {
    const texts = sizes.map((chars) => 'y'.repeat(chars));
    const { get } = setup(texts);
    const before = await ready(get);
    readRow.mockClear();
    const state = get();

    // Nothing changed: a store update costs comparisons only.
    get.notify();
    get.notify();
    await until(() => false);
    expect(readRow).not.toHaveBeenCalled();

    // A variable set, a query run, another component's definition changed: not these figures.
    state.resolvedStore.modules.canvas.exposedValues = { variables: { x: 1 }, queries: { q: { isLoading: true } } };
    state.modules = { canvas: { pages: [] } };
    get.notify();
    await until(() => false);
    expect(readRow).not.toHaveBeenCalled();
    expect(estimate(get, 'lv1')).toMatchObject({ ready: true, timeMs: before.timeMs });

    // A child's: every row is measured again, without anyone asking for an estimate.
    readRow.mockImplementation(
      readAs(
        get,
        texts.map((name, id) => ({ id, name })),
        { msPerChar: 0.2 }
      )
    );
    state.definitions = { ...state.definitions, txt1: { component: { component: 'Text' } } };
    state.modules = { canvas: { pages: [] } };
    get.notify();
    await until(() => readRow.mock.calls.length === 10);
    await until(() => false);
    expect(readRow).toHaveBeenCalledTimes(10);
    expect(estimate(get, 'lv1').timeMs).toBeCloseTo(2 * before.timeMs, 6);

    // Forgotten: no longer watched.
    forgetEstimate('lv1');
    expect(get.listeners.size).toBe(0);
  });

  test('measured when the browser is idle (requestIdleCallback), within a timeout', async () => {
    const idle = jest.fn((callback) => setTimeout(callback, 0));
    global.requestIdleCallback = idle;
    global.cancelIdleCallback = clearTimeout;
    try {
      const { get } = setup(sizes.map((chars) => 'y'.repeat(chars)));
      await ready(get);
      // A row per idle callback, and one finding nothing left to measure.
      expect(idle).toHaveBeenCalledTimes(6);
      expect(idle.mock.calls[0][1]).toEqual({ timeout: expect.any(Number) });
    } finally {
      delete global.requestIdleCallback;
      delete global.cancelIdleCallback;
    }
  });

  test('a calibration that fails says why, and is tried again only once something changed', async () => {
    const { get } = setup(sizes.map((chars) => 'y'.repeat(chars)));
    readRow.mockImplementation(() => {
      throw new Error('a child could not be read');
    });
    profileListview(get, get.subscribe, 'lv1');
    await until(() => estimate(get, 'lv1').error);
    const est = estimate(get, 'lv1');
    expect(est.ready).toBe(false);
    expect(decide(est).message).toBe(
      "listview1's 2,000 rows couldn't be measured: a child could not be read. Use its source data instead " +
        '(queries.restapi1.data).'
    );
    expect(readRow).toHaveBeenCalledTimes(1);
    get.notify();
    profileListview(get, get.subscribe, 'lv1');
    await until(() => false);
    expect(readRow).toHaveBeenCalledTimes(1);
    get().definitions = { ...get().definitions, txt1: { component: { component: 'Text' } } };
    get().modules = { canvas: { pages: [] } };
    get.notify();
    await until(() => readRow.mock.calls.length > 1);
    expect(readRow.mock.calls.length).toBeGreaterThan(1);
  });

  test('a ListView that draws every row costs nothing more', () => {
    const { get } = setup(['a', 'b', 'c']);
    slotsOf.mockReturnValue(null);
    expect(profileListview(get, get.subscribe, 'lv1')).toBeNull();
    expect(estimate(get, 'lv1')).toMatchObject({ ready: true, rows: 3, timeMs: 0, resultBytes: 0, windowed: false });
  });
});

// ─── decide() ───────────────────────────────────────────────────────────────────────────────────────────────────────

const est = (overrides = {}) => ({
  ready: true,
  rows: 5000000,
  timeMs: 5000,
  resultBytes: 100 * MB,
  jsonChars: 1000,
  drawnWidgets: 0,
  drawnChildren: [],
  rowBytes: 1000,
  listview: 'listview1',
  source: 'queries.restapi1.data',
  error: null,
  ...overrides,
});

describe('decide', () => {
  afterEach(() => {
    delete performance.memory;
  });

  test('not ready', () => {
    expect(decide(est({ ready: false }))).toMatchObject({ ok: false, reason: 'not-ready' });
    expect(decide(est({ ready: false }), { mode: 'sync' }).reason).toBe('not-ready');
    expect(decide(est({ ready: false })).message).toContain('still being measured. Try again in a moment');
  });

  test('rows that need drawing: only in the background', () => {
    const drawing = est({ drawnWidgets: 10, drawnChildren: ['icon1'] });
    const refused = decide(drawing, { mode: 'sync' });
    expect(refused).toMatchObject({ ok: false, reason: 'needs-drawing' });
    expect(refused.message).toContain('icon1');
    expect(refused.message).toContain('(queries.restapi1.data)');
    expect(decide(drawing, { mode: 'background' }).ok).toBe(true);
  });

  test('time: 10 s in the background, 2 s at once; an estimate over the limit never reads as the limit', () => {
    expect(decide(est({ timeMs: 9999 })).ok).toBe(true);
    expect(decide(est({ timeMs: 10001 }))).toMatchObject({ ok: false, reason: 'time' });
    expect(decide(est({ timeMs: 10001 })).message).toContain('takes about 11 s, more than the 10 s allowed.');
    expect(decide(est({ timeMs: 1999 }), { mode: 'sync' }).ok).toBe(true);
    const refused = decide(est({ timeMs: 2001 }), { mode: 'sync' });
    expect(refused.reason).toBe('time');
    expect(refused.message).toBe(
      'listview1 has 5,000,000 rows: reading all of its data takes about 2.1 s, more than the 2 s allowed ' +
        'synchronously. Use its source data instead (queries.restapi1.data).'
    );
  });

  test('memory: the result must fit the tab’s free memory', () => {
    // 4 GB limit, 512 MB reserve: 1.1 GB free.
    setMemory({ jsHeapSizeLimit: 4 * GB, usedJSHeapSize: 4 * GB - 512 * MB - 1.1 * GB });
    const refused = decide(est({ resultBytes: 2.1 * GB }));
    expect(refused).toMatchObject({ ok: false, reason: 'memory' });
    expect(refused.message).toBe(
      'listview1 has 5,000,000 rows: reading all of its data needs about 2.1 GB, more than the 1.1 GB this tab has ' +
        'free. Use its source data instead (queries.restapi1.data).'
    );
    expect(decide(est({ resultBytes: GB })).ok).toBe(true);
    expect(decide(est({ resultBytes: 2.1 * GB, timeMs: 100 }), { mode: 'sync' }).reason).toBe('memory');
  });

  test('memory, as JSON: the result and its string (2 bytes a character) must fit together', () => {
    // 4 GB limit, 512 MB reserve: 1.1 GB free.
    setMemory({ jsHeapSizeLimit: 4 * GB, usedJSHeapSize: 4 * GB - 512 * MB - 1.1 * GB });
    const large = est({ resultBytes: 0.6 * GB, jsonChars: 450e6 });
    expect(decide(large).ok).toBe(true);
    const refused = decide(large, { json: true });
    expect(refused).toMatchObject({ ok: false, reason: 'memory' });
    expect(refused.message).toBe(
      'listview1 has 5,000,000 rows: reading all of its data as JSON needs about 1.4 GB, more than the 1.1 GB this ' +
        'tab has free. Use its source data instead (queries.restapi1.data).'
    );
    expect(decide(est({ resultBytes: 0.6 * GB, jsonChars: 200e6 }), { json: true }).ok).toBe(true);
  });

  test('size: as JSON, under 500 million characters, in both modes', () => {
    expect(decide(est({ jsonChars: 600e6 })).ok).toBe(true);
    const refused = decide(est({ jsonChars: 600e6, source: null }), { json: true });
    expect(refused).toMatchObject({ ok: false, reason: 'size' });
    expect(refused.message).toBe(
      'listview1 has 5,000,000 rows: all of its data as JSON comes to about 600 million characters, more than the ' +
        '500 million allowed (a string holds at most about 536 million). Use its source data instead.'
    );
    expect(decide(est({ jsonChars: LIMITS.jsonChars - 1 }), { json: true }).ok).toBe(true);
    const sync = est({ jsonChars: 600e6, timeMs: 100 });
    expect(decide(sync, { mode: 'sync', json: true })).toMatchObject({ ok: false, reason: 'size' });
    expect(decide(sync, { mode: 'sync' }).ok).toBe(true);
    expect(decide(est({ jsonChars: LIMITS.jsonChars - 1, timeMs: 100 }), { mode: 'sync', json: true }).ok).toBe(true);
  });

  test('batchRows: ~8 ms of rows, within 16 MB, at least 1 and at most every row', () => {
    // 1 µs a row: 8000 rows by time; 1000 B a row: 16,777 by bytes.
    expect(decide(est({ rows: 1000000, timeMs: 1000 })).batchRows).toBe(8000);
    expect(decide(est({ rows: 1000000, timeMs: 10, rowBytes: 4 * MB })).batchRows).toBe(4);
    expect(decide(est({ rows: 10, timeMs: 10, rowBytes: 64 * MB })).batchRows).toBe(1);
    expect(decide(est({ rows: 3, timeMs: 0, rowBytes: 0 })).batchRows).toBe(3);
    expect(decide(est({ rows: 0, timeMs: 0, rowBytes: 0 })).batchRows).toBe(1);
  });

  test('messages name the source the ListView is bound to', async () => {
    jest.spyOn(performance, 'now').mockImplementation(() => clock);
    for (const [binding, source] of [
      ['{{queries.restapi1.data}}', 'queries.restapi1.data'],
      ['{{ variables.rows }}', 'variables.rows'],
      ['{{queries.restapi1.data.filter((r) => r.ok)}}', null],
    ]) {
      const { get } = setup(['a'], { binding });
      const estimated = await ready(get);
      expect(estimated.source).toBe(source);
      const { message } = decide({ ...estimated, timeMs: 1e9 });
      expect(
        message.endsWith(source ? `Use its source data instead (${source}).` : 'Use its source data instead.')
      ).toBe(true);
      forgetEstimate('lv1');
      forgetListviewRows('lv1', 'canvas');
    }
    jest.restoreAllMocks();
  });

  test('MaterializationError carries its reason and estimate', () => {
    const estimated = est();
    const error = new MaterializationError('time', 'too slow', estimated);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ name: 'MaterializationError', reason: 'time', estimate: estimated });
  });
});

// ─── materializeAll, every row drawn ────────────────────────────────────────────────────────────────────────────────

describe('materializeAll of a ListView that draws every row', () => {
  test('its children/data as they are; inside another ListView’s row, by outer row as it exposes them', async () => {
    slotsOf.mockReturnValue(null);
    const row = (text) => ({ text1: { text, id: 'txt1' } });
    const outer = { children: { 0: row('a') }, data: { 0: row('a') } };
    const inner = [
      { children: { 0: row('b') }, data: { 0: row('b') } },
      { children: { 0: row('c'), 1: row('d') }, data: { 0: row('c'), 1: row('d') } },
    ];
    const components = { lv1: outer, lv2: inner };
    const get = () => ({ resolvedStore: { modules: { canvas: { exposedValues: { components } } } } });
    const top = materializeAll(get, null, 'lv1', 'canvas', { mode: 'sync' });
    expect(top.children).toBe(outer.children);
    expect(top.data).toBe(outer.data);
    const nested = materializeAll(get, null, 'lv2', 'canvas', { mode: 'sync' });
    expect(nested.children).toEqual([inner[0].children, inner[1].children]);
    expect(nested.data).toEqual([inner[0].data, inner[1].data]);
    expect(nested.children[1]).toBe(inner[1].children);
    await expect(materializeAll(get, null, 'lv2')).resolves.toEqual(nested);
  });
});
