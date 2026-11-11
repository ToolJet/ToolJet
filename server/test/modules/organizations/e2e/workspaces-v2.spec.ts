/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initTestApp, closeTestApp } from 'test-helper';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

const BASE = '/api/v2/ext/workspaces';

describe('ExternalApisWorkspacesControllerV2 (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('GET /api/v2/ext/workspaces returns 404 — route not registered on CE', async () => {
    await request(app.getHttpServer()).get(BASE).set('Authorization', getExtAuth()).expect(404);
  });

  it('POST /api/v2/ext/workspaces returns 404 — route not registered on CE', async () => {
    await request(app.getHttpServer())
      .post(BASE)
      .set('Authorization', getExtAuth())
      .send({ name: `CE Workspace ${Date.now()}`, slug: `ce-workspace-${Date.now()}` })
      .expect(404);
  });
});
