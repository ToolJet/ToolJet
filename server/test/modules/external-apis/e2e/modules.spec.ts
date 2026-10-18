/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createUser, initTestApp, closeTestApp } from 'test-helper';

jest.setTimeout(120_000);

// Read from the running app's ConfigService (not process.env directly) — the root .env and
// .env.test can define EXTERNAL_API_ACCESS_TOKEN differently, and the guard always checks
// against ConfigService.
let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

// A valid UUID that will never exist in the test database.
const NONEXISTENT_UUID = '00000000-0000-0000-0000-000000000001';

describe('ExternalApisModulesController (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('GET /api/ext/workspace/:workspaceId/modules returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: 'admin@tooljet.io' });
    await request(app.getHttpServer())
      .get(`/api/ext/workspace/${user.defaultOrganizationId}/modules`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('POST /api/ext/export/workspace/:workspaceId/modules/:moduleId returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: 'admin@tooljet.io' });
    await request(app.getHttpServer())
      .post(`/api/ext/export/workspace/${user.defaultOrganizationId}/modules/${NONEXISTENT_UUID}`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('POST /api/ext/import/workspace/:workspaceId/modules returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: 'admin@tooljet.io' });
    await request(app.getHttpServer())
      .post(`/api/ext/import/workspace/${user.defaultOrganizationId}/modules`)
      .set('Authorization', getExtAuth())
      .send({ tooljet_version: '1.0.0' })
      .expect(404);
  });
});
