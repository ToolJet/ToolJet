import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { initTestApp, closeTestApp, getDefaultDataSource, createAdmin } from 'test-helper';
import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';

/**
 * Workspace PATs are an EE feature: on CE the create route is a stub and must never mint a token.
 *
 * @group platform
 */
describe('Personal access token creation (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('POST /api/personal-access-tokens | Create a token', () => {
    it('should not create a token, even for an admin', async () => {
      const admin = await createAdmin(app, 'pat-ce-admin@tooljet.io');

      const res = await request
        .agent(app.getHttpServer())
        .post('/api/personal-access-tokens')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', admin.workspace.id)
        .send({ name: 'ce-token', expiresAt: new Date(Date.now() + 86400000).toISOString() });

      expect(res.status).toBe(501);
      expect(res.body).not.toHaveProperty('token');
      expect(await getDefaultDataSource().getRepository(UserPersonalAccessToken).count()).toBe(0);
    });
  });
});
