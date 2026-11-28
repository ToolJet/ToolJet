import { AppBuilderTestSession, seedApp } from '@/test/app-builder';

// Refresh exists only for a query with response caching on, in a workspace licensed for it. Otherwise a
// query behaves as it does without the response cache: no refresh(), no hint, no refresh request.
describe('query cache refresh gate', () => {
  let session;

  const restQuery = (responseCache) => ({
    id: 'q-cache',
    name: 'getRows',
    kind: 'restapi',
    options: { method: 'get', url: 'https://example.test/rows', ...(responseCache && { responseCache }) },
  });
  // Reports what the RunJS context exposes for the REST query.
  const probe = {
    id: 'q-probe',
    name: 'probe',
    kind: 'runjs',
    options: { code: 'return { refresh: typeof queries.getRows.refresh };', parameters: [] },
  };

  const startSession = async ({ licensed, responseCache }) => {
    session = new AppBuilderTestSession({
      scenario: {
        surface: 'app-editor',
        capabilities: {
          network: [
            {
              method: 'post',
              url: 'http://localhost:3000/api/data-queries/q-cache/*',
              // Echo the cache instruction so the run's public data shows what reached the server.
              json: async ({ request }) => {
                const body = await request.json();
                return { status: 'ok', data: { cacheControl: body.cacheControl ?? null } };
              },
            },
            { url: '*/license/access', json: () => ({ queryResponseCache: licensed }) },
          ],
        },
      },
    });
    await session.store.act('updateFeatureAccess');
    seedApp({});
    const queries = [restQuery(responseCache), probe];
    await session.store.act((state) => {
      state.setApp({ appId: 'app-1', isPublic: false });
      state.setCurrentMode('edit');
      state.dataQuery.setQueries(queries, 'canvas');
      state.setQueryMapping('canvas');
      queries.forEach((query) =>
        state.registerQueryDependencies(query.id, query.name, query.kind, query.options, 'canvas')
      );
      state.rebuildQueryHints('canvas');
    });
  };

  const run = (queryId, name, runOptions) =>
    session.store.act((state) =>
      state.queryPanel.runQuery(
        queryId,
        name,
        undefined,
        undefined,
        {},
        undefined,
        undefined,
        false,
        false,
        'canvas',
        undefined,
        runOptions
      )
    );
  const queryData = (queryId) =>
    session.store.read((state) => state.resolvedStore.modules.canvas.exposedValues.queries[queryId]?.data);
  const hints = () => session.store.read((state) => state.suggestions.segments.queries.map(({ hint }) => hint));

  const cacheOn = { enabled: true, ttlSeconds: 60 };

  describe.each([
    ['caching is off on the query', { licensed: true, responseCache: { enabled: false, ttlSeconds: 60 } }],
    ['the query has no cache settings', { licensed: true, responseCache: undefined }],
    ['the license lacks the feature', { licensed: false, responseCache: cacheOn }],
  ])('when %s', (_label, setup) => {
    beforeEach(() => startSession(setup));

    // Break this catches: a saved Refresh Query Cache event or refresh() still asking the server to refresh.
    test('[QueryCache-REFRESH-GATE-001] a refresh request runs as a plain run', async () => {
      await run('q-cache', 'getRows', { refreshCache: true });
      expect(queryData('q-cache')).toEqual({ cacheControl: null });
    });

    // Break this catches: RunJS still exposing queries.<name>.refresh().
    test('[QueryCache-REFRESH-GATE-002] RunJS has no refresh()', async () => {
      // RunJS sees a query once it has run.
      await run('q-cache', 'getRows');
      await run('q-probe', 'probe');
      expect(queryData('q-probe')).toEqual({ refresh: 'undefined' });
    });

    // Break this catches: the editor still suggesting queries.<name>.refresh().
    test('[QueryCache-REFRESH-GATE-003] code hints leave out refresh()', () => {
      expect(hints()).toContain('queries.getRows.run()');
      expect(hints()).not.toContain('queries.getRows.refresh()');
    });
  });

  describe('when the query has caching on and the license has the feature', () => {
    beforeEach(() => startSession({ licensed: true, responseCache: cacheOn }));

    // Break this catches: the gate also taking refresh away from a query that should have it.
    test('[QueryCache-REFRESH-GATE-004] refresh(), its hint and the refresh request are available', async () => {
      await run('q-cache', 'getRows', { refreshCache: true });
      expect(queryData('q-cache')).toEqual({ cacheControl: 'refresh' });
      await run('q-probe', 'probe');
      expect(queryData('q-probe')).toEqual({ refresh: 'function' });
      expect(hints()).toContain('queries.getRows.refresh()');
    });
  });
});
