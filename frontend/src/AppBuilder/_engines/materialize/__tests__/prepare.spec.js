/**
 * What a `{{ }}` template reads of a ListView's children/data (../prepare.js listviewReadsOf): a row (a literal index,
 * or an index expression), or the whole list; nothing for a template that reads neither. And where a control-component
 * action on a row's widget runs (../rows.js controlRowOf). And what a script reads of them (../scripts.js scriptReadsOf).
 */
import { eventReadsIn, listviewReadsOf, windowedReadsOf } from '@/AppBuilder/_engines/materialize/prepare';
import { controlRowOf } from '@/AppBuilder/_engines/materialize/rows';
import { scriptReadsOf } from '@/AppBuilder/_engines/materialize/scripts';

describe('listviewReadsOf', () => {
  test('a literal row, in either notation, optional chaining included', () => {
    expect(listviewReadsOf('{{components["lv1"].data[2900]?.text1?.text}}')).toEqual([
      { id: 'lv1', row: 2900, index: null },
    ]);
    expect(listviewReadsOf('{{components.lv1.children["7"].text1.text}}')).toEqual([
      { id: 'lv1', row: 7, index: null },
    ]);
  });

  test('an index expression, kept to resolve from the values as they are', () => {
    expect(listviewReadsOf('{{components.lv1.data[variables.row + 1].text1}}')).toEqual([
      { id: 'lv1', row: null, index: 'variables.row + 1' },
    ]);
  });

  test('the whole list: used without an index', () => {
    expect(listviewReadsOf('{{Object.keys(components["lv1"].children).length}}')).toEqual([
      { id: 'lv1', row: null, index: null },
    ]);
    expect(listviewReadsOf('Rows: {{components.lv1.data}} and {{components.lv2.data[0]}}')).toEqual([
      { id: 'lv1', row: null, index: null },
      { id: 'lv2', row: 0, index: null },
    ]);
  });

  test("the whole list: the entry used whole, or an index using the template's own variable", () => {
    const whole = (id) => [{ id, row: null, index: null }];
    expect(listviewReadsOf('{{components.lv1}}')).toEqual(whole('lv1'));
    expect(listviewReadsOf('{{JSON.stringify(components["lv1"])}}')).toEqual(whole('lv1'));
    expect(listviewReadsOf("{{['id'].map((k) => components.lv1[k])}}")).toEqual(whole('lv1'));
    expect(listviewReadsOf('{{[5, 9].map((i) => components.lv1.data[i])}}')).toEqual(whole('lv1'));
    expect(listviewReadsOf('{{(() => { const r = 2; return components.lv1.children[r + 1]; })()}}')).toEqual(
      whole('lv1')
    );
    // A name the template doesn't bind is resolved from the values as they are.
    expect(listviewReadsOf('{{[5].map((i) => components.lv1.data[page.row])}}')).toEqual([
      { id: 'lv1', row: null, index: 'page.row' },
    ]);
    expect(listviewReadsOf('{{components.lv1.selectedRecord.text1}}')).toBeNull();
  });

  test('a key of the entry named by an expression: kept to resolve, the whole list only when it names its rows', () => {
    expect(listviewReadsOf('{{components.lv1[variables.key]}}')).toEqual([
      { id: 'lv1', row: null, index: null, key: 'variables.key' },
    ]);
  });

  test('nothing for `components` used whole, an entry only tested, or a template binding its own `components`', () => {
    expect(listviewReadsOf('{{Object.keys(components).length}}')).toBeNull();
    expect(listviewReadsOf('{{JSON.stringify(components)}}')).toBeNull();
    expect(listviewReadsOf('{{components}}')).toBeNull();
    expect(listviewReadsOf('{{components.lv1 ? 1 : 2}}')).toBeNull();
    expect(listviewReadsOf('{{components.lv1 && components.lv1.selectedRecord}}')).toBeNull();
    expect(listviewReadsOf('{{!components.lv1.data}}')).toBeNull();
    expect(listviewReadsOf('{{((components) => components.lv1.data)({ lv1: {} })}}')).toBeNull();
  });

  test('a value passed through `||`, `??` or `?:` is followed', () => {
    expect(listviewReadsOf('{{(components.lv1 || {}).selectedRecord}}')).toBeNull();
    expect(listviewReadsOf('{{(components.lv1 ?? {}).data[4].text1}}')).toEqual([{ id: 'lv1', row: 4, index: null }]);
    expect(listviewReadsOf('{{(components.lv1.children || {})[6]}}')).toEqual([{ id: 'lv1', row: 6, index: null }]);
    expect(listviewReadsOf('{{components.lv1 ?? null}}')).toEqual([{ id: 'lv1', row: null, index: null }]);
  });

  test('nothing for a template reading neither, a key that is no row, or that does not parse', () => {
    expect(listviewReadsOf('{{components.text1.text}}')).toBeNull();
    expect(listviewReadsOf('{{queries.q1.data[0]}}')).toBeNull();
    expect(listviewReadsOf('{{components.lv1.data["name"]}}')).toBeNull();
    expect(listviewReadsOf('{{String(components.lv1.data.length)}}')).toBeNull();
    expect(listviewReadsOf('{{components.lv1.children.foo}}')).toBeNull();
    expect(listviewReadsOf('{{components.lv1.data[}}')).toBeNull();
    expect(listviewReadsOf(42)).toBeNull();
  });

  test('kept per text', () => {
    const text = '{{components.lv1.data[1]}}';
    expect(listviewReadsOf(text)).toBe(listviewReadsOf(text));
  });
});

describe('reads of windowed ListViews only', () => {
  const store = (slots) => () => ({
    resolvedStore: { modules: { canvas: { listviewSlots: slots } } },
    modules: { canvas: { componentNameIdMapping: { listview1: 'lv1', form1: 'fm1' }, queryNameIdMapping: {} } },
  });

  test("a Form's data, or a module with no windowed ListView: nothing", () => {
    expect(windowedReadsOf(store({ lv1: [0, 1] }), '{{components.fm1.data.name}}', 'canvas')).toBeNull();
    expect(windowedReadsOf(store({}), '{{components.lv1.data[5]}}', 'canvas')).toBeNull();
    expect(windowedReadsOf(store({ lv1: [0, 1] }), '{{components.lv1.data[5]}}', 'canvas')).toEqual([
      { id: 'lv1', row: 5, index: null },
    ]);
  });

  test('`components` used whole: nothing, as it reads the drawn rows as it always did', () => {
    expect(windowedReadsOf(store({ lv1: [0, 1], lv2: [3] }), '{{_.size(components)}}', 'canvas')).toBeNull();
  });

  describe("a script's reads (scriptReadsOf)", () => {
    const reads = (code) => scriptReadsOf(store({ lv1: [0, 1] }), code, 'canvas');
    const whole = [{ id: 'lv1', row: null, index: null }];

    test('its entry in a variable, destructured, or passed through `||`/`??`: followed', () => {
      expect(reads('const lv = components.listview1; return lv.selectedRecordId;')).toBeNull();
      expect(reads('const x = components.listview1 || {}; return x.selectedRecord;')).toBeNull();
      expect(reads('const { selectedRecordId, ...rest } = components.listview1; return selectedRecordId;')).toBeNull();
      expect(reads('return components.listview1 && components.listview1.selectedRecord;')).toBeNull();
      expect(reads('if (components.listview1.data) return 1;')).toBeNull();
      expect(reads('const lv = components.listview1; return lv.children[5].text1.text;')).toEqual([
        { id: 'lv1', row: 5, index: null },
      ]);
      expect(reads('const lv = components.listview1; const { data } = lv; const r = 7; return data[r];')).toEqual([
        { id: 'lv1', row: 7, index: null },
      ]);
      expect(reads('return (components.listview1 ?? {}).data[3];')).toEqual([{ id: 'lv1', row: 3, index: null }]);
    });

    test('its entry or rows used whole, through a variable too: every row', () => {
      expect(reads('const lv = components.listview1; return lv;')).toEqual(whole);
      expect(reads('return components.listview1 ?? null;')).toEqual(whole);
      expect(reads('const { id, ...rest } = components.listview1; return rest;')).toEqual(whole);
      expect(reads('const lv = components.listview1; return Object.keys(lv.data);')).toEqual(whole);
      expect(reads('let lv = components.listview1; lv = {}; return lv.id;')).toEqual(whole);
      expect(reads('for (const i of [1]) components.listview1.data[i];')).toEqual(whole);
    });

    test("named as `components['listview1']`, by a `const` holding its name, or destructured from `components`", () => {
      const row = (n) => [{ id: 'lv1', row: n, index: null }];
      expect(reads("return components['listview1'].children[2900].text1.text;")).toEqual(row(2900));
      expect(reads("const n = 'listview1'; return components[n].data[4];")).toEqual(row(4));
      expect(reads('const { listview1 } = components; return listview1.children[2900].text1.text;')).toEqual(row(2900));
      expect(reads('const { listview1: lv } = components; return Object.keys(lv.data).length;')).toEqual(whole);
      expect(reads('const { listview1: { data } = {} } = components; return data[3];')).toEqual(row(3));
      expect(reads('const { listview1, text1 } = components; return [listview1.id, text1.text];')).toBeNull();
      expect(reads('const { text1, ...rest } = components; return rest;')).toBeNull();
    });

    test('a key of its entry through a `const` holding it: that key, its rows only for children/data', () => {
      expect(reads("const k = 'id'; return components.listview1[k];")).toBeNull();
      expect(reads("const k = 'data'; return components.listview1[k][5];")).toEqual([
        { id: 'lv1', row: 5, index: null },
      ]);
      expect(reads('return components.listview1[key];')).toEqual(whole);
      expect(reads("let k = 'id'; k = 'data'; return components.listview1[k];")).toEqual(whole);
    });

    test("each scope's variables are its own: one declared again elsewhere, or shadowed, reads what its own holds", () => {
      expect(
        reads(
          'if (a) { const lv = components.listview1; x = lv.id; } else { const lv = components.listview1; y = lv.id; }'
        )
      ).toBeNull();
      expect(
        reads(`function a() { const lv = components.listview1; return lv.selectedRecord; }
          function b() { const lv = components.listview1; return lv.id; }`)
      ).toBeNull();
      expect(
        reads(
          'const { data } = components.listview1; const f = () => { const data = 1; return data; }; return data[5];'
        )
      ).toEqual([{ id: 'lv1', row: 5, index: null }]);
      expect(
        reads(
          'if (a) { const lv = components.listview1; lv.data[2]; } else { const lv = components.listview1; lv.data[4]; }'
        )
      ).toEqual([
        { id: 'lv1', row: 2, index: null },
        { id: 'lv1', row: 4, index: null },
      ]);
      expect(reads('const lv = components.listview1; { const lv = {}; Object.keys(lv); } return lv.data[1];')).toEqual([
        { id: 'lv1', row: 1, index: null },
      ]);
      expect(reads('const i = 3; { const i = j; } return components.listview1.data[i];')).toEqual([
        { id: 'lv1', row: 3, index: null },
      ]);
      // Bound again where it is visible, or a `var` declared in a block: every row.
      expect(reads('let lv = components.listview1; function f() { lv = {}; } return lv.id;')).toEqual(whole);
      expect(reads('var lv = components.listview1; if (a) { var lv = {}; } return lv.id;')).toEqual(whole);
      expect(reads('if (a) { var lv = components.listview1; } return Object.keys(lv.data);')).toEqual(whole);
    });

    test('`components` whole or by a computed name, its own `components`, or no windowed ListView: nothing', () => {
      expect(reads('return components;')).toBeNull();
      expect(reads('return JSON.stringify(components);')).toBeNull();
      expect(reads("return components['list' + 'view1'].data;")).toBeNull();
      expect(
        reads('const components = { listview1: { data: [] } }; return Object.keys(components.listview1.data);')
      ).toBeNull();
      expect(reads('function f(components) { return components.listview1.data; }')).toBeNull();
      expect(scriptReadsOf(store({}), 'return components.listview1.data;', 'canvas')).toBeNull();
    });
  });

  test("an event's runOnlyIf is read apart from the rest", () => {
    const get = store({ lv1: [0, 1] });
    const event = { runOnlyIf: '{{components.listview1.data[4]}}', value: '{{components.listview1.data[5]}}' };
    expect(eventReadsIn(get, event, 'canvas', { runOnlyIf: true })).toEqual([{ id: 'lv1', row: 4, index: null }]);
    expect(eventReadsIn(get, event, 'canvas')).toEqual([{ id: 'lv1', row: 5, index: null }]);
  });

  test("an event's control-component action in a module with no windowed ListView: nothing looked up", () => {
    const getComponentDefinition = jest.fn();
    const get = () => ({ ...store({})(), getComponentDefinition, findNearestSubcontainerAncestor: jest.fn() });
    expect(controlRowOf(get, 'txt1', 'btn1', [2], 'canvas')).toBeNull();
    expect(getComponentDefinition).not.toHaveBeenCalled();
  });

  test("an event's control-component action: the data row its slot showed as it fired", () => {
    const parents = { txt1: 'lv1', btn1: 'lv1', lv1: null };
    const get = () => ({
      ...store({ lv1: [40, 41, 42] })(),
      getComponentDefinition: (id) => ({ component: { parent: parents[id] } }),
      findNearestSubcontainerAncestor: (id) => (id === 'lv1' ? 'lv1' : null),
    });
    expect(controlRowOf(get, 'txt1', 'btn1', [1], 'canvas')).toEqual({ listviewId: 'lv1', dataRow: 41 });
    expect(controlRowOf(get, 'txt1', 'btn1', [1], 'canvas', { lv1: [7, 8, 9] })).toEqual({
      listviewId: 'lv1',
      dataRow: 8,
    });
    expect(controlRowOf(get, 'txt1', 'out1', null, 'canvas')).toEqual({ listviewId: 'lv1', dataRow: 0 });
  });

  test("an event: the strings its action resolves, not a value it carries, nor its query's options", () => {
    const get = store({ lv1: [0, 1] });
    const event = {
      actionId: 'set-custom-variable',
      key: 'k',
      value: { s: '{{components.listview1.data}}' },
      query: { options: { body: '{{components.listview1.data}}' } },
    };
    expect(eventReadsIn(get, event, 'canvas')).toBeNull();
    expect(
      eventReadsIn(
        get,
        {
          value: '{{components.listview1.data[1]}}',
          queryParams: [['a', '{{components.listview1.data[2]}}']],
          componentSpecificActionParams: [{ value: '{{components.listview1.data[3]}}' }],
          parameters: { p: '{{components.listview1.children}}' },
        },
        'canvas'
      )
    ).toEqual([
      { id: 'lv1', row: 1, index: null },
      { id: 'lv1', row: 2, index: null },
      { id: 'lv1', row: 3, index: null },
      { id: 'lv1', row: null, index: null },
    ]);
  });
});
