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
import { resetDB, createUser, initTestApp, login, getTooljetDbDataSource, closeTestApp } from 'test-helper';

describe('TooljetDbDataController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let adminOrgId: string;
    let tooljetDbAvailable: boolean;
    let tableId: string;

    const TABLE_NAME = 'test_data_ops';

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
      }
    });

    beforeEach(() => {
      // Passthrough requests to the NestJS test server (127.0.0.1).
      context.polly.server
        .any()
        .filter((req) => req.hostname === '127.0.0.1')
        .intercept((_req, _res, interceptor) => {
          interceptor.passthrough();
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
  });
});
