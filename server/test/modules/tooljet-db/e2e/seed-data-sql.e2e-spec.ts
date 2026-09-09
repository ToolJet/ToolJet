/**
 * Acceptance spec for the "Seed data with SQL" route: a thin wrapper around the existing
 * TooljetDbDataOperationsService.sqlExecution, reusing raw-sql-migrations.e2e-spec.ts's setup
 * conventions (real tenant Postgres role/schema, suite-level transaction).
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
  getDefaultDataSource,
  getTooljetDbDataSource,
  closeTestApp,
  ensureAppEnvironments,
  withRealTransactions,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';
// EE token: getProviders() registers the edition-resolved class as the DI token, same reason
// raw-sql-migrations.e2e-spec.ts imports it from @ee rather than @modules.
import { TooljetDbTableOperationsService } from '@ee/tooljet-db/services/tooljet-db-table-operations.service';

describe('TooljetDb seed data with SQL - POST table/:tableId/sql (DEV-83)', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let tjdbAvailable: boolean;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tjdbAvailable = !!getTooljetDbDataSource();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    function headers(organizationId: string, cookie: string[]) {
      return { Cookie: cookie, 'tj-workspace-id': organizationId };
    }

    async function setUpWorkspace(groups: string[]) {
      const email = `seed-data-sql-${uuidv4()}@tooljet.io`;
      const { user } = await createUser(app, {
        email,
        firstName: 'SeedDataSql',
        lastName: 'Test',
        groups,
      });
      const organizationId = user.defaultOrganizationId;
      const environments = await ensureAppEnvironments(app, organizationId);
      return { organizationId, cookie: (await login(app, email)).tokenCookie, environments };
    }

    async function provisionTenant(organizationId: string) {
      await app
        .get(TooljetDbTableOperationsService)
        .createTooljetDbTenantSchemaAndRole(organizationId, getDefaultDataSource().manager);
    }

    async function cleanupTenant(organizationId: string) {
      try {
        await app.get(TooljetDbTableOperationsService).deleteTooljetDbTenantSchemaAndRole(organizationId);
      } catch {
        // best-effort - a failed setup earlier in the test shouldn't mask the real failure
      }
    }

    async function createTable(organizationId: string, cookie: string[], tableName: string) {
      const res = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table`)
        .set(headers(organizationId, cookie))
        .send({
          table_name: tableName,
          columns: [
            {
              column_name: 'id',
              data_type: 'integer',
              constraints_type: { is_not_null: true, is_primary_key: true, is_unique: true },
            },
            {
              column_name: 'gpa',
              data_type: 'character varying',
              constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
            },
          ],
          foreign_keys: [],
        });
      expect([200, 201]).toContain(res.statusCode);
      const internalTable = await getDefaultDataSource().manager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName },
      });
      return internalTable.id;
    }

    // verifyTablesExistInWorkspace resolves table references in the SQL text by table_name, not
    // by id - sqlExecution expects display names in the query, the same as it does when run from
    // Query Manager.

    function runSql(
      organizationId: string,
      cookie: string[],
      tableId: string,
      body: { sql: string; environment_id: string }
    ) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table/${tableId}/sql`)
        .set(headers(organizationId, cookie))
        .send(body);
    }

    it('should insert a row and make it readable via the proxy when run by an admin', async () => {
      if (!tjdbAvailable) return;
      let organizationId: string | undefined;
      try {
        // sqlExecution authenticates to Postgres as the tenant role directly (a fresh connection,
        // not the suite's shared pool) - that role only exists once createTooljetDbTenantSchemaAndRole's
        // CREATE ROLE actually commits, so this needs a real transaction, same as
        // raw-sql-migrations.e2e-spec.ts's tenant-role tests.
        await withRealTransactions(async () => {
          const workspace = await setUpWorkspace(['admin', 'end-user']);
          organizationId = workspace.organizationId;
          const { cookie, environments } = workspace;
          await provisionTenant(organizationId);

          const tableName = `seed_sql_${uuidv4().slice(0, 8)}`;
          const tableId = await createTable(organizationId, cookie, tableName);
          // priority 1 = development (defaultAppEnvironments in utils.helper.ts) - isDefault is set
          // on production instead, and a freshly-created table only has a relation in development.
          const devEnvironment = environments.find((env) => env.priority === 1) ?? environments[0];

          const res = await runSql(organizationId, cookie, tableId, {
            sql: `INSERT INTO ${tableName} (id, gpa) VALUES (1, '3.9')`,
            environment_id: devEnvironment.id,
          });
          expect(res.statusCode).toBe(201);

          const readRes = await request
            .agent(app.getHttpServer())
            .get(`/api/tooljet-db/proxy/${tableId}`)
            .set(headers(organizationId, cookie));
          expect(readRes.statusCode).toBe(200);
          expect(readRes.body).toMatchObject([{ id: 1, gpa: '3.9' }]);
        });
      } finally {
        if (organizationId) await cleanupTenant(organizationId);
      }
    });

    it('should reject a non-builder end user with 403', async () => {
      if (!tjdbAvailable) return;
      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpWorkspace(['end-user']);
          organizationId = workspace.organizationId;
          const { cookie, environments } = workspace;
          await provisionTenant(organizationId);

          const res = await runSql(organizationId, cookie, uuidv4(), {
            sql: 'SELECT 1',
            environment_id: environments[0].id,
          });
          expect(res.statusCode).toBe(403);
        });
      } finally {
        if (organizationId) await cleanupTenant(organizationId);
      }
    });
  });
});
