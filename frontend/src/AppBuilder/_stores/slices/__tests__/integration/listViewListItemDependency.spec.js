/**
 * How a binding inside a ListView row stays in sync with the ListView's data.
 *
 * A row binding reaches its own row through the `listItem` custom resolvable. The ListView
 * republishes `listItem` whenever its data changes (Listview.jsx -> updateCustomResolvables),
 * and a row re-resolves off that publish only if the binding registered a
 * `components.<listview>.listItem` dependency when the graph was built.
 *
 * Registration is decided by getCustomResolvableReference (componentsSlice.js), which asks
 * checkSubstringRegex (utils.js) whether the expression references `listItem`. That check is
 * textual, so which reference SHAPES it recognises is the whole contract — a shape it misses
 * produces no edge and a row that silently stops tracking its data. The last describe block
 * pins the accepted and rejected sets in both directions; widening one without meaning to is
 * the regression this file exists to catch.
 *
 * Bindings that reference something else as well (a query, another component) are kept in
 * their own block: that second edge re-resolves the row on its own schedule and can arrive
 * before the ListView has republished, which turns a missing `listItem` edge into data that
 * lags a publish behind rather than data that never arrives at all.
 *
 * Everything runs against the REAL composed store; nothing here is mocked.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const state = () => useStore.getState();

const LV = 'lv';
const CHILD = 'ti';
const QUERY_ID = 'q1';

/** componentDefinition() has no parent slot; row children need one to be found by findNearestSubcontainerAncestor. */
const childOf = (parentId, ...args) => {
  const def = componentDefinition(...args);
  def.component.parent = parentId;
  return def;
};

/** What Listview.jsx hands updateCustomResolvables on every render whose data changed. */
const rowsFor = (data) => data.map((listItem) => ({ listItem }));

const seedRow = (childProperties) => {
  seedApp({
    [LV]: componentDefinition(LV, 'listview1', 'Listview', { data: binding('{{queries.runjs1.data}}') }),
    [CHILD]: childOf(LV, CHILD, 'textinput1', 'TextInput', childProperties),
  });
};

/** Simulates the Listview render that publishes new rows for changed data. */
const publishRows = (data) => state().updateCustomResolvables(LV, rowsFor(data), 'listItem', 'canvas', []);

const rowValue = (index) => state().getResolvedComponent(CHILD, index)?.properties?.value;

const D1 = [{ name: 'alpha' }, { name: 'bravo' }];
const D2 = [{ name: 'charlie' }, { name: 'delta' }];

describe('a ListView row binding re-resolves when the ListView data changes', () => {
  test('control: a property-access reference (`listItem.name`) tracks the new data', () => {
    seedRow({ value: binding('{{listItem.name}}') });

    publishRows(D1);
    expect(rowValue(0)).toBe('alpha');

    publishRows(D2);
    expect(rowValue(0)).toBe('charlie');
  });

  test('a bare-identifier reference inside an IIFE tracks the new data', () => {
    seedRow({
      value: binding(
        `{{(() => {
            const row = typeof listItem !== "undefined" ? listItem : null;
            return row ? String(row.name) : "";
          })()}}`
      ),
    });

    publishRows(D1);
    expect(rowValue(0)).toBe('alpha');

    // Break this catches: a bare-identifier reference registering no `listItem` edge, so a
    // republish of the ListView's rows never reaches this row.
    publishRows(D2);
    expect(rowValue(0)).toBe('charlie');
  });

  // Row data is strings so the whole binding is `{{ listItem }}` and the padding is the
  // subject; a TextInput `value` holding an object would be rejected by property validation.
  // The unpadded `{{listItem}}` is matched by the `value === '{{listItem}}'` equality case in
  // getCustomResolvableReference rather than by the matcher, so padding is the shape that
  // actually exercises the boundary.
  test('a whitespace-padded `{{ listItem }}` reference tracks the new data', () => {
    seedRow({ value: binding('{{ listItem }}') });

    publishRows(['alpha', 'bravo']);
    expect(rowValue(0)).toBe('alpha');

    publishRows(['charlie', 'delta']);
    expect(rowValue(0)).toBe('charlie');
  });
});

describe('a row binding that references both a query and listItem', () => {
  const EXPRESSION = `{{(() => {
      if (queries.runjs1.isLoading) return "";
      const row = typeof listItem !== "undefined" ? listItem : null;
      return row ? String(row.name) : "";
    })()}}`;

  /**
   * Mirrors one query run. The dependency cascade for `isLoading` lands synchronously, while
   * the ListView republishes its rows only on the React render that follows — hence the
   * separate publishRows call, in that order.
   */
  const runQuery = (data) => {
    state().setResolvedQuery(QUERY_ID, { isLoading: true }, 'canvas');
    state().setResolvedQuery(QUERY_ID, { isLoading: false, data }, 'canvas');
    publishRows(data);
  };

  test('the row tracks the data of the run that just finished', () => {
    // The query name->id mapping has to exist BEFORE initDependencyGraph runs, otherwise
    // `queries.runjs1` is never rewritten to its id and the edge is never registered.
    state().dataQuery.setQueries([{ id: QUERY_ID, name: 'runjs1', kind: 'runjs', options: {} }], 'canvas');
    state().setQueryMapping('canvas');
    seedApp({
      [LV]: componentDefinition(LV, 'listview1', 'Listview', { data: binding('{{queries.runjs1.data}}') }),
      [CHILD]: childOf(LV, CHILD, 'textinput1', 'TextInput', { value: binding(EXPRESSION) }),
    });

    runQuery(D1);
    expect(rowValue(0)).toBe('alpha');

    // Break this catches: another edge in the same expression standing in for the `listItem`
    // edge. It cannot — it re-resolves the row before the ListView has republished, so the
    // row settles on the previous publish's data and trails every subsequent run by one.
    runQuery(D2);
    expect(rowValue(0)).toBe('charlie');
  });
});

describe('which reference shapes register a listItem dependency', () => {
  // The matcher is textual, so it cannot tell an identifier from text that merely looks like
  // one — a quoted name, a key, a word in a sentence. The boundaries are therefore drawn by
  // hand, and the two costs are not symmetric: a shape wrongly accepted only buys a redundant
  // recompute, while a shape wrongly rejected leaves the row stale with no visible error.
  // Both directions are pinned so either boundary moves deliberately.
  const refsFor = (expression) => {
    seedRow({ value: binding(expression) });
    return state().getCustomResolvableReference(expression, LV, 'canvas');
  };

  test.each([
    ['a string literal', '{{"listItem"}}'],
    ['a quoted property lookup', "{{row['listItem']}}"],
    ["another object's property", '{{row.listItem}}'],
    ['a longer name that merely starts with it', '{{listItems.length}}'],
    ['a longer name that merely ends with it', '{{mylistItem.x}}'],
    ['an underscore-suffixed name', '{{listItem_id}}'],
    // Optional chaining is matched as the two-character `?.` rather than a bare `?`, so a
    // question mark closing a sentence is not a reference. The unspaced ternary below is the
    // accepted cost of that; its spaced form is covered by the whitespace boundary.
    ['prose ending in a question mark', '{{"have you picked a listItem?"}}'],
    ['an unspaced ternary', '{{listItem?a:b}}'],
  ])('%s is not a reference', (_label, expression) => {
    expect(refsFor(expression)).toEqual([]);
  });

  test.each([
    ['a bare identifier followed by whitespace', '{{typeof listItem !== "undefined" ? listItem : null}}'],
    ['optional chaining', '{{listItem?.config_value}}'],
    ['optional index access', '{{listItem?.[0]}}'],
    ['a spaced ternary', '{{listItem ? a : b}}'],
    ['whitespace padding', '{{ listItem }}'],
    ['a property access', '{{listItem.name}}'],
    ['an index', '{{listItem[0]}}'],
  ])('%s IS a reference', (_label, expression) => {
    expect(refsFor(expression)).toEqual([{ entityType: 'components', entityNameOrId: LV, entityKey: 'listItem' }]);
  });
});
