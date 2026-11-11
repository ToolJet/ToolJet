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

const BASE = '/api/v2/ext/users';

describe('ExternalApisUsersControllerV2 (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('GET /api/v2/ext/users returns 404 — route not registered on CE', async () => {
    await request(app.getHttpServer()).get(BASE).set('Authorization', getExtAuth()).expect(404);
  });

  it('PATCH /api/v2/ext/users/:userIdentifier returns 404 — route not registered on CE', async () => {
    await request(app.getHttpServer())
      .patch(`${BASE}/${NONEXISTENT_UUID}`)
      .set('Authorization', getExtAuth())
      .send({ name: 'X' })
      .expect(404);
  });
});
