import { waitFor } from '@testing-library/react';
import { AppBuilderTestSession, seedApp } from '@/test/app-builder';

// The editor suggests queries.<name>.refresh() exactly while refresh can work (the query has response caching on and
// the workspace license has queryResponseCache). Suggestions are built once when the editor loads, so a change to
// either side during the session must update them without a reload. The initial gate states are covered by
// _stores/slices/__tests__/queryCacheRefreshGate.spec.js.
describe('query cache refresh hints follow cache and license changes', () => {
  let session;
  let licensed;

  const cacheOn = { enabled: true, ttlSeconds: 60 };
  const cacheOff = { enabled: false, ttlSeconds: 60 };
  const restQuery = (responseCache) => ({
    id: 'q-cache',
    name: 'getRows',
    kind: 'restapi',
    options: { method: 'get', url: 'https://example.test/rows', responseCache },
  });
  const otherQuery = {
    id: 'q-other',
    name: 'getUsers',
    kind: 'restapi',
    options: { method: 'get', url: 'https://example.test/users', responseCache: cacheOn },
  };

  const hints = () => session.store.read((state) => state.suggestions.segments.queries.map(({ hint }) => hint));
  const appHints = () => session.store.read((state) => state.suggestions.appHints.map(({ hint }) => hint));
  const options = (queryId) =>
    session.store.read((state) => state.dataQuery.queries.modules.canvas.find((q) => q.id === queryId).options);

  // Loads the editor the way useAppData does: license fetched, queries set, suggestions built once.
  const startSession = async ({ license, responseCache }) => {
    licensed = license;
    session = new AppBuilderTestSession({
      scenario: {
        surface: 'app-editor',
        capabilities: {
          network: [
            {
              method: 'post',
              url: 'http://localhost:3000/api/data-queries/:id/*',
              json: () => ({ status: 'ok', data: { n: 1 } }),
            },
            { url: '*/license/access', json: () => ({ queryResponseCache: licensed }) },
          ],
        },
      },
    });
    await refetchLicense();
    seedApp({});
    const queries = [restQuery(responseCache), otherQuery];
    await session.store.act((state) => {
      state.setApp({ appId: 'app-1', isPublic: false });
      state.setCurrentMode('edit');
      state.dataQuery.setQueries(queries, 'canvas');
      state.setQueryMapping('canvas');
      state.initSuggestions('canvas');
      state.queryPanel.setSelectedQuery('q-cache');
    });
  };

  // What the Response cache setting does: the query panel writes the edited options for the selected query.
  const setCache = (responseCache) =>
    session.store.act((state) => state.dataQuery.updateDataQuery({ ...options('q-cache'), responseCache }, 'canvas'));

  async function refetchLicense() {
    await session.store.act('updateFeatureAccess');
    await waitFor(() => expect(session.store.read((state) => state.isLicenseFetched)).toBe(true));
  }

  const run = (queryId, name) =>
    session.store.act((state) =>
      state.queryPanel.runQuery(queryId, name, undefined, undefined, {}, undefined, undefined, false, false, 'canvas')
    );

  // Break this catches: turning caching off leaving refresh() suggested until reload.
  test('[QueryCache-REFRESH-HINT-001] turning caching off removes refresh() at once, keeping the other hints', async () => {
    await startSession({ license: true, responseCache: cacheOn });
    expect(hints()).toContain('queries.getRows.refresh()');

    await setCache(cacheOff);

    expect(hints()).not.toContain('queries.getRows.refresh()');
    expect(appHints()).not.toContain('queries.getRows.refresh()');
    expect(hints()).toEqual(
      expect.arrayContaining(['queries.getRows.run()', 'queries.getRows.reset()', 'queries.getUsers.refresh()'])
    );
  });

  // Break this catches: turning caching back on not offering refresh() until reload.
  test('[QueryCache-REFRESH-HINT-002] turning caching on restores refresh() when licensed', async () => {
    await startSession({ license: true, responseCache: cacheOff });
    expect(hints()).not.toContain('queries.getRows.refresh()');

    await setCache(cacheOn);

    expect(hints()).toContain('queries.getRows.refresh()');
    expect(appHints()).toContain('queries.getRows.refresh()');
  });

  // Break this catches: a query result of unchanged shape bringing back the stale eligibility, or the result-shape
  // shortcut swallowing the eligibility change.
  test('[QueryCache-REFRESH-HINT-003] a run with an unchanged result shape keeps the updated eligibility', async () => {
    await startSession({ license: true, responseCache: cacheOn });
    await run('q-cache', 'getRows');

    await setCache(cacheOff);
    await run('q-cache', 'getRows');
    expect(hints()).not.toContain('queries.getRows.refresh()');
    expect(hints()).toContain('queries.getRows.data.n');

    await setCache(cacheOn);
    await run('q-cache', 'getRows');
    expect(hints()).toContain('queries.getRows.refresh()');
  });

  // Break this catches: a license gained or lost during the session leaving refresh() hints as they were.
  test('[QueryCache-REFRESH-HINT-004] a license change updates refresh() for every cached query', async () => {
    await startSession({ license: false, responseCache: cacheOn });
    expect(hints()).not.toContain('queries.getRows.refresh()');

    licensed = true;
    await refetchLicense();
    expect(hints()).toEqual(expect.arrayContaining(['queries.getRows.refresh()', 'queries.getUsers.refresh()']));

    licensed = false;
    await refetchLicense();
    expect(hints()).not.toContain('queries.getRows.refresh()');
    expect(hints()).not.toContain('queries.getUsers.refresh()');
    expect(hints()).toEqual(expect.arrayContaining(['queries.getRows.run()', 'queries.getUsers.reset()']));
  });

  // Break this catches: a license gain offering refresh() on a query that has caching off.
  test('[QueryCache-REFRESH-HINT-005] gaining the license does not offer refresh() where caching is off', async () => {
    await startSession({ license: false, responseCache: cacheOff });

    licensed = true;
    await refetchLicense();

    expect(hints()).not.toContain('queries.getRows.refresh()');
    expect(hints()).toContain('queries.getUsers.refresh()');
  });
});
