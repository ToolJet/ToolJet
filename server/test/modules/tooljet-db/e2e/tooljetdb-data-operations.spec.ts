/** @jest-environment setup-polly-jest/jest-environment-node */

/**
 * ToolJet Database Data Operations E2E Tests
 *
 * Tests row-level CRUD operations through the PostgREST proxy endpoint.
 * Polly.js intercepts PostgREST HTTP calls and returns mock responses,
 * so the tests work without a live PostgREST instance. The NestJS test
 * server runs normally (supertest requests are passed through).
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupPolly } from 'setup-polly-jest';
import * as NodeHttpAdapter from '@pollyjs/adapter-node-http';
import * as FSPersister from '@pollyjs/persister-fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  initTestApp,
  login,
  getTooljetDbDataSource,
  closeTestApp,
  ensureAppEnvironments,
} from 'test-helper';

describe('TooljetDbDataController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let adminOrgId: string;
    let tooljetDbAvailable: boolean;
    let tableId: string;
    let ordersTableId: string;
    let foreignTableId: string;

    const TABLE_NAME = 'test_data_ops';
    const ORDERS_TABLE_NAME = 'test_data_ops_orders';
    const FOREIGN_TABLE_NAME = 'test_data_ops_foreign';

    // Requests Polly actually forwarded to PostgREST — reset per test in beforeEach.
    let interceptedRequests: { method: string; url: string }[] = [];
    function pollyRequests() {
      return interceptedRequests;
    }

    // In-memory store for mock PostgREST data
    const mockRows: Record<number, any>[] = [];

    // ---------------------------------------------------------------------------
    // Polly.js setup — intercept PostgREST, passthrough test server
    // ---------------------------------------------------------------------------
    const context = setupPolly({
      adapters: [NodeHttpAdapter as any],
      persister: FSPersister as any,
      recordFailedRequests: true,
      persisterOptions: {
        fs: {
          recordingsDir: path.resolve(
            __dirname,
            `../../__fixtures__/${path.basename(__filename).replace(/\.[tj]s$/, '')}`
          ),
        },
      },
    });

    // ---------------------------------------------------------------------------
    // Helper: ensure the workspace schema exists in the tooljetDb connection
    // ---------------------------------------------------------------------------
    async function ensureWorkspaceSchema(orgId: string): Promise<boolean> {
      const tjds = getTooljetDbDataSource();
      if (!tjds) return false;
      try {
        await tjds.query(`CREATE SCHEMA IF NOT EXISTS "workspace_${orgId}"`);
        return true;
      } catch {
        return false;
      }
    }

    // ---------------------------------------------------------------------------
    // Helper: build a create-table payload matching CreatePostgrestTableDto
    // ---------------------------------------------------------------------------
    function buildCreateTablePayload(tableName: string) {
      return {
        table_name: tableName,
        columns: [
          {
            column_name: 'id',
            data_type: 'integer',
            constraints_type: {
              is_not_null: true,
              is_primary_key: true,
              is_unique: true,
            },
          },
          {
            column_name: 'name',
            data_type: 'character varying',
            constraints_type: {
              is_not_null: false,
              is_primary_key: false,
              is_unique: false,
            },
          },
          {
            column_name: 'email',
            data_type: 'character varying',
            constraints_type: {
              is_not_null: false,
              is_primary_key: false,
              is_unique: false,
            },
          },
        ],
        foreign_keys: [],
      };
    }

    // ---------------------------------------------------------------------------
    // Helper: parse the proxy response body (may be JSON, Buffer, or string)
    // ---------------------------------------------------------------------------
    function parseProxyBody(res: any): any[] {
      if (Array.isArray(res.body)) return res.body;
      if (Buffer.isBuffer(res.body) || res.body?.type === 'Buffer') {
        const buf = Buffer.isBuffer(res.body) ? res.body : Buffer.from(res.body.data);
        return JSON.parse(buf.toString('utf8'));
      }
      if (typeof res.body === 'string') return JSON.parse(res.body);
      if (res.text) return JSON.parse(res.text);
      return res.body;
    }

    // ---------------------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------------------
    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tooljetDbAvailable = !!getTooljetDbDataSource();

      // Create admin user and login
      const { user } = await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      adminOrgId = user.defaultOrganizationId;

      if (tooljetDbAvailable) {
        const schemaReady = await ensureWorkspaceSchema(adminOrgId);
        if (!schemaReady) tooljetDbAvailable = false;
      }

      // A freshly created test org has no app_environments row — the backfill migration only
      // covered pre-existing orgs, and createUser() (unlike real signup) doesn't seed one either.
      // createTable/create-relation need it (resolveEnvironmentId), same as a real signup flow provides.
      await ensureAppEnvironments(app, adminOrgId);

      const auth = await login(app);
      adminCookie = auth.tokenCookie;

      // Create the table used by all data tests
      if (tooljetDbAvailable) {
        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload(TABLE_NAME));

        expect([200, 201]).toContain(res.statusCode);
        tableId = res.body?.result?.id;
        expect(tableId).toBeDefined();

        // A second table in the SAME workspace, for the <rel>. filter-key rewrite case.
        const ordersRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload(ORDERS_TABLE_NAME));

        expect([200, 201]).toContain(ordersRes.statusCode);
        ordersTableId = ordersRes.body?.result?.id;
        expect(ordersTableId).toBeDefined();

        // A table owned by a DIFFERENT workspace — must never resolve for adminOrgId.
        const { user: otherUser } = await createUser(app, {
          email: 'other-admin@tooljet.io',
          firstName: 'Other',
          lastName: 'Admin',
          groups: ['admin', 'end-user'],
        });
        const otherOrgId = otherUser.defaultOrganizationId;
        await ensureWorkspaceSchema(otherOrgId);
        await ensureAppEnvironments(app, otherOrgId);
        const otherAuth = await login(app, 'other-admin@tooljet.io');

        const foreignRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${otherOrgId}/table`)
          .set('Cookie', otherAuth.tokenCookie)
          .set('tj-workspace-id', otherOrgId)
          .send(buildCreateTablePayload(FOREIGN_TABLE_NAME));

        expect([200, 201]).toContain(foreignRes.statusCode);
        foreignTableId = foreignRes.body?.result?.id;
        expect(foreignTableId).toBeDefined();
      }
    });

    beforeEach(() => {
      interceptedRequests = [];

      // Passthrough requests to the NestJS test server (127.0.0.1).
      context.polly.server
        .any()
        .filter((req) => req.hostname === '127.0.0.1')
        .intercept((_req, _res, interceptor) => {
          interceptor.passthrough();
        });

      // Record every request Polly actually forwarded to PostgREST — the fail-closed matrix
      // asserts on this directly, since "never reached PostgREST" is the point of the guard.
      context.polly.server.any('http://localhost:3001/*').on('request', (req) => {
        interceptedRequests.push({ method: req.method, url: req.url });
      });

      // Intercept PostgREST requests (localhost:3001) with mock responses.
      // POST | create a row
      context.polly.server.post('http://localhost:3001/*').intercept((req, res) => {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        mockRows.push(body);
        res.status(201);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Range', `0-0/${mockRows.length}`);
        res.json([body]);
      });

      // GET | list rows
      context.polly.server.get('http://localhost:3001/*').intercept((req, res) => {
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Range', mockRows.length > 0 ? `0-${mockRows.length - 1}/${mockRows.length}` : '*/0');
        res.json([...mockRows]);
      });

      // PATCH | update rows
      context.polly.server.patch('http://localhost:3001/*').intercept((req, res) => {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        // Parse query for PostgREST filter: ?id=eq.1
        const query = req.query || {};
        const idFilter = query.id;
        let matchIdx = -1;
        if (idFilter && typeof idFilter === 'string' && idFilter.startsWith('eq.')) {
          const idVal = parseInt(idFilter.slice(3), 10);
          matchIdx = mockRows.findIndex((r) => r.id === idVal);
        }
        if (matchIdx >= 0) {
          Object.assign(mockRows[matchIdx], body);
          res.status(200);
          res.setHeader('Content-Type', 'application/json');
          res.json([mockRows[matchIdx]]);
        } else {
          res.status(200);
          res.setHeader('Content-Type', 'application/json');
          res.json([]);
        }
      });

      // DELETE | delete rows
      context.polly.server.delete('http://localhost:3001/*').intercept((req, res) => {
        const query = req.query || {};
        const idFilter = query.id;
        if (idFilter && typeof idFilter === 'string' && idFilter.startsWith('eq.')) {
          const idVal = parseInt(idFilter.slice(3), 10);
          const idx = mockRows.findIndex((r) => r.id === idVal);
          if (idx >= 0) {
            const deleted = mockRows.splice(idx, 1);
            res.status(200);
            res.setHeader('Content-Type', 'application/json');
            res.json(deleted);
            return;
          }
        }
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.json([]);
      });
    });

    afterAll(async () => {
      await closeTestApp(app);
    });

    // ---------------------------------------------------------------------------
    // Sequential CRUD tests | each depends on the previous
    // ---------------------------------------------------------------------------

    it('should create a row', async function () {
      if (!tooljetDbAvailable) return;

      const res = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/proxy/${tableId}`)
        .set('Cookie', adminCookie)
        .set('tj-workspace-id', adminOrgId)
        .send({ id: 1, name: 'Alice', email: 'alice@test.com' });

      expect([200, 201]).toContain(res.statusCode);
    });

    it('should list rows', async function () {
      if (!tooljetDbAvailable) return;

      const res = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/proxy/${tableId}`)
        .set('Cookie', adminCookie)
        .set('tj-workspace-id', adminOrgId);

      expect(res.statusCode).toBe(200);

      const rows = parseProxyBody(res);
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBeGreaterThanOrEqual(1);

      const alice = rows.find((r: any) => r.id === 1);
      expect(alice).toBeDefined();
      expect(alice.name).toBe('Alice');
      expect(alice.email).toBe('alice@test.com');
    });

    it('should update a row', async function () {
      if (!tooljetDbAvailable) return;

      const res = await request
        .agent(app.getHttpServer())
        .patch(`/api/tooljet-db/proxy/${tableId}?id=eq.1`)
        .set('Cookie', adminCookie)
        .set('tj-workspace-id', adminOrgId)
        .send({ name: 'Bob' });

      expect([200, 204]).toContain(res.statusCode);
    });

    it('should delete a row', async function () {
      if (!tooljetDbAvailable) return;

      const res = await request
        .agent(app.getHttpServer())
        .delete(`/api/tooljet-db/proxy/${tableId}?id=eq.1`)
        .set('Cookie', adminCookie)
        .set('tj-workspace-id', adminOrgId);

      expect([200, 204]).toContain(res.statusCode);
    });

    it('should return empty after delete', async function () {
      if (!tooljetDbAvailable) return;

      const res = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/proxy/${tableId}`)
        .set('Cookie', adminCookie)
        .set('tj-workspace-id', adminOrgId);

      expect(res.statusCode).toBe(200);

      const rows = parseProxyBody(res);
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBe(0);
    });

    // -------------------------------------------------------------------------
    // Fail-closed matrix — every table reference in the path or querystring must
    // resolve against the caller's own workspace before anything reaches PostgREST.
    // -------------------------------------------------------------------------
    describe('GET /api/tooljet-db/proxy/:tableId | fail-closed resolution', () => {
      // Uses the <rel>. filter-key-prefix form rather than select=*,<rel>(...) — both feed the
      // same `embedded` extraction/resolution path, and Polly's passthrough leg to the app
      // itself percent-encodes `(`, `)`, `,`, `*` in-flight, which would mask the assertion.
      it('should return 400 when another workspace uuid appears as an embedded reference', async function () {
        if (!tooljetDbAvailable) return;

        const res = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/proxy/${tableId}?${foreignTableId}.title=eq.x`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(res.statusCode).toBe(400);
        expect(pollyRequests()).toHaveLength(0);
      });

      it('should return 404 for an unowned uuid in the path', async function () {
        if (!tooljetDbAvailable) return;

        const res = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/proxy/${foreignTableId}?select=name`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(res.statusCode).toBe(404);
        expect(pollyRequests()).toHaveLength(0);
      });

      it('should forward a uuid-shaped filter value byte identical', async function () {
        if (!tooljetDbAvailable) return;

        await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/proxy/${tableId}?owner_id=eq.${foreignTableId}`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(pollyRequests()[0].url).toContain(`owner_id=eq.${foreignTableId}`);
      });

      it('should rewrite a <rel>. filter-key prefix to the resolved relation', async function () {
        if (!tooljetDbAvailable) return;

        await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/proxy/${tableId}?${ordersTableId}.total=gt.5`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        // Relation id currently always equals the logical table id, so the rewritten value equals
        // the input.
        expect(pollyRequests()[0].url).toContain(`${ordersTableId}.total=gt.5`);
      });

      it('should return 400 for a uuid-shaped embedded reference that resolves to nothing', async function () {
        if (!tooljetDbAvailable) return;

        const res = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/proxy/${tableId}?${uuidv4()}.x=eq.1`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(res.statusCode).toBe(400);
        expect(pollyRequests()).toHaveLength(0);
      });
    });
  });
});
