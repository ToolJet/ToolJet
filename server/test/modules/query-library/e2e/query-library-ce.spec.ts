import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
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
  it('should 404 every query-library route on CE', async () => {
    for (const path of ['queries', 'catalog', 'usage', 'static-data-sources'])
      await request(app.getHttpServer()).get(`/api/query-library/${path}`).expect(404);
    await request(app.getHttpServer())
      .post('/api/query-library/queries/00000000-0000-4000-8000-000000000000/run/00000000-0000-4000-8000-000000000001')
      .send({})
      .expect(404);
  });
});
