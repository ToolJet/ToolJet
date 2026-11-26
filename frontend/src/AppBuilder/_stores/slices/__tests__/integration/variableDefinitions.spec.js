/**
 * Declared variables at runtime: values are seeded when the dependency graph is built (app load
 * and page switch), recomputed when anything their expression reads changes, overwritten by
 * setVariable / setPageVariable until the next recompute, and skipped when circular.
 *
 * Real composed store, no mocks; reads go straight to the store for the same reason as
 * exposedValueCascade.spec.js (the cascade timing is what is under test).
 */
import useStore from '@/AppBuilder/_stores/store';
import { componentDefinition, binding } from '@/test/app-builder';

const state = () => useStore.getState();
const appVars = () => state().resolvedStore.modules.canvas.exposedValues.variables;
const pageVars = () => state().resolvedStore.modules.canvas.exposedValues.page.variables;

// Saved maps are keyed by name. (The first argument once held a definition id; it is unused.)
const def = (_label, name, value, fxActive = false) => ({ name, value, fxActive });
const byName = (...defs) => Object.fromEntries(defs.map(({ name, value, fxActive }) => [name, { value, fxActive }]));

function seed({ app = [], page = [], components = {}, queries = {} } = {}) {
  const store = state();
  store.initializeDependencySlice('canvas');
  store.setGlobalSettings({ ...store.globalSettings, variables: byName(...app) });
  store.setPages([{ id: 'page-1', handle: 'home', name: 'Home', components, variables: byName(...page) }], 'canvas');
  store.setCurrentPageId('page-1', 'canvas');
  store.setComponentNameIdMapping('canvas');
  Object.entries(queries).forEach(([id, name]) => store.addNewQueryMapping(id, name, 'canvas'));
  store.initDependencyGraph('canvas');
}

const flush = () => Promise.resolve();

describe('declared variables: load', () => {
  test('static app and page values are set before components resolve', () => {
    seed({
      app: [def('v1', 'threshold', '5')],
      page: [def('v2', 'category', 'Electronics')],
      components: {
        c1: componentDefinition('c1', 'text1', 'Text', { text: binding('{{variables.threshold}}') }),
        c2: componentDefinition('c2', 'text2', 'Text', { text: binding('{{page.variables.category}}') }),
      },
    });

    expect(appVars().threshold).toBe(5);
    expect(pageVars().category).toBe('Electronics');
    // Text renders its value as a string
    expect(state().getResolvedComponent('c1').properties.text).toBe('5');
    expect(state().getResolvedComponent('c2').properties.text).toBe('Electronics');
  });

  test('variables that read other variables are evaluated after them', () => {
    seed({ app: [def('vb', 'b', '{{variables.a + 1}}'), def('va', 'a', '1')] });

    expect(appVars().b).toBe(2);
  });

  test('a rebuilt graph (page switch) keeps the current app value but re-seeds page values', () => {
    seed({ app: [def('v1', 'a', '1')], page: [def('v2', 'p', 'x')] });
    state().setVariable('a', 99);
    state().setPageVariable('p', 'changed');
    state().resolvedStore.modules.canvas.exposedValues.page.variables; // read-only touch

    // switchPage clears page variables, then rebuilds the graph
    useStore.setState((s) => {
      s.resolvedStore.modules.canvas.exposedValues.page.variables = {};
    });
    state().initDependencyGraph('canvas');

    expect(appVars().a).toBe(99);
    expect(pageVars().p).toBe('x');
  });
});

describe('declared variables: recompute', () => {
  test('recomputes when a query it reads returns data', () => {
    seed({
      app: [def('v1', 'firstId', '{{queries.getProducts.data?.[0]?.id}}', true)],
      queries: { q1: 'getProducts' },
    });
    expect(appVars().firstId).not.toBe(7);

    state().setResolvedQuery('q1', { data: [{ id: 7 }] });

    expect(appVars().firstId).toBe(7);
  });

  test('recomputes when another variable it reads changes, and its dependents follow', async () => {
    seed({
      app: [def('va', 'a', '1'), def('vb', 'b', '{{variables.a * 10}}')],
      components: { c1: componentDefinition('c1', 'text1', 'Text', { text: binding('{{variables.b}}') }) },
    });

    state().setVariable('a', 3);
    await flush();
    await flush();

    expect(appVars().b).toBe(30);
    expect(state().getResolvedComponent('c1').properties.text).toBe('30');
  });

  test('a page variable can read an app variable', async () => {
    seed({ app: [def('va', 'a', '2')], page: [def('vp', 'double', '{{variables.a * 2}}')] });
    expect(pageVars().double).toBe(4);

    state().setVariable('a', 5);
    await flush();

    expect(pageVars().double).toBe(10);
  });

  test('setVariable overwrites the value until the next recompute', () => {
    seed({ app: [def('v1', 'count', '{{queries.q.data.length}}')], queries: { q1: 'q' } });
    state().setResolvedQuery('q1', { data: [1, 2] });
    expect(appVars().count).toBe(2);

    state().setVariable('count', 'manual');
    expect(appVars().count).toBe('manual');

    state().setResolvedQuery('q1', { data: [1, 2, 3] });
    expect(appVars().count).toBe(3);
  });
});

describe('declared variables: cycles', () => {
  test('variables in a saved cycle stay undefined, are logged, and do not loop', async () => {
    seed({
      app: [def('vx', 'x', '{{variables.y + 1}}'), def('vy', 'y', '{{variables.x + 1}}'), def('vk', 'ok', '1')],
    });
    await flush();

    expect(appVars().x).toBeUndefined();
    expect(appVars().y).toBeUndefined();
    expect(appVars().ok).toBe(1);
    const cycleLogs = state().debugger.logs.filter((l) => l.type === 'variable');
    expect(cycleLogs).toEqual([
      expect.objectContaining({ logLevel: 'error', message: expect.stringMatching(/x → y → x/) }),
    ]);
  });
});
