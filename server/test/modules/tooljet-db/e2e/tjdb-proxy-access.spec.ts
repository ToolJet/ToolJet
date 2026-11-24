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
import {
  createUser,
  initTestApp,
  login,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  createDataSource,
  createDataQuery,
} from 'test-helper';

describe('TooljetDb proxy access', () => {
  let app: INestApplication;
  let orgId: string;
  let organization: any;
  let readQueryId: string;
  let otherWorkspaceQueryId: string;
  const tableX = uuidv4();
  const tableY = uuidv4();

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

    // A read-only ToolJet Database query on table X, in an app of this workspace and of another one.
    const seedReadQuery = async (user) => {
      const application = await createApplication(app, { name: `proxy-access-${uuidv4()}`, user });
      const appVersion = await createApplicationVersion(app, application);
      const dataSource = await createDataSource(app, {
        appVersion,
        application,
        name: 'tooljetdb',
        kind: 'tooljetdb',
      });
      const dataQuery = await createDataQuery(app, {
        dataSource,
        appVersion,
        options: { operation: 'list_rows', table_id: tableX },
      });
      return dataQuery.id;
    };
    readQueryId = await seedReadQuery(admin.user);
    const otherAdmin = await createUser(app, {
      email: 'proxy-access-other-admin@tooljet.io',
      groups: ['admin', 'end-user'],
    });
    otherWorkspaceQueryId = await seedReadQuery(otherAdmin.user);
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

  describe('ALL /api/tooljet-db/proxy/:tableId | end user with a data query', () => {
    const asEndUser = async (req: request.Test, dataQueryId: string) => {
      const { tokenCookie } = await login(app, 'proxy-access-end-user@tooljet.io');
      return req.set({ Cookie: tokenCookie, 'tj-workspace-id': orgId, 'data-query-id': dataQueryId });
    };
    const http = () => request.agent(app.getHttpServer());

    it("should let a read query through for its own table's rows", async () => {
      const res = await asEndUser(http().get(`/api/tooljet-db/proxy/${tableX}`), readQueryId);

      expect(res.statusCode).not.toBe(403);
    });

    it('should 403 a read query used on another table', async () => {
      const res = await asEndUser(http().get(`/api/tooljet-db/proxy/${tableY}`), readQueryId);

      expect(res.statusCode).toBe(403);
    });

    it('should 403 a read query used to write its own table', async () => {
      const res = await asEndUser(http().patch(`/api/tooljet-db/proxy/${tableX}?id=eq.1`), readQueryId);

      expect(res.statusCode).toBe(403);
    });

    it('should 403 a read query that embeds another table', async () => {
      const res = await asEndUser(http().get(`/api/tooljet-db/proxy/${tableX}?select=*,${tableY}(*)`), readQueryId);

      expect(res.statusCode).toBe(403);
    });

    it("should 403 a data query from another workspace's app", async () => {
      const res = await asEndUser(http().get(`/api/tooljet-db/proxy/${tableX}`), otherWorkspaceQueryId);

      expect(res.statusCode).toBe(403);
    });
  });
});
