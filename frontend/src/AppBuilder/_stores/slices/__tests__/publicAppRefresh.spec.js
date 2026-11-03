import { AppBuilderTestSession, seedApp } from '@/test/app-builder';

// Refresh clears every user's cached responses for a query, so a public app's viewers must get a
// normal run. Builders editing a public app, and viewers of private apps, keep refresh.
describe('query cache refresh in a public app', () => {
  let session;

  const startSession = async ({ isPublic, mode }) => {
    session = new AppBuilderTestSession({
      scenario: {
        surface: 'app-editor',
        capabilities: {
          network: [
            {
              method: 'post',
              // Viewer and editor runs use different run URLs; both carry the same body.
              url: 'http://localhost:3000/api/data-queries/q-cache/*',
              // Echo the cache instruction so the run's public data shows what reached the server.
              json: async ({ request }) => {
                const body = await request.json();
                return { status: 'ok', data: { cacheControl: body.cacheControl ?? null } };
              },
            },
          ],
        },
      },
    });
    seedApp({});
    const query = {
      id: 'q-cache',
      name: 'getRows',
      kind: 'restapi',
      options: { method: 'get', url: 'https://example.test/rows', responseCache: { enabled: true, ttlSeconds: 60 } },
    };
    await session.store.act((state) => {
      state.setApp({ appId: 'app-1', isPublic });
      state.setCurrentMode(mode);
      state.dataQuery.setQueries([query], 'canvas');
      state.setQueryMapping('canvas');
      state.registerQueryDependencies(query.id, query.name, query.kind, query.options, 'canvas');
    });
  };

  const refresh = () =>
    session.store.act((state) =>
      state.queryPanel.runQuery(
        'q-cache',
        'getRows',
        undefined,
        undefined,
        {},
        undefined,
        undefined,
        false,
        false,
        'canvas',
        undefined,
        {
          refreshCache: true,
        }
      )
    );
  const sentCacheControl = () =>
    session.store.read(
      (state) => state.resolvedStore.modules.canvas.exposedValues.queries['q-cache']?.data?.cacheControl
    );

  // Break this catches: a public app's visitor still being able to wipe every user's cached responses.
  test('[QueryCache-REFRESH-PUBLIC-001] a public app viewer refreshes as a normal run', async () => {
    await startSession({ isPublic: true, mode: 'view' });
    await refresh();
    expect(sentCacheControl()).toBeNull();
  });

  // Break this catches: also taking refresh away from builders editing a public app.
  test('[QueryCache-REFRESH-PUBLIC-002] a builder editing a public app keeps refresh', async () => {
    await startSession({ isPublic: true, mode: 'edit' });
    await refresh();
    expect(sentCacheControl()).toBe('refresh');
  });

  // Break this catches: taking refresh away from viewers of private apps.
  test('[QueryCache-REFRESH-PUBLIC-003] a private app viewer keeps refresh', async () => {
    await startSession({ isPublic: false, mode: 'view' });
    await refresh();
    expect(sentCacheControl()).toBe('refresh');
  });
});
