/**
 * "Run this query periodically": a self-re-arming setTimeout per query
 * (componentsSlice.js, armPeriodicTimer), started by runQuery via
 * reconcileQueryPeriodicRun.
 *
 * NO MOCKS. Like queryRerunOnDependencyChange.spec.js, the observable is the
 * real store side effect of runQuery: `{ isLoading: true }` in
 * exposedValues.queries[id] once it starts executing.
 */
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { resetAllStores } from '@/AppBuilder/_stores/utils';
// Module-level exports, not store actions.
import { reconcileQueryPeriodicRun, clearAllPeriodicTimers } from '@/AppBuilder/_stores/slices/componentsSlice';
import { seedApp } from '@/test/app-builder';

const state = () => useStore.getState();

const didRun = (queryId = 'q1') =>
  state().resolvedStore.modules.canvas.exposedValues.queries?.[queryId]?.isLoading === true;

const skippedLogs = () => state().debugger.logs.filter((log) => log.message?.startsWith('Query skipped'));

function seedPeriodicQuery(options = {}, id = 'q1') {
  seedApp({});
  state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' });
  const query = {
    id,
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
  beforeEach(() => {
    jest.useFakeTimers();
    // Ticks really send the run request; answer it so runs settle quietly.
    server.use(http.post('*/data-queries/:queryId/run', () => HttpResponse.json({ status: 'ok', data: [] })));
  });

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

  test('a short interval is used as set, with no minimum', () => {
    seedPeriodicQuery({ queryRunInterval: 10 });

    jest.advanceTimersByTime(9);
    expect(didRun()).toBe(false);

    jest.advanceTimersByTime(1);
    expect(didRun()).toBe(true);
  });

  test('an interval above the browser timer limit is capped instead of firing immediately', () => {
    seedPeriodicQuery({ queryRunInterval: 3_000_000_000 }); // ~35 days, overflows a 32-bit delay

    jest.advanceTimersByTime(1000);
    expect(didRun()).toBe(false);

    jest.advanceTimersByTime(2 ** 31 - 1 - 1000);
    expect(didRun()).toBe(true);
  });

  test('an option edit never starts a timer for a query that has not run', () => {
    seedApp({});
    state().dataQuery.setQueries(
      [{ id: 'q1', name: 'query1', kind: 'restapi', options: { runPeriodically: true, queryRunInterval: 1000 } }],
      'canvas'
    );
    reconcileQueryPeriodicRun('q1', 'canvas', state, { allowStart: false });

    jest.advanceTimersByTime(3000);
    expect(didRun()).toBe(false);
  });

  test('a tick whose query is gone (e.g. after a version switch) stops the chain', () => {
    seedPeriodicQuery();

    state().dataQuery.setQueries([], 'canvas');
    jest.advanceTimersByTime(1000);
    // Restoring the query must not revive the stopped chain.
    state().dataQuery.setQueries([{ id: 'q1', name: 'query1', kind: 'restapi', options: {} }], 'canvas');
    jest.advanceTimersByTime(3000);

    expect(didRun()).toBe(false);
  });

  describe('when the toggle turns off or the interval becomes invalid', () => {
    // What a changing fx value or an option edit looks like to the timer.
    const setOptions = (query, options) =>
      state().dataQuery.setQueries([{ ...query, options: { ...query.options, ...options } }], 'canvas');

    test('polling idles, then resumes without another run once the toggle is back on', () => {
      const query = seedPeriodicQuery();

      setOptions(query, { runPeriodically: false });
      jest.advanceTimersByTime(3000);
      expect(didRun()).toBe(false);

      setOptions(query, { runPeriodically: true });
      jest.advanceTimersByTime(1000);
      expect(didRun()).toBe(true);
    });

    test('polling idles, then resumes once an invalid interval is fixed', () => {
      const query = seedPeriodicQuery();

      setOptions(query, { queryRunInterval: 'not a number' });
      jest.advanceTimersByTime(3000);
      expect(didRun()).toBe(false);

      setOptions(query, { queryRunInterval: 1000 });
      jest.advanceTimersByTime(1000);
      expect(didRun()).toBe(true);
    });

    test('an editor edit turning it back on restarts the clock from the edit', () => {
      const query = seedPeriodicQuery();

      setOptions(query, { runPeriodically: false });
      jest.advanceTimersByTime(1500); // the tick at 1000ms idles

      setOptions(query, { runPeriodically: true });
      reconcileQueryPeriodicRun(query.id, 'canvas', state, { allowStart: false });

      jest.advanceTimersByTime(999);
      expect(didRun()).toBe(false); // the idle check that was due at 2000ms was replaced
      jest.advanceTimersByTime(1);
      expect(didRun()).toBe(true);
    });
  });

  describe('in an inactive browser tab', () => {
    let hidden;
    beforeEach(() => {
      hidden = true;
      jest.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    });
    afterEach(() => jest.restoreAllMocks());

    const showTab = () => {
      hidden = false;
      document.dispatchEvent(new Event('visibilitychange'));
    };

    test('ticks pause, then the query runs once as soon as the tab is visible again', () => {
      seedPeriodicQuery();

      jest.advanceTimersByTime(3000);
      expect(didRun()).toBe(false);

      showTab();
      jest.advanceTimersByTime(0);
      expect(didRun()).toBe(true);
    });

    test('a query set to keep running in inactive tabs still runs', () => {
      seedPeriodicQuery({ runPeriodicallyInBackground: true });

      jest.advanceTimersByTime(1000);
      expect(didRun()).toBe(true);
    });
  });

  describe('after consecutive failures', () => {
    // Real timers: the failed run settles through MSW and promise chains that fake timers stall.
    beforeEach(() => jest.useRealTimers());

    function serveFailingRuns() {
      const runs = [];
      server.use(
        http.post('*/data-queries/:queryId/run', ({ params }) => {
          runs.push(params.queryId);
          return HttpResponse.json({ statusCode: 500, message: 'Service unavailable' }, { status: 500 });
        })
      );
      return runs;
    }

    const pausedLogs = () => state().debugger.logs.filter((log) => log.message?.startsWith('Periodic run paused'));

    test('periodic runs pause once the configured number of runs failed in a row', async () => {
      const runs = serveFailingRuns();
      // Own query id: a run still in flight from an earlier test must not count here.
      seedPeriodicQuery({ pauseAfterFailures: '2' }, 'q-fail-threshold');

      await waitFor(() => expect(pausedLogs()).toHaveLength(1), { timeout: 4000 });
      expect(runs).toHaveLength(2);

      await new Promise((resolve) => setTimeout(resolve, 1500));
      expect(runs).toHaveLength(2);
    }, 10000);

    const thresholdWarnings = () =>
      state().debugger.logs.filter((log) => log.message?.startsWith('Pause after failures'));

    test('a fractional threshold rounds up, with one warning', async () => {
      const runs = serveFailingRuns();
      seedPeriodicQuery({ pauseAfterFailures: '1.5' }, 'q-fail-fraction');

      await waitFor(() => expect(pausedLogs()).toHaveLength(1), { timeout: 4000 });
      expect(runs).toHaveLength(2);
      expect(thresholdWarnings()).toEqual([
        expect.objectContaining({ message: 'Pause after failures "1.5" is not a positive whole number; using 2.' }),
      ]);
    }, 10000);

    test('a negative threshold never pauses, with one warning', async () => {
      const runs = serveFailingRuns();
      seedPeriodicQuery({ pauseAfterFailures: '-1' }, 'q-fail-negative');

      await waitFor(() => expect(runs.length).toBeGreaterThanOrEqual(3), { timeout: 5000 });
      expect(pausedLogs()).toHaveLength(0);
      expect(thresholdWarnings()).toHaveLength(1);
    }, 10000);

    test('without a threshold, failing runs keep going', async () => {
      const runs = serveFailingRuns();
      seedPeriodicQuery({}, 'q-fail-no-threshold');

      await waitFor(() => expect(runs.length).toBeGreaterThanOrEqual(3), { timeout: 5000 });
      expect(pausedLogs()).toHaveLength(0);
    }, 10000);
  });

  test('clearing all timers (app teardown) stops further ticks', () => {
    seedPeriodicQuery();

    clearAllPeriodicTimers();
    jest.advanceTimersByTime(3000);

    expect(didRun()).toBe(false);
  });
});
