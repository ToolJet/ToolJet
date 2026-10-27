/**
 * An object keyed by row number (a ListView's `children`/`data`) gets suggestions for its first 10 rows only, like the
 * rows of an array; its other keys keep theirs.
 */
import useStore from '@/AppBuilder/_stores/store';

const state = () => useStore.getState();

test('suggests the first 10 rows of a row-keyed object, and every other key', () => {
  const rows = Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [i, { text: `row ${i}` }]));
  state().initializeDependencySlice('canvas');
  state().setVariable('list', { ...rows, selectedRow: 3 });
  state().rebuildVariableHints('canvas');

  const hints = state().suggestions.segments.variables.map(({ hint }) => hint);
  const rowHints = hints.filter((hint) => /^variables\.list\.\d+$/.test(hint));
  expect(rowHints).toEqual(Array.from({ length: 10 }, (_, i) => `variables.list.${i}`));
  expect(hints).toContain('variables.list.9.text');
  expect(hints).not.toContain('variables.list.10.text');
  expect(hints).toContain('variables.list.selectedRow');
});
