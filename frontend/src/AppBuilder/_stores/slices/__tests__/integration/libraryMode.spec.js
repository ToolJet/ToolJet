beforeEach(() => {
  useStore.setState((state) => ({
    license: { featureAccess: { ...state.license.featureAccess, queryLibraryEnabled: true } },
  }));
});
import '@/test/setupMsw';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import config from 'config';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
const state = () => useStore.getState();

const draft = { id: 'draft-a', name: 'Branch A', kind: 'restapi', dataSourceId: 'source-a', options: { url: 'draft' } };
const identity = { id: 'q1', name: 'query' };
const seed = async (workspace = 'workspace-a') => {
  state().queryLibrary.beginLibrarySession(workspace);
  state().queryLibrary.setLibraryEnvironments([{ id: 'development', name: 'development', priority: 1 }]);
  state().dataQuery.setQueries([identity]);
  state().setQueryMapping('canvas');
  state().initialiseResolvedQuery(['q1'], 'canvas');
  await state().queryLibrary.loadLibraryVersions('q1');
  state().queryPanel.setSelectedQuery('q1', 'canvas', { fromServer: true });
};
beforeEach(() => {
  server.use(
    http.get(`${config.apiUrl}/query-library/queries/q1/versions`, () =>
      HttpResponse.json({ drafts: [draft], versions: [] })
    )
  );
});
afterEach(() => {
  state().queryLibrary.endLibrarySession();
  jest.useRealTimers();
});

it('starts without a backing app and rejects obsolete sessions', () => {
  const first = state().queryLibrary.beginLibrarySession('workspace-a');
  expect(state().appStore.modules.canvas.app.appId).toBeUndefined();
  const second = state().queryLibrary.beginLibrarySession('workspace-b');
  state().queryLibrary.endLibrarySession(first);
  expect(state().queryLibrary.isCurrentSession(first)).toBe(false);
  expect(state().queryLibrary.isCurrentSession(second)).toBe(true);
});

it('saves queued edits to their original workspace when the editor exits', async () => {
  const seen = [];
  server.use(
    http.patch(`${config.apiUrl}/query-library/queries/q1/drafts/draft-a`, async ({ request }) => {
      seen.push({ body: await request.json(), workspace: request.headers.get('tj-workspace-id') });
      return HttpResponse.json(draft);
    })
  );
  await seed();
  const first = state().dataQuery.saveData({ ...identity, options: { url: 'first' } });
  state().dataQuery.saveData({ ...identity, options: { url: 'last' } });
  state().dataQuery.saveData.flush();
  const tail = state().dataQuery.libraryDraftWrite('q1', 'draft-a').promise;
  state().queryLibrary.endLibrarySession();
  state().queryLibrary.beginLibrarySession('workspace-b');
  await Promise.all([first, tail]);
  expect(seen.map(({ body }) => body.options.url)).toEqual(['first', 'last']);
  expect(seen.map(({ workspace }) => workspace)).toEqual(['workspace-a', 'workspace-a']);
  expect(state().dataQuery.queries.modules.canvas).toEqual([]);
});

it('uses standalone create and delete routes without an app version', async () => {
  const seen = [];
  server.use(
    http.post(`${config.apiUrl}/query-library/queries`, async ({ request }) => {
      const body = await request.json();
      seen.push(body);
      return HttpResponse.json({ ...body, id: 'created', draftId: 'created-draft' });
    }),
    http.get(`${config.apiUrl}/query-library/queries/created/versions`, () =>
      HttpResponse.json({ drafts: [{ ...draft, id: 'created-draft' }], versions: [] })
    ),
    http.delete(`${config.apiUrl}/query-library/queries/created`, () => new HttpResponse(null, { status: 204 }))
  );
  await seed();
  await state().dataQuery.createDataQuery({ id: 'source-a', kind: 'restapi' }, false, {}, 'canvas', 'createdQuery');
  expect(seen[0]).toMatchObject({ name: 'createdQuery', kind: 'restapi', dataSourceId: 'source-a' });
  expect(seen[0].appId).toBeUndefined();
  await state().dataQuery.deleteDataQueries('created');
  expect(state().dataQuery.queries.modules.canvas.map(({ id }) => id)).toEqual(['q1']);
});

it('persists edits queued during creation after exit without populating the next session', async () => {
  const patches = [];
  let finish;
  let start;
  const ready = new Promise((resolve) => {
    start = resolve;
  });
  server.use(
    http.post(`${config.apiUrl}/query-library/queries`, async () => {
      start();
      await new Promise((resolve) => {
        finish = resolve;
      });
      return HttpResponse.json({ id: 'late-query', name: 'lateQuery', draftId: 'late-draft' });
    }),
    http.patch(`${config.apiUrl}/query-library/queries/late-query/drafts/late-draft`, async ({ request }) => {
      patches.push({ options: (await request.json()).options, workspace: request.headers.get('tj-workspace-id') });
      return HttpResponse.json({ ...draft, id: 'late-draft', options: { url: 'queued-before-exit' } });
    })
  );
  await seed();
  const creation = state().dataQuery.createDataQuery(
    { id: 'source-a', kind: 'restapi' },
    false,
    {},
    'canvas',
    'lateQuery'
  );
  await ready;
  const temporaryId = state().dataQuery.creatingQueryInProcessId;
  state().dataQuery.saveData({ id: temporaryId, options: { url: 'queued-before-exit' } });
  state().queryLibrary.endLibrarySession();
  state().queryLibrary.beginLibrarySession('workspace-b');
  finish();
  await creation;
  await waitFor(() => expect(patches).toEqual([{ options: { url: 'queued-before-exit' }, workspace: 'workspace-a' }]));
  expect(state().dataQuery.queries.modules.canvas).toEqual([]);
  expect(state().queryLibrary.versionsByQueryId).toEqual({});
});

it('ignores a late versions response after switching workspaces', async () => {
  let finish;
  let start;
  const ready = new Promise((resolve) => {
    start = resolve;
  });
  server.use(
    http.get(`${config.apiUrl}/query-library/queries/q1/versions`, async () => {
      start();
      await new Promise((resolve) => {
        finish = resolve;
      });
      return HttpResponse.json({ drafts: [draft], versions: [] });
    })
  );
  state().queryLibrary.beginLibrarySession('workspace-a');
  const load = state().queryLibrary.loadLibraryVersions('q1');
  await ready;
  state().queryLibrary.beginLibrarySession('workspace-b');
  finish();
  await load;
  expect(state().queryLibrary.versionsByQueryId).toEqual({});
});

it('runs the explicit saved source without draft options and previews only the selected draft', async () => {
  const bodies = [];
  server.use(
    http.get(`${config.apiUrl}/query-library/queries/q1/versions`, () =>
      HttpResponse.json({
        drafts: [draft],
        versions: [
          {
            ...draft,
            id: 'saved',
            name: 'Saved',
            dataSourceId: 'source-b',
            options: { url: 'saved' },
            environment: { id: 'development', priority: 1 },
          },
        ],
      })
    ),
    http.post(`${config.apiUrl}/query-library/queries/q1/run/development`, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ status: 'ok', data: [1] });
    })
  );
  await seed();
  state().queryLibrary.viewLibraryVersion('q1', 'saved');
  await state().queryPanel.runQuery('q1', 'query', true, 'edit');
  expect(bodies[0]).toEqual({ libraryVersionId: 'saved' });
  state().queryLibrary.viewLibraryVersion('q1', 'draft-a');
  await state().queryPanel.previewQuery(state().queryPanel.selectedQuery, true);
  expect(bodies[1]).toMatchObject({ draftId: 'draft-a', options: { url: 'draft' } });
});

it('aborts an obsolete run without filling the next session with its result', async () => {
  let finish;
  let start;
  const ready = new Promise((resolve) => {
    start = resolve;
  });
  server.use(
    http.post(`${config.apiUrl}/query-library/queries/q1/run/development`, async () => {
      start();
      await new Promise((resolve) => {
        finish = resolve;
      });
      return HttpResponse.json({ status: 'ok', data: ['old result'] });
    })
  );
  await seed();
  const run = state().queryPanel.runQuery('q1', 'query', true, 'edit');
  await ready;
  state().queryLibrary.beginLibrarySession('workspace-b');
  finish();
  await expect(run).resolves.toEqual({ status: 'aborted' });
  expect(state().queryPanel.queryPreviewData).toBe('');
});

it('retries a failed draft in its active session and clears writes on exit', async () => {
  let fail = true;
  let saves = 0;
  server.use(
    http.patch(`${config.apiUrl}/query-library/queries/q1/drafts/draft-a`, () =>
      fail ? HttpResponse.json({ error: 'Save failed' }, { status: 400 }) : HttpResponse.json(draft)
    ),
    http.post(`${config.apiUrl}/query-library/queries/q1/drafts/draft-a/save`, () => {
      saves++;
      return HttpResponse.json({ ...draft, name: 'Saved' });
    })
  );
  await seed();
  await state()
    .dataQuery.saveData({ ...identity, options: { url: 'unsaved' } })
    .catch(() => {});
  await expect(state().queryLibrary.saveLibraryDraft('q1', 'draft-a', { name: 'Saved' })).rejects.toBeDefined();
  fail = false;
  state()
    .dataQuery.retryLibraryDraftSave('q1', 'draft-a')
    .catch(() => {});
  await state().dataQuery.flushLibraryDraft('q1', 'draft-a');
  await state().queryLibrary.saveLibraryDraft('q1', 'draft-a', { name: 'Saved' });
  expect(saves).toBe(1);
  await seed('workspace-b');
  expect(state().dataQuery.libraryDraftWrite('q1', 'draft-a')).toBeUndefined();
  await seed('workspace-a');
  expect(state().dataQuery.libraryDraftWrite('q1', 'draft-a')).toBeUndefined();
});

it('keeps app autosaves on the app endpoint after leaving library mode', async () => {
  let body;
  server.use(
    http.patch(`${config.apiUrl}/data-queries/app-query/versions/app-version`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ id: 'app-query' });
    })
  );
  state().queryLibrary.beginLibrarySession('workspace-a');
  state().queryLibrary.endLibrarySession();
  state().setCurrentVersionId('app-version');
  state().dataQuery.saveData({ id: 'app-query', name: 'appQuery', options: { url: 'app' } });
  state().dataQuery.saveData.flush();
  await state().dataQuery.queryUpdates['app-query'];
  expect(body.options).toEqual({ url: 'app' });
});

// F05: duplicateQuery reads kind/data_source_id/options from the identity-only catalog row (dataQuerySlice.js:491-502)
it('duplicates a server-loaded library query from its viewed draft', async () => {
  const seen = [];
  server.use(
    http.post(`${config.apiUrl}/query-library/queries`, async ({ request }) => {
      const body = await request.json();
      seen.push(body);
      // Mirrors server validation: kind is required on create.
      if (!body.kind) return HttpResponse.json({ error: 'kind must be a string' }, { status: 400 });
      return HttpResponse.json({ id: 'copy', name: body.name, draftId: 'copy-draft' });
    }),
    http.get(`${config.apiUrl}/query-library/queries/copy/versions`, () =>
      HttpResponse.json({ drafts: [{ ...draft, id: 'copy-draft' }], versions: [] })
    )
  );
  await seed();
  await state().dataQuery.duplicateQuery('q1');
  expect(seen).toHaveLength(1);
  expect(seen[0]).toMatchObject({
    name: 'query_copy',
    kind: 'restapi',
    dataSourceId: 'source-a',
    options: { url: 'draft' },
  });
  expect(state().dataQuery.queries.modules.canvas.map(({ id }) => id)).toContain('copy');
});
