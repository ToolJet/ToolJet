import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import config from 'config';
import { findQueryLibrary, getOrCreateQueryLibrary } from '../queryLibraryApp';

const library = { id: 'lib1', slug: 'query-library', app_versions: [{ id: 'libv' }] };

describe('queryLibraryApp', () => {
  it('finds the workspace library and its single version', async () => {
    server.use(http.get(`${config.apiUrl}/apps`, () => HttpResponse.json({ apps: [library] })));
    expect(await findQueryLibrary()).toEqual({ id: 'lib1', slug: 'query-library', versionId: 'libv' });
  });

  it('returns null when there is none', async () => {
    server.use(http.get(`${config.apiUrl}/apps`, () => HttpResponse.json({ apps: [] })));
    expect(await findQueryLibrary()).toBeNull();
  });

  it('creates the library when missing', async () => {
    let created = false;
    server.use(
      http.get(`${config.apiUrl}/apps`, () => HttpResponse.json({ apps: created ? [library] : [] })),
      http.post(`${config.apiUrl}/apps`, async ({ request }) => {
        expect(await request.json()).toMatchObject({ type: 'query_library', name: 'Query library' });
        created = true;
        return HttpResponse.json({ id: 'lib1' });
      })
    );
    expect(await getOrCreateQueryLibrary()).toEqual({ id: 'lib1', slug: 'query-library', versionId: 'libv' });
  });

  it("uses the other creator's library when it loses the creation race", async () => {
    let calls = 0;
    server.use(
      http.get(`${config.apiUrl}/apps`, () => HttpResponse.json({ apps: ++calls > 1 ? [library] : [] })),
      http.post(`${config.apiUrl}/apps`, () =>
        HttpResponse.json({ statusCode: 400, message: 'This workspace already has a query library' }, { status: 400 })
      )
    );
    expect(await getOrCreateQueryLibrary()).toMatchObject({ id: 'lib1', versionId: 'libv' });
  });

  it('rethrows the create error when the library is still missing afterwards', async () => {
    server.use(
      http.get(`${config.apiUrl}/apps`, () => HttpResponse.json({ apps: [] })),
      http.post(`${config.apiUrl}/apps`, () => HttpResponse.json({ message: 'boom' }, { status: 500 }))
    );
    await expect(getOrCreateQueryLibrary()).rejects.toMatchObject({ error: 'boom' });
  });

  it('rethrows the create error when looking again also fails', async () => {
    let calls = 0;
    server.use(
      http.get(`${config.apiUrl}/apps`, () =>
        ++calls > 1 ? HttpResponse.json({ message: 'down' }, { status: 503 }) : HttpResponse.json({ apps: [] })
      ),
      http.post(`${config.apiUrl}/apps`, () => HttpResponse.json({ message: 'boom' }, { status: 500 }))
    );
    await expect(getOrCreateQueryLibrary()).rejects.toMatchObject({ error: 'boom' });
  });
});
