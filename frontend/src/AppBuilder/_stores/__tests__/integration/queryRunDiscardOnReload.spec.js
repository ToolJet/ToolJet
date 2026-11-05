/**
 * A run still in flight when the app reloads into another environment, version or restore point
 * (useAppData calls discardInFlightQueries) must not write its late result into the new context.
 *
 * NO MOCKS: a real runQuery against MSW; the observable is exposedValues.queries[id].
 */
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { resetAllStores } from '@/AppBuilder/_stores/utils';
import { discardInFlightQueries } from '@/AppBuilder/_utils/queryAbort';
import { seedApp } from '@/test/app-builder';

const state = () => useStore.getState();
const exposedQuery = () => state().resolvedStore.modules.canvas.exposedValues.queries?.q1;

function seedQuery() {
  seedApp({});
  state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' });
  state().dataQuery.setQueries(
    [{ id: 'q1', name: 'query1', kind: 'restapi', options: { url: 'https://example.test' } }],
    'canvas'
  );
  state().setQueryMapping('canvas');
}

// The response is held until the test releases it, so the reload happens mid-flight.
function serveHeldResponse(body) {
  let release;
  const held = new Promise((resolve) => (release = resolve));
  server.use(
    http.post('*/data-queries/:queryId/run', async () => {
      await held;
      return HttpResponse.json(body);
    })
  );
  return () => release();
}

describe('query run in flight across an app reload', () => {
  afterEach(() => resetAllStores());

  test('a response that arrives after the reload is dropped', async () => {
    seedQuery();
    const release = serveHeldResponse({ status: 'ok', data: ['from the old environment'] });

    const run = state().queryPanel.runQuery('q1', 'query1', true, 'view');
    expect(exposedQuery()?.isLoading).toBe(true);

    discardInFlightQueries();
    release();

    await expect(run).resolves.toEqual({ status: 'aborted' });
    expect(exposedQuery()?.data).not.toEqual(['from the old environment']);
  });

  test('a run started after the reload still lands', async () => {
    seedQuery();
    discardInFlightQueries();
    const release = serveHeldResponse({ status: 'ok', data: ['from the new environment'] });

    const run = state().queryPanel.runQuery('q1', 'query1', true, 'view');
    release();

    await expect(run).resolves.toMatchObject({ status: 'ok' });
    expect(exposedQuery()?.data).toEqual(['from the new environment']);
  });
});
