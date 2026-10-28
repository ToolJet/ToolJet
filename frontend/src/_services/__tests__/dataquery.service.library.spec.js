import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { dataqueryService } from '@/_services/dataquery.service';
import config from 'config';

describe('dataqueryService library calls', () => {
  it('runLibrary uses the editor route with an environment', async () => {
    let seen;
    server.use(
      http.post(`${config.apiUrl}/data-queries/q1/versions/v1/run-library/e1`, async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json({ status: 'ok', data: [1] });
      })
    );
    await expect(
      dataqueryService.runLibrary('q1', { inputs: { id: 1 }, parameters: { n: 2 } }, 'v1', 'e1')
    ).resolves.toEqual({
      status: 'ok',
      data: [1],
    });
    expect(seen).toEqual({ inputs: { id: 1 }, parameters: { n: 2 } });
  });

  it('runLibrary uses the viewer route without an environment and forwards libraryQueryId', async () => {
    let seen;
    server.use(
      http.post(`${config.apiUrl}/data-queries/q1/run-library`, async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json({ status: 'ok', data: [] });
      })
    );
    await dataqueryService.runLibrary('q1', {}, undefined, undefined, 's1');
    expect(seen).toEqual({ inputs: {}, libraryQueryId: 's1' });
  });

  it('getLibraryDefinition posts the sibling id', async () => {
    server.use(
      http.post(`${config.apiUrl}/data-queries/q1/library-definition`, async ({ request }) =>
        HttpResponse.json({ ...(await request.json()), kind: 'runjs' })
      )
    );
    await expect(dataqueryService.getLibraryDefinition('q1', 's1')).resolves.toEqual({
      libraryQueryId: 's1',
      kind: 'runjs',
    });
  });

  it('releaseLibraryQuery posts to the library-release route', async () => {
    server.use(
      http.post(`${config.apiUrl}/data-queries/q1/versions/v1/library-release`, () =>
        HttpResponse.json({ id: 'r1', name: 'v1', versionNumber: 1, createdAt: 'now' })
      )
    );
    await expect(dataqueryService.releaseLibraryQuery('q1', 'v1')).resolves.toMatchObject({
      id: 'r1',
      versionNumber: 1,
    });
  });

  it('getLibraryCatalog gets the catalog for a version', async () => {
    server.use(
      http.get(`${config.apiUrl}/data-queries/v1/library-catalog`, () => HttpResponse.json({ queries: [{ id: 'q1' }] }))
    );
    await expect(dataqueryService.getLibraryCatalog('v1')).resolves.toEqual({ queries: [{ id: 'q1' }] });
  });
});
