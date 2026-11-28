import { waitFor } from '@testing-library/react';
import { AppBuilderTestSession, seedApp } from '@/test/app-builder';

// A cached query that asks for confirmation must keep a refresh a refresh: answering Yes runs it with the
// refresh instruction, answering No sends nothing, and a plain run stays a plain run.
describe('query cache refresh through request confirmation', () => {
  let session;
  let sentBodies;

  const cachedQuery = {
    id: 'q-cache',
    name: 'getRows',
    kind: 'restapi',
    options: {
      method: 'get',
      url: 'https://example.test/rows',
      requestConfirmation: true,
      responseCache: { enabled: true, ttlSeconds: 60 },
    },
  };
  // Calls refresh() from RunJS, the way app code does.
  const refresher = {
    id: 'q-refresher',
    name: 'refresher',
    kind: 'runjs',
    options: { code: 'queries.getRows.refresh(); return true;', parameters: [] },
  };

  beforeEach(async () => {
    sentBodies = [];
    session = new AppBuilderTestSession({
      scenario: {
        surface: 'app-editor',
        capabilities: {
          network: [
            {
              method: 'post',
              url: 'http://localhost:3000/api/data-queries/q-cache/*',
              json: async ({ request }) => {
                const body = await request.json();
                sentBodies.push(body);
                return { status: 'ok', data: { cacheControl: body.cacheControl ?? null } };
              },
            },
            // Refresh needs the response cache license; it reaches the store only through this endpoint.
            { url: '*/license/access', json: () => ({ queryResponseCache: true }) },
          ],
        },
      },
    });
    await session.store.act('updateFeatureAccess');
    seedApp({});
    const queries = [cachedQuery, refresher];
    await session.store.act((state) => {
      state.setApp({ appId: 'app-1', isPublic: false });
      state.setCurrentMode('edit');
      state.setEditorLoading(false, 'canvas');
      state.dataQuery.setQueries(queries, 'canvas');
      state.setQueryMapping('canvas');
      queries.forEach((query) =>
        state.registerQueryDependencies(query.id, query.name, query.kind, query.options, 'canvas')
      );
    });
  });

  const pending = () => session.store.read((state) => state.dataQuery.queryConfirmationList.map((q) => q.queryId));
  // What the confirmation popup's Yes and No buttons call (Popups.jsx).
  const answer = (isConfirm) =>
    session.store.act((state) =>
      state.queryPanel.onQueryConfirmOrCancel(state.dataQuery.queryConfirmationList[0], isConfirm)
    );
  const runConfirmed = (queryId, name) =>
    session.store.act((state) => state.queryPanel.runQuery(queryId, name, true, undefined, {}));
  const runAwaitingAnswer = (queryId, name) =>
    session.store.act((state) => state.queryPanel.runQuery(queryId, name, undefined, undefined, {}));
  const fireRefreshEvent = (event) =>
    session.store.act((state) => {
      state.eventsSlice.setEvents(
        [
          {
            id: 'evt-refresh',
            index: 0,
            sourceId: 'component-1',
            name: 'evt-refresh',
            target: 'component',
            event: { eventId: 'onClick', queryId: 'q-cache', queryName: 'getRows', ...event },
          },
        ],
        'canvas'
      );
      state.eventsSlice.fireEvent('onClick', 'component-1', 'canvas', {}, {});
    });
  const waitForQueued = () => waitFor(() => expect(pending()).toEqual(['q-cache']));

  // Break this catches: Yes on a refresh() call dropping the refresh, so the query is served from cache.
  test('[QueryCache-REFRESH-CONFIRM-001] refresh() from RunJS refreshes after Yes', async () => {
    // RunJS sees a query, and its refresh(), once it has run.
    await runConfirmed('q-cache', 'getRows');
    await waitFor(() => expect(sentBodies).toHaveLength(1));

    await runConfirmed('q-refresher', 'refresher');
    await waitForQueued();
    expect(sentBodies).toHaveLength(1);

    await answer(true);

    await waitFor(() => expect(sentBodies).toHaveLength(2));
    expect(sentBodies[1].cacheControl).toBe('refresh');
  });

  // Break this catches: Yes on a Refresh Query Cache event dropping the refresh.
  test.each([
    ['saved Refresh Query Cache event', { actionId: 'run-query', refreshCache: true }],
    ['Refresh Query Cache alias built outside the Event Manager', { actionId: 'refresh-query-cache' }],
  ])('[QueryCache-REFRESH-CONFIRM-002] a %s refreshes after Yes', async (_label, event) => {
    await fireRefreshEvent(event);
    await waitForQueued();
    expect(sentBodies).toHaveLength(0);

    await answer(true);

    await waitFor(() => expect(sentBodies).toHaveLength(1));
    expect(sentBodies[0].cacheControl).toBe('refresh');
  });

  // Break this catches: No still running the refresh.
  test('[QueryCache-REFRESH-CONFIRM-003] No sends no request', async () => {
    await fireRefreshEvent({ actionId: 'run-query', refreshCache: true });
    await waitForQueued();

    await answer(false);
    // Let anything that answering could have started reach the network.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(pending()).toEqual([]);
    expect(sentBodies).toHaveLength(0);
  });

  // Break this catches: the fix turning every confirmed run into a refresh.
  test('[QueryCache-REFRESH-CONFIRM-004] a plain run stays a plain run after Yes', async () => {
    await runAwaitingAnswer('q-cache', 'getRows');
    await waitForQueued();

    await answer(true);

    await waitFor(() => expect(sentBodies).toHaveLength(1));
    expect(sentBodies[0]).not.toHaveProperty('cacheControl');
  });
});
