import { INestApplication } from '@nestjs/common';
import { createUser, initTestApp, logout, login, closeTestApp } from 'test-helper';
import * as request from 'supertest';

/**
 * @group platform
 */
describe('SessionController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let tokenCookie: string;
    let orgId: string;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      const { organization } = await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'user',
        lastName: 'name',
      });
      orgId = organization.id;
      const { tokenCookie: tokenCookieData } = await login(app);
      tokenCookie = tokenCookieData;
    });

    afterEach(async () => {
      await logout(app, tokenCookie, orgId);
      jest.resetAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);

    describe('GET /api/authorize | Validate auth token', () => {
      it('should return 401 if the auth token is invalid', async () => {
        await request.agent(app.getHttpServer()).get('/api/authorize').set('tj-workspace-id', orgId).expect(401);
      });

      it('should return 401 if the user not in the specific organization', async () => {
        const { organization } = await createUser(app, {
          email: 'admin2@tooljet.io',
          firstName: 'user',
          lastName: 'name',
        });

        await request
          .agent(app.getHttpServer())
          .get('/api/authorize')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', organization.id)
          .expect(401);
      });

      it('should return the organization details if the auth token have the organization id', async () => {
        await request(app.getHttpServer())
          .get('/api/authorize')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
      });
    });

    describe('GET /api/profile | Get user profile', () => {
      it('should return the user details', async () => {
        await request(app.getHttpServer())
          .get('/api/profile')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
      });
    });

    describe('GET /api/session | Get current session', () => {
      it('should return the current user details', async () => {
        await request(app.getHttpServer())
          .get('/api/session')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .expect(200);
      });
    });
  });
});
