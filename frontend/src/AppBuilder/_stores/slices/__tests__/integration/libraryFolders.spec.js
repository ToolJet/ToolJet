beforeEach(() => {
  useStore.setState((state) => ({
    license: { featureAccess: { ...state.license.featureAccess, queryLibraryEnabled: true } },
  }));
});
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import config from 'config';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
const state = () => useStore.getState();

it('persists standalone folders and query placement in the originating workspace', async () => {
  const requests = [];
  const capture = async (request) => {
    const body = request.method === 'DELETE' ? undefined : await request.json();
    requests.push({
      method: request.method,
      path: new URL(request.url).pathname,
      workspace: request.headers.get('tj-workspace-id'),
      body,
    });
    return body;
  };
  server.use(
    http.post(`${config.apiUrl}/query-library/folders`, async ({ request }) => {
      const body = await capture(request);
      return HttpResponse.json({ id: 'folder', ...body });
    }),
    http.patch(`${config.apiUrl}/query-library/folders/folder`, async ({ request }) => {
      const body = await capture(request);
      return HttpResponse.json({ id: 'folder', ...body });
    }),
    http.patch(`${config.apiUrl}/query-library/queries/query`, async ({ request }) => {
      await capture(request);
      return HttpResponse.json({ id: 'query' });
    }),
    http.delete(`${config.apiUrl}/query-library/folders/folder`, async ({ request }) => {
      await capture(request);
      return HttpResponse.json({});
    })
  );
  state().queryLibrary.beginLibrarySession('workspace-a');
  state().queryFolders.createFolder('Folder');
  await waitFor(() => expect(state().queryFolders.folders[0]?.id).toBe('folder'));
  state().queryFolders.renameFolder('folder', 'Renamed');
  await waitFor(() => expect(requests.filter(({ method }) => method === 'PATCH')).toHaveLength(1));
  state().queryFolders.reorderItem('query', 'query', 0, 'folder');
  await waitFor(() => expect(requests.filter(({ method }) => method === 'PATCH')).toHaveLength(2));
  state().queryFolders.deleteFolder('folder', 'folder_only');
  await waitFor(() => expect(requests.some(({ method }) => method === 'DELETE')).toBe(true));
  expect(requests.map(({ workspace }) => workspace)).toEqual(Array(4).fill('workspace-a'));
  expect(requests[0].body).toEqual({ name: 'Folder' });
  expect(requests[1].body).toEqual({ name: 'Renamed' });
  expect(requests[2].body).toEqual({ folderId: 'folder' });
  expect(state().queryFolders.folders).toEqual([]);
});

it('deletes child queries through library routes before deleting their folder', async () => {
  const removed = [];
  server.use(
    http.delete(`${config.apiUrl}/query-library/queries/query`, () => {
      removed.push('query');
      return HttpResponse.json({});
    }),
    http.delete(`${config.apiUrl}/query-library/folders/folder`, () => {
      removed.push('folder');
      return HttpResponse.json({});
    })
  );
  state().queryLibrary.beginLibrarySession('workspace-a');
  state().dataQuery.setQueries([{ id: 'query', name: 'query', kind: 'restapi', options: {} }]);
  state().queryFolders.setFolders([{ id: 'folder', name: 'Folder' }]);
  state().queryFolders.setFolderMappings([
    { id: 'mapping', childId: 'query', childType: 'query', parentId: 'folder', index: 0 },
  ]);
  state().setQueryMapping('canvas');
  state().initialiseResolvedQuery(['query'], 'canvas');
  state().queryFolders.deleteFolder('folder', 'folder_and_queries');
  await waitFor(() => expect(removed).toEqual(['query', 'folder']));
  expect(state().dataQuery.queries.modules.canvas).toEqual([]);
});
