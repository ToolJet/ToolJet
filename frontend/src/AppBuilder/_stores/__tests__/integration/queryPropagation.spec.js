/**
 * A query result re-resolves its dependents without blocking: in one pass (it was one per query key), with one store
 * write per slice, and — when there are many — in slices across tasks. `await queries.x.run()` still sees every
 * dependent resolved.
 */
import useStore from '@/AppBuilder/_stores/store';
import { componentDefinition, binding } from '@/test/app-builder';
import { INLINE_DEPENDENTS } from '@/AppBuilder/_engines/data/propagation';

const state = () => useStore.getState();

const query = { id: 'q1', name: 'query1', kind: 'runjs', options: { code: 'return [1, 2, 3];' } };

// `count` Text components showing the query's row count.
function seed(count) {
  const components = {};
  for (let i = 0; i < count; i++) {
    components[`t${i}`] = componentDefinition(`t${i}`, `text${i}`, 'Text', {
      text: binding('{{queries.query1.data.length}}'),
    });
  }
  const store = state();
  store.initializeDependencySlice('canvas');
  store.setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' });
  store.dataQuery.setQueries([query], 'canvas');
  store.setQueryMapping('canvas');
  store.initialiseResolvedQuery([query.id], 'canvas');
  store.setPages([{ id: 'page-1', handle: 'home', name: 'Home', components }], 'canvas');
  store.setCurrentPageId('page-1', 'canvas');
  store.setComponentNameIdMapping('canvas');
  store.initDependencyGraph('canvas');
  return Object.keys(components);
}
// Text validates `text` as a string.
const shown = (ids) => ids.map((id) => state().getResolvedComponent(id)?.properties?.text);

// Every read of the clock moves it 1 ms, so a pass over many dependents runs out of its slice.
const slowClock = () => {
  let t = 0;
  return jest.spyOn(performance, 'now').mockImplementation(() => (t += 1));
};

afterEach(() => jest.restoreAllMocks());

describe('query result → dependents', () => {
  // Store writes (each one a render) while a query result lands on `count` dependents.
  const writesFor = (count) => {
    const ids = seed(count);
    const writes = jest.fn();
    const unsubscribe = useStore.subscribe(writes);
    const pending = state().setResolvedQuery('q1', { isLoading: false, data: [1, 2], rawData: [1, 2] });
    unsubscribe();
    return { ids, pending, writes: writes.mock.calls.length };
  };

  test('a few dependents resolve at once', () => {
    const { ids, pending } = writesFor(10);
    expect(pending).toBeNull();
    expect(shown(ids)).toEqual(Array(10).fill('2'));
  });

  test('the store is written a fixed number of times, not once per dependent', () => {
    writesFor(1); // the first run also writes a little one-time setup
    // The query's own write and one for all of its dependents. It was a pass per query key, and a write per dependent.
    expect(writesFor(40).writes).toBe(2);
    expect(writesFor(5).writes).toBe(2);
  });

  test('many dependents resolve in slices; the promise settles when all have', async () => {
    const ids = seed(INLINE_DEPENDENTS * 3);
    slowClock();
    const pending = state().setResolvedQuery('q1', { isLoading: false, data: [1, 2, 3, 4] });
    expect(pending).toBeInstanceOf(Promise);
    const done = shown(ids).filter((text) => text === '4').length;
    expect(done).toBeGreaterThan(0);
    expect(done).toBeLessThan(ids.length);
    await pending;
    expect(shown(ids)).toEqual(Array(ids.length).fill('4'));
  });

  test('await query.run() sees every dependent resolved, even when they resolve in slices', async () => {
    const ids = seed(INLINE_DEPENDENTS * 3);
    slowClock();
    await state().queryPanel.runQuery('q1', 'query1');
    expect(shown(ids)).toEqual(Array(ids.length).fill('3'));
  });

  test('flushImplicitBatchEntries (used before events run) resolves everything still pending', () => {
    const ids = seed(INLINE_DEPENDENTS * 3);
    slowClock();
    state().setResolvedQuery('q1', { isLoading: false, data: [1] });
    state().flushImplicitBatchEntries();
    expect(shown(ids)).toEqual(Array(ids.length).fill('1'));
  });
});
