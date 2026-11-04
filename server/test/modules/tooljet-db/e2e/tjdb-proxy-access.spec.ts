/**
 * Who may call the HTTP `/proxy/*` passthrough. App queries never use this route - they reach
 * PostgREST in-process - so it serves only the TJDB dashboard and the App Builder editor, both
 * admin/builder surfaces. An end user must not get raw row access to any table by calling it.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { createUser, initTestApp, login, closeTestApp } from 'test-helper';

describe('TooljetDb proxy access', () => {
  let app: INestApplication;
  let orgId: string;
  let organization: any;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    const admin = await createUser(app, {
      email: 'proxy-access-admin@tooljet.io',
      groups: ['admin', 'end-user'],
    });
    orgId = admin.user.defaultOrganizationId;
    organization = admin.organization;
    await createUser(app, {
      email: 'proxy-access-end-user@tooljet.io',
      groups: ['end-user'],
      organization,
    });
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  describe('GET /api/tooljet-db/proxy/:tableId | caller role', () => {
    it('should 403 an end user calling the proxy without a data query', async () => {
      const { tokenCookie } = await login(app, 'proxy-access-end-user@tooljet.io');

      const res = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/proxy/${uuidv4()}`)
        .set({ Cookie: tokenCookie, 'tj-workspace-id': orgId });

      expect(res.statusCode).toBe(403);
    });

    it('should let an admin past the guard', async () => {
      const { tokenCookie } = await login(app, 'proxy-access-admin@tooljet.io');

      const res = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/proxy/${uuidv4()}`)
        .set({ Cookie: tokenCookie, 'tj-workspace-id': orgId });

      expect(res.statusCode).not.toBe(403);
    });
  });

  // Temporary opt-in for apps that still call /proxy from RunJS: restores the pre-3.21.87 rule.
  describe('TOOLJET_DB_PROXY_ALLOW_END_USERS=true | caller role', () => {
    beforeAll(() => {
      process.env.TOOLJET_DB_PROXY_ALLOW_END_USERS = 'true';
    });

    afterAll(() => {
      delete process.env.TOOLJET_DB_PROXY_ALLOW_END_USERS;
    });

    it('should let an end user past the guard for a read', async () => {
      const { tokenCookie } = await login(app, 'proxy-access-end-user@tooljet.io');

      const res = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/proxy/${uuidv4()}`)
        .set({ Cookie: tokenCookie, 'tj-workspace-id': orgId });

      expect(res.statusCode).not.toBe(403);
    });

    it('should let an end user past the guard for a write', async () => {
      const { tokenCookie } = await login(app, 'proxy-access-end-user@tooljet.io');

      const res = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/proxy/${uuidv4()}`)
        .set({ Cookie: tokenCookie, 'tj-workspace-id': orgId })
        .send({ name: 'x' });

      expect(res.statusCode).not.toBe(403);
    });

    it('should still refuse a caller without a session', async () => {
      const res = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/proxy/${uuidv4()}`)
        .set({ 'tj-workspace-id': orgId });

      expect([401, 403]).toContain(res.statusCode);
    });
  });
});
