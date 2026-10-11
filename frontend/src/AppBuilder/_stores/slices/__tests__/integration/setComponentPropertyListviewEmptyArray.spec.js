/**
 * Regression for: a Table nested inside a Listview (or Kanban, or another Table) silently
 * fails to delete its last remaining column — the delete click does nothing, with no visible
 * error, and devtools shows a swallowed TypeError.
 *
 * Root cause lives in setComponentProperty's per-row branch (taken whenever the component
 * being updated sits under a row-scoped ancestor — Listview/Kanban/Table). That branch assumes
 * `resolvedComponent[componentId]` is shaped as one entry per row, but that shape is only ever
 * produced as a SIDE EFFECT of checkValueAndResolve resolving each array ELEMENT (via
 * updateResolvedValues -> setAllValueToComponent -> updateResolvedValueForNonNullIndex).
 * Setting an array-valued property to an EMPTY array resolves zero elements, so that reshape
 * never runs, and resolvedComponent[componentId] is left in its original flat shape — which
 * the per-row write loop right after then crashes indexing into:
 *
 *   resolvedComponent[componentId][i][paramType][property]
 *   // TypeError: Cannot read properties of undefined (reading 'properties')
 *
 * The exception is thrown synchronously inside setComponentProperty, called from Inspector's
 * paramUpdated, called from useListItemManager's removeItem — which wraps the whole thing in a
 * try/catch that only console.errors. So the user sees nothing happen: the property is never
 * actually written, and the deleted column reappears because it was never removed in the first
 * place.
 *
 * This only bites when the array empties out entirely (i.e. deleting the LAST item) — any
 * array left non-empty still has elements for checkValueAndResolve to iterate, so the reshape
 * happens normally. That is exactly why only the last column is affected, while earlier
 * deletions (leaving a non-empty array) work fine.
 *
 * Everything here runs against the real composed store; nothing is mocked.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';

const state = () => useStore.getState();

const LV = 'lv1';
const TBL = 'tbl1';

/** componentDefinition() has no parent slot; row children need one to be found by findNearestSubcontainerAncestor. */
const childOf = (parentId, ...args) => {
  const def = componentDefinition(...args);
  def.component.parent = parentId;
  return def;
};

/** What Listview.jsx hands updateCustomResolvables on every render whose data changed. */
const rowsFor = (data) => data.map((listItem) => ({ listItem }));

const ROWS = [{ name: 'alpha' }, { name: 'bravo' }, { name: 'charlie' }];

function seedTableInsideListview(columns) {
  seedApp({
    [LV]: componentDefinition(LV, 'listview1', 'Listview', { data: { value: ROWS } }),
    [TBL]: childOf(LV, TBL, 'table1', 'Table', {
      columns: { value: columns },
      columnDeletionHistory: { value: [] },
    }),
  });
  // Simulate the Listview render that publishes rows for its (3-row) data — this is what makes
  // setComponentProperty's per-row branch see length > 0 for the nested Table.
  state().updateCustomResolvables(LV, rowsFor(ROWS), 'listItem', 'canvas', []);
}

const currentColumns = () => state().getComponentDefinition(TBL).component.definition.properties.columns.value;

describe('setComponentProperty: emptying an array property on a row-scoped-nested component', () => {
  test('[regression] deleting the last column of a Table nested in a Listview does not throw, and commits the empty array', () => {
    seedTableInsideListview([{ id: 'c1', name: 'last_column', key: 'last_column', columnType: 'string' }]);

    expect(() => {
      state().setComponentProperty(TBL, 'columns', [], 'properties', 'value', false, 'canvas');
    }).not.toThrow();

    expect(currentColumns()).toEqual([]);
  });

  // Control: the same component, same row-scoping, but the array stays non-empty after the
  // write. This already worked before the fix (checkValueAndResolve has elements to iterate),
  // so it must keep working after it.
  test('control: removing one of two columns (leaving a non-empty array) still works', () => {
    seedTableInsideListview([
      { id: 'c1', name: 'a', key: 'a', columnType: 'string' },
      { id: 'c2', name: 'b', key: 'b', columnType: 'string' },
    ]);

    expect(() => {
      state().setComponentProperty(
        TBL,
        'columns',
        [{ id: 'c1', name: 'a', key: 'a', columnType: 'string' }],
        'properties',
        'value',
        false,
        'canvas'
      );
    }).not.toThrow();

    expect(currentColumns()).toEqual([{ id: 'c1', name: 'a', key: 'a', columnType: 'string' }]);
  });
});
