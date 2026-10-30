import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import config from 'config';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { authenticationService } from '@/_services';
const state = () => useStore.getState();

describe('standalone library sessions', () => {
  it('starts without a backing app and rejects obsolete sessions', () => {
    const first = state().queryLibrary.beginLibrarySession('workspace-a');
    expect(state().queryLibrary.isLibraryMode).toBe(true);
    expect(state().appStore.modules.canvas.app.appId).toBeUndefined();
    const second = state().queryLibrary.beginLibrarySession('workspace-b');
    expect(state().queryLibrary.isCurrentSession(first)).toBe(false);
    state().queryLibrary.endLibrarySession(first);
    expect(state().queryLibrary.isCurrentSession(second)).toBe(true);
    expect(state().queryLibrary.workspaceId).toBe('workspace-b');
  });
  it('saves queued edits to their original workspace when the editor exits', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    const seen = [];
    server.use(
      http.patch(`${config.apiUrl}/query-library/queries/q1`, async ({ request }) => {
        seen.push({ body: await request.json(), workspace: request.headers.get('tj-workspace-id') });
        return HttpResponse.json({ id: 'q1', updatedAt: 'today' });
      })
    );
    state().queryLibrary.beginLibrarySession('workspace-a');
    state().dataQuery.saveData({ id: 'q1', name: 'query', options: { url: 'first' } });
    state().dataQuery.saveData({ id: 'q1', name: 'query', options: { url: 'last' } });
    state().queryLibrary.endLibrarySession();
    state().queryLibrary.beginLibrarySession('workspace-b');
    await jest.advanceTimersByTimeAsync(500);
    expect(seen.map(({ body }) => body.options.url)).toEqual(['first', 'last']);
    expect(state().dataQuery.queries.modules.canvas).toEqual([]);
    jest.useRealTimers();
  });
});

describe('standalone query writes', () => {
  const query = { id: 'q1', name: 'query', kind: 'restapi', options: { url: 'before' } };
  const seed = () => {
    state().queryLibrary.beginLibrarySession('workspace-a');
    state().dataQuery.setQueries([query]);
    state().setQueryMapping('canvas');
    state().initialiseResolvedQuery(['q1'], 'canvas');
    state().queryPanel.setSelectedQuery('q1');
  };
  it('uses standalone create and delete routes without an app version', async () => {
    const seen = [];
    server.use(
      http.post(`${config.apiUrl}/query-library/queries`, async ({ request }) => {
        const body = await request.json();
        seen.push(body);
        return HttpResponse.json({ ...body, id: 'created' });
      }),
      http.delete(`${config.apiUrl}/query-library/queries/created`, () => HttpResponse.json({}))
    );
    seed();
    await state().dataQuery.createDataQuery({ id: 'source-a', kind: 'restapi' }, false, {}, 'canvas', 'createdQuery');
    expect(seen[0]).toMatchObject({ name: 'createdQuery', kind: 'restapi', dataSourceId: 'source-a' });
    expect(seen[0].appId).toBeUndefined();
    await state().dataQuery.deleteDataQueries('created');
    expect(state().dataQuery.queries.modules.canvas.map(({ id }) => id)).toEqual(['q1']);
  });
  it('waits for draft persistence before saving a version and retains failures for retry', async () => {
    let fail = true;
    let versions = 0;
    server.use(
      http.patch(`${config.apiUrl}/query-library/queries/q1`, () =>
        fail ? HttpResponse.json({ error: 'Draft rejected' }, { status: 400 }) : HttpResponse.json({ id: 'q1' })
      ),
      http.post(`${config.apiUrl}/query-library/queries/q1/versions/save`, () => {
        versions += 1;
        return HttpResponse.json({ id: 'saved' });
      }),
      http.get(`${config.apiUrl}/query-library/queries/q1/versions`, () =>
        HttpResponse.json({ draft: {}, versions: [] })
      )
    );
    seed();
    state().dataQuery.saveData(query);
    await expect(state().queryLibrary.saveLibraryVersion('q1')).rejects.toMatchObject({
      error: 'Save the query before saving a version',
    });
    expect(versions).toBe(0);
    expect(state().dataQuery.failedSaves.q1.values).toEqual(query);
    expect(state().queryLibrary.saveError || state().queryLibrary.isSaving).toBe(true);
    fail = false;
    state().dataQuery.retryFailedSave('q1');
    await state().queryLibrary.saveLibraryVersion('q1');
    expect(versions).toBe(1);
    expect(state().dataQuery.failedSaves.q1).toBeUndefined();
  });
});

describe('standalone library reads and runs', () => {
  it('ignores a late versions response after switching workspaces', async () => {
    let finish;
    let started;
    const ready = new Promise((resolve) => {
      started = resolve;
    });
    server.use(
      http.get(`${config.apiUrl}/query-library/queries/q1/versions`, async () => {
        started();
        await new Promise((resolve) => {
          finish = resolve;
        });
        return HttpResponse.json({ draft: {}, versions: [{ id: 'old' }] });
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
  it('runs saved source B without draft options and previews only draft options', async () => {
    const bodies = [];
    server.use(
      http.get(`${config.apiUrl}/query-library/queries/q1/versions`, () =>
        HttpResponse.json({
          draft: {},
          versions: [
            {
              id: 'v1',
              name: 'v1',
              kind: 'restapi',
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
    state().queryLibrary.beginLibrarySession('workspace-a');
    state().queryLibrary.setLibraryEnvironments([{ id: 'development', priority: 1 }]);
    state().dataQuery.setQueries([
      { id: 'q1', name: 'query', kind: 'restapi', data_source_id: 'source-a', options: { url: 'draft' } },
    ]);
    state().setQueryMapping('canvas');
    state().initialiseResolvedQuery(['q1'], 'canvas');
    await state().queryLibrary.loadLibraryVersions('q1');
    state().queryLibrary.viewLibraryVersion('q1', 'v1');
    await state().queryPanel.runQuery('q1', 'query', true, 'edit');
    expect(bodies[0]).toEqual({ libraryVersionId: 'v1' });
    state().queryLibrary.viewLibraryVersion('q1', 'draft');
    await state().queryPanel.previewQuery(state().dataQuery.queries.modules.canvas[0], true);
    expect(bodies[1].options).toEqual({ url: 'draft' });
  });
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

it('persists edits queued during creation after its original session has ended', async () => {
  let finish;
  let started;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  const writes = [];
  server.use(
    http.post(`${config.apiUrl}/query-library/queries`, async ({ request }) => {
      const body = await request.json();
      started();
      await new Promise((resolve) => {
        finish = resolve;
      });
      return HttpResponse.json({ ...body, id: 'created-late' });
    }),
    http.patch(`${config.apiUrl}/query-library/queries/created-late`, async ({ request }) => {
      writes.push({ body: await request.json(), workspace: request.headers.get('tj-workspace-id') });
      return HttpResponse.json({ id: 'created-late' });
    })
  );
  state().queryLibrary.beginLibrarySession('workspace-a');
  const creation = state().dataQuery.createDataQuery(
    { id: 'source', kind: 'restapi' },
    false,
    {},
    'canvas',
    'newQuery'
  );
  await ready;
  const temporary = state().queryPanel.selectedQuery;
  state().dataQuery.saveData({ ...temporary, options: { url: 'edited while creating' } });
  state().queryLibrary.endLibrarySession();
  state().queryLibrary.beginLibrarySession('workspace-b');
  finish();
  await creation;
  state().dataQuery.saveData.flush();
  await state().dataQuery.queryUpdates['created-late'];
  expect(writes[0]).toMatchObject({ body: { options: { url: 'edited while creating' } }, workspace: 'workspace-a' });
  expect(state().dataQuery.queries.modules.canvas).toEqual([]);
});

it('aborts an obsolete run without filling the next session with its result', async () => {
  let started;
  let finish;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  server.use(
    http.post(`${config.apiUrl}/query-library/queries/q1/run/development`, async () => {
      started();
      await new Promise((resolve) => {
        finish = resolve;
      });
      return HttpResponse.json({ status: 'ok', data: ['old result'] });
    })
  );
  state().queryLibrary.beginLibrarySession('workspace-a');
  state().queryLibrary.setLibraryEnvironments([{ id: 'development', priority: 1 }]);
  state().dataQuery.setQueries([{ id: 'q1', name: 'oldQuery', kind: 'restapi', options: {} }]);
  state().setQueryMapping('canvas');
  state().initialiseResolvedQuery(['q1'], 'canvas');
  const run = state().queryPanel.runQuery('q1', 'oldQuery', true, 'edit');
  await ready;
  state().queryLibrary.beginLibrarySession('workspace-b');
  finish();
  await expect(run).resolves.toEqual({ status: 'aborted' });
  expect(state().getResolvedState('canvas').queries.oldQuery).toBeUndefined();
  expect(state().queryPanel.queryPreviewData).toBe('');
});

it('restores failed library edits only in their workspace and blocks versions until retry succeeds', async () => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
  let fail = true;
  let versions = 0;
  const draft = { id: 'recover', name: 'recoverQuery', kind: 'restapi', options: { url: 'server' } };
  server.use(
    http.patch(`${config.apiUrl}/query-library/queries/recover`, () =>
      fail ? HttpResponse.json({ error: 'Save failed' }, { status: 400 }) : HttpResponse.json(draft)
    ),
    http.post(`${config.apiUrl}/query-library/queries/recover/versions/save`, () => {
      versions++;
      return HttpResponse.json({ id: 'saved' });
    }),
    http.get(`${config.apiUrl}/query-library/queries/recover/versions`, () =>
      HttpResponse.json({ draft: {}, versions: [] })
    )
  );
  state().queryLibrary.beginLibrarySession('workspace-a');
  state().dataQuery.saveData({ ...draft, options: { url: 'unsaved' } });
  await expect(state().queryLibrary.saveLibraryVersion('recover')).rejects.toMatchObject({
    error: 'Save the query before saving a version',
  });
  state().queryLibrary.endLibrarySession();
  state().queryLibrary.beginLibrarySession('workspace-b');
  state().dataQuery.setQueries([draft]);
  expect(state().queryLibrary.saveError).toBe(false);
  expect(state().dataQuery.queries.modules.canvas[0].options.url).toBe('server');
  state().queryLibrary.beginLibrarySession('workspace-a');
  state().dataQuery.setQueries([draft]);
  expect(state().queryLibrary.saveError).toBe(true);
  expect(state().dataQuery.queries.modules.canvas[0].options.url).toBe('unsaved');
  await expect(state().queryLibrary.saveLibraryVersion('recover')).rejects.toMatchObject({
    error: 'Save the query before saving a version',
  });
  expect(versions).toBe(0);
  fail = false;
  state().dataQuery.retryFailedSave('recover');
  await jest.advanceTimersByTimeAsync(500);
  await state().queryLibrary.saveLibraryVersion('recover');
  expect(versions).toBe(1);
  expect(state().dataQuery.failedSaves.recover).toBeUndefined();
  expect(state().queryLibrary.saveError).toBe(false);
  jest.useRealTimers();
});

it('captures the app workspace and version before a trailing save follows a workspace switch', async () => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
  const prior = authenticationService.currentSessionValue;
  const seen = [];
  server.use(
    http.patch(`${config.apiUrl}/data-queries/app-edit/versions/original-version`, async ({ request }) => {
      seen.push({ workspace: request.headers.get('tj-workspace-id'), body: await request.json() });
      return HttpResponse.json({ id: 'app-edit' });
    })
  );
  state().dataQuery.saveData.cancel();
  authenticationService.updateCurrentSession({ ...prior, current_organization_id: 'app-workspace-a' });
  state().setCurrentVersionId('original-version');
  state().dataQuery.saveData({ id: 'app-edit', name: 'appEdit', options: { url: 'first' } });
  state().dataQuery.saveData({ id: 'app-edit', name: 'appEdit', options: { url: 'trailing' } });
  authenticationService.updateCurrentSession({ ...prior, current_organization_id: 'app-workspace-b' });
  state().setCurrentVersionId('new-version');
  await jest.advanceTimersByTimeAsync(500);
  await state().dataQuery.queryUpdates['app-edit'];
  expect(seen).toHaveLength(2);
  expect(seen.map(({ workspace }) => workspace)).toEqual(['app-workspace-a', 'app-workspace-a']);
  expect(seen[1].body.options).toEqual({ url: 'trailing' });
  authenticationService.updateCurrentSession(prior);
  jest.useRealTimers();
});

it('serializes overlapping draft writes and blocks versions when the newest write fails', async () => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
  let finishFirst;
  let firstStarted;
  const ready = new Promise((resolve) => {
    firstStarted = resolve;
  });
  const requests = [];
  let versions = 0;
  server.use(
    http.patch(`${config.apiUrl}/query-library/queries/overlap`, async ({ request }) => {
      const body = await request.json();
      requests.push(body.options.url);
      if (body.options.url === 'first') {
        firstStarted();
        await new Promise((resolve) => {
          finishFirst = resolve;
        });
        return HttpResponse.json({ id: 'overlap' });
      }
      return HttpResponse.json({ error: 'Newest draft rejected' }, { status: 400 });
    }),
    http.post(`${config.apiUrl}/query-library/queries/overlap/versions/save`, () => {
      versions++;
      return HttpResponse.json({ id: 'saved' });
    })
  );
  state().queryLibrary.beginLibrarySession('workspace-a');
  state().dataQuery.saveData({ id: 'overlap', name: 'query', options: { url: 'first' } });
  await ready;
  state().dataQuery.saveData({ id: 'overlap', name: 'query', options: { url: 'newest' } });
  const version = state().queryLibrary.saveLibraryVersion('overlap');
  const rejected = version.then(
    () => {
      throw new Error('Expected failed draft to block version creation');
    },
    (error) => {
      expect(error).toMatchObject({ error: 'Save the query before saving a version' });
    }
  );
  await jest.advanceTimersByTimeAsync(500);
  const beforeRelease = [...requests];
  const versionsBeforeRelease = versions;
  finishFirst();
  await rejected;
  expect(beforeRelease).toEqual(['first']);
  expect(versionsBeforeRelease).toBe(0);
  expect(requests).toEqual(['first', 'newest']);
  expect(versions).toBe(0);
  expect(state().dataQuery.failedSaves.overlap.values.options.url).toBe('newest');
  expect(state().queryLibrary.saveError || state().queryLibrary.isSaving).toBe(true);
  jest.useRealTimers();
});
