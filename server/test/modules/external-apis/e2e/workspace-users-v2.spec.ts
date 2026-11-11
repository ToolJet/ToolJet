/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initTestApp, closeTestApp, NONEXISTENT_UUID } from 'test-helper';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

const WORKSPACES_BASE = '/api/v2/ext/workspaces';

describe('ExternalApisWorkspaceUsersControllerV2 (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('GET /api/v2/ext/workspaces/:workspaceIdentifier/users returns 404 — route not registered on CE', async () => {
    await request(app.getHttpServer())
      .get(`${WORKSPACES_BASE}/${NONEXISTENT_UUID}/users`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('POST /api/v2/ext/workspaces/:workspaceIdentifier/users returns 404 — route not registered on CE', async () => {
    await request(app.getHttpServer())
      .post(`${WORKSPACES_BASE}/${NONEXISTENT_UUID}/users`)
      .set('Authorization', getExtAuth())
      .send({ name: 'X', email: `wu-ce-${Date.now()}@tooljet.io`, password: 'Password1', role: 'end-user' })
      .expect(404);
  });
});
