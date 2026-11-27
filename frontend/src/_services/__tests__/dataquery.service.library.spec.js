import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { dataqueryService } from '@/_services/dataquery.service';
import config from 'config';

describe('dataqueryService library calls', () => {
  it('runLibrary uses the editor route in the selected environment', async () => {
    let seen;
    server.use(
      http.post(`${config.apiUrl}/data-queries/q1/versions/v1/run-library/e1`, async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json({ status: 'ok', data: [1] });
      })
    );
    await expect(dataqueryService.runLibrary('q1', { inputs: { id: 1 } }, 'v1', 'e1')).resolves.toEqual({
      status: 'ok',
      data: [1],
    });
    expect(seen).toEqual({ inputs: { id: 1 } });
  });

  it('runLibrary uses the viewer route without an environment', async () => {
    let seen;
    server.use(
      http.post(`${config.apiUrl}/data-queries/q1/run-library`, async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json({ status: 'ok', data: [] });
      })
    );
    await dataqueryService.runLibrary('q1', {});
    expect(seen).toEqual({ inputs: {} });
  });

  it('getLibraryDefinition posts an empty body', async () => {
    let seen;
    server.use(
      http.post(`${config.apiUrl}/data-queries/q1/library-definition`, async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json({ kind: 'runjs' });
      })
    );
    await expect(dataqueryService.getLibraryDefinition('q1')).resolves.toEqual({ kind: 'runjs' });
    expect(seen).toEqual({});
  });

  it.each([
    'getLibraryUsage',
    'getLibraryVersions',
    'saveLibraryVersion',
    'createLibraryDraft',
    'discardLibraryDraft',
    'promoteLibraryVersion',
    'releaseLibraryVersion',
    'deleteLibraryQueryVersion',
    'getLibraryCatalog',
    'releaseLibraryQuery',
  ])('removes standalone library operation %s from consumer service', (name) => {
    expect(dataqueryService[name]).toBeUndefined();
  });
});
