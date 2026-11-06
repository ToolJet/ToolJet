import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import config from 'config';
import { libraryQueryService as service } from '../libraryQuery.service';

const query = {
  id: 'q1',
  name: 'lookup',
  kind: 'postgresql',
  dataSourceId: null,
  folderId: null,
  options: {},
  createdAt: '2026-10-29',
  updatedAt: '2026-10-29',
};
const createRequest = { name: query.name, kind: query.kind, dataSourceId: null, folderId: null, options: {} };
const cases = [
  ['list', 'get', 'queries', [], undefined, [query]],
  ['listStaticDataSources', 'get', 'static-data-sources', [], undefined, []],
  ['create', 'post', 'queries', [createRequest], createRequest, query],
  ['update', 'patch', 'queries/q1', ['q1', { options: {} }], { options: {} }, query],
  [
    'changeDraftDataSource',
    'put',
    'queries/q1/drafts/d1/data-source',
    ['q1', 'd1', 'source1'],
    { dataSourceId: 'source1' },
  ],
  ['del', 'delete', 'queries/q1', ['q1']],
  [
    'run',
    'post',
    'queries/q1/run/env1',
    ['q1', 'env1', { inputs: {}, libraryVersionId: 'lv1' }],
    { inputs: {}, libraryVersionId: 'lv1' },
  ],
  ['getCatalog', 'get', 'catalog', []],
  ['getUsage', 'get', 'usage', []],
  ['getVersions', 'get', 'queries/q1/versions', ['q1']],
  ['saveDraft', 'post', 'queries/q1/drafts/d1/save', ['q1', 'd1', { name: 'v1' }], { name: 'v1' }],
  ['getDraft', 'get', 'queries/q1/drafts/d1', ['q1', 'd1']],
  ['updateDraft', 'patch', 'queries/q1/drafts/d1', ['q1', 'd1', { options: {} }], { options: {} }],
  ['createDraft', 'post', 'queries/q1/drafts', ['q1', { fromVersionId: 'lv1' }], { fromVersionId: 'lv1' }],
  ['deleteDraft', 'delete', 'queries/q1/drafts/d1', ['q1', 'd1']],
  ['promote', 'post', 'queries/q1/versions/lv1/promote', ['q1', 'lv1']],
  ['release', 'post', 'queries/q1/versions/lv1/release', ['q1', 'lv1']],
  ['deleteVersion', 'delete', 'queries/q1/versions/lv1', ['q1', 'lv1']],
  ['listFolders', 'get', 'folders', []],
  ['createFolder', 'post', 'folders', ['Billing'], { name: 'Billing' }],
  ['renameFolder', 'patch', 'folders/f1', ['f1', 'New'], { name: 'New' }],
  ['deleteFolder', 'delete', 'folders/f1', ['f1']],
];
it.each(
  cases.map(([method, verb, path, args, body, response]) => [method, verb, path, args, body, response ?? { ok: true }])
)(
  '%s uses the standalone method, URL and body',
  async (method, verb, path, args, expectedBody, response = { ok: true }) => {
    let seen;
    server.use(
      http[verb](`${config.apiUrl}/query-library/${path}`, async ({ request }) => {
        const body = await request.text();
        seen = body ? JSON.parse(body) : undefined;
        return verb === 'delete' ? new HttpResponse(null, { status: 204 }) : HttpResponse.json(response);
      })
    );
    const result = await service[method](...args);
    expect(seen).toEqual(expectedBody);
    if (['list', 'create', 'update', 'changeDataSource'].includes(method)) {
      expect(method === 'list' ? result[0] : result).toMatchObject({
        id: 'q1',
        data_source_id: null,
        folder_id: null,
        created_at: query.createdAt,
        updated_at: query.updatedAt,
      });
    }
  }
);
it('keeps queued writes bound to their originating workspace and maps non-null ids', async () => {
  let workspace;
  server.use(
    http.patch(`${config.apiUrl}/query-library/queries/q1`, ({ request }) => {
      workspace = request.headers.get('tj-workspace-id');
      return HttpResponse.json({ ...query, dataSourceId: 'source1', folderId: 'f1' });
    })
  );
  const result = await service.update('q1', { name: 'new' }, { workspaceId: 'original-workspace' });
  expect(workspace).toBe('original-workspace');
  expect(result).toMatchObject({ data_source_id: 'source1', folder_id: 'f1' });
});
it('passes cancellation to library runs', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(service.run('q1', 'env1', { draftId: 'd1' }, controller.signal)).rejects.toMatchObject({
    name: 'AbortError',
  });
});

it.each([{}, { draftId: 'draft' }, { draftId: 'd1', libraryVersionId: 'v1' }])(
  'rejects ambiguous or implicit run targets %j',
  async (body) => {
    await expect(service.run('q1', 'env1', body)).rejects.toThrow();
  }
);
