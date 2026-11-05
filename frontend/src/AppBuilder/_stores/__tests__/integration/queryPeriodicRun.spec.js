/**
 * "Run this query periodically": a self-re-arming setTimeout per query
 * (componentsSlice.js, armPeriodicTimer), started by runQuery via
 * reconcileQueryPeriodicRun.
 *
 * NO MOCKS. Like queryRerunOnDependencyChange.spec.js, the observable is the
 * real store side effect of runQuery: `{ isLoading: true }` in
 * exposedValues.queries[id] once it starts executing.
 */
import useStore from '@/AppBuilder/_stores/store';
import { resetAllStores } from '@/AppBuilder/_stores/utils';
// Module-level exports, not store actions.
import { reconcileQueryPeriodicRun, clearAllPeriodicTimers } from '@/AppBuilder/_stores/slices/componentsSlice';
import { seedApp } from '@/test/app-builder';

const state = () => useStore.getState();

const didRun = (queryId = 'q1') =>
  state().resolvedStore.modules.canvas.exposedValues.queries?.[queryId]?.isLoading === true;

const skippedLogs = () => state().debugger.logs.filter((log) => log.message?.startsWith('Query skipped'));

function seedPeriodicQuery(options = {}) {
  seedApp({});
  state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' });
  const query = {
    id: 'q1',
    name: 'query1',
    kind: 'restapi',
    options: { url: 'https://example.test', runPeriodically: true, queryRunInterval: 1000, ...options },
  };
  state().dataQuery.setQueries([query], 'canvas');
  state().setQueryMapping('canvas');
  // What runQuery does once the query is committed to executing: arm the first tick.
  reconcileQueryPeriodicRun(query.id, 'canvas', state);
  return query;
}

describe('run query periodically', () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    clearAllPeriodicTimers();
    jest.useRealTimers();
    resetAllStores();
  });

  test('an armed query runs once the interval elapses', () => {
    seedPeriodicQuery();

    jest.advanceTimersByTime(999);
    expect(didRun()).toBe(false);

    jest.advanceTimersByTime(1);
    expect(didRun()).toBe(true);
  });

  test('a disabled query does not run or log "Query skipped" on each tick', () => {
    seedPeriodicQuery({ disableQuery: '{{true}}' });

    jest.advanceTimersByTime(3000);

    expect(didRun()).toBe(false);
    expect(skippedLogs()).toHaveLength(0);
  });

  test('clearing all timers (app teardown) stops further ticks', () => {
    seedPeriodicQuery();

    clearAllPeriodicTimers();
    jest.advanceTimersByTime(3000);

    expect(didRun()).toBe(false);
  });
});
