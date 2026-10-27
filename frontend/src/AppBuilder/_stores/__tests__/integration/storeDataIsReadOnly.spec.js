/**
 * Only the store's own setters change a query's or a component's data. A RunJS script, a transformation or a `{{ }}`
 * binding writing into it (a row, a nested field) changes nothing — at any size: a large result is frozen in slices
 * before it's stored.
 */
import useStore from '@/AppBuilder/_stores/store';
import { rowsProfileOf } from '@/AppBuilder/_engines/data/freeze';

const state = () => useStore.getState();
const exposed = () => state().resolvedStore.modules.canvas.exposedValues;

const query = (id, name, code, options = {}) => ({ id, name, kind: 'runjs', options: { code, ...options } });

function seed(queries) {
  const store = state();
  store.initializeDependencySlice('canvas');
  store.setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' });
  store.dataQuery.setQueries(queries, 'canvas');
  store.setQueryMapping('canvas');
  store.initialiseResolvedQuery(
    queries.map(({ id }) => id),
    'canvas'
  );
  store.setPages([{ id: 'page-1', handle: 'home', name: 'Home', components: {} }], 'canvas');
  store.setCurrentPageId('page-1', 'canvas');
  store.setComponentNameIdMapping('canvas');
  store.initDependencyGraph('canvas');
}

const ROWS = "return [{ name: 'a', address: { city: 'x' }, tags: ['t'] }];";

describe("other code can't change stored data", () => {
  test('a RunJS script writing into another query’s rows', async () => {
    seed([
      query('q1', 'source', ROWS),
      query('q2', 'writer', "queries.source.data[0].name = 'changed'; queries.source.data[0].address.city = 'y';"),
    ]);
    await state().queryPanel.runQuery('q1', 'source');
    await state().queryPanel.runQuery('q2', 'writer');
    expect(exposed().queries.q1.data).toEqual([{ name: 'a', address: { city: 'x' }, tags: ['t'] }]);
  });

  test("a transformation writing into a component's exposed rows", async () => {
    seed([
      query('q1', 'writer', 'return 1;', {
        enableTransformation: true,
        transformation: "components.table1.data[0].name = 'changed'; return data;",
      }),
    ]);
    state().setExposedValue('table1', 'data', [{ name: 'a' }], 'canvas');
    useStore.setState((draft) => {
      draft.modules.canvas.componentNameIdMapping = { table1: 'table1' };
    });
    await state().queryPanel.runQuery('q1', 'writer');
    expect(exposed().components.table1.data).toEqual([{ name: 'a' }]);
  });

  test('a large result is frozen throughout before it is stored', async () => {
    seed([query('q1', 'big', 'return Array.from({ length: 200000 }, (_, i) => ({ id: i, address: { city: "x" } }));')]);
    await state().queryPanel.runQuery('q1', 'big');
    const rows = exposed().queries.q1.data;
    expect(rows).toHaveLength(200000);
    expect([Object.isFrozen(rows), Object.isFrozen(rows[0]), Object.isFrozen(rows[199999].address)]).toEqual([
      true,
      true,
      true,
    ]);
  });

  test('a variable is stored as it was set, frozen as Immer freezes it: class instances (a Date) are left alone', () => {
    seed([]);
    class Counter {
      count = 0;
    }
    const counter = new Counter();
    const when = new Date(0);
    const value = { rows: [{ name: 'a' }], nested: { counter, when } };
    state().setVariable('v', value, 'canvas');
    expect(state().getVariable('v', 'canvas')).toBe(value);
    expect([Object.isFrozen(value), Object.isFrozen(value.rows[0]), Object.isFrozen(value.nested)]).toEqual([
      true,
      true,
      true,
    ]);
    expect([Object.isFrozen(counter), Object.isFrozen(when)]).toEqual([false, false]);
    counter.count += 1;
    expect(state().getVariable('v', 'canvas').nested.counter.count).toBe(1);
    // A long array's rows are profiled as it is frozen (for a ListView over it).
    const rows = Array.from({ length: 2000 }, (_, i) => ({ id: i }));
    state().setVariable('rows', rows, 'canvas');
    expect(rowsProfileOf(rows)).toBeDefined();
  });
});
