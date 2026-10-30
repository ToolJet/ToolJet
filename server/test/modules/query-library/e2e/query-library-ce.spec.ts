import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { QueryLibraryService } from '@modules/query-library/service';
import { LibraryDraftService } from '@modules/query-library/draft.service';
import { LibraryLifecycleService } from '@modules/query-library/lifecycle.service';
import { initTestApp, closeTestApp } from 'test-helper';
/** @group platform */
describe('QueryLibraryController on CE', () => {
  let app: INestApplication;
  beforeAll(async () => {
    ({ app } = await initTestApp());
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);
  it('refuses feature services even when raw license terms could enable them', async () => {
    await expect(app.get(QueryLibraryService).assertEnabled('workspace')).rejects.toMatchObject({ status: 404 });
    await expect(app.get(LibraryDraftService).getDraft('query', 'draft', null)).rejects.toMatchObject({ status: 404 });
    await expect(app.get(LibraryLifecycleService).getState(null, 'query')).rejects.toMatchObject({ status: 404 });
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
});
