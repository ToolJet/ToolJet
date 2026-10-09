/**
 * "Run query on dependency change" has been re-fixed five times, and the
 * recurring symptom is always the same: a query that should only run when a
 * component value changes runs during app load instead — extra backend load,
 * and it overwrites whatever the user was looking at.
 *
 * Mechanism: a dependency on `queries.<id>.__options__` schedules a 500 ms
 * trailing rerun (componentsSlice.js:54-69), suppressible via a module-level Set
 * that the load effect opens and closes synchronously (useAppData.js:657-666).
 *
 * NO MOCKS. The observable is the real store side effect of runQuery — it writes
 * `{ isLoading: true }` into exposedValues.queries[id] synchronously when it
 * starts (queryPanelSlice.js:648-658). That is stronger evidence than a spy,
 * because it proves the query actually entered execution.
 *
 * FAKE TIMER TRAP, read before editing: jest.useFakeTimers() with no doNotFake
 * also fakes `queueMicrotask` (jsdom defines it as an own property of window),
 * so `await Promise.resolve()` does NOT drain the dependency cascade here. Every
 * test below drives it with flushImplicitBatchEntries() or jest.runAllTicks(),
 * never a bare await.
 */
import useStore from '@/AppBuilder/_stores/store';
import { resetAllStores } from '@/AppBuilder/_stores/utils';
// Module-level export, not a store action (componentsSlice.js:87).
import { setSuppressQueryRerun } from '@/AppBuilder/_stores/slices/componentsSlice';
import { seedApp, componentDefinition } from '@/test/app-builder';

const state = () => useStore.getState();

/** True once runQuery has actually started executing the query. */
const didRun = (queryId = 'q1') =>
  state().resolvedStore.modules.canvas.exposedValues.queries?.[queryId]?.isLoading === true;

const restQuery = (options) => ({
  id: 'q1',
  name: 'query1',
  kind: 'restapi',
  options: { url: '{{components.textinput1.value}}', runOnDependencyChange: true, ...options },
});

function seedQueryDependingOnComponent(query = restQuery()) {
  seedApp({ c1: componentDefinition('c1', 'textinput1', 'TextInput') });
  state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' });
  state().dataQuery.setQueries([query], 'canvas');
  state().setQueryMapping('canvas');
  state().registerQueryDependencies(query.id, query.name, query.kind, query.options, 'canvas');
  return query;
}

/** Publish a value and let the dependency cascade land, under fake timers. */
function publish(value) {
  state().setExposedValue('c1', 'value', value);
  state().flushImplicitBatchEntries();
}

describe('rerun on dependency change', () => {
  beforeEach(() => jest.useFakeTimers());

  test('the __options__ sentinel edge is registered for a rest query', () => {
    seedQueryDependingOnComponent();

    // If this edge is missing, nothing below can possibly fire — assert it
    // first so a registration regression is not misread as a timing bug.
    const graph = state().dependencyGraph.modules.canvas.graph;
    expect(graph.hasNode('queries.q1.__options__')).toBe(true);
    expect(graph.getDirectDependents('queries.q1.__options__')).toContain('components.c1.value');
  });

  test('a dependency change reruns the query after the 500ms debounce', () => {
    seedQueryDependingOnComponent();

    publish('typed');
    expect(didRun()).toBe(false);

    jest.advanceTimersByTime(500);
    expect(didRun()).toBe(true);
  });

  test('many changes inside the window collapse into one rerun', () => {
    seedQueryDependingOnComponent();

    for (const value of ['a', 'b', 'c', 'd']) {
      publish(value);
      jest.advanceTimersByTime(100); // each keystroke restarts the trailing timer
    }

    // Still nothing after 400ms of typing: the debounce is trailing, so a bound
    // input must not fire one request per keystroke.
    expect(didRun()).toBe(false);
    jest.advanceTimersByTime(500);
    expect(didRun()).toBe(true);
  });

  test('turning runOnDependencyChange off during the window cancels the rerun', () => {
    const query = seedQueryDependingOnComponent();

    publish('typed');
    // componentsSlice.js:62-66 re-reads the query and the flag at FIRE time, not
    // at schedule time. Pinned because it is the cheap way to cancel a pending
    // rerun, and a refactor that captured the flag at schedule time would
    // silently break it.
    state().dataQuery.setQueries([{ ...query, options: { ...query.options, runOnDependencyChange: false } }], 'canvas');
    jest.advanceTimersByTime(500);

    expect(didRun()).toBe(false);
  });

  test('a query without runOnDependencyChange never reruns', () => {
    seedQueryDependingOnComponent(restQuery({ runOnDependencyChange: false }));

    publish('typed');
    jest.advanceTimersByTime(500);

    expect(didRun()).toBe(false);
  });

  test('RunJS never registers a rerun dependency', () => {
    seedApp({ c1: componentDefinition('c1', 'textinput1', 'TextInput') });
    state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' });
    const q = { id: 'q1', name: 'query1', kind: 'runjs', options: { code: '{{components.textinput1.value}}' } };
    state().dataQuery.setQueries([q], 'canvas');
    state().setQueryMapping('canvas');

    // componentsSlice.js:1208 early-returns for runjs/runpy. Regression test for
    // commit 4e1756eb48 — a RunJS query re-running on every keystroke.
    state().registerQueryDependencies(q.id, q.name, q.kind, q.options, 'canvas');
    expect(state().dependencyGraph.modules.canvas.graph.hasNode('queries.q1.__options__')).toBe(false);

    publish('typed');
    jest.advanceTimersByTime(500);
    expect(didRun()).toBe(false);
  });

  test('suppression blocks a rerun cascading inside the window', () => {
    seedQueryDependingOnComponent();

    // What useAppData does around the initial-load flush.
    setSuppressQueryRerun('canvas', true);
    publish('from load');
    setSuppressQueryRerun('canvas', false);

    jest.advanceTimersByTime(500);
    expect(didRun()).toBe(false);
  });

  test.failing('BUG: a write made before the suppression window leaks past it', () => {
    seedQueryDependingOnComponent();

    // A widget publishes during mount, OUTSIDE any explicit bracket, so the
    // cascade sits in the implicit queueMicrotask queue (resolvedSlice.js:88-98)
    // rather than in the batch the load effect flushes.
    state().setExposedValue('c1', 'value', 'mounted');

    // The load effect's suppression window is synchronous (useAppData.js:657-666)
    // and never drains that pending microtask.
    setSuppressQueryRerun('canvas', true);
    state().flushExposedValueBatch();
    setSuppressQueryRerun('canvas', false);

    // The queued cascade lands after suppression is gone and schedules the rerun
    // anyway. This is the "my query runs on page load" report, still reachable
    // after five separate fixes.
    jest.runAllTicks();
    jest.advanceTimersByTime(500);

    expect(didRun()).toBe(false);
  });
});

describe('module-level state hygiene', () => {
  test('a pending rerun does not execute against a store that no longer has the query', () => {
    jest.useFakeTimers();
    seedQueryDependingOnComponent();
    publish('typed');

    // queryRerunTimers is a module-level Map (componentsSlice.js:46) that no
    // store reset clears, so the timer itself DOES survive. What saves us is
    // that the callback re-reads the query at fire time (componentsSlice.js:62-66)
    // and finds nothing, so it no-ops. Pinned because that fire-time lookup is
    // the only thing standing between a stale timer and a phantom query run.
    resetAllStores();
    jest.advanceTimersByTime(500);

    expect(didRun()).toBe(false);
  });

  test('the pending timer itself is NOT cleared by a store reset', () => {
    jest.useFakeTimers();
    seedQueryDependingOnComponent();
    publish('typed');
    const pendingBefore = jest.getTimerCount();

    resetAllStores();

    // The module-level queryRerunTimers Map is outside zustand entirely, so the
    // timer count is unchanged. Documented as a live hazard rather than a bug
    // report: today it is contained by the fire-time query lookup above, so the
    // safety depends on that lookup staying in place. Anything that starts
    // capturing the query at schedule time turns this into a real cross-page
    // query execution.
    expect(jest.getTimerCount()).toBe(pendingBefore);
    expect(pendingBefore).toBeGreaterThan(0);
  });
});
