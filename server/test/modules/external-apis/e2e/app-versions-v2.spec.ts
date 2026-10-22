/**
 * @group platform
 */

// EE behaviour lives in the same-named spec under ee/test/; on CE the v2 routes are never registered.

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createUser, initTestApp, closeTestApp, createApplication } from 'test-helper';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

function base(workspaceId: string, appId: string) {
  return `/api/v2/ext/workspaces/${workspaceId}/apps/${appId}/versions`;
}

describe('ExternalApisAppVersionsControllerV2 (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ce' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should not register the version routes on CE', async () => {
    const { user } = await createUser(app, { email: `avv2-ce-${Date.now()}@tooljet.io` });
    const seeded = await createApplication(app, { name: 'CE App', user });
    await request(app.getHttpServer())
      .get(base(user.defaultOrganizationId, seeded.id))
      .set('Authorization', getExtAuth())
      .expect(404);
  });
});
