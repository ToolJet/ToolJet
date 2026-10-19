/**
 * Every row of a long ListView at once (../../materialize.js), estimated first (../../estimate.js): what it gives is
 * what reading each row gives, built in the background without blocking, or at once when every child is computed; and
 * it is refused, saying why, when it would take too long, not fit in memory, or not fit in a string.
 */
import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import { rowsProfileOf, sizeOf } from '@/AppBuilder/_engines/data/freeze';
import * as estimateEngine from '@/AppBuilder/_engines/materialize/estimate';
import { forgetEstimate, FUNCTION_BYTES, LIMITS, profileListview } from '@/AppBuilder/_engines/materialize/estimate';
import { MaterializationError } from '@/AppBuilder/_engines/materialize/materialize';
import * as rowsEngine from '@/AppBuilder/_engines/materialize/rows';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import {
  binding,
  drain,
  widgetProps,
  preloadLazyComponent,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const state = () => useStore.getState();

const SCENARIO = defineAppBuilderScenario({
  id: 'listview-materialize-all',
  name: 'Listview reads every row at once',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true, media: { matches: false }, dnd: true },
});

const ROWS = Array.from({ length: 3000 }, (_, i) => ({
  name: `row ${i}`,
  url: `https://example.com/${i}.png`,
  odd: i % 2 === 1,
}));
const SAMPLE = [0, 1, 2, 3, 1000, 2004, 2005, 2006, 2999, ...Array.from({ length: 30 }, (_, i) => i * 97 + 5)];

let session;

const nest = (def) => {
  def.component.parent = 'lv1';
  def.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  return def;
};

// lv1 over `variables.rows`, with a Text, a TextInput, a Button and an Image in every row (`icon`: an Icon too;
// `pagination`: pages of `pagination` rows; `text`: the Text's binding).
function renderListview(rows, { icon = false, pagination = 0, text = '{{listItem.name}}' } = {}) {
  state().setVariable('rows', rows, MODULE_ID);
  const props = { visibility: binding('{{true}}'), loadingState: binding('{{false}}') };
  const definitions = {
    lv1: componentDefinition('lv1', 'listview1', 'Listview', {
      ...props,
      dataSourceSelector: binding('rawJson'),
      data: binding('{{variables.rows}}'),
      mode: binding('list'),
      rowHeight: binding('100'),
      disabledState: binding('{{false}}'),
      enablePagination: binding(pagination ? '{{true}}' : '{{false}}'),
      rowsPerPage: binding(String(pagination || 10)),
    }),
    txt1: nest(
      componentDefinition('txt1', 'text1', 'Text', {
        ...props,
        text: binding(text),
        textFormat: binding('plainText'),
        disabledState: binding('{{listItem.odd}}'),
      })
    ),
    inp1: nest(
      componentDefinition('inp1', 'textinput1', 'TextInput', {
        ...props,
        label: binding('{{listItem.name}}'),
        value: binding('{{listItem.name}}'),
        disabledState: binding('{{listItem.odd}}'),
      })
    ),
    btn1: nest(
      componentDefinition('btn1', 'button1', 'Button', {
        ...props,
        text: binding('{{listItem.name}}'),
        visibility: binding('{{!listItem.odd}}'),
        disabledState: binding('{{false}}'),
      })
    ),
    img1: nest(
      componentDefinition('img1', 'image1', 'Image', {
        ...props,
        imageFormat: binding('imageUrl'),
        source: binding('{{listItem.url}}'),
        alternativeText: binding('{{listItem.name}}'),
        disabledState: binding('{{false}}'),
      })
    ),
  };
  definitions.btn1.component.definition.styles = { type: binding('primary') };
  definitions.img1.component.definition.styles = { padding: binding('default') };
  if (icon) {
    definitions.ico1 = nest(
      componentDefinition('ico1', 'icon1', 'Icon', {
        ...props,
        icon: binding('IconHome2'),
        disabledState: binding('{{false}}'),
      })
    );
  }
  seedApp(definitions, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
}

const listview = () => state().getExposedValueOfComponent('lv1', MODULE_ID);
const estimated = (options) => state().estimateListviewRows('lv1', options, MODULE_ID);
const materialize = (options) => state().materializeListviewRows('lv1', options, MODULE_ID);
const values = (exposed) =>
  Object.fromEntries(Object.entries(exposed ?? {}).filter(([, value]) => typeof value !== 'function'));
const functionsOf = (exposed) => Object.keys(exposed ?? {}).filter((key) => typeof exposed[key] === 'function');
const setMemory = (memory) => Object.defineProperty(performance, 'memory', { ...memory, configurable: true });
const rowsOf = () => rowsEngine.listviewRows(state, 'lv1', MODULE_ID);
const scrollTo = async (top) => {
  const el = document.querySelector('.listview-scroll-container');
  await act(async () => {
    el.scrollTop = top;
    fireEvent.scroll(el);
  });
  await drain();
  await drain();
};
// A few tasks for background work to run in.
const tasks = async (n) => {
  for (let i = 0; i < n; i++) await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
};

// Mounted, and its rows estimated (calibrated in the background once it had data).
const ready = async () => {
  await drain();
  await drain();
  await waitFor(() => expect(listview().children?.[3]?.text1?.setText).toBeInstanceOf(Function));
  await waitFor(() => expect(estimated().ready).toBe(true));
};

// What materializeAll gave for a row is what readListviewRow gives for it.
const expectRowsMatch = (all, rows) =>
  rows.forEach((row) => {
    const read = state().readListviewRow('lv1', row, MODULE_ID);
    expect(Object.keys(all.children[row])).toEqual(Object.keys(read));
    Object.keys(read).forEach((name) => {
      expect(values(all.children[row][name])).toEqual(values(read[name]));
      expect(functionsOf(all.children[row][name])).toEqual(functionsOf(read[name]));
      expect(all.data[row][name]).toEqual(values(read[name]));
    });
  });

beforeAll(() =>
  Promise.all(
    ['Listview', 'Text', 'TextInput', 'Button', 'Image', 'Icon'].map((type) =>
      preloadLazyComponent(getComponentToRender(type))
    )
  )
);

describe('Listview rows all at once — a long list', () => {
  const limits = { ...LIMITS };
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });
  afterEach(() => {
    Object.assign(LIMITS, limits);
    delete performance.memory;
    jest.restoreAllMocks();
  });

  test('its estimate is ready once it has data: calibrated in the background', async () => {
    renderListview(ROWS);
    await ready();
    const estimate = estimated();
    expect(estimate).toMatchObject({ ready: true, rows: 3000, drawnWidgets: 0, listview: 'listview1', windowed: true });
    expect(estimate.source).toBe('variables.rows');
    expect(estimate.timeMs).toBeGreaterThan(0);
    expect(estimate.resultBytes).toBeGreaterThan(estimate.dataBytes);
    expect(estimate.jsonChars).toBeGreaterThan(3000 * 100);
    // Profiled as it was frozen (setVariable), not scanned.
    expect(rowsOf()).toBe(ROWS);
    expect(rowsProfileOf(ROWS)).toBeDefined();
    expect(estimate.dataBytes).toBe(rowsProfileOf(ROWS).totalBytes);
  });

  test('asking for an estimate doesn’t profile: without its data hook, it never gets ready', async () => {
    renderListview(ROWS);
    await drain();
    forgetEstimate('lv1', MODULE_ID);
    for (let i = 0; i < 20; i++) {
      expect(estimated().ready).toBe(false);
      await tasks(1);
    }
  });

  test('a page of rows keeps its profile while scrolling, and is read in full meanwhile', async () => {
    const longer = [...ROWS, ...ROWS.slice(0, 500)];
    renderListview(longer, { pagination: 3000 });
    await ready();
    const profile = profileListview(state, null, 'lv1', MODULE_ID);
    const rows = rowsOf();
    expect(rows).toHaveLength(3000);
    await scrollTo(1500 * 100);
    expect(rowsOf()).toBe(rows);
    expect(profileListview(state, null, 'lv1', MODULE_ID)).toBe(profile);
    expect(estimated().ready).toBe(true);

    const pending = materialize();
    await tasks(1);
    await scrollTo(2500 * 100);
    const all = await pending;
    expect(Object.keys(all.data)).toHaveLength(3000);
    expect(all.data[2999].text1.text).toBe('row 2999');
  });

  test('in the background: every row as readListviewRow reads it, a changed one included, without blocking', async () => {
    renderListview(ROWS);
    await ready();
    await act(async () => {
      await state().runRowAction('lv1', 2005, 'txt1', 'setText', ['changed'], MODULE_ID);
    });
    await drain();

    let finished = false;
    let tasksBetween = 0;
    const count = () => {
      if (finished) return;
      tasksBetween += 1;
      setTimeout(count, 0);
    };
    const pending = materialize();
    setTimeout(count, 0);
    const all = await pending;
    finished = true;

    expect(tasksBetween).toBeGreaterThan(1);
    expect(Object.keys(all.children)).toHaveLength(3000);
    expect(Object.keys(all.data)).toHaveLength(3000);
    expect(all.children[2005].text1.text).toBe('changed');
    expect(all.data[2005].text1.text).toBe('changed');
    expectRowsMatch(all, SAMPLE);
    // The rows it draws: what the ListView itself exposes for them, in children and in data.
    const drawn = Object.keys(listview().children).map(Number);
    expect(drawn.length).toBeGreaterThan(5);
    drawn.forEach((row) => {
      expect(Object.keys(all.children[row])).toEqual(Object.keys(listview().children[row]));
      Object.entries(listview().children[row]).forEach(([name, exposed]) => {
        expect(values(all.children[row][name])).toEqual(values(exposed));
        expect(functionsOf(all.children[row][name])).toEqual(functionsOf(exposed));
      });
      expect(all.data[row]).toEqual(listview().data[row]);
    });
    // Its functions run on their row.
    await act(async () => {
      await all.children[2006].text1.setText('via materialized');
    });
    expect(state().readListviewRow('lv1', 2006, MODULE_ID).text1.text).toBe('via materialized');
    // Deep-frozen, and not in the store.
    expect(Object.isFrozen(all) && Object.isFrozen(all.children) && Object.isFrozen(all.data[7].text1)).toBe(true);
    expect(Object.isFrozen(all.children[7].textinput1)).toBe(true);
    expect(listview().children[2999]).toBeUndefined();
    // Its JSON (functions dropped: children and data hold the same values) is what the estimate allowed for.
    const jsonChars = JSON.stringify(all).length;
    expect(estimated({ json: true }).jsonChars).toBeGreaterThanOrEqual(jsonChars);
    expect(estimated({ json: true }).jsonChars).toBeLessThan(jsonChars * 1.25);
    // Its memory: what sizeOf measures of the real result (children and data, the strings data shares counted once)
    // and a closure (FUNCTION_BYTES) for each of its actions; the 5 longest rows stand for the others, so a little more.
    let functions = 0;
    let sharedChars = 0;
    Object.values(all.children).forEach((row) =>
      Object.values(row).forEach((child) =>
        Object.values(child).forEach((value) => {
          if (typeof value === 'function') functions += 1;
          else if (typeof value === 'string') sharedChars += value.length;
        })
      )
    );
    const measured = sizeOf(all) - sharedChars;
    const { resultBytes } = estimated();
    const real = measured + functions * FUNCTION_BYTES;
    expect(resultBytes).toBeGreaterThanOrEqual(real);
    expect(resultBytes).toBeLessThan(real * 1.05);
  });

  test('in the background, stopped when its ListView unmounts, or when cancelled', async () => {
    const { unmount } = renderListview(ROWS);
    await ready();
    const cancelled = materialize();
    await tasks(1);
    cancelled.cancel();
    const reason = await cancelled.catch((error) => error);
    expect(reason).toBeInstanceOf(MaterializationError);
    expect(reason.reason).toBe('cancelled');

    const reads = jest.spyOn(rowsEngine, 'readRow');
    const pending = materialize();
    await tasks(1);
    act(() => unmount());
    const stopped = await pending.catch((error) => error);
    expect(stopped).toBeInstanceOf(MaterializationError);
    expect(stopped.reason).toBe('changed');
    expect(reads.mock.calls.length).toBeLessThan(3000);
  });

  test('in the background, rows with a child that must be drawn are drawn a batch at a time, then let go', async () => {
    const ROW_COUNT = 450; // 5 children: windowed above 400 rows
    renderListview(ROWS.slice(0, ROW_COUNT), { icon: true });
    await ready();
    const estimate = estimated();
    expect(estimate).toMatchObject({ windowed: true, drawnChildren: ['icon1'], drawnWidgets: ROW_COUNT * 5 });
    // Every widget of every row drawn, 2 ms each: within the 10 s allowed in the background.
    expect(estimate.timeMs).toBeGreaterThan(ROW_COUNT * 5 * 2);
    expect(estimate.timeMs).toBeLessThan(LIMITS.backgroundMs);
    const { holdRowMounted, readRow } = rowsEngine;
    let held = 0;
    let mostHeld = 0;
    const holds = [];
    const drawnRows = new Set();
    // Rows 0, 200 and the last are really drawn; the others (jsdom draws a row in seconds) only held and let go.
    const DRAWN = [0, 200, ROW_COUNT - 1];
    jest.spyOn(rowsEngine, 'holdRowMounted').mockImplementation((get, subscribe, listviewId, dataRow, moduleId) => {
      holds.push(dataRow);
      held += 1;
      mostHeld = Math.max(mostHeld, held);
      const hold = DRAWN.includes(dataRow)
        ? holdRowMounted(get, subscribe, listviewId, dataRow, moduleId)
        : Promise.resolve(() => {});
      return hold.then((release) => {
        drawnRows.add(dataRow);
        return () => {
          held -= 1;
          release();
        };
      });
    });
    // Each row is read once it is drawn, and while it is held.
    const readWhile = [];
    jest.spyOn(rowsEngine, 'readRow').mockImplementation((get, listviewId, dataRow, ...rest) => {
      readWhile.push(drawnRows.has(dataRow) && held > 0);
      return readRow(get, listviewId, dataRow, ...rest);
    });
    const all = await materialize();
    expect(holds).toEqual(Array.from({ length: ROW_COUNT }, (_, i) => i));
    expect(readWhile).toHaveLength(ROW_COUNT);
    expect(readWhile.every(Boolean)).toBe(true);
    expect(held).toBe(0);
    expect(mostHeld).toBe(1); // a row's 5 widgets take more than a batch's 8 ms to draw
    expect(Object.keys(all.children)).toHaveLength(ROW_COUNT);
    DRAWN.forEach((row) => {
      const icon = all.children[row].icon1;
      expect(values(icon)).toMatchObject({ isVisible: true, isDisabled: false });
      expect(functionsOf(icon)).toEqual(expect.arrayContaining(['click', 'setVisibility']));
      expect(all.data[row].icon1).toEqual(values(icon));
      expect(all.data[row].text1.text).toBe(`row ${row}`);
    });
  });

  test('in the background, drawn rows slower than estimated: stopped once the rows left wouldn’t fit the time', async () => {
    renderListview(ROWS.slice(0, 450), { icon: true });
    await ready();
    expect(estimated().timeMs).toBeLessThan(LIMITS.backgroundMs);
    // Each row takes 50 ms to draw (a slow render round): 450 rows would take 22.5 s.
    const now = performance.now.bind(performance);
    let late = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => now() + late);
    const holds = [];
    jest.spyOn(rowsEngine, 'holdRowMounted').mockImplementation((get, subscribe, listviewId, dataRow) => {
      holds.push(dataRow);
      late += 50;
      return Promise.resolve(() => {});
    });
    const stopped = await materialize().catch((error) => error);
    expect(stopped).toBeInstanceOf(MaterializationError);
    expect(stopped.reason).toBe('time');
    expect(stopped.message).toMatch(
      /^listview1 has 450 rows: reading all of its data is taking longer than estimated: at its pace so far it takes about 2\d s, more than the 10 s allowed\. Use its source data instead \(variables\.rows\)\.$/
    );
    // Stopped after about a second's worth, not at the end.
    expect(holds.length).toBeLessThan(50);
  });

  test('in the background, rows that change while the last batch is drawn: rejected, not mixed into the result', async () => {
    renderListview(ROWS.slice(0, 450), { icon: true });
    await ready();
    jest.spyOn(rowsEngine, 'holdRowMounted').mockImplementation(async (get, subscribe, listviewId, dataRow) => {
      if (dataRow === 449) {
        // New rows of the same length arrive while the last row is being drawn.
        await act(async () =>
          state().setVariable(
            'rows',
            ROWS.slice(0, 450).map((row) => ({ ...row, name: 'new' }))
          )
        );
        await drain();
      }
      return () => {};
    });
    const changed = await materialize().catch((error) => error);
    expect(changed).toBeInstanceOf(MaterializationError);
    expect(changed.reason).toBe('changed');
  });

  test('in the background, a row of a batch that fails: the batch’s other rows are let go, not drawn', async () => {
    renderListview(ROWS.slice(0, 450), { icon: true });
    await ready();
    const { decide } = estimateEngine;
    jest.spyOn(estimateEngine, 'decide').mockImplementation((...args) => ({ ...decide(...args), batchRows: 3 }));
    const waiting = [];
    jest
      .spyOn(rowsEngine, 'holdRowMounted')
      .mockImplementation((get, subscribe, listviewId, dataRow, moduleId, signal) => {
        if (dataRow === 0) return Promise.resolve(() => {});
        waiting.push(dataRow);
        return new Promise((resolve, reject) => {
          signal?.addEventListener('abort', () => {
            waiting.splice(waiting.indexOf(dataRow), 1);
            reject(signal.reason);
          });
        });
      });
    const { readRow } = rowsEngine;
    jest.spyOn(rowsEngine, 'readRow').mockImplementation((get, listviewId, dataRow, ...rest) => {
      if (dataRow === 0) throw new Error('row 0 could not be read');
      return readRow(get, listviewId, dataRow, ...rest);
    });
    const failed = await materialize().catch((error) => error);
    expect(failed.message).toBe('row 0 could not be read');
    expect(waiting).toEqual([]);
  });

  test('in the background, cancelled while rows wait to be drawn: rejects at once, and lets them go', async () => {
    renderListview(ROWS.slice(0, 450), { icon: true });
    await ready();
    // Rows that are never drawn (a hidden ListView, a tab in the background): a hold settles only when let go.
    const waiting = [];
    jest
      .spyOn(rowsEngine, 'holdRowMounted')
      .mockImplementation((get, subscribe, listviewId, dataRow, moduleId, signal) => {
        waiting.push(dataRow);
        return new Promise((resolve, reject) => {
          signal?.addEventListener('abort', () => {
            waiting.splice(waiting.indexOf(dataRow), 1);
            reject(signal.reason);
          });
        });
      });
    const pending = materialize();
    await tasks(2);
    expect(waiting).toEqual([0]);
    pending.cancel();
    const reason = await pending.catch((error) => error);
    expect(reason).toBeInstanceOf(MaterializationError);
    expect(reason.reason).toBe('cancelled');
    expect(waiting).toEqual([]);
  });

  test('a row held drawn is let go when its signal aborts before it is drawn', async () => {
    renderListview(ROWS);
    await ready();
    const slots = () => state().resolvedStore.modules[MODULE_ID].listviewSlots.lv1;
    expect(slots()).not.toContain(2500);
    const controller = new AbortController();
    const hold = rowsEngine.holdRowMounted(state, useStore.subscribe, 'lv1', 2500, MODULE_ID, controller.signal);
    controller.abort(new Error('not needed'));
    await expect(hold).rejects.toThrow('not needed');
    await drain();
    await drain();
    expect(slots()).not.toContain(2500);
    await expect(
      rowsEngine.holdRowMounted(state, useStore.subscribe, 'lv1', 2500, MODULE_ID, controller.signal)
    ).rejects.toThrow('not needed');
  });

  test('at once, for rows whose children are all computed', async () => {
    LIMITS.syncMs = Infinity; // jsdom reads a row far slower than a browser
    renderListview(ROWS);
    await ready();
    await act(async () => {
      await state().runRowAction('lv1', 10, 'btn1', 'setVisibility', [false], MODULE_ID);
    });
    const all = materialize({ mode: 'sync' });
    expect(all.then).toBeUndefined();
    expect(Object.keys(all.children)).toHaveLength(3000);
    expect(all.data[10].button1.isVisible).toBe(false);
    expectRowsMatch(all, SAMPLE);
  });

  test('not at once when a child can only be read drawn (an Icon)', async () => {
    renderListview(ROWS.slice(0, 1000), { icon: true });
    await ready();
    // Every widget of every row would be drawn.
    expect(estimated()).toMatchObject({ drawnWidgets: 1000 * 5, drawnChildren: ['icon1'] });
    let error;
    try {
      materialize({ mode: 'sync' });
    } catch (thrown) {
      error = thrown;
    }
    expect(error).toBeInstanceOf(MaterializationError);
    expect(error.reason).toBe('needs-drawing');
    expect(error.message).toContain('icon1');
    expect(error.estimate.rows).toBe(1000);
  });

  test('its time estimate covers building every row as it really goes, at once and in the background', async () => {
    LIMITS.syncMs = Infinity; // jsdom reads a row far slower than a browser
    renderListview(ROWS);
    await ready();
    const { timeMs } = estimated();
    let start = performance.now();
    materialize({ mode: 'sync' });
    const syncMs = performance.now() - start;
    start = performance.now();
    await materialize();
    const backgroundMs = performance.now() - start;
    // Its rows built in one loop take what was estimated (the 5 longest rows' build timed, freezing included); in the
    // background, the tasks between slices add a little.
    expect(syncMs).toBeLessThanOrEqual(timeMs * 1.05);
    expect(backgroundMs).toBeLessThanOrEqual(timeMs * 1.3);
  });

  test('as JSON, rows that grew since they were measured (a variable their children read): stopped before too long', async () => {
    LIMITS.syncMs = Infinity;
    renderListview(ROWS, { text: "{{listItem.name + (variables.suffix ?? '')}}" });
    await ready();
    const before = estimated({ json: true });
    // Every Text's text is 2,000 characters longer now: not measured again (nothing in its rows' widgets changed).
    await act(async () => state().setVariable('suffix', 'x'.repeat(2000), MODULE_ID));
    await drain();
    expect(estimated({ json: true })).toMatchObject({ ready: true, jsonChars: before.jsonChars });
    expect(state().readListviewRow('lv1', 2999, MODULE_ID).text1.text).toHaveLength('row 2999'.length + 2000);
    // Within the limit as estimated, far over it as built.
    LIMITS.jsonChars = before.jsonChars * 2;
    const tooLong = await materialize({ json: true }).catch((error) => error);
    expect(tooLong).toBeInstanceOf(MaterializationError);
    expect(tooLong.reason).toBe('size');
    expect(() => materialize({ mode: 'sync', json: true })).toThrow(MaterializationError);
    await expect(materialize().then(() => 'ok')).resolves.toBe('ok');
  });

  test('refused, saying why: too slow, too large for memory, too long as JSON', async () => {
    renderListview(ROWS);
    await ready();

    LIMITS.backgroundMs = 1;
    const slow = await materialize().catch((error) => error);
    expect(slow).toBeInstanceOf(MaterializationError);
    expect(slow.reason).toBe('time');
    expect(slow.message).toMatch(
      /^listview1 has 3,000 rows: reading all of its data takes about .* \(variables\.rows\)\.$/
    );
    Object.assign(LIMITS, limits);

    LIMITS.jsonChars = 1000;
    await expect(materialize().then(() => 'ok')).resolves.toBe('ok');
    const long = await materialize({ json: true }).catch((error) => error);
    expect(long.reason).toBe('size');
    Object.assign(LIMITS, limits);

    const MB = 1024 * 1024;
    setMemory({ value: { jsHeapSizeLimit: 4096 * MB, usedJSHeapSize: 4096 * MB - 512 * MB - MB / 1024 } });
    const large = await materialize().catch((error) => error);
    expect(large.reason).toBe('memory');
    expect(large.message).toContain('this tab has free. Use its source data instead (variables.rows).');
  });

  test('stops when memory no longer fits between batches', async () => {
    renderListview(ROWS);
    await ready();
    const MB = 1024 * 1024;
    let reads = 0;
    // Room enough to decide and start; none once the first batch is built.
    setMemory({
      get: () => {
        reads += 1;
        return { jsHeapSizeLimit: 4096 * MB, usedJSHeapSize: reads <= 2 ? MB : 4096 * MB };
      },
    });
    const stopped = await materialize().catch((error) => error);
    expect(stopped).toBeInstanceOf(MaterializationError);
    expect(stopped.reason).toBe('memory');
    expect(reads).toBeGreaterThan(2);
  });

  test('a result fully built is kept, even when the tab dipped into its reserve while building it', async () => {
    renderListview(ROWS);
    await ready();
    const { decide } = estimateEngine;
    jest
      .spyOn(estimateEngine, 'decide')
      .mockImplementation((...args) => ({ ...decide(...args), batchRows: ROWS.length }));
    const MB = 1024 * 1024;
    let reads = 0;
    // Room to decide and start; the tab is into its reserve once the rows are built.
    setMemory({
      get: () => {
        reads += 1;
        return { jsHeapSizeLimit: 4096 * MB, usedJSHeapSize: reads <= 2 ? MB : 4096 * MB };
      },
    });
    const all = materialize({ mode: 'sync' });
    expect(Object.keys(all.data)).toHaveLength(ROWS.length);
  });

  test('data reloaded with the same content is measured again', async () => {
    renderListview(ROWS);
    await ready();
    await act(async () =>
      state().setVariable(
        'rows',
        ROWS.map((row) => ({ ...row })),
        MODULE_ID
      )
    );
    await drain();
    await waitFor(() => expect(estimated().ready).toBe(true));
    expect(rowsProfileOf(rowsOf())).toBeTruthy();
    await expect(materialize().then(() => 'ok')).resolves.toBe('ok');
  });

  test('rows that cost far more than estimated (a variable their children read grew): stopped on memory, not run out', async () => {
    renderListview(ROWS, { text: "{{listItem.name + (variables.suffix ?? '')}}" });
    await ready();
    const before = estimated();
    await act(async () => state().setVariable('suffix', 'x'.repeat(20000), MODULE_ID));
    await drain();
    expect(estimated()).toMatchObject({ ready: true, resultBytes: before.resultBytes });
    // Room for twice the estimate: far less than the rows really take now.
    const MB = 1024 * 1024;
    setMemory({ value: { jsHeapSizeLimit: 4096 * MB, usedJSHeapSize: 4096 * MB - 512 * MB - 2 * before.resultBytes } });
    const stopped = await materialize().catch((error) => error);
    expect(stopped).toBeInstanceOf(MaterializationError);
    expect(stopped.reason).toBe('memory');
  });
});

describe('Listview rows all at once — a short list (every row drawn)', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });

  test('its exposed children/data, as they are', async () => {
    renderListview(ROWS.slice(0, 5));
    await drain();
    await waitFor(() => expect(listview().children?.[4]?.text1?.setText).toBeInstanceOf(Function));
    await drain();
    expect(estimated()).toMatchObject({ ready: true, rows: 5, timeMs: 0, windowed: false });
    const all = materialize({ mode: 'sync' });
    expect(all.children).toBe(listview().children);
    expect(all.data).toBe(listview().data);
    await expect(materialize()).resolves.toEqual(all);
  });
});
