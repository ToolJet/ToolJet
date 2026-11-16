/**
 * Panel rows: declared variables first, then variables that only a script or event creates
 * ("Runtime only"), which are never saved.
 */
import useStore from '@/AppBuilder/_stores/store';
import { buildVariableRows, previewOf } from '../../variableRows';

const state = () => useStore.getState();

function seed() {
  const store = state();
  store.initializeDependencySlice('canvas');
  store.setGlobalSettings({
    ...store.globalSettings,
    variables: { v1: { id: 'v1', name: 'threshold', value: '5', fx_active: false } },
  });
  store.setPages([{ id: 'page-1', handle: 'home', name: 'Home', components: {}, variables: {} }], 'canvas');
  store.setCurrentPageId('page-1', 'canvas');
  store.setComponentNameIdMapping('canvas');
  store.initDependencyGraph('canvas');
}

test('a variable only set at runtime is listed as runtime-only; a declared one is not duplicated', () => {
  seed();
  state().setVariable('cartTotal', 12);
  state().setPageVariable('editing', { id: 1 });

  const s = state();
  const rows = buildVariableRows(s, 'canvas', s.globalSettings.variables, {});

  expect(rows.app.map((r) => [r.name, Boolean(r.definition)])).toEqual([
    ['threshold', true],
    ['cartTotal', false],
  ]);
  expect(rows.page.map((r) => [r.name, Boolean(r.definition)])).toEqual([['editing', false]]);
});

describe('previewOf', () => {
  // A blank initial value stores an empty string; the panel labels it instead of showing "".
  test('labels an empty string', () => {
    expect(previewOf('')).toBe('Empty string');
  });

  test('quotes other strings so they stay distinct from the label', () => {
    expect(previewOf('Empty string')).toBe('"Empty string"');
    expect(previewOf(' ')).toBe('" "');
  });
});
