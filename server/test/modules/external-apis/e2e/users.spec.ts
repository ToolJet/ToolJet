/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createUser, initTestApp, closeTestApp } from 'test-helper';

jest.setTimeout(120_000);

const getExtAuth = () => `Basic ${process.env.EXTERNAL_API_ACCESS_TOKEN}`;

describe('ExternalApisUsersController (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('POST /api/ext/users — inviteUrl', () => {
    it('should include a non-null inviteUrl per workspace in the response', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Vendor One',
          email: 'vendor1@example.com',
          workspaces: [{ id: orgId }],
        })
        .expect(201);

      expect(res.body.workspaces).toHaveLength(1);
      expect(res.body.workspaces[0].inviteUrl).toBeTruthy();
    });

    it('inviteUrl should contain the correct oid query param matching the workspace id', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin2@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Vendor Two',
          email: 'vendor2@example.com',
          workspaces: [{ id: orgId }],
        })
        .expect(201);

      const inviteUrl: string = res.body.workspaces[0].inviteUrl;
      expect(inviteUrl).toContain(`oid=${orgId}`);
    });
  });

  describe('GET /api/ext/user/:id — backward compat', () => {
    it('should return inviteUrl as null for users without invitation tokens', async () => {
      // Users created via test helper (internal path) never get invitationToken set,
      // so getAllUsers should safely return inviteUrl: null for each of their workspaces.
      const { user: adminUser } = await createUser(app, { email: 'admin3@tooljet.io' });

      const res = await request(app.getHttpServer())
        .get(`/api/ext/user/${adminUser.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);

      res.body.workspaces.forEach((ws: { inviteUrl: string | null }) => {
        expect(ws.inviteUrl).toBeNull();
      });
    });
  });
});
