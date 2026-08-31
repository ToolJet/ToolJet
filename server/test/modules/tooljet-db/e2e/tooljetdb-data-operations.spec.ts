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
import { INestApplication, NotFoundException } from '@nestjs/common';
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
  withRealTransactions,
  getTooljetDbDataSource,
  getDefaultDataSource,
  closeTestApp,
  ensureAppEnvironments,
  createAppWithDependencies,
} from 'test-helper';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { TooljetDbTableOperationsService } from '@ee/tooljet-db/services/tooljet-db-table-operations.service';
// EE-only imports: resolve the real, edition-aware DI tokens TooljetDbModule/DataQueriesModule
// register under edition 'ee' (SubModule.getProviders dynamically imports these exact classes) —
// mirrors the existing pattern in test/modules/tooljet-db/e2e/tooljetdb-migration-replay.spec.ts
// and test/modules/data-queries/e2e/data-queries.spec.ts. Importing the CE base classes would be
// a different DI token and app.get() would not find them.
import { TooljetDbDataOperationsService } from '@ee/tooljet-db/services/tooljet-db-data-operations.service';
import { TooljetDbBulkUploadService } from '@ee/tooljet-db/services/tooljet-db-bulk-upload.service';
import { DataQueriesUtilService as EEDataQueriesUtilService } from '@ee/data-queries/util.service';

describe('TooljetDbDataController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let adminOrgId: string;
    let adminUser: any;
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

    // Environment-resolution test only: keyed by physical relation id so two relations of the
    // same logical table can be told apart by which rewritten id shows up in the request URL.
    // Reset per test so it never leaks into the shared mockRows-based tests above.
    let environmentRowsByRelationId: Map<string, any[]> | null = null;

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
      adminUser = { ...user, organizationId: user.defaultOrganizationId };

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
      environmentRowsByRelationId = null;

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
        if (environmentRowsByRelationId) {
          const relationId = [...environmentRowsByRelationId.keys()].find((id) => req.url.includes(id));
          const rows = relationId ? environmentRowsByRelationId.get(relationId) : [];
          res.status(200);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Range', rows.length > 0 ? `0-${rows.length - 1}/${rows.length}` : '*/0');
          res.json(rows);
          return;
        }
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
      expect(tooljetDbAvailable).toBe(true);

      const res = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/proxy/${tableId}`)
        .set('Cookie', adminCookie)
        .set('tj-workspace-id', adminOrgId)
        .send({ id: 1, name: 'Alice', email: 'alice@test.com' });

      expect([200, 201]).toContain(res.statusCode);
    });

    it('should list rows', async function () {
      expect(tooljetDbAvailable).toBe(true);

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
      expect(tooljetDbAvailable).toBe(true);

      const res = await request
        .agent(app.getHttpServer())
        .patch(`/api/tooljet-db/proxy/${tableId}?id=eq.1`)
        .set('Cookie', adminCookie)
        .set('tj-workspace-id', adminOrgId)
        .send({ name: 'Bob' });

      expect([200, 204]).toContain(res.statusCode);
    });

    it('should delete a row', async function () {
      expect(tooljetDbAvailable).toBe(true);

      const res = await request
        .agent(app.getHttpServer())
        .delete(`/api/tooljet-db/proxy/${tableId}?id=eq.1`)
        .set('Cookie', adminCookie)
        .set('tj-workspace-id', adminOrgId);

      expect([200, 204]).toContain(res.statusCode);
    });

    it('should return empty after delete', async function () {
      expect(tooljetDbAvailable).toBe(true);

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
        expect(tooljetDbAvailable).toBe(true);

        const res = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/proxy/${tableId}?${foreignTableId}.title=eq.x`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(res.statusCode).toBe(400);
        expect(pollyRequests()).toHaveLength(0);
      });

      it('should return 404 for an unowned uuid in the path', async function () {
        expect(tooljetDbAvailable).toBe(true);

        const res = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/proxy/${foreignTableId}?select=name`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(res.statusCode).toBe(404);
        expect(pollyRequests()).toHaveLength(0);
      });

      it('should forward a uuid-shaped filter value byte identical', async function () {
        expect(tooljetDbAvailable).toBe(true);

        await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/proxy/${tableId}?owner_id=eq.${foreignTableId}`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(pollyRequests()[0].url).toContain(`owner_id=eq.${foreignTableId}`);
      });

      it('should rewrite a <rel>. filter-key prefix to the resolved relation', async function () {
        expect(tooljetDbAvailable).toBe(true);

        await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/proxy/${tableId}?${ordersTableId}.total=gt.5`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        // The relation id is independent of the logical table id, so the rewrite is observable:
        // the forwarded key carries the relation id and the logical id is gone.
        const ordersRelation = await getDefaultDataSource().manager.findOne(InternalTableRelation, {
          where: { internalTableId: ordersTableId },
        });
        expect(ordersRelation.id).not.toBe(ordersTableId);
        expect(pollyRequests()[0].url).toContain(`${ordersRelation.id}.total=gt.5`);
        expect(pollyRequests()[0].url).not.toContain(ordersTableId);
      });

      it('should return 400 for a uuid-shaped embedded reference that resolves to nothing', async function () {
        expect(tooljetDbAvailable).toBe(true);

        const res = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/proxy/${tableId}?${uuidv4()}.x=eq.1`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(res.statusCode).toBe(400);
        expect(pollyRequests()).toHaveLength(0);
      });
    });

    describe('plugin context | environment_id', () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('carries the resolved environment into context.app.environment_id for a tooljetdb query', async function () {
        const { application, dataQuery, appEnvironments } = await createAppWithDependencies(app, adminUser, {
          dsKind: 'tooljetdb',
        });
        // 'staging' rather than the default 'production': asserting against the org's default
        // environment can't tell "carried the requested environment" apart from "silently fell
        // back to whatever getOptions resolves with no name given" — staging is neither the
        // default nor priority 1, so it discriminates both failure modes.
        const stagingEnv = appEnvironments.find((env) => env.name === 'staging');
        expect(stagingEnv).toBeDefined();

        const dataOperationsService = app.get(TooljetDbDataOperationsService);
        const runSpy = jest.spyOn(dataOperationsService, 'run').mockResolvedValue({ status: 'ok', data: [] } as any);

        const eeUtilService = app.get(EEDataQueriesUtilService);
        const response = { cookie: jest.fn(), setHeader: jest.fn() } as any;

        await eeUtilService.runQuery(adminUser, dataQuery, {}, response, stagingEnv.id, 'edit', application as any);

        expect(runSpy).toHaveBeenCalled();
        const context = runSpy.mock.calls[0][4];
        expect(context.app.environment_id).toBe(stagingEnv.id);
      });
    });

    describe('list_rows | resolves in the requested environment', () => {
      it('should return production rows, not development rows, when production is named', async function () {
        expect(tooljetDbAvailable).toBe(true);

        const appEnvironments = await ensureAppEnvironments(app, adminOrgId);
        const productionEnv = appEnvironments.find((env) => env.name === 'production');
        expect(productionEnv).toBeDefined();

        const defaultManager = getDefaultDataSource().manager;
        // createTable (in beforeAll) only ever mints the development relation — production has
        // none yet, so it's seeded directly here.
        const devRelation = await defaultManager.findOne(InternalTableRelation, {
          where: { internalTableId: tableId },
        });
        const prodRelation = await defaultManager.save(
          defaultManager.create(InternalTableRelation, {
            id: uuidv4(),
            internalTableId: tableId,
            environmentId: productionEnv.id,
            branchId: devRelation.branchId,
          })
        );

        environmentRowsByRelationId = new Map([
          [devRelation.id, [{ id: 101, name: 'DevOnlyRow' }]],
          [prodRelation.id, [{ id: 102, name: 'ProdOnlyRow' }]],
        ]);

        const dataOperationsService = app.get(TooljetDbDataOperationsService);
        const result = await dataOperationsService.listRows(
          { id: 'q1', table_id: tableId, list_rows: {} },
          { app: { organization_id: adminOrgId, environment_id: productionEnv.id } }
        );

        expect(result.status).toBe('ok');
        const rows = result.data as any[];
        expect(rows.find((row) => row.id === 102)).toBeDefined();
        expect(rows.find((row) => row.id === 101)).toBeUndefined();
      });
    });

    // -------------------------------------------------------------------------
    // bulk_update_with_primary_key and bulk_upsert_with_primary_key write rows - unlike list_rows
    // above, they run real SQL through the tooljetDb-connection EntityManager (not a mocked
    // PostgREST call and not a second, genuinely separate connection like sql_execution/
    // join_tables below), so they stay visible inside this spec file's ordinary suite transaction
    // and don't need withRealTransactions or a dedicated tenant role. Placed before the
    // sql_execution/join_tables block deliberately: that block's withRealTransactions rebuilds the
    // suite transaction from scratch on exit, which leaves the ordinary beforeEach/afterEach
    // per-test SAVEPOINT machinery pointed at a savepoint name that no longer exists in the new
    // transaction - a pre-existing test-harness ordering hazard, not this task's to fix.
    // -------------------------------------------------------------------------
    describe('bulk_update_with_primary_key & bulk_upsert_with_primary_key | resolve in the requested environment', () => {
      let bulkTableId: string;
      let productionEnv: { id: string };
      let devRelation: InternalTableRelation;
      let prodRelation: InternalTableRelation;
      const workspaceSchema = () => `workspace_${adminOrgId}`;

      beforeAll(async () => {
        expect(tooljetDbAvailable).toBe(true);

        const tableName = `test_bulk_env_${Date.now()}`;
        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload(tableName));
        expect([200, 201]).toContain(res.statusCode);
        bulkTableId = res.body?.result?.id;
        expect(bulkTableId).toBeDefined();

        const appEnvironments = await ensureAppEnvironments(app, adminOrgId);
        productionEnv = appEnvironments.find((env) => env.name === 'production');
        expect(productionEnv).toBeDefined();

        const defaultManager = getDefaultDataSource().manager;
        // createTable only ever mints the development relation - production has none yet.
        devRelation = await defaultManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: bulkTableId },
        });
        prodRelation = await defaultManager.save(
          defaultManager.create(InternalTableRelation, {
            id: uuidv4(),
            internalTableId: bulkTableId,
            environmentId: productionEnv.id,
            branchId: devRelation.branchId,
          })
        );

        // Production's physical table carries an extra column development's table never had -
        // lets the agreement test below prove which relation a shape read actually landed on
        // without reaching into view_table's internals.
        await getTooljetDbDataSource().query(
          `CREATE TABLE "${workspaceSchema()}"."${prodRelation.id}" ` +
            `(id integer primary key, name varchar, email varchar, prod_only_marker varchar)`
        );
      });

      it('bulk_upsert_with_primary_key with production named lands rows in production, not development', async function () {
        expect(tooljetDbAvailable).toBe(true);

        const bulkUploadService = app.get(TooljetDbBulkUploadService);
        const result = await bulkUploadService.bulkUpsertRowsWithPrimaryKey(
          [{ id: 9001, name: 'ProdUpsertRow' }],
          bulkTableId,
          ['id'],
          adminOrgId,
          productionEnv.id
        );

        expect(result.status).toBe('ok');

        const tjds = getTooljetDbDataSource();
        const prodRows = await tjds.query(`SELECT * FROM "${workspaceSchema()}"."${prodRelation.id}" WHERE id = 9001`);
        expect(prodRows.length).toBe(1);

        const devRows = await tjds.query(`SELECT * FROM "${workspaceSchema()}"."${devRelation.id}" WHERE id = 9001`);
        expect(devRows.length).toBe(0);
      });

      it('bulkUpsertRowsWithPrimaryKey resolves its write target and its shape read to the same relation', async function () {
        expect(tooljetDbAvailable).toBe(true);

        const tableOperationsService = app.get(TooljetDbTableOperationsService);

        const { relation: writeRelation } = await tableOperationsService.resolveTableById(
          adminOrgId,
          bulkTableId,
          productionEnv.id,
          getDefaultDataSource().manager
        );
        expect(writeRelation.id).toBe(prodRelation.id);

        const viewResult = await tableOperationsService.perform(
          adminOrgId,
          'view_table',
          { id: bulkTableId },
          productionEnv.id
        );
        // prod_only_marker exists only on production's physical table - its presence here proves
        // view_table resolved the SAME relation id the write target above resolved to, not
        // development's, which is what bulkUpsertRowsWithPrimaryKey's :458/:470 pair depends on.
        expect(viewResult.columns.some((column: any) => column.column_name === 'prod_only_marker')).toBe(true);
      });
    });

    // -------------------------------------------------------------------------
    // sql_execution and join_tables never go through PostgrestProxyService - each resolves
    // relation names through its own path (resolveTable / relationResolverService.resolve), so
    // they need their own environment-resolution coverage. Unlike the Polly-mocked tests above,
    // both open a *second*, genuinely separate Postgres connection to run the query
    // (createTooljetDatabaseConnection) - it cannot see anything still sitting inside this spec
    // file's uncommitted suite transaction. Each test below runs inside withRealTransactions to
    // get real, committed rows, and builds its own workspace from scratch rather than reusing
    // adminOrgId/tableId - withRealTransactions rolls the suite transaction all the way back
    // first, which would take the outer beforeAll's fixtures with it.
    // -------------------------------------------------------------------------
    describe('sql_execution & join_tables | resolve in the requested environment', () => {
      async function setUpWorkspace() {
        const email = `tjdb-env-${uuidv4()}@tooljet.io`;
        const { user } = await createUser(app, {
          email,
          firstName: 'Env',
          lastName: 'Test',
          groups: ['admin', 'end-user'],
        });
        const organizationId = user.defaultOrganizationId;
        const appEnvironments = await ensureAppEnvironments(app, organizationId);
        const productionEnv = appEnvironments.find((env) => env.name === 'production');
        expect(productionEnv).toBeDefined();

        // join_tables/sql_execution each open their own real connection using a per-workspace
        // tenant role whose default search_path is the workspace schema - createUser() (unlike
        // the real signup flow) never provisions one. .from(relationId, alias) names the physical
        // table unqualified, relying on that search_path to find it, so a real tenant role is load
        // -bearing here, not just a schema config row.
        const defaultManager = getDefaultDataSource().manager;
        await app
          .get(TooljetDbTableOperationsService)
          .createTooljetDbTenantSchemaAndRole(organizationId, defaultManager);

        const { tokenCookie } = await login(app, email);
        return { organizationId, cookie: tokenCookie, productionEnv };
      }

      // createTooljetDbTenantSchemaAndRole provisions a cluster-level Postgres role + schema -
      // withRealTransactions only rolls back this suite's transaction, it never reclaims those.
      // Every test that calls setUpWorkspace must drop them here, or CI leaks a role+schema per run.
      async function cleanupWorkspace(organizationId: string) {
        try {
          await app.get(TooljetDbTableOperationsService).deleteTooljetDbTenantSchemaAndRole(organizationId);
        } catch {
          // best-effort - a failed setup earlier in the test shouldn't mask the real failure
        }
      }

      async function createTestTable(organizationId: string, cookie: string[], tableName: string): Promise<string> {
        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${organizationId}/table`)
          .set('Cookie', cookie)
          .set('tj-workspace-id', organizationId)
          .send(buildCreateTablePayload(tableName));

        expect([200, 201]).toContain(res.statusCode);
        const internalTableId = res.body?.result?.id;
        expect(internalTableId).toBeDefined();
        return internalTableId;
      }

      // A promoted relation is otherwise just a metadata row - mint a real physical table behind
      // it (mirroring what create_table does for development), since sql_execution/join_tables
      // run real SQL against it.
      async function promoteToProduction(
        organizationId: string,
        productionEnv: { id: string },
        internalTableId: string,
        prodRowName: string
      ) {
        const tjds = getTooljetDbDataSource();
        const schema = `workspace_${organizationId}`;
        const defaultManager = getDefaultDataSource().manager;

        const devRelation = await defaultManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId },
        });
        const prodRelation = await defaultManager.save(
          defaultManager.create(InternalTableRelation, {
            id: uuidv4(),
            internalTableId,
            environmentId: productionEnv.id,
            branchId: devRelation.branchId,
          })
        );

        await tjds.query(`CREATE TABLE "${schema}"."${prodRelation.id}" (id integer primary key, name varchar)`);
        await tjds.query(`INSERT INTO "${schema}"."${prodRelation.id}" (id, name) VALUES (1, $1)`, [prodRowName]);
        // The development relation's table already exists (create_table minted it) - seed it with
        // a row that must never surface once production is what's named.
        await tjds.query(`INSERT INTO "${schema}"."${devRelation.id}" (id, name) VALUES (1, $1)`, [
          `dev-${prodRowName}`,
        ]);

        return { devRelation, prodRelation };
      }

      it('sql_execution should read production rows, not development rows, when production is named', async function () {
        expect(tooljetDbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpWorkspace();
            organizationId = workspace.organizationId;
            const { cookie, productionEnv } = workspace;
            const tableName = `test_sql_exec_${Date.now()}`;
            const internalTableId = await createTestTable(organizationId, cookie, tableName);
            await promoteToProduction(organizationId, productionEnv, internalTableId, 'ProdSqlRow');

            const dataOperationsService = app.get(TooljetDbDataOperationsService);
            const result = await dataOperationsService.sqlExecution(
              { sql_execution: { sqlQuery: `select * from ${tableName}` } },
              { app: { organization_id: organizationId, environment_id: productionEnv.id } }
            );

            expect(result.status).toBe('ok');
            const names = (result.data as any).results.map((row: any) => row.name);
            expect(names).toContain('ProdSqlRow');
            expect(names).not.toContain('dev-ProdSqlRow');
          });
        } finally {
          if (organizationId) await cleanupWorkspace(organizationId);
        }
      });

      it('join_tables should join production relations, not development relations, when production is named', async function () {
        expect(tooljetDbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpWorkspace();
            organizationId = workspace.organizationId;
            const { cookie, productionEnv } = workspace;
            const tableAName = `test_join_env_a_${Date.now()}`;
            const tableBName = `test_join_env_b_${Date.now()}`;
            const tableAId = await createTestTable(organizationId, cookie, tableAName);
            const tableBId = await createTestTable(organizationId, cookie, tableBName);
            await promoteToProduction(organizationId, productionEnv, tableAId, 'ProdJoinA');
            await promoteToProduction(organizationId, productionEnv, tableBId, 'ProdJoinB');

            const dataOperationsService = app.get(TooljetDbDataOperationsService);
            const result = await dataOperationsService.joinTables(
              {
                join_table: {
                  from: { name: tableAId, type: 'Table' },
                  fields: [
                    { name: 'name', table: tableAId },
                    { name: 'name', table: tableBId },
                  ],
                  joins: [
                    {
                      joinType: 'INNER',
                      table: tableBId,
                      conditions: {
                        operator: 'AND',
                        conditionsList: [
                          {
                            operator: '=',
                            leftField: { type: 'Column', table: tableAId, columnName: 'id' },
                            rightField: { type: 'Column', table: tableBId, columnName: 'id' },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              { app: { organization_id: organizationId, environment_id: productionEnv.id } }
            );

            expect(result.status).toBe('ok');
            const rows = (result.data as any).result;
            const aliasA = `${tableAName}_name`;
            const aliasB = `${tableBName}_name`;
            expect(rows.some((row: any) => row[aliasA] === 'ProdJoinA' && row[aliasB] === 'ProdJoinB')).toBe(true);
            expect(rows.some((row: any) => row[aliasA] === `dev-ProdJoinA`)).toBe(false);
          });
        } finally {
          if (organizationId) await cleanupWorkspace(organizationId);
        }
      });

      it('join_tables should 404 when one of the joined tables has no relation in production', async function () {
        expect(tooljetDbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpWorkspace();
            organizationId = workspace.organizationId;
            const { cookie, productionEnv } = workspace;
            const tableAName = `test_join_404_a_${Date.now()}`;
            const tableBName = `test_join_404_b_${Date.now()}`;
            const tableAId = await createTestTable(organizationId, cookie, tableAName);
            const tableBId = await createTestTable(organizationId, cookie, tableBName);
            // tableAId is promoted; tableBId is deliberately left development-only.
            await promoteToProduction(organizationId, productionEnv, tableAId, 'ProdJoin404A');

            const dataOperationsService = app.get(TooljetDbDataOperationsService);

            await expect(
              dataOperationsService.joinTables(
                {
                  join_table: {
                    from: { name: tableAId, type: 'Table' },
                    fields: [{ name: 'name', table: tableAId }],
                    joins: [
                      {
                        joinType: 'INNER',
                        table: tableBId,
                        conditions: {
                          operator: 'AND',
                          conditionsList: [
                            {
                              operator: '=',
                              leftField: { type: 'Column', table: tableAId, columnName: 'id' },
                              rightField: { type: 'Column', table: tableBId, columnName: 'id' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                { app: { organization_id: organizationId, environment_id: productionEnv.id } }
              )
            ).rejects.toThrow(NotFoundException);
          });
        } finally {
          if (organizationId) await cleanupWorkspace(organizationId);
        }
      });
    });
  });
});
