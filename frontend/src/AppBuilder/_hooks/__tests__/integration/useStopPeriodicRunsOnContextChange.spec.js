/**
 * Switching environment / version / restoring history stops "Run this query periodically" polling,
 * in the app editor and in the standalone module editor (QC05: the module editor kept polling and
 * its ticks ran against the newly selected environment). A fresh Run starts one loop again.
 *
 * NO MOCKS: the real store and periodic scheduler; the observable is the run requests MSW receives.
 */
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { renderHook, act } from '@testing-library/react';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { resetAllStores } from '@/AppBuilder/_stores/utils';
import { reconcileQueryPeriodicRun, clearAllPeriodicTimers } from '@/AppBuilder/_stores/slices/componentsSlice';
import { useStopPeriodicRunsOnContextChange } from '@/AppBuilder/_hooks/useStopPeriodicRunsOnContextChange';
import { seedApp } from '@/test/app-builder';

const state = () => useStore.getState();
const INTERVAL = 1000;

let runRequests;

// A placed module instance's namespace, the same setup as queryPeriodicRun.spec.js.
function bootModule(moduleId) {
  state().initializeComponentsSlice(moduleId);
  state().initializeAppSlice(moduleId);
  state().initializeEventsSlice(moduleId);
  state().initializeResolvedSlice(moduleId);
  state().initializeDependencySlice(moduleId);
  state().initializeDataQuerySlice(moduleId);
  state().initializeModeSlice(moduleId);
  state().initializeLoaderSlice(moduleId);
  state().setEditorLoading(false, moduleId);
  state().setCurrentMode('view', moduleId);
  seedApp({}, { moduleId });
}

function seedPolledQuery(moduleId = 'canvas') {
  if (moduleId === 'canvas') seedApp({});
  else bootModule(moduleId);
  state().dataQuery.setQueries(
    [
      {
        id: 'q1',
        name: 'query1',
        kind: 'restapi',
        options: { url: 'https://example.test', runPeriodically: true, queryRunInterval: INTERVAL },
      },
    ],
    moduleId
  );
  state().setQueryMapping(moduleId);
}

// What the Run button does once the query is committed to executing: arm the polling loop.
const run = (moduleId = 'canvas') => reconcileQueryPeriodicRun('q1', moduleId, state);

// Advance time and let each tick's run request reach MSW and settle.
const elapse = async (ms) => {
  await act(() => jest.advanceTimersByTimeAsync(ms));
};

const context = {
  environmentId: 'env-development',
  versionId: 'v1',
  selectedVersionId: 'v1',
  restoreTimestamp: null,
};

const renderEditor = (editor) =>
  renderHook((props) => useStopPeriodicRunsOnContextChange(props), {
    initialProps: { ...context, ...editor },
  });

describe('periodic polling stops when the editor data context changes', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    runRequests = 0;
    server.use(
      http.post('*/data-queries/:queryId/run', () => {
        runRequests += 1;
        return HttpResponse.json({ status: 'ok', data: [] });
      })
    );
  });

  afterEach(async () => {
    clearAllPeriodicTimers();
    jest.useRealTimers();
    // Let a run that was in flight settle before the store reset drops the namespace it writes to.
    await new Promise((resolve) => setTimeout(resolve, 50));
    resetAllStores();
  });

  describe('standalone module editor', () => {
    const moduleEditor = { moduleMode: true, moduleId: 'canvas' };

    test('QC05: switching environment stops polling; no new request until Run again', async () => {
      seedPolledQuery();
      const { rerender } = renderEditor(moduleEditor);
      run();
      await elapse(3 * INTERVAL);
      expect(runRequests).toBe(3);

      rerender({ ...context, ...moduleEditor, environmentId: 'env-staging' });
      await elapse(10 * INTERVAL);
      expect(runRequests).toBe(3);

      // A fresh Run in the new environment polls again, as one loop.
      run();
      await elapse(3 * INTERVAL);
      expect(runRequests).toBe(6);
    });

    test('switching back and forth never revives the old loop', async () => {
      seedPolledQuery();
      const { rerender } = renderEditor(moduleEditor);
      run();
      await elapse(INTERVAL);

      rerender({ ...context, ...moduleEditor, environmentId: 'env-staging' });
      rerender({ ...context, ...moduleEditor, environmentId: 'env-development' });
      await elapse(5 * INTERVAL);
      expect(runRequests).toBe(1);
    });

    test('a re-render in the same context (e.g. a hot reload) keeps polling', async () => {
      seedPolledQuery();
      const { rerender } = renderEditor(moduleEditor);
      run();

      rerender({ ...context, ...moduleEditor });
      await elapse(2 * INTERVAL);
      expect(runRequests).toBe(2);
    });
  });

  describe('app editor', () => {
    const appEditor = { moduleMode: false, moduleId: 'canvas' };

    test.each([
      ['an environment switch', { environmentId: 'env-staging' }],
      ['a version switch', { versionId: 'v2', selectedVersionId: 'v2' }],
      ['a restore', { restoreTimestamp: 1 }],
    ])('%s stops polling', async (_, change) => {
      seedPolledQuery();
      const { rerender } = renderEditor(appEditor);
      run();

      rerender({ ...context, ...appEditor, ...change });
      await elapse(3 * INTERVAL);
      expect(runRequests).toBe(0);
    });

    test('a version id selectedVersion has not caught up with (clone) keeps polling', async () => {
      seedPolledQuery();
      const { rerender } = renderEditor(appEditor);
      run();

      rerender({ ...context, ...appEditor, versionId: 'v2' });
      await elapse(2 * INTERVAL);
      expect(runRequests).toBe(2);
    });
  });

  test('a placed module instance leaves stopping to the app holding it', async () => {
    seedPolledQuery();
    seedPolledQuery('module-a');
    const app = renderEditor({ moduleMode: false, moduleId: 'canvas' });
    const instance = renderEditor({ moduleMode: true, moduleId: 'module-a' });
    run('module-a');

    // The instance alone re-rendering with the new environment doesn't stop anything...
    instance.rerender({ ...context, moduleMode: true, moduleId: 'module-a', environmentId: 'env-staging' });
    await elapse(INTERVAL);
    expect(runRequests).toBe(1);

    // ...the app's switch stops every timer, the instance's included.
    app.rerender({ ...context, moduleMode: false, moduleId: 'canvas', environmentId: 'env-staging' });
    await elapse(3 * INTERVAL);
    expect(runRequests).toBe(1);
  });
});
