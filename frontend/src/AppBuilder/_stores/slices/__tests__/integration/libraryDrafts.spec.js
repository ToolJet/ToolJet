import '@/test/setupMsw';
import { setImmediate } from 'timers';
import { http, HttpResponse } from 'msw';
import config from 'config';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { viewedLibraryVersionId, withViewedLibraryVersion } from '../../queryLibrarySlice';

const state = () => useStore.getState();
const identity = { id: 'q1', name: 'lookup' };
const draft = (id) => ({ id, name: id, kind: 'restapi', dataSourceId: 'source', options: { url: id } });
const view = { drafts: [draft('a'), draft('b')], versions: [] };
const seed = async () => {
  state().queryLibrary.beginLibrarySession('workspace-a');
  state().dataQuery.setQueries([identity]);
  state().setQueryMapping('canvas');
  state().initialiseResolvedQuery(['q1'], 'canvas');
  await state().queryLibrary.loadLibraryVersions('q1');
  state().queryPanel.setSelectedQuery('q1', 'canvas', { fromServer: true });
};
beforeEach(() =>
  server.use(http.get(`${config.apiUrl}/query-library/queries/q1/versions`, () => HttpResponse.json(view)))
);
afterEach(() => state().queryLibrary.endLibrarySession());
it('selects explicit draft snapshots while preserving query identity', async () => {
  await seed();
  expect(viewedLibraryVersionId(state(), 'q1')).toBe('a');
  state().queryLibrary.viewLibraryVersion('q1', 'b');
  expect(withViewedLibraryVersion(state(), identity)).toMatchObject({ name: 'lookup', options: { url: 'b' } });
});
it.each([
  [false, false],
  [true, false],
  [false, true],
  [true, true],
])(
  'isolates delayed draft A writes after selecting B (workspace switch=%s, failure=%s)',
  async (switchWorkspace, fail) => {
    let finish;
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    const seen = [];
    server.use(
      http.patch(`${config.apiUrl}/query-library/queries/q1/drafts/a`, async ({ request }) => {
        seen.push({ body: await request.json(), workspace: request.headers.get('tj-workspace-id') });
        await pending;
        return fail
          ? HttpResponse.json({ error: 'Rejected A' }, { status: 400 })
          : HttpResponse.json({ ...draft('a'), options: { url: 'edited A' } });
      })
    );
    await seed();
    const write = state().dataQuery.saveData({ ...identity, options: { url: 'edited A' } });
    state().queryLibrary.viewLibraryVersion('q1', 'b');
    if (switchWorkspace) {
      state().queryLibrary.beginLibrarySession('workspace-b');
      state().dataQuery.setQueries([identity]);
      await state().queryLibrary.loadLibraryVersions('q1');
      state().queryLibrary.viewLibraryVersion('q1', 'b');
    }
    finish();
    await write.catch(() => {});
    expect(seen).toEqual([{ body: { options: { url: 'edited A' } }, workspace: 'workspace-a' }]);
    expect(withViewedLibraryVersion(state(), identity).options.url).toBe('b');
    expect(state().queryPanel.queryPreviewData).toBe('');
    expect(state().queryLibrary.saveError).toBe(false);
  }
);
it('flushes pending draft writes before save and blocks publication on failure', async () => {
  let saves = 0;
  server.use(
    http.patch(`${config.apiUrl}/query-library/queries/q1/drafts/a`, () =>
      HttpResponse.json({ error: 'Rejected' }, { status: 400 })
    ),
    http.post(`${config.apiUrl}/query-library/queries/q1/drafts/a/save`, () => {
      saves += 1;
      return HttpResponse.json({ id: 'a' });
    })
  );
  await seed();
  state().dataQuery.saveData({ ...identity, options: { url: 'edited' } });
  await expect(state().queryLibrary.saveLibraryDraft('q1', 'a', { name: 'saved' })).rejects.toBeDefined();
  expect(saves).toBe(0);
});
it('renames query identity separately from draft metadata', async () => {
  const requests = [];
  server.use(
    http.patch(`${config.apiUrl}/query-library/queries/q1`, async ({ request }) => {
      requests.push(await request.json());
      return HttpResponse.json({ ...identity, name: 'renamed' });
    }),
    http.patch(`${config.apiUrl}/query-library/queries/q1/drafts/a`, async ({ request }) => {
      requests.push(await request.json());
      return HttpResponse.json({ ...draft('a'), name: 'branch' });
    })
  );
  await seed();
  await state().dataQuery.renameQuery('q1', 'renamed');
  await state().queryLibrary.editLibraryDraft('q1', 'a', { name: 'branch' });
  expect(requests).toEqual([{ name: 'renamed' }, { name: 'branch' }]);
  expect(state().dataQuery.queries.modules.canvas[0].name).toBe('renamed');
});

it.each([false, true])(
  'rejects a deferred editor callback after draft/session switch (session=%s)',
  async (switchSession) => {
    await seed();
    const origin = {
      sessionId: state().queryLibrary.sessionId,
      workspaceId: 'workspace-a',
      queryId: 'q1',
      versionId: 'a',
    };
    const deferredEdit = () => state().dataQuery.updateDataQuery({ url: 'obsolete' }, 'canvas', origin);
    if (switchSession) await seed();
    else state().queryLibrary.viewLibraryVersion('q1', 'b');
    deferredEdit();
    expect(withViewedLibraryVersion(state(), identity).options.url).toBe(switchSession ? 'a' : 'b');
  }
);
it('waits for a pending draft save and preserves its UUID when publishing', async () => {
  const order = [];
  let finish;
  const waiting = new Promise((resolve) => {
    finish = resolve;
  });
  server.use(
    http.patch(`${config.apiUrl}/query-library/queries/q1/drafts/a`, async () => {
      await waiting;
      order.push('patched');
      return HttpResponse.json(draft('a'));
    }),
    http.post(`${config.apiUrl}/query-library/queries/q1/drafts/a/save`, async ({ request }) => {
      order.push(await request.json());
      return HttpResponse.json({ ...draft('a'), id: 'a' });
    })
  );
  await seed();
  state().dataQuery.saveData({ ...identity, options: { url: 'latest' } });
  const publishing = state().queryLibrary.saveLibraryDraft('q1', 'a', { name: 'saved A' });
  await new Promise(setImmediate);
  expect(order).toEqual([]);
  finish();
  const saved = await publishing;
  expect(saved.id).toBe('a');
  expect(order).toEqual(['patched', { name: 'saved A' }]);
});

it('orders option writes behind a pending source change on the same draft', async () => {
  let finish;
  let started;
  const sourceStarted = new Promise((resolve) => {
    started = resolve;
  });
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  const order = [];
  server.use(
    http.put(`${config.apiUrl}/query-library/queries/q1/drafts/a/data-source`, async () => {
      started();
      await pending;
      order.push('source');
      return HttpResponse.json({ ...draft('a'), dataSourceId: 'new-source' });
    }),
    http.patch(`${config.apiUrl}/query-library/queries/q1/drafts/a`, () => {
      order.push('options');
      return HttpResponse.json(draft('a'));
    })
  );
  await seed();
  const changingSource = state().queryLibrary.changeLibraryDraftDataSource('q1', 'a', 'new-source');
  await sourceStarted;
  const writing = state().dataQuery.saveData({ ...identity, options: { url: 'new' } });
  await new Promise(setImmediate);
  finish();
  await changingSource;
  await writing;
  expect(order).toEqual(['source', 'options']);
});
