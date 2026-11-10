import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { QueryLibraryService } from '@modules/query-library/service';
import { LibraryDraftService } from '@modules/query-library/draft.service';
import { LibraryLifecycleService } from '@modules/query-library/lifecycle.service';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  createDataQuery,
  createDataSource,
  getDefaultDataSource,
} from 'test-helper';
/** @group platform */
describe('QueryLibraryController on CE', () => {
  let app: INestApplication;
  beforeAll(async () => {
    ({ app } = await initTestApp());
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);
  it('refuses feature services with 501 even when raw license terms could enable them', async () => {
    await expect(app.get(QueryLibraryService).assertEnabled('workspace')).rejects.toMatchObject({ status: 501 });
    await expect(app.get(LibraryDraftService).getDraft('query', 'draft', null)).rejects.toMatchObject({ status: 501 });
    await expect(app.get(LibraryLifecycleService).getState(null, 'query')).rejects.toMatchObject({ status: 501 });
  });
  it('should 404 every query-library route on CE', async () => {
    for (const path of ['queries', 'catalog', 'usage', 'static-data-sources'])
      await request(app.getHttpServer()).get(`/api/query-library/${path}`).expect(404);
    const queryPath = '/api/query-library/queries/00000000-0000-4000-8000-000000000000';
    const referenceId = '00000000-0000-4000-8000-000000000001';
    for (const suffix of ['versions', `drafts/${referenceId}`])
      await request(app.getHttpServer()).get(`${queryPath}/${suffix}`).expect(404);
    for (const suffix of [
      'drafts',
      `drafts/${referenceId}/save`,
      `versions/${referenceId}/promote`,
      `versions/${referenceId}/release`,
    ])
      await request(app.getHttpServer()).post(`${queryPath}/${suffix}`).send({}).expect(404);
    for (const suffix of [`drafts/${referenceId}`, `versions/${referenceId}`])
      await request(app.getHttpServer()).delete(`${queryPath}/${suffix}`).expect(404);
    await request(app.getHttpServer())
      .post('/api/query-library/queries/00000000-0000-4000-8000-000000000000/run/00000000-0000-4000-8000-000000000001')
      .send({})
      .expect(404);
  });
  // Like Modules: an app that references the library still moves between workspaces; the reference is kept as-is.
  it('should export and import an app that references a library query', async () => {
    const admin = await createAdmin(app, 'library-ce-export@tooljet.io');
    const application = await createApplication(app, { name: 'Library consumer', user: admin.user });
    const version = await createApplicationVersion(app, application);
    const source = await createDataSource(app, {
      name: 'librarydefault',
      kind: 'library',
      type: 'static',
      application,
    });
    const pin = {
      libraryQueryId: '00000000-0000-4000-8000-0000000000aa',
      libraryQueryVersionId: '00000000-0000-4000-8000-0000000000bb',
    };
    await createDataQuery(app, { name: 'consumer', dataSource: source, appVersion: version, options: pin });
    const send = (path: string, body: object) =>
      request(app.getHttpServer())
        .post(`/api/v2/resources/${path}`)
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin.cookie)
        .send({ organization_id: admin.user.defaultOrganizationId, ...body });

    const exported = await send('export', { app: [{ id: application.id }] }).expect(201);
    expect(exported.body.app[0].definition.appV2).not.toHaveProperty('libraryQueries');
    const imported = await send('import', {
      tooljet_version: exported.body.tooljet_version,
      app: exported.body.app.map((row: object) => ({ ...row, appName: 'Imported consumer' })),
    }).expect(201);

    const [row] = await getDefaultDataSource().query(
      `SELECT dq.options FROM data_queries dq JOIN app_versions av ON av.id = dq.app_version_id
        WHERE av.app_id = $1 AND dq.name = 'consumer'`,
      [imported.body.imports.app[0].id]
    );
    expect(typeof row.options === 'string' ? JSON.parse(row.options) : row.options).toMatchObject(pin);
  });
});
