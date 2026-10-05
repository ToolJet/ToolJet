/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createUser, initTestApp, closeTestApp } from 'test-helper';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

function base(workspaceId: string) {
  return `/api/v2/ext/workspaces/${workspaceId}/environments`;
}

describe('ExternalApisEnvironmentsControllerV2 (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should reject a request with no token', async () => {
    const { user } = await createUser(app, { email: `env2-auth-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer()).get(base(user.defaultOrganizationId)).expect(403);
  });

  it('should 404 when the workspace identifier matches nothing', async () => {
    await request(app.getHttpServer()).get(base('not-a-real-workspace')).set('Authorization', getExtAuth()).expect(404);
  });

  it('should list the workspace environments in promotion order', async () => {
    const { user } = await createUser(app, { email: `env2-list-${Date.now()}@tooljet.io` });

    const res = await request(app.getHttpServer())
      .get(base(user.defaultOrganizationId))
      .set('Authorization', getExtAuth())
      .expect(200);

    expect(res.body).toEqual({
      data: [
        { id: expect.any(String), name: 'development', priority: 1 },
        { id: expect.any(String), name: 'staging', priority: 2 },
        { id: expect.any(String), name: 'production', priority: 3 },
      ],
    });
  });
});
