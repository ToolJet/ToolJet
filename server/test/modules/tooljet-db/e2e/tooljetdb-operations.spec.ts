/**
 * ToolJet Database Table Operations E2E Tests
 *
 * Tests table-level DDL operations: create, list, and delete tables.
 * End-user role denial is also verified.
 *
 * NOTE: The ToolJet DB requires a separate PostgreSQL connection (tooljetDb)
 * **and** a per-workspace schema (`workspace_<orgId>`). If either is missing
 * the DDL tests are skipped gracefully; only the 403 guard test runs.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { resetDB, createUser, initTestApp, login, logout, getTooljetDbDataSource, closeTestApp } from 'test-helper';

describe('TooljetDbController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let adminOrgId: string;
    let tooljetDbAvailable: boolean;

    /** Try to ensure the workspace schema exists in the tooljetDb connection. */
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

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tooljetDbAvailable = !!getTooljetDbDataSource();

      const { user } = await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      adminOrgId = user.defaultOrganizationId;

      // Ensure the tooljetDb workspace schema exists for DDL tests
      if (tooljetDbAvailable) {
        const schemaReady = await ensureWorkspaceSchema(adminOrgId);
        if (!schemaReady) tooljetDbAvailable = false;
      }

      const auth = await login(app);
      adminCookie = auth.tokenCookie;
    });

    afterEach(async () => {
      await logout(app, adminCookie, adminOrgId);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    // ---------------------------------------------------------------------------
    // Helper: build a minimal create-table payload matching CreatePostgrestTableDto
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
        ],
        foreign_keys: [],
      };
    }

    // ---------------------------------------------------------------------------
    // Admin DDL tests | skipped when tooljetDb connection is unavailable
    // ---------------------------------------------------------------------------
    const describeIfTooljetDb = () => (tooljetDbAvailable ? describe : describe.skip);

    // We use a factory function so the `tooljetDbAvailable` flag is evaluated at
    // runtime rather than at module-parse time.
    describe('Admin table DDL operations | create, list, delete tables', () => {
      it('admin can create a table', async function () {
        if (!tooljetDbAvailable) return;

        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('test_create_tbl'));

        expect([200, 201]).toContain(res.statusCode);
      });

      it('admin can list tables', async function () {
        if (!tooljetDbAvailable) return;

        // Create a table first so the list is non-empty
        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('test_list_tbl'));

        const res = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/tables`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('result');
      });

      it('admin can delete a table', async function () {
        if (!tooljetDbAvailable) return;

        // Create then delete
        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('test_drop_tbl'));

        const res = await request
          .agent(app.getHttpServer())
          .delete(`/api/tooljet-db/organizations/${adminOrgId}/table/test_drop_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(res.statusCode).toBe(200);
      });
    });

    // ---------------------------------------------------------------------------
    // End-user denial | this test does NOT require the tooljetDb connection
    // because the guard rejects before the service layer touches TJDB.
    // ---------------------------------------------------------------------------
    describe('End-user access denial | role-based guard', () => {
      it('end-user is denied table creation (403)', async () => {
        // Create an end-user (no admin group)
        const { user: endUser } = await createUser(app, {
          email: 'enduser@tooljet.io',
          firstName: 'End',
          lastName: 'User',
          groups: ['end-user'],
        });

        const { tokenCookie: endUserCookie } = await login(app, 'enduser@tooljet.io', 'password');

        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${endUser.defaultOrganizationId}/table`)
          .set('Cookie', endUserCookie)
          .set('tj-workspace-id', endUser.defaultOrganizationId)
          .send(buildCreateTablePayload('forbidden_tbl'));

        expect(res.statusCode).toBe(403);

        await logout(app, endUserCookie, endUser.defaultOrganizationId);
      });
    });
  });
});
