import * as legacy from './reference/expressions.legacy';
import * as engine from '../expressions';
import { extractAndReplaceReferencesFromString as astRewrite } from '@/AppBuilder/_stores/ast';

// States and templates covering how templates are written in apps: whole expressions, text around parts, several
// parts, template literals, nested braces, %% parameters, custom variables, errors and the refused forms.
const state = {
  components: { 'c-1': { value: 'hello', items: [1, 2, 3], row: { a: 1, 'b c': 2 } } },
  queries: {
    'q-1': {
      data: [
        { id: 1, name: 'Ann' },
        { id: 2, name: 'Bob' },
      ],
      isLoading: false,
    },
  },
  globals: { currentUser: { email: 'a@b.c' }, theme: { name: 'dark' } },
  variables: { count: 3, list: ['x', 'y'], obj: { nested: { deep: 'yes' } }, empty: '' },
  page: { handle: 'home', variables: { pv: 7 } },
  constants: { API: 'https://api' },
  parameters: { p: 5 },
  input: { i: 1 },
};
const custom = [{}, { listItem: { name: 'Row' } }, { rowData: { id: 9 }, cellValue: 'cv' }];
const templates = [
  '{{variables.count}}',
  '{{ variables.count }}',
  '{{variables.count + 1}}',
  '{{variables.count > 2 ? "big" : "small"}}',
  'Count: {{variables.count}}',
  '{{variables.count}} and {{variables.list}}',
  '{{variables.list.map((x) => x.toUpperCase())}}',
  '{{components["c-1"].value}}',
  '{{components["c-1"].items.length}}',
  '{{components["c-1"].row["b c"]}}',
  '{{queries["q-1"].data[0].name}}',
  '{{queries["q-1"].data.filter((r) => r.id > 1)}}',
  '{{`${variables.count}-${variables.list[0]}`}}',
  '{{queries["q-1"].data[0][`${"name"}`]}}',
  '{{ {a: 1} }}',
  '{{{a: {b: 2}}}}',
  '{{[1, {a: [2]}]}}',
  '{{JSON.stringify(variables.obj)}}',
  '{{moment(0).utc().year()}}',
  '{{_.sum([1, 2, 3])}}',
  '{{listItem?.name}}',
  '{{rowData.id + 1}}',
  '{{cellValue}}',
  '%%parameters.p%%',
  'text %%parameters.p%% more',
  '{{page.variables.pv}}',
  '{{constants.API}}/users',
  '{{globals.currentUser.email}}',
  '{{undefinedThing.x}}',
  '{{variables.count +}}',
  '{{_}}',
  '{{this._x}}',
  '{{queries.q1.run()}}',
  'no template here',
  '',
  '{{}}',
  '{{variables.empty}}',
  'a {{variables.count}} b {{variables.count}}',
  '{{variables.list[0]}}{{variables.list[1]}}',
  '{{"$&"}} and {{"$1"}}',
  'Price: {{"$&"}}',
  '{{variables.obj.nested}}',
  '{{input.i}}',
  '{{ variables.count\n }}',
  '{{\tvariables.count}}',
];

const outcome = (fn) => {
  const errors = [];
  const logs = [];
  const error = jest.spyOn(console, 'error').mockImplementation((...args) => errors.push(String(args[0])));
  const log = jest.spyOn(console, 'log').mockImplementation((...args) => logs.push(String(args[0])));
  let value;
  try {
    value = fn();
  } finally {
    error.mockRestore();
    log.mockRestore();
  }
  // Errors are compared by message: a new Error object is made on every failed resolution.
  const normalize = (v) => (v instanceof Error ? `${v.name}: ${v.message}` : v);
  return { value: Array.isArray(value) ? value.map(normalize) : normalize(value), errors, logs };
};

describe('expressions: same results as before', () => {
  for (const customObjects of custom) {
    for (const withError of [false, true]) {
      for (const isJsCode of [true, false]) {
        test(`custom ${Object.keys(customObjects).join(',') || 'none'}, withError ${withError}, js ${isJsCode}`, () => {
          for (const template of templates) {
            const args = [template, state, customObjects, withError, [], isJsCode];
            const expected = outcome(() => legacy.resolveDynamicValues(...args));
            // Twice: the first resolution remembers the template, the second uses what was remembered.
            expect([template, outcome(() => engine.resolveDynamicValues(...args))]).toEqual([template, expected]);
            expect([template, outcome(() => engine.resolveDynamicValues(...args))]).toEqual([template, expected]);
          }
        });
      }
    }
  }

  test('templates that are not strings fail as before', () => {
    for (const template of [undefined, null, 5, {}, ['{{1}}']]) {
      expect(outcome(() => engine.resolveDynamicValues(template, state))).toEqual(
        outcome(() => legacy.resolveDynamicValues(template, state))
      );
    }
  });

  test('a changed state is read on every resolution', () => {
    const live = { variables: { count: 1 } };
    expect(engine.resolveDynamicValues('{{variables.count}}', live)).toBe(1);
    live.variables = { count: 2 };
    expect(engine.resolveDynamicValues('{{variables.count}}', live)).toBe(2);
  });

  test('names are replaced by IDs as before, remembered per pair of maps', () => {
    const componentMap = { text1: 'c-1' };
    const queryMap = { q1: 'q-1' };
    for (const template of ['{{components.text1.value}}', '{{queries.q1.data[0].name}}', '{{variables.x}}', 'x']) {
      const expected = astRewrite(template, componentMap, queryMap).valueWithBrackets;
      expect(engine.valueWithIds(template, componentMap, queryMap)).toBe(expected);
      expect(engine.valueWithIds(template, componentMap, queryMap)).toBe(expected);
    }
    // A new map (a rename) gives the new result.
    expect(engine.valueWithIds('{{components.text1.value}}', { text1: 'c-2' }, queryMap)).toBe(
      astRewrite('{{components.text1.value}}', { text1: 'c-2' }, queryMap).valueWithBrackets
    );
  });
});

describe('expressions: compiled once', () => {
  test('resolving the same template again compiles nothing', () => {
    const original = global.Function;
    let compiles = 0;
    global.Function = function (...args) {
      compiles += 1;
      return original(...args);
    };
    try {
      engine.resolveDynamicValues('{{variables.count * 1000 + 7}}', state);
      const first = compiles;
      for (let i = 0; i < 50; i++) engine.resolveDynamicValues('{{variables.count * 1000 + 7}}', state);
      expect(compiles).toBe(first);
    } finally {
      global.Function = original;
    }
  });

  test('the expressions switch compiles on every resolution, as before', () => {
    window.public_config = { DISABLE_BACKGROUND_DATA: 'expressions' };
    const original = global.Function;
    let compiles = 0;
    global.Function = function (...args) {
      compiles += 1;
      return original(...args);
    };
    try {
      for (let i = 0; i < 5; i++) engine.resolveDynamicValues('{{variables.count * 2000 + 7}}', state);
      expect(compiles).toBe(5);
    } finally {
      global.Function = original;
      delete window.public_config;
    }
  });
});
