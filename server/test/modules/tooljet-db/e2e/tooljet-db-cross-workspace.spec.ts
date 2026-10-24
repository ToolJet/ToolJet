/**
 * Guards reject before the service runs, so these cases need no tooljetDb connection.
 *
 * @group database
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createUser, initTestApp, login, closeTestApp } from 'test-helper';

describe('TooljetDbController', () => {
  let app: INestApplication;
  let adminOrgId: string;
  let otherAdminOrgId: string;
  let otherAdminCookie: string[];

  beforeAll(async () => {
    ({ app } = await initTestApp());

    const admin = await createUser(app, { email: 'admin@tooljet.io', groups: ['all_users', 'admin'] });
    const otherAdmin = await createUser(app, { email: 'other-admin@tooljet.io', groups: ['all_users', 'admin'] });
    adminOrgId = admin.user.defaultOrganizationId;
    otherAdminOrgId = otherAdmin.user.defaultOrganizationId;
    ({ tokenCookie: otherAdminCookie } = await login(app, otherAdmin.user.email));
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  describe('GET /api/tooljet-db/organizations/:organizationId/tables | Cross-workspace', () => {
    it("should return 403 when the path workspace id is not the session's workspace", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${adminOrgId}/tables`)
        .set('tj-workspace-id', otherAdminOrgId)
        .set('Cookie', otherAdminCookie);

      expect(response.statusCode).toBe(403);
    });
  });

  describe('POST /api/tooljet-db/organizations/:organizationId/join | Cross-workspace', () => {
    it("should return 403 when the path workspace id is not the session's workspace", async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${adminOrgId}/join`)
        .set('tj-workspace-id', otherAdminOrgId)
        .set('Cookie', otherAdminCookie)
        .send({});

      expect(response.statusCode).toBe(403);
    });
  });
});
