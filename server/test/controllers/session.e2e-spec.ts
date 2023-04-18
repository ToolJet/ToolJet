import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstance, logoutUser, authenticateUser } from '../test.helper';
import * as request from 'supertest';

describe('session & new apis', () => {
  let app: INestApplication;
  let tokenCookie: string;
  let orgId: string;
  beforeEach(async () => {
    await clearDB();
    const { organization } = await createUser(app, {
      email: 'admin@tooljet.io',
      firstName: 'user',
      lastName: 'name',
    });
    orgId = organization.id;
    const { tokenCookie: tokenCookieData } = await authenticateUser(app);
    tokenCookie = tokenCookieData;
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  afterEach(async () => {
    await logoutUser(app, tokenCookie, orgId);
  });

  it('Should return 403 if the auth token is invalid', async () => {
    await request.agent(app.getHttpServer()).get('/api/authorize').set('tj-workspace-id', orgId).expect(403);
  });

  describe('GET /api/authorize', () => {
    it("should return 401 if the organization-id isn't available in the auth token", async () => {
      const response = await request(app.getHttpServer())
        .post('/api/organizations')
        .send({ name: 'My workspace' })
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId);

      await request
        .agent(app.getHttpServer())
        .get('/api/authorize')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', response.body.current_organization_id)
        .expect(401);
    });

    it('should return 404 if the user not in the specific organization', async () => {
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

  describe('GET /api/profile', () => {
    it('should return the user details', async () => {
      await request(app.getHttpServer())
        .get('/api/profile')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .expect(200);
    });
  });

  describe('GET /api/profile', () => {
    it('should return the user details', async () => {
      await request(app.getHttpServer())
        .get('/api/profile')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .expect(200);
    });
  });

  describe('GET /api/session', () => {
    it('should return the current user details', async () => {
      await request(app.getHttpServer())
        .get('/api/session')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', orgId)
        .expect(200);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
