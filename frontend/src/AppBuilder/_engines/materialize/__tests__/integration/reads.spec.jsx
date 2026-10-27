/**
 * A long ListView's rows as the app's code reads them (../../scripts.js, ../../prepare.js): a RunJS script, a
 * transformation, a binding, a query's options and an event's params get the rows they read made ready first, as plain
 * objects (never a Proxy), and an event's control-component action runs on the data row it fired in.
 */
import React from 'react';
import { types } from 'util';
import { act, configure, fireEvent, getConfig, waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { dataqueryService } from '@/_services';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import * as windowEngine from '@/AppBuilder/_engines/rendering/useWindow';
import { LIMITS, MaterializationError } from '@/AppBuilder/_engines/materialize/estimate';
import * as prepareEngine from '@/AppBuilder/_engines/materialize/prepare';
import * as scriptsEngine from '@/AppBuilder/_engines/materialize/scripts';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import {
  binding,
  drain,
  widgetProps,
  preloadLazyComponent,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Integration specs that draw real rows: a CI runner takes several times as long as a laptop.
jest.setTimeout(60000);

// Waits for a 3,000-row ListView's reads: a CI runner takes several times as long as a laptop. Restored after this
// file, so other files keep testing-library's default.
let asyncUtilTimeout;
beforeAll(() => {
  ({ asyncUtilTimeout } = getConfig());
  configure({ asyncUtilTimeout: 30000 });
});
afterAll(() => configure({ asyncUtilTimeout }));

const state = () => useStore.getState();

const SCENARIO = defineAppBuilderScenario({
  id: 'listview-rows-read-by-code',
  name: 'Listview rows read by scripts, bindings, queries and events',
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

const ROW_HEIGHT = 100;
// For a test reading every row (slow in jsdom, slower on a loaded machine).
const WHOLE_MS = 30000;
const ROWS = Array.from({ length: 3000 }, (_, i) => ({ name: `row ${i}`, odd: i % 2 === 1 }));

let session;

const nest = (def) => {
  def.component.parent = 'lv1';
  def.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  return def;
};

/**
 * lv1 over `variables.rows` with a Text and a Button in every row (`icon`: an Icon too, a child read only drawn), and
 * outside it `extra` components. `queries`: [{ id, name, kind, options }].
 */
function renderListview(rows, { icon = false, extra = {}, queries = [] } = {}) {
  state().setVariable('rows', rows, MODULE_ID);
  const props = { visibility: binding('{{true}}'), loadingState: binding('{{false}}') };
  const definitions = {
    lv1: componentDefinition('lv1', 'listview1', 'Listview', {
      ...props,
      dataSourceSelector: binding('rawJson'),
      data: binding('{{variables.rows}}'),
      mode: binding('list'),
      rowHeight: binding(String(ROW_HEIGHT)),
      disabledState: binding('{{false}}'),
      enablePagination: binding('{{false}}'),
    }),
    txt1: nest(
      componentDefinition('txt1', 'text1', 'Text', {
        ...props,
        text: binding('{{listItem.name}}'),
        textFormat: binding('plainText'),
        disabledState: binding('{{false}}'),
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
    ...extra,
  };
  definitions.btn1.component.definition.styles = { type: binding('primary') };
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
  state().dataQuery.setQueries(queries, MODULE_ID);
  state().setQueryMapping(MODULE_ID);
  state().initialiseResolvedQuery(
    queries.map(({ id }) => id),
    MODULE_ID
  );
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
}

const runjs = (id, code, options = {}) => ({ id, name: id, kind: 'runjs', options: { code, ...options } });
const restapi = (id, body) => ({
  id,
  name: id,
  kind: 'restapi',
  options: { method: 'post', url: 'https://x.y', body },
});
const listview = () => state().getExposedValueOfComponent('lv1', MODULE_ID);
const queryData = (id) => state().resolvedStore.modules[MODULE_ID].exposedValues.queries[id]?.data;
const run = (id) =>
  act(() => state().queryPanel.runQuery(id, id, undefined, 'view', {}, undefined, undefined, false, false, MODULE_ID));
const errors = () => state().debugger.logs.filter((log) => log.logLevel === 'error');
const rowElements = () =>
  [...document.querySelectorAll('[data-cy*="-row-"]')].filter((e) => e.closest('.listview-scroll-container'));
const renderedRows = () => rowElements().map((e) => Number(e.getAttribute('data-cy').split('-row-').pop()));
const rowElement = (row) => rowElements().find((e) => e.getAttribute('data-cy').endsWith(`-row-${row}`));
const scrollTo = async (top) => {
  const el = document.querySelector('.listview-scroll-container');
  await act(async () => {
    el.scrollTop = top;
    fireEvent.scroll(el);
  });
  await drain();
  await drain();
};
const mounted = async () => {
  await drain();
  await drain();
  await waitFor(() => expect(listview().children?.[2]?.text1?.setText).toBeInstanceOf(Function));
};
// Mounted, and its rows estimated: reading them all can be decided.
const ready = async () => {
  await mounted();
  await waitFor(() => expect(state().estimateListviewRows('lv1', {}, MODULE_ID).ready).toBe(true));
};
/** Whether a Proxy is anywhere in `value`: in Maps and Sets, functions, non-enumerable and symbol keys too. */
const holdsProxy = (value, seen = new Set()) => {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return false;
  if (types.isProxy(value)) return true;
  if (seen.has(value)) return false;
  seen.add(value);
  const own = Reflect.ownKeys(value).flatMap((key) => {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
    return descriptor && 'value' in descriptor ? [descriptor.value] : [];
  });
  const items = value instanceof Map || value instanceof Set ? [...value.entries()].flat() : [];
  return [...own, ...items].some((item) => holdsProxy(item, seen));
};
const storeHoldsProxy = () => holdsProxy(state().resolvedStore);
// No Proxy anywhere: in the store, nor in what a query sent (run or preview). Then the spies are restored.
const expectNoProxy = () => {
  expect(storeHoldsProxy()).toBe(false);
  [dataqueryService.run, dataqueryService.preview].forEach((send) => {
    if (jest.isMockFunction(send)) expect(send.mock.calls.some((args) => holdsProxy(args))).toBe(false);
  });
  jest.restoreAllMocks();
};
/** Whether an accessor (a getter or setter) is anywhere in `value`'s own keys, nested ones too. */
const holdsAccessor = (value, seen = new Set()) => {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function') || seen.has(value)) return false;
  seen.add(value);
  return Reflect.ownKeys(value).some((key) => {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
    return !('value' in descriptor) || holdsAccessor(descriptor.value, seen);
  });
};
const control = (id, sourceId, componentId, value) => ({
  id,
  index: 0,
  sourceId,
  name: id,
  target: 'component',
  event: {
    eventId: 'onClick',
    actionId: 'control-component',
    componentId,
    componentSpecificActionHandle: 'setText',
    componentSpecificActionParams: [{ handle: 'text', value }],
  },
});
const setVariable = (key, value, extra = {}) => ({ event: { actionId: 'set-custom-variable', key, value, ...extra } });
// Not awaited inside act(): a row drawn for it renders only outside of act's scope.
const execute = (event) => state().eventsSlice.executeAction(event, 'view', {}, MODULE_ID, null);

beforeAll(() =>
  Promise.all(
    ['Listview', 'Text', 'Button', 'Icon', 'Container'].map((type) => preloadLazyComponent(getComponentToRender(type)))
  )
);

describe('Listview rows read by code — a long list', () => {
  const limits = { ...LIMITS };
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
    // Reads are allowed whatever the machine's load (jsdom reads a row far slower than a browser): the tests that are
    // refused set their limits.
    Object.assign(LIMITS, { syncMs: Infinity, backgroundMs: Infinity });
  });
  afterEach(() => {
    Object.assign(LIMITS, limits);
    expectNoProxy();
  });

  test('a RunJS script reads a row never drawn: its values and actions in children, its values in data', async () => {
    renderListview(ROWS, {
      queries: [
        runjs(
          'q1',
          `const { children, data } = components.listview1;
           return [children[2900].text1.text, typeof children[2900].text1.setText, typeof data[2900].text1.setText,
             data[2900].button1.isVisible, 2900 in children, children[3000]];`
        ),
      ],
    });
    await mounted();
    expect(listview().children[2900]).toBeUndefined();
    const materialize = jest.spyOn(state(), 'materializeListviewRows');
    const prepare = jest.spyOn(scriptsEngine, 'prepareScript');

    await run('q1');
    expect(queryData('q1')).toEqual(['row 2900', 'function', 'undefined', true, true, undefined]);
    expect(renderedRows()).not.toContain(2900);
    // Its rows made ready (the positive control of the tests that expect nothing prepared), only the row it reads.
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(materialize).not.toHaveBeenCalled();
  });

  test(
    'a RunJS script walking every row reads them all in the background first; refused with the reason over the limits',
    async () => {
      renderListview(ROWS, {
        queries: [
          runjs(
            'q1',
            `const { children, data } = components.listview1;
           let texts = 0;
           for (const row of Object.keys(components.listview1.data)) if (data[row].text1.text) texts += 1;
           const json = JSON.parse(JSON.stringify(data));
           return [texts, json[2900].text1.text, Object.values(children).length, _.size(data),
             Object.keys({ ...children }).length, -1 in children, 3000 in data, Object.isFrozen(components.listview1)];`
          ),
        ],
      });
      await ready();
      const materialize = jest.spyOn(state(), 'materializeListviewRows');

      await run('q1');
      // Its entry a plain per-run object, not frozen.
      expect(queryData('q1')).toEqual([3000, 'row 2900', 3000, 3000, 3000, false, false, false]);
      expect(materialize).toHaveBeenCalledTimes(1);
      expect(materialize.mock.calls[0][1]).not.toEqual(expect.objectContaining({ mode: 'sync' }));

      // Rows changed: read again, and refused.
      LIMITS.backgroundMs = 0;
      await act(async () =>
        state().setVariable(
          'rows',
          ROWS.map((row) => ({ ...row })),
          MODULE_ID
        )
      );
      await ready();
      state().debugger.clear();
      let result;
      await act(async () => {
        result = await state().queryPanel.runQuery(
          'q1',
          'q1',
          undefined,
          'view',
          {},
          undefined,
          undefined,
          false,
          false
        );
      });
      expect(result.message).toContain('listview1 has 3,000 rows');
      const [log, ...more] = errors();
      expect(more).toEqual([]);
      expect(log.message).toMatch(/listview1 has 3,000 rows: reading all of its data takes about .* allowed\./);
      expect(log.message).toContain('Use its source data instead (variables.rows)');
    },
    WHOLE_MS
  );

  test(
    'what a script returns, and what it sets, is stored plain: no Proxy reaches the store',
    async () => {
      renderListview(ROWS, {
        queries: [
          runjs(
            'q1',
            `const lv = components.listview1;
           actions.setVariable('seen', lv.data);
           return { children: lv.children, row: lv.children[2900], entry: lv, nested: [lv.data] };`
          ),
          runjs('q2', 'return 1;', {
            enableTransformation: true,
            transformation:
              'return [components.listview1.data[2900].text1.text, Object.keys(components.listview1.children).length];',
          }),
        ],
      });
      await ready();

      await run('q1');
      const stored = queryData('q1');
      expect(holdsProxy(state().resolvedStore.modules[MODULE_ID].exposedValues)).toBe(false);
      expect(Object.keys(stored.children)).toHaveLength(3000);
      expect(stored.row.text1.text).toBe('row 2900');
      expect(Object.keys(stored.entry.data)).toHaveLength(3000);
      expect(stored.nested[0][2900].text1.text).toBe('row 2900');
      expect(Object.keys(state().getVariable('seen', MODULE_ID))).toHaveLength(3000);

      // A transformation reads the rows too.
      await run('q2');
      expect(queryData('q2')).toEqual(['row 2900', 3000]);
      expect(holdsProxy(state().resolvedStore.modules[MODULE_ID].exposedValues)).toBe(false);
    },
    WHOLE_MS
  );

  test(
    "a run that sets a row's text then reads it sees the new value: a row read, or every row",
    async () => {
      renderListview(ROWS, {
        queries: [
          runjs(
            'q1',
            `await components.listview1.children[2900].text1.setText('changed');
           return [components.listview1.children[2900].text1.text, components.listview1.data[2900].text1.text];`
          ),
          runjs(
            'q2',
            `const before = Object.keys(components.listview1.data).length;
           await components.listview1.children[2950].text1.setText('also');
           return [before, components.listview1.data[2950].text1.text, Object.keys(components.listview1.data).length];`
          ),
        ],
      });
      await ready();
      await run('q1');
      expect(queryData('q1')).toEqual(['changed', 'changed']);
      expect(renderedRows()).not.toContain(2900);
      await run('q2');
      expect(queryData('q2')).toEqual([3000, 'also', 3000]);
    },
    WHOLE_MS
  );

  test(
    'a run reads its entry as one plain object: unfrozen, its rows copied once, not again on every change',
    async () => {
      renderListview(ROWS, {
        queries: [
          runjs(
            'q1',
            `const entry = components.listview1;
           Object.freeze(entry.data); // frozen as setVariable freezes what it is given
           await components.listview1.children[2900].text1.setText('a');
           const first = components.listview1.data;
           await components.listview1.children[2901].text1.setText('b');
           await components.listview1.children[2950].text1.setText('c');
           const second = components.listview1.data;
           return [Object.isFrozen(components.listview1), entry === components.listview1, first === second,
             Object.isFrozen(second), second[2900].text1.text, second[2901].text1.text, second[2950].text1.text,
             Object.keys(second).length];`
          ),
        ],
      });
      await ready();
      await run('q1');
      expect(queryData('q1')).toEqual([false, true, true, false, 'a', 'b', 'c', 3000]);
    },
    WHOLE_MS
  );

  test("a script holding the entry in a variable sees an action's result through `components`, as it always did", async () => {
    renderListview(ROWS, {
      queries: [
        runjs(
          'q1',
          `const lv = components.listview1;
           await lv.children[2900].text1.setText('alias');
           await lv.children[0].text1.setText('drawn');
           await new Promise((resolve) => setTimeout(resolve, 100)); // a drawn row's widget sets it as it renders
           return [lv.children[2900].text1.text, lv.children[0].text1.text,
             components.listview1.children[2900].text1.text, components.listview1.children[0].text1.text];`
        ),
      ],
    });
    await mounted();
    await run('q1');
    // The variable holds the entry as it was read (a drawn row too, as before); `components` reads it as it is now.
    expect(queryData('q1')).toEqual(['row 2900', 'row 0', 'alias', 'drawn']);
  });

  test(
    'a RunJS loop over computed indexes reads every row in the background first',
    async () => {
      renderListview(ROWS, {
        queries: [
          runjs(
            'q1',
            'let n = 0; for (let i = 0; i < 3000; i++) if (components.listview1.data[i].text1.text) n++; return n;'
          ),
        ],
      });
      await ready();
      const materialize = jest.spyOn(state(), 'materializeListviewRows');
      await run('q1');
      expect(queryData('q1')).toBe(3000);
      expect(materialize).toHaveBeenCalledTimes(1);
    },
    WHOLE_MS
  );

  test("a script naming the ListView as `components['listview1']`, or destructured from `components`", async () => {
    renderListview(ROWS, {
      queries: [
        runjs('q1', "return components['listview1'].children[2900].text1.text;"),
        runjs('q2', 'const { listview1 } = components; return listview1.children[2901].text1.text;'),
        runjs('q3', 'const { listview1: lv } = components; return lv.data[2902].text1.text;'),
      ],
    });
    await mounted();
    const materialize = jest.spyOn(state(), 'materializeListviewRows');
    for (const id of ['q1', 'q2', 'q3']) await run(id);
    expect([queryData('q1'), queryData('q2'), queryData('q3')]).toEqual(['row 2900', 'row 2901', 'row 2902']);
    expect(materialize).not.toHaveBeenCalled();
  });

  test('code reading only other keys of the entry runs at once, over the limits too: nothing read', async () => {
    const text = (id, name, template) => componentDefinition(id, name, 'Text', { text: binding(template) });
    state().setVariable('key', 'id', MODULE_ID);
    renderListview(ROWS, {
      extra: {
        out1: text('out1', 'outside1', '{{String(components.listview1.data.length)}}'),
        out2: text('out2', 'outside2', '{{components.listview1[variables.key]}}'),
      },
      queries: [
        runjs(
          'q1',
          `if (true) { const lv = components.listview1; a = lv.id; } else { const lv = components.listview1; a = lv.id; }
           function b() { const lv = components.listview1; return lv.id; }
           const k = 'id';
           const { data } = components.listview1;
           const f = () => { const data = 1; return data; };
           return [a, b(), components.listview1[k], f(), data[0].text1.text];`
        ),
        runjs('q2', 'return 1;', {
          enableTransformation: true,
          transformation: "const k = 'id'; return components.listview1[k];",
        }),
      ],
    });
    await ready();
    LIMITS.backgroundMs = 0;
    state().debugger.clear();
    const materialize = jest.spyOn(state(), 'materializeListviewRows');
    const shown = (id) => state().getResolvedComponent(id, null, MODULE_ID).properties.text;
    await waitFor(() => expect(shown('out1')).toBe('undefined'));
    await waitFor(() => expect(shown('out2')).toBe('lv1'));
    await run('q1');
    expect(queryData('q1')).toEqual(['lv1', 'lv1', 'lv1', 1, 'row 0']);
    await run('q2');
    expect(queryData('q2')).toBe('lv1');
    expect(materialize).not.toHaveBeenCalled();
    expect(errors()).toEqual([]);
  });

  test(
    'a RunJS returning the ListView entry stores every row as plain frozen objects',
    async () => {
      renderListview(ROWS, { queries: [runjs('q1', 'return components.listview1;')] });
      await ready();
      await run('q1');
      const stored = queryData('q1');
      expect(stored.id).toBe('lv1');
      expect(Object.keys(stored.children)).toHaveLength(3000);
      expect(Object.keys(stored.data)).toHaveLength(3000);
      expect(stored.data[2900].text1.text).toBe('row 2900');
      expect(
        [stored, stored.children, stored.data, stored.children[2900], stored.data[2900]].every(Object.isFrozen)
      ).toBe(true);
      expect(holdsAccessor(stored) || holdsProxy(stored)).toBe(false);
    },
    WHOLE_MS
  );

  test('`components` used whole or by a computed name reads the drawn rows, as before: nothing made ready', async () => {
    renderListview(ROWS, {
      queries: [
        runjs('q1', 'return components;'),
        runjs('q2', 'return Object.keys(JSON.parse(JSON.stringify(components)).listview1.data).length;'),
        runjs(
          'q3',
          "return [components['text' + '1'] === components.text1, Object.keys(components['list' + 'view1'].data).length];"
        ),
        runjs('q4', 'return 1;', {
          enableTransformation: true,
          transformation:
            "return Object.keys(Object.values(components).find((entry) => entry.id === 'lv1').data).length;",
        }),
      ],
    });
    await ready();
    const materialize = jest.spyOn(state(), 'materializeListviewRows');
    const prepare = jest.spyOn(scriptsEngine, 'prepareScript');
    const drawn = Object.keys(listview().data).length;
    expect(drawn).toBeLessThan(3000);
    await run('q1');
    expect(Object.keys(queryData('q1').listview1.data)).toHaveLength(drawn);
    await run('q2');
    expect(queryData('q2')).toBe(drawn);
    await run('q3');
    expect(queryData('q3')).toEqual([true, drawn]);
    await run('q4');
    expect(queryData('q4')).toBe(drawn);
    expect(materialize).not.toHaveBeenCalled();
    expect(prepare).not.toHaveBeenCalled();
  });

  test('a script not naming the ListView, though a comment or a string does, runs as it always did: nothing prepared', async () => {
    const out = componentDefinition('out1', 'outside1', 'Text', { text: binding('hi') });
    renderListview(ROWS, {
      extra: { out1: out },
      queries: [
        runjs(
          'q1',
          `// refresh listview1 later
           const name = 'listview1';
           return [name, components.outside1, components.text1, components.listview1.id];`
        ),
        runjs('q2', 'return 1;', {
          enableTransformation: true,
          transformation: '/* listview1 */ return [`listview1`, components.outside1.text];',
        }),
      ],
    });
    await ready();
    const prepare = jest.spyOn(scriptsEngine, 'prepareScript');
    const code = (id) => state().dataQuery.queries.modules[MODULE_ID].find((query) => query.id === id).options;
    expect(scriptsEngine.scriptReadsOf(useStore.getState, code('q1').code, MODULE_ID)).toBeNull();
    expect(scriptsEngine.scriptReadsOf(useStore.getState, code('q2').transformation, MODULE_ID)).toBeNull();
    await run('q1');
    const exposed = state().resolvedStore.modules[MODULE_ID].exposedValues.components;
    // The store's entries themselves, not copies.
    expect(queryData('q1')).toEqual(['listview1', exposed.out1, exposed.txt1, 'lv1']);
    expect(queryData('q1')[1]).toBe(exposed.out1);
    await run('q2');
    expect(queryData('q2')).toEqual(['listview1', exposed.out1.text]);
    expect(prepare).not.toHaveBeenCalled();
    expect(errors()).toEqual([]);
  });

  test('a script reading a row with an icon child waits while it is drawn, instead of failing', async () => {
    renderListview(ROWS, {
      icon: true,
      queries: [
        runjs(
          'q1',
          'const row = components.listview1.children[2900]; return [typeof row.icon1.click, row.text1.text];'
        ),
      ],
    });
    await ready();
    expect(state().uncomputedRowChildren('lv1', 2900, MODULE_ID)).toEqual(['ico1']);
    const ensure = jest.spyOn(state(), 'ensureRowMounted');
    const materialize = jest.spyOn(state(), 'materializeListviewRows');
    // Not awaited inside act(): a row drawn for it renders only outside of act's scope.
    state().queryPanel.runQuery('q1', 'q1', undefined, 'view', {}, undefined, undefined, false, false, MODULE_ID);
    await waitFor(() => expect(queryData('q1')).toEqual(['function', 'row 2900']));
    expect(ensure).toHaveBeenCalledWith('lv1', 2900, MODULE_ID);
    expect(materialize).not.toHaveBeenCalled();
  });

  test('a script reading every row with an icon child waits while they are read in the background, instead of failing', async () => {
    const rows = ROWS.slice(0, 700); // 3 children: windowed above 666 rows
    renderListview(rows, {
      icon: true,
      queries: [runjs('q1', 'return Object.values(components.listview1.data).filter((row) => row.icon1).length;')],
    });
    await ready();
    const materialize = jest.spyOn(state(), 'materializeListviewRows');
    state().debugger.clear();
    state().queryPanel.runQuery('q1', 'q1', undefined, 'view', {}, undefined, undefined, false, false, MODULE_ID);
    await waitFor(() => expect(queryData('q1')).toBe(700), { timeout: 55000 });
    // Read in the background (not at once), and nothing failed.
    expect(materialize).toHaveBeenCalledTimes(1);
    expect(materialize.mock.calls[0][1]).not.toEqual(expect.objectContaining({ mode: 'sync' }));
    expect(errors()).toEqual([]);
  }, 60000);

  test('a binding to a row never drawn shows its value: never undefined, read without drawing it', async () => {
    const out = componentDefinition('out1', 'outside1', 'Text', {
      text: binding('{{components.listview1.data[2900].text1.text}}'),
    });
    renderListview(ROWS, { extra: { out1: out } });
    await mounted();
    await waitFor(() => expect(state().getResolvedComponent('out1', null, MODULE_ID).properties.text).toBe('row 2900'));
    expect(renderedRows()).not.toContain(2900);
  });

  test('a binding to a row that must be drawn keeps its value until it is, then shows it', async () => {
    const seen = [];
    const unsubscribe = useStore.subscribe(() => {
      const properties = state().resolvedStore.modules[MODULE_ID]?.components?.out1?.properties;
      if (properties && 'text' in properties && seen[seen.length - 1] !== properties.text) seen.push(properties.text);
    });
    const out = componentDefinition('out1', 'outside1', 'Text', {
      text: binding('{{components.listview1.data[2900].text1.text}}'),
    });
    renderListview(ROWS, { icon: true, extra: { out1: out } });
    await mounted();
    await waitFor(() => expect(state().getResolvedComponent('out1', null, MODULE_ID).properties.text).toBe('row 2900'));
    unsubscribe();
    // What it showed before the list had rows (its expression failed: ''), then the row's value: never undefined, nor
    // what the row's widgets showed while they mounted (the template row's values).
    expect(seen).toEqual(['', 'row 2900']);
    // Drawn for it, and kept drawn (pinned).
    expect(renderedRows()).toContain(2900);
  });

  test(
    'a binding reading the whole list shows it once read; refused, it keeps its value and logs it once',
    async () => {
      const out = componentDefinition('out1', 'outside1', 'Text', {
        text: binding('{{Object.keys(components.listview1.data).length}}'),
      });
      renderListview(ROWS, { extra: { out1: out } });
      await ready();
      const shown = () => String(state().getResolvedComponent('out1', null, MODULE_ID).properties.text);
      await waitFor(() => expect(shown()).toBe('3000'));

      LIMITS.backgroundMs = 0;
      state().debugger.clear();
      await act(async () => state().setVariable('rows', ROWS.slice(0, 2500), MODULE_ID));
      await ready();
      await waitFor(() => expect(errors()).toHaveLength(1));
      // Read again as the user scrolls (its children change): the same refusal, not logged again.
      await scrollTo(1000 * ROW_HEIGHT);
      await scrollTo(2000 * ROW_HEIGHT);
      await act(() => new Promise((resolve) => setTimeout(resolve, 200)));
      expect(shown()).toBe('3000');
      expect(errors()).toHaveLength(1);
      expect(errors()[0].message).toMatch(/listview1 has 2,500 rows: reading all of its data takes about/);
      expect(errors()[0].key).toBe('outside1 - properties.text');
    },
    WHOLE_MS
  );

  test(
    "a query's options reading the whole list send every row; over the limits it fails, saying why",
    async () => {
      const send = jest.spyOn(dataqueryService, 'run').mockResolvedValue({ status: 'ok', data: { ok: true } });
      renderListview(ROWS, {
        queries: [
          {
            id: 'q1',
            name: 'q1',
            kind: 'restapi',
            options: { method: 'post', url: 'https://example.com', body: '{{components.listview1.data}}' },
          },
        ],
      });
      await ready();

      await run('q1');
      await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
      const options = send.mock.calls[0][1];
      const sent = JSON.parse(JSON.stringify(options))['{{components.listview1.data}}'];
      expect(Object.keys(sent)).toHaveLength(3000);
      expect(sent[2900].text1.text).toBe('row 2900');
      expect(queryData('q1')).toEqual({ ok: true });

      // Rows changed: read again, and refused.
      LIMITS.backgroundMs = 0;
      await act(async () =>
        state().setVariable(
          'rows',
          ROWS.map((row) => ({ ...row })),
          MODULE_ID
        )
      );
      await ready();
      state().debugger.clear();
      let result;
      await act(async () => {
        result = await state().queryPanel.runQuery(
          'q1',
          'q1',
          undefined,
          'view',
          {},
          undefined,
          undefined,
          false,
          false
        );
      });
      expect(result).toEqual({ status: 'failed', message: expect.stringContaining('listview1 has 3,000 rows') });
      expect(send).toHaveBeenCalledTimes(1);
      const [log, ...more] = errors();
      expect(more).toEqual([]);
      expect(log.message).toContain('Use its source data instead (variables.rows)');
    },
    WHOLE_MS
  );

  test('a control-component action from a row runs on that data row; from outside the list, on row 0', async () => {
    renderListview(ROWS);
    await mounted();
    state().eventsSlice.setEvents([control('evt-row', 'btn1', 'txt1', '{{"set from " + listItem.name}}')], MODULE_ID);

    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).toContain(2004));
    await waitFor(() => expect(listview().children[2004]?.button1?.click).toBeInstanceOf(Function));
    const slots = state().resolvedStore.modules[MODULE_ID].listviewSlots.lv1;
    expect(slots.indexOf(2004)).not.toBe(2004);
    await act(async () => {
      fireEvent.click(rowElement(2004).querySelector('button'));
    });
    await drain();
    await waitFor(() => expect(rowElement(2004).textContent).toContain('set from row 2004'));
    expect(listview().children[2004].text1.text).toBe('set from row 2004');
    // The row drawn in slot 2004 (if any), and the row in the slot it fired from in a list of all rows, are untouched.
    expect(state().readListviewRow('lv1', slots.indexOf(2004), MODULE_ID).text1.text).not.toContain('set from');

    // From outside any row: row 0, not drawn now.
    await act(async () => {
      await state().eventsSlice.executeAction(
        control('evt-outside', 'out1', 'txt1', 'set from outside'),
        'view',
        {},
        MODULE_ID,
        null
      );
    });
    await drain();
    expect(renderedRows()).not.toContain(0);
    expect(state().readListviewRow('lv1', 0, MODULE_ID).text1.text).toBe('set from outside');
    expect(listview().children[0].text1.text).toBe('set from outside');
  });

  test("an event's params reading a row that must be drawn: drawn for them first", async () => {
    renderListview(ROWS, { icon: true });
    await ready();
    expect(renderedRows()).not.toContain(2900);
    execute(setVariable('row', '{{components.listview1.data[2900].text1.text}}'));
    await waitFor(() => expect(state().getVariable('row', MODULE_ID)).toBe('row 2900'));
    expect(renderedRows()).toContain(2900);
  });

  test("an event's params reading the whole list; refused, the action fails and logs why", async () => {
    renderListview(ROWS);
    await ready();
    execute(setVariable('count', '{{Object.keys(components.listview1.data).length}}'));
    await waitFor(() => expect(state().getVariable('count', MODULE_ID)).toBe(3000));

    LIMITS.backgroundMs = 0;
    await act(async () => state().setVariable('rows', ROWS.slice(0, 2500), MODULE_ID));
    await ready();
    state().debugger.clear();
    const error = await execute(setVariable('count', '{{Object.keys(components.listview1.data).length}}')).catch(
      (thrown) => thrown
    );
    expect(error.message).toMatch(/listview1 has 2,500 rows: reading all of its data takes about/);
    expect(state().getVariable('count', MODULE_ID)).toBe(3000);
    expect(errors()).toHaveLength(1);
  });

  test('a debounced event waiting for its rows runs once they are, without waiting its debounce again', async () => {
    renderListview(ROWS, { icon: true });
    await ready();
    const now = jest.spyOn(state().eventsSlice.executeAction, 'now');
    await act(async () => {
      state().eventsSlice.executeAction(
        { id: 'debounced', ...setVariable('row', '{{components.listview1.data[2900].text1.text}}', { debounce: 50 }) },
        'view',
        {},
        MODULE_ID,
        null
      );
    });
    await waitFor(() => expect(state().getVariable('row', MODULE_ID)).toBe('row 2900'));
    expect(now).toHaveBeenCalledTimes(1);
  });

  test("what an action carries isn't read for templates: a script's value is set as it is, nothing read", async () => {
    renderListview(ROWS, {
      queries: [runjs('q1', 'await actions.setVariable("x", { s: "{{components.listview1.data}}" }); return 1;')],
    });
    await ready();
    const materialize = jest.spyOn(state(), 'materializeListviewRows');
    await run('q1');
    expect(state().getVariable('x', MODULE_ID)).toEqual({ s: '{{components.listview1.data}}' });
    expect(materialize).not.toHaveBeenCalled();
  });

  test("a query's options reading a row that must be drawn: drawn first, then sent", async () => {
    const send = jest.spyOn(dataqueryService, 'run').mockResolvedValue({ status: 'ok', data: { ok: true } });
    renderListview(ROWS, { icon: true, queries: [restapi('q1', '{{components.listview1.data[2900].text1.text}}')] });
    await ready();
    expect(renderedRows()).not.toContain(2900);
    state().queryPanel.runQuery('q1', 'q1', undefined, 'view', {}, undefined, undefined, false, false, MODULE_ID);
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(JSON.parse(JSON.stringify(send.mock.calls[0][1]))['{{components.listview1.data[2900].text1.text}}']).toBe(
      'row 2900'
    );
  });

  test("the editor's preview of a query reading the whole list sends every row", async () => {
    const preview = jest.spyOn(dataqueryService, 'preview').mockResolvedValue({ status: 'ok', data: { ok: true } });
    renderListview(ROWS);
    await ready();
    await act(async () => {
      await state().queryPanel.previewQuery(restapi('q2', '{{components.listview1.data}}'), false, {}, MODULE_ID);
    });
    expect(preview).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(JSON.stringify(preview.mock.calls[0][1]))['{{components.listview1.data}}'];
    expect(Object.keys(sent)).toHaveLength(3000);
  });

  test('a binding whose index is an expression follows it, to rows not drawn', async () => {
    state().setVariable('i', 2900, MODULE_ID);
    const out = componentDefinition('out1', 'outside1', 'Text', {
      text: binding('{{components.listview1.data[variables.i].text1.text}}'),
    });
    renderListview(ROWS, { extra: { out1: out } });
    await mounted();
    const shown = () => state().getResolvedComponent('out1', null, MODULE_ID).properties.text;
    await waitFor(() => expect(shown()).toBe('row 2900'));
    await act(async () => state().setVariable('i', 2950, MODULE_ID));
    await waitFor(() => expect(shown()).toBe('row 2950'));
  });

  test('a control-component action on a widget in a container of the row, from a widget there: that data row', async () => {
    const inRow = (def, parent) => {
      def.component.parent = parent;
      def.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
      return def;
    };
    const props = { visibility: binding('{{true}}'), disabledState: binding('{{false}}') };
    renderListview(ROWS, {
      extra: {
        ctr1: inRow(componentDefinition('ctr1', 'container1', 'Container', props), 'lv1'),
        txt2: inRow(
          componentDefinition('txt2', 'text2', 'Text', { ...props, text: binding('{{listItem.name}}') }),
          'ctr1'
        ),
        btn2: inRow(componentDefinition('btn2', 'button2', 'Button', { ...props, text: binding('go') }), 'ctr1'),
      },
    });
    await mounted();
    state().eventsSlice.setEvents([control('evt-row', 'btn2', 'txt2', '{{"set from " + listItem.name}}')], MODULE_ID);
    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(rowElement(2004)?.querySelectorAll('button').length).toBe(2));
    const slots = state().resolvedStore.modules[MODULE_ID].listviewSlots.lv1;
    expect(slots.indexOf(2004)).not.toBe(2004);
    await act(async () => {
      fireEvent.click([...rowElement(2004).querySelectorAll('button')].find((b) => b.textContent.includes('go')));
    });
    await drain();
    await waitFor(() => expect(rowElement(2004).textContent).toContain('set from row 2004'));

    // From outside the list: data row 0, drawn for it (not whatever row slot 0 shows).
    expect(renderedRows()).not.toContain(0);
    const zero = slots[0];
    execute(control('evt-outside', 'out1', 'txt2', 'set from outside'));
    await waitFor(() => expect(rowElement(0)?.textContent).toContain('set from outside'));
    if (rowElement(zero)) expect(rowElement(zero).textContent).not.toContain('set from outside');
  });

  test('a control-component action from a row runs on the data row it fired in, though that row scrolled away first', async () => {
    renderListview(ROWS);
    await mounted();
    const debounced = control('evt-row', 'btn1', 'txt1', '{{"set from " + listItem.name}}');
    debounced.event.debounce = 300;
    state().eventsSlice.setEvents([debounced], MODULE_ID);
    const slotsNow = () => state().resolvedStore.modules[MODULE_ID].listviewSlots.lv1;

    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(listview().children[2004]?.button1?.click).toBeInstanceOf(Function));
    const slot = slotsNow().indexOf(2004);
    await act(async () => {
      fireEvent.click(rowElement(2004).querySelector('button'));
    });
    // Scrolled away while the action waits (its debounce): its slot shows another row by the time it runs.
    await scrollTo(1000 * ROW_HEIGHT);
    await waitFor(() => expect(slotsNow()[slot]).not.toBe(2004));
    const other = slotsNow()[slot];
    await act(() => new Promise((resolve) => setTimeout(resolve, 500)));
    await drain();
    expect(renderedRows()).not.toContain(2004);
    expect(state().readListviewRow('lv1', 2004, MODULE_ID).text1.text).toBe('set from row 2004');
    if (other >= 0) expect(state().readListviewRow('lv1', other, MODULE_ID).text1.text).toBe(`row ${other}`);
  });

  test('a whole-list read that fails for a reason of its own fails the query once, saying why: not read again', async () => {
    const send = jest.spyOn(dataqueryService, 'run').mockResolvedValue({ status: 'ok', data: { ok: true } });
    renderListview(ROWS, { queries: [restapi('q1', '{{components.listview1.data}}')] });
    await ready();
    // Read again (the bug), it would fail forever: after 20 reads it waits, and the query never settles.
    const materialize = jest
      .spyOn(state(), 'materializeListviewRows')
      .mockImplementation(() =>
        materialize.mock.calls.length > 20 ? new Promise(() => {}) : Promise.reject(new TypeError('boom'))
      );
    state().debugger.clear();
    let result;
    await act(async () => {
      result = await state().queryPanel.runQuery('q1', 'q1', undefined, 'view', {}, undefined, undefined, false, false);
    });
    expect(result).toEqual({
      status: 'failed',
      message: expect.stringContaining("Reading listview1's rows failed: boom"),
    });
    expect(materialize).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
    expect(state().resolvedStore.modules[MODULE_ID].exposedValues.queries.q1.isLoading).toBe(false);
  });

  test("a binding naming the entry's key by an expression reads every row when it names its rows", async () => {
    state().setVariable('key', 'data', MODULE_ID);
    const out = componentDefinition('out1', 'outside1', 'Text', {
      text: binding('{{Object.keys(components.listview1[variables.key]).length}}'),
    });
    renderListview(ROWS, { extra: { out1: out } });
    await ready();
    const shown = () => String(state().getResolvedComponent('out1', null, MODULE_ID).properties.text);
    await waitFor(() => expect(shown()).toBe('3000'));
  });

  test('a binding reading the whole list is read once: not again as the user scrolls', async () => {
    const out = componentDefinition('out1', 'outside1', 'Text', {
      text: binding('{{Object.keys(components.listview1.data).length}}'),
    });
    renderListview(ROWS, { extra: { out1: out } });
    await ready();
    const shown = () => String(state().getResolvedComponent('out1', null, MODULE_ID).properties.text);
    await waitFor(() => expect(shown()).toBe('3000'));
    const materialize = jest.spyOn(state(), 'materializeListviewRows');
    for (const row of [1000, 2000, 500]) {
      await scrollTo(row * ROW_HEIGHT);
      await waitFor(() => expect(renderedRows()).toContain(row + 2));
    }
    await act(() => new Promise((resolve) => setTimeout(resolve, 200)));
    expect(materialize).not.toHaveBeenCalled();
    expect(shown()).toBe('3000');
  });

  test("a query's options reading more rows that must be drawn than the ListView keeps drawn: each drawn once, then sent", async () => {
    const send = jest.spyOn(dataqueryService, 'run').mockResolvedValue({ status: 'ok', data: { ok: true } });
    const rows = Array.from({ length: 70 }, (_, i) => 1000 + 3 * i);
    const body = `{{[${rows.map((row) => `components.listview1.data[${row}].text1.text`).join(', ')}]}}`;
    renderListview(ROWS, { icon: true, queries: [restapi('q1', body)] });
    await ready();
    const ensure = jest.spyOn(state(), 'ensureRowMounted');
    state().queryPanel.runQuery('q1', 'q1', undefined, 'view', {}, undefined, undefined, false, false, MODULE_ID);
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1), { timeout: 30000 });
    expect(JSON.parse(JSON.stringify(send.mock.calls[0][1]))[body]).toEqual(rows.map((row) => `row ${row}`));
    expect(ensure).toHaveBeenCalledTimes(70);
  }, 40000);

  test(
    "a query's options passing the ListView's entry send every row; `components` whole, the drawn rows as before",
    async () => {
      const send = jest.spyOn(dataqueryService, 'run').mockResolvedValue({ status: 'ok', data: { ok: true } });
      const out = componentDefinition('out1', 'outside1', 'Text', { text: binding('hi') });
      renderListview(ROWS, {
        extra: { out1: out },
        queries: [restapi('q1', '{{components.listview1}}'), restapi('q2', '{{components}}')],
      });
      await ready();
      await run('q1');
      await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
      const sent = JSON.parse(JSON.stringify(send.mock.calls[0][1]))['{{components.listview1}}'];
      expect(Object.keys(sent.data)).toHaveLength(3000);
      expect(sent.children[2900].text1.text).toBe('row 2900');

      // `components` whole names no ListView: sent at once, as the store holds it (its drawn rows), nothing read.
      const materialize = jest.spyOn(state(), 'materializeListviewRows');
      const exposed = state().resolvedStore.modules[MODULE_ID].exposedValues.components;
      await run('q2');
      await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
      const all = JSON.parse(JSON.stringify(send.mock.calls[1][1]))['{{components}}'];
      expect(all).toEqual(JSON.parse(JSON.stringify(exposed)));
      expect(Object.keys(all.lv1.data).length).toBeLessThan(3000);
      expect(materialize).not.toHaveBeenCalled();
    },
    WHOLE_MS
  );

  test('`components` used whole by a binding, getResolvedValue or an event: as before; naming the ListView, every row', async () => {
    const out = (id, name) => componentDefinition(id, name, 'Text', { text: binding('hi') });
    renderListview(ROWS, { extra: { out1: out('out1', 'outside1'), out2: out('out2', 'outside2') } });
    await ready();
    const exposed = () => state().resolvedStore.modules[MODULE_ID].exposedValues.components;
    const ids = Object.keys(exposed());
    const shown = (id) => state().getResolvedComponent(id, null, MODULE_ID).properties.text;
    // Set as the editor sets a property (ids in it, as the store resolves it).
    const bind = (id, template) =>
      state().setValueToComponent(id, 'properties', 'text', undefined, template, template, false, MODULE_ID);
    bind('out1', '{{Object.keys(components).join(",")}}');
    bind(
      'out2',
      '{{String(Object.getPrototypeOf(components) === Object.prototype) + ":" + Object.keys(components.lv1.data).length}}'
    );
    await waitFor(() => expect(shown('out1')).toBe(ids.join(',')));
    await waitFor(() => expect(shown('out2')).toBe('true:3000'));
    expect(storeHoldsProxy()).toBe(false);
    // Resolved at once: the store's components themselves, its drawn rows, though a read of every row holds.
    const materialize = jest.spyOn(state(), 'materializeListviewRows');
    expect(state().getResolvedValue('{{Object.keys(components)}}', {}, MODULE_ID)).toEqual(ids);
    expect(state().getResolvedValue('{{components}}', {}, MODULE_ID)).toBe(exposed());
    expect(state().getResolvedValue('{{JSON.stringify(components).length}}', {}, MODULE_ID)).toBe(
      JSON.stringify(exposed()).length
    );
    // An event's params.
    await execute(setVariable('names', '{{Object.keys(components).join(",")}}'));
    expect(state().getVariable('names', MODULE_ID)).toBe(ids.join(','));
    expect(materialize).not.toHaveBeenCalled();
  });

  test("`components` resolved at once while its ListView is not read: the store's components as they are", async () => {
    renderListview(ROWS);
    await ready();
    const exposed = state().resolvedStore.modules[MODULE_ID].exposedValues.components;
    expect(state().getResolvedValue('{{Object.keys(components)}}', {}, MODULE_ID)).toEqual(Object.keys(exposed));
    expect(state().getResolvedValue('{{components}}', {}, MODULE_ID)).toBe(exposed);
  });

  test(
    'a transformation returning `components` whole, or the entry, stores plain data with every row: no accessor, no Proxy',
    async () => {
      renderListview(ROWS, {
        queries: [
          runjs('q1', 'return 1;', {
            enableTransformation: true,
            transformation: "const n = 'listview1'; return { all: components, n, lv: components.listview1 };",
          }),
        ],
      });
      await ready();
      await run('q1');
      const stored = queryData('q1');
      expect(stored.n).toBe('listview1');
      expect(holdsAccessor(stored)).toBe(false);
      expect(holdsProxy(stored)).toBe(false);
      expect(stored.all.listview1.id).toBe('lv1');
      // Every row, not the drawn ones, in the entry returned and in `components` whole.
      expect(Object.keys(listview().data).length).toBeLessThan(3000);
      expect(Object.keys(stored.lv.data)).toHaveLength(3000);
      expect(stored.lv.children[2900].text1.text).toBe('row 2900');
      expect(Object.keys(stored.all.listview1.data)).toHaveLength(3000);
    },
    WHOLE_MS
  );

  test(
    "a script returning or passing on the ListView's entry gives every row; refused, it fails saying why",
    async () => {
      renderListview(ROWS, {
        queries: [
          runjs(
            'q1',
            `actions.setVariable('lv', components.listview1);
           await components.text1[3].setText({ lv: components.listview1 });
           await queries.q3.run({ p: components.listview1 });
           return { lv: components.listview1 };`
          ),
          runjs('q2', 'return components.listview1;'),
          runjs('q3', 'return Object.keys(parameters.p.data).length;', {
            parameters: [{ name: 'p', defaultValue: '' }],
          }),
        ],
      });
      await ready();
      expect(Object.keys(listview().data).length).toBeLessThan(3000);
      await run('q1');
      await drain();
      const stored = queryData('q1');
      expect(storeHoldsProxy()).toBe(false);
      expect(holdsAccessor(stored)).toBe(false);
      expect(Object.keys(stored.lv.data)).toHaveLength(3000);
      expect(stored.lv.children[2900].text1.text).toBe('row 2900');
      expect(stored.lv.id).toBe('lv1');
      expect(Object.keys(state().getVariable('lv', MODULE_ID).data)).toHaveLength(3000);
      const text = state().resolvedStore.modules[MODULE_ID].exposedValues.components.txt1[3].text;
      expect(Object.keys(text.lv.children)).toHaveLength(3000);
      expect(queryData('q3')).toBe(3000);

      // Rows changed: read again, and refused.
      LIMITS.backgroundMs = 0;
      await act(async () => state().setVariable('rows', ROWS.slice(0, 2900), MODULE_ID));
      await ready();
      let result;
      await act(async () => {
        result = await state().queryPanel.runQuery(
          'q2',
          'q2',
          undefined,
          'view',
          {},
          undefined,
          undefined,
          false,
          false
        );
      });
      expect(result.message).toContain('listview1 has 2,900 rows');
    },
    WHOLE_MS
  );

  test("a binding whose index is a callback's variable reads every row", async () => {
    const text = (id, name, variable) =>
      componentDefinition(id, name, 'Text', {
        text: binding(
          `{{[5, 2900].map((${variable}) => components.listview1.data[${variable}]?.text1?.text).join(",")}}`
        ),
      });
    // `page` is a global too: the callback's, not it, is the index.
    renderListview(ROWS, { extra: { out1: text('out1', 'outside1', 'i'), out2: text('out2', 'outside2', 'page') } });
    await ready();
    const shown = (id) => state().getResolvedComponent(id, null, MODULE_ID).properties.text;
    await waitFor(() => expect(shown('out1')).toBe('row 5,row 2900'));
    await waitFor(() => expect(shown('out2')).toBe('row 5,row 2900'));
  });

  test('a widget in the rows bound to a row that must be drawn keeps its value until it is, set or resolved again', async () => {
    const props = {
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      textFormat: binding('plainText'),
      disabledState: binding('{{false}}'),
    };
    const txt3 = nest(
      componentDefinition('txt3', 'text3', 'Text', {
        ...props,
        text: binding('{{components.listview1.data[2900].text1.text}}'),
      })
    );
    const seen = [];
    const unsubscribe = useStore.subscribe(() => {
      const text = state().getResolvedComponent('txt3', 0, MODULE_ID)?.properties?.text;
      if (text !== undefined || seen.length) if (seen[seen.length - 1] !== text) seen.push(text);
    });
    renderListview(ROWS, { icon: true, extra: { txt3 } });
    await mounted();
    const shown = () => state().getResolvedComponent('txt3', 0, MODULE_ID)?.properties?.text;
    await waitFor(() => expect(shown()).toBe('row 2900'));
    // Edited (the editor sets the property): row 2950, drawn first, its rows keeping 'row 2900' meanwhile.
    await act(async () =>
      state().setComponentProperty(
        'txt3',
        'text',
        '{{components.listview1.data[2950].text1.text}}',
        'properties',
        'value',
        false,
        MODULE_ID,
        { saveAfterAction: false }
      )
    );
    await waitFor(() => expect(shown()).toBe('row 2950'));
    unsubscribe();
    expect(seen.slice(seen.indexOf('row 2900'))).toEqual(['row 2900', 'row 2950']);
    expect(seen).not.toContain(undefined);
  });

  test("an action whose runOnlyIf is false is skipped before its params' rows are read; one reading rows reads them first", async () => {
    renderListview(ROWS);
    await ready();
    LIMITS.backgroundMs = 0;
    const materialize = jest.spyOn(state(), 'materializeListviewRows');
    state().debugger.clear();
    const skipped = await execute(
      setVariable('count', '{{Object.keys(components.listview1.data).length}}', { runOnlyIf: '{{false}}' })
    );
    expect(skipped).toBe(false);
    expect(materialize).not.toHaveBeenCalled();
    expect(errors()).toEqual([]);

    execute(setVariable('row', 'yes', { runOnlyIf: '{{components.listview1.data[2900].text1.text === "row 2900"}}' }));
    await waitFor(() => expect(state().getVariable('row', MODULE_ID)).toBe('yes'));
  });

  test("a disabled query reads none of its options' rows; its disable expression reads a row not drawn", async () => {
    const send = jest.spyOn(dataqueryService, 'run').mockResolvedValue({ status: 'ok', data: { ok: true } });
    const query = restapi('q1', '{{components.listview1.data}}');
    query.options.disableQuery = '{{components.listview1.data[2900].text1.text === "row 2900"}}';
    renderListview(ROWS, { queries: [query] });
    await ready();
    const materialize = jest.spyOn(state(), 'materializeListviewRows');
    state().debugger.clear();
    await run('q1');
    await drain();
    expect(materialize).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(state().debugger.logs.map((log) => log.message)).toContain('Query skipped');
  });

  test('only a ListView a template read rows of that it does not draw is resolved again when its rows change', async () => {
    const out = componentDefinition('out1', 'outside1', 'Text', {
      text: binding('{{components.listview1.data[0].text1.text}}'),
    });
    renderListview(ROWS, { extra: { out1: out } });
    await mounted();
    await waitFor(() => expect(state().getResolvedComponent('out1', null, MODULE_ID).properties.text).toBe('row 0'));
    expect(prepareEngine.readByTemplates('lv1', MODULE_ID)).toBe(false);
    state().setValueToComponent(
      'out1',
      'properties',
      'text',
      undefined,
      '{{components.lv1.data[2900].text1.text}}',
      '{{components.lv1.data[2900].text1.text}}',
      false,
      MODULE_ID
    );
    expect(prepareEngine.readByTemplates('lv1', MODULE_ID)).toBe(true);
  });

  test("a script holding the ListView's entry in a variable, or passing it through `||`/`??`, reading no rows: as before", async () => {
    renderListview(ROWS, {
      queries: [
        runjs(
          'q1',
          `const lv = components.listview1;
           const x = components.listview1 || {};
           const { id, ...rest } = components.listview1;
           const guarded = components.listview1 && components.listview1.id;
           return [lv.id, x.id, id, guarded, (components.listview1 ?? {}).id];`
        ),
        runjs('q2', 'return 1;', {
          enableTransformation: true,
          transformation: 'const lv = components.listview1; return lv.id;',
        }),
      ],
    });
    await ready();
    const materialize = jest.spyOn(state(), 'materializeListviewRows');
    const prepare = jest.spyOn(scriptsEngine, 'prepareScript');
    await run('q1');
    expect(queryData('q1')).toEqual(['lv1', 'lv1', 'lv1', 'lv1', 'lv1']);
    await run('q2');
    expect(queryData('q2')).toBe('lv1');
    expect(materialize).not.toHaveBeenCalled();
    expect(prepare).not.toHaveBeenCalled();
  });

  test('a script binding its own `components` runs as it always did: nothing read of the real ListView', async () => {
    renderListview(ROWS, {
      queries: [
        runjs(
          'q1',
          '{ const components = { listview1: { data: [1, 2] } }; return Object.keys(components.listview1.data).length; }'
        ),
      ],
    });
    await ready();
    const materialize = jest.spyOn(state(), 'materializeListviewRows');
    const prepare = jest.spyOn(scriptsEngine, 'prepareScript');
    await run('q1');
    expect(queryData('q1')).toBe(2);
    expect(materialize).not.toHaveBeenCalled();
    expect(prepare).not.toHaveBeenCalled();
  });

  test('a transformation reading a row with an icon child waits while it is drawn, then reads it', async () => {
    renderListview(ROWS, {
      icon: true,
      queries: [
        runjs('q1', 'return 1;', {
          enableTransformation: true,
          transformation: `const row = components.listview1.children[2900];
            return [row.text1.text, typeof row.icon1.click, components.listview1.data[0].text1.text];`,
        }),
      ],
    });
    await ready();
    expect(renderedRows()).not.toContain(2900);
    const ensure = jest.spyOn(state(), 'ensureRowMounted');
    // Not awaited inside act(): a row drawn for it renders only outside of act's scope.
    state().queryPanel.runQuery('q1', 'q1', undefined, 'view', {}, undefined, undefined, false, false, MODULE_ID);
    await waitFor(() => expect(queryData('q1')).toEqual(['row 2900', 'function', 'row 0']));
    expect(ensure).toHaveBeenCalledWith('lv1', 2900, MODULE_ID);
    expect(errors()).toEqual([]);
  });

  test('a transformation reading every row, refused, fails the query saying why', async () => {
    renderListview(ROWS, {
      queries: [
        runjs('q1', 'return 1;', {
          enableTransformation: true,
          transformation: 'return Object.keys(components.listview1.data).length;',
        }),
      ],
    });
    await ready();
    LIMITS.backgroundMs = 0;
    state().debugger.clear();
    let result;
    await act(async () => {
      result = await state().queryPanel.runQuery('q1', 'q1', undefined, 'view', {}, undefined, undefined, false, false);
    });
    expect(result.status).toBe('failed');
    expect(result.data.message).toMatch(/listview1 has 3,000 rows: reading all of its data takes about/);
    // Logged once, as a transformation that throws is (the query failed, and why), and it never ran on the drawn rows.
    expect(errors().map((log) => log.type)).toEqual(['query', 'transformation']);
    expect(errors()[1].error.message).toMatch(/listview1 has 3,000 rows: reading all of its data takes about/);
    expect(queryData('q1')).toEqual([]);
  });

  test('a run whose rows keep changing while they are read fails, saying so, instead of reading the drawn rows', async () => {
    renderListview(ROWS, { queries: [runjs('q1', 'return Object.keys(components.listview1.data).length;')] });
    await ready();
    const materialize = jest
      .spyOn(state(), 'materializeListviewRows')
      .mockImplementation(() => Promise.reject(new MaterializationError('changed', 'changed while read')));
    let result;
    await act(async () => {
      result = await state().queryPanel.runQuery('q1', 'q1', undefined, 'view', {}, undefined, undefined, false, false);
    });
    expect(result.message).toBe("listview1's rows kept changing while they were read.");
    expect(materialize).toHaveBeenCalledTimes(6); // the first read, and one after each of the 5 waits
  });

  test("a run's `components` returned, read after the run: the store's entries, frozen, as before", async () => {
    renderListview(ROWS, {
      queries: [runjs('q1', 'const row = components.listview1.data[2900]; return [row.text1.text, components];')],
    });
    await mounted();
    await run('q1');
    expect(queryData('q1')[0]).toBe('row 2900');
    await scrollTo(1500 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).toContain(1502));
    const later = queryData('q1')[1].listview1;
    expect(later).toBe(listview());
    expect(Object.isFrozen(later) && Object.isFrozen(later.children)).toBe(true);
    expect(later.data[2900]).toBeUndefined();
  });

  test(
    "a run whose action replaces the ListView's rows then reads the new rows, not what was read before",
    async () => {
      renderListview(ROWS, {
        queries: [
          runjs(
            'q1',
            `const before = Object.keys(components.listview1.data).length;
           await actions.setVariable('rows', variables.rows.slice(0, 5));
           for (let i = 0; i < 100 && Object.keys(components.listview1.data).length !== 5; i++)
             await new Promise((resolve) => setTimeout(resolve, 20));
           return [before, Object.keys(components.listview1.data).length, components.listview1.data[2900]?.text1?.text];`
          ),
        ],
      });
      await ready();
      // Not awaited inside act(): the ListView renders its new rows only outside of act's scope.
      state().queryPanel.runQuery('q1', 'q1', undefined, 'view', {}, undefined, undefined, false, false, MODULE_ID);
      await waitFor(() => expect(queryData('q1')).toHaveLength(3), { timeout: 10000 });
      expect(queryData('q1')).toEqual([3000, 5, undefined]);
    },
    WHOLE_MS
  );

  test('the ListView gives useWindow its budget for rows mounting ahead of the view', async () => {
    const useWindow = jest.spyOn(windowEngine, 'useWindow');
    renderListview(ROWS);
    await mounted();
    expect(useWindow).toHaveBeenCalledWith(expect.objectContaining({ aheadBudgetMs: 8 }));
    expect(useWindow.mock.calls.every(([options]) => !('mountBudgetMs' in options))).toBe(true);
  });
});

describe('Listview rows read by code — a short list (every row drawn)', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });
  afterEach(expectNoProxy);

  test('scripts and bindings read its children/data as they are', async () => {
    const prepare = jest.spyOn(prepareEngine, 'prepareBinding');
    const prepareScript = jest.spyOn(scriptsEngine, 'prepareScript');
    const out = componentDefinition('out1', 'outside1', 'Text', {
      text: binding('{{components.listview1.data[3].text1.text}}'),
    });
    renderListview(ROWS.slice(0, 10), {
      extra: { out1: out },
      queries: [
        runjs('q1', 'return [Object.keys(components.listview1.data).length, components.listview1.data[3].text1.text];'),
      ],
    });
    await mounted();
    expect(state().resolvedStore.modules[MODULE_ID].listviewSlots?.lv1).toBeUndefined();
    await waitFor(() => expect(state().getResolvedComponent('out1', null, MODULE_ID).properties.text).toBe('row 3'));
    await run('q1');
    expect(queryData('q1')).toEqual([10, 'row 3']);
    // Nothing made ready for them: no windowed ListView.
    expect(prepare).not.toHaveBeenCalled();
    expect(prepareScript).not.toHaveBeenCalled();
  });

  test('a query failing with a thrown error shows what it always did', async () => {
    jest.spyOn(dataqueryService, 'run').mockRejectedValue(new TypeError('Failed to fetch'));
    renderListview(ROWS.slice(0, 10), { queries: [restapi('q1', 'hi')] });
    await mounted();
    let result;
    await act(async () => {
      result = await state().queryPanel.runQuery('q1', 'q1', undefined, 'view', {}, undefined, undefined, false, false);
    });
    expect(result).toEqual({ status: 'failed', message: 'Unknown error' });
  });

  test(
    "a preview that can't be frozen in a later slice isn't shown, and rejects nothing unhandled",
    async () => {
      const unhandled = jest.fn();
      process.on('unhandledRejection', unhandled);
      try {
        const shown = state().queryPanel.queryPreviewData;
        const rows = Array.from({ length: 300000 }, (_, i) => ({ id: i, address: { city: 'c' } }));
        rows.push({
          get value() {
            throw new TypeError('refused');
          },
        });
        state().queryPanel.setPreviewData(rows);
        await act(() => new Promise((resolve) => setTimeout(resolve, 2000)));
        expect(state().queryPanel.queryPreviewData).toBe(shown);
        expect(unhandled).not.toHaveBeenCalled();
      } finally {
        process.off('unhandledRejection', unhandled);
      }
    },
    WHOLE_MS
  );
});
