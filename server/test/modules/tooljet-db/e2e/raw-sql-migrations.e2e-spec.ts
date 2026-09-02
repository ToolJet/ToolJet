/**
 * Task B5: acceptance spec for DEV-91's "Done when" bar, end to end - one file covering every case
 * rather than scattering them across the per-task specs (tjdb-raw-sql-migration.spec.ts /
 * tjdb-revert-migration.spec.ts / tjdb-promote.spec.ts / tooljetdb-migration-replay.spec.ts), which
 * this suite borrows its setup/cleanup conventions from.
 *
 * Same isolation model as tjdb-raw-sql-migration.spec.ts: every test opens its own real, separate
 * Postgres connection as the tenant role (createTooljetDatabaseConnection), so it cannot see
 * anything still sitting inside this spec file's uncommitted suite transaction. Each test runs
 * inside withRealTransactions to get real, committed role/schema/config rows, and builds its own
 * workspace(s) from scratch.
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
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
// EE token: getProviders() registers the edition-resolved class as the DI token, same reason
// tooljetdb-migration-replay.spec.ts imports it from @ee rather than @modules.
import { TooljetDbTableOperationsService } from '@ee/tooljet-db/services/tooljet-db-table-operations.service';

describe('TooljetDb raw SQL migrations and revert - acceptance (DEV-91)', () => {
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

    async function setUpWorkspace() {
      const email = `raw-sql-acceptance-${uuidv4()}@tooljet.io`;
      const { user } = await createUser(app, {
        email,
        firstName: 'RawSqlAcceptance',
        lastName: 'Test',
        groups: ['admin', 'end-user'],
      });
      const organizationId = user.defaultOrganizationId;
      const tenantSchema = `workspace_${organizationId}`;
      const environments = await ensureAppEnvironments(app, organizationId);

      // Real provisioning, not just the schema: recordRawSqlMigration opens its own connection as
      // the tenant role, which needs a real login role and a matching OrganizationTjdbConfigurations
      // row - createUser() (unlike the real signup flow) never provisions either.
      await app
        .get(TooljetDbTableOperationsService)
        .createTooljetDbTenantSchemaAndRole(organizationId, getDefaultDataSource().manager);

      const { tokenCookie } = await login(app, email);
      return { organizationId, tenantSchema, cookie: tokenCookie, environments };
    }

    // createTooljetDbTenantSchemaAndRole provisions a cluster-level Postgres role + schema -
    // withRealTransactions only rolls back this suite's transaction, it never reclaims those.
    async function cleanupWorkspace(organizationId: string) {
      try {
        await app.get(TooljetDbTableOperationsService).deleteTooljetDbTenantSchemaAndRole(organizationId);
      } catch {
        // best-effort - a failed setup earlier in the test shouldn't mask the real failure
      }
    }

    function headers(organizationId: string, cookie: string[]) {
      return { Cookie: cookie, 'tj-workspace-id': organizationId };
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
    }

    async function addColumn(organizationId: string, cookie: string[], tableName: string, columnName: string) {
      const res = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table/${tableName}/column`)
        .set(headers(organizationId, cookie))
        .send({
          column: {
            column_name: columnName,
            data_type: 'character varying',
            constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
          },
        });
      expect([200, 201]).toContain(res.statusCode);
    }

    async function tableAndRelation(organizationId: string, tableName: string) {
      const manager = getDefaultDataSource().manager;
      const internalTable = await manager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName },
      });
      const relation = await manager.findOneOrFail(InternalTableRelation, {
        where: { internalTableId: internalTable.id },
      });
      return { internalTable, relation };
    }

    function runRawSql(
      organizationId: string,
      cookie: string[],
      tableId: string,
      body: { sql: string; refs?: Record<string, string> }
    ) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table/${tableId}/migrations/sql`)
        .set(headers(organizationId, cookie))
        .send({ refs: {}, ...body });
    }

    function revertMigration(
      organizationId: string,
      cookie: string[],
      tableId: string,
      migrationId: string,
      body: { sql: string; refs?: Record<string, string>; confirmed?: boolean }
    ) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table/${tableId}/migrations/${migrationId}/revert`)
        .set(headers(organizationId, cookie))
        .send({ refs: {}, ...body });
    }

    function promote(organizationId: string, cookie: string[], tableId: string, environmentId: string) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table/${tableId}/promote`)
        .set(headers(organizationId, cookie))
        .send({ environment_id: environmentId });
    }

    // Case 6: any table B0 creates is owned by the workspace's own tenant role, not the TJDB admin.
    async function expectOwnedByTenant(tenantSchema: string, relationId: string, organizationId: string) {
      const [row] = await getTooljetDbDataSource().query(
        `SELECT tableowner FROM pg_tables WHERE schemaname = $1 AND tablename = $2`,
        [tenantSchema, relationId]
      );
      expect(row).toBeTruthy();
      expect(row.tableowner).toBe(`user_${organizationId}`);
    }

    it("runs a raw SQL step as the tenant role - a different workspace's schema stays unreachable with a Postgres permission error", async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      let otherOrganizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const other = await setUpWorkspace();
          otherOrganizationId = other.organizationId;
          await createTable(otherOrganizationId, other.cookie, 'cross_ws_target_tbl');
          const { relation: otherRelation } = await tableAndRelation(otherOrganizationId, 'cross_ws_target_tbl');

          const workspace = await setUpWorkspace();
          organizationId = workspace.organizationId;
          const { cookie } = workspace;
          await createTable(organizationId, cookie, 'cross_ws_caller_tbl');
          const { internalTable } = await tableAndRelation(organizationId, 'cross_ws_caller_tbl');

          // Positive control: the same connection can read its own schema fine - isolates the
          // failure below to the other workspace's schema specifically, not some blanket breakage
          // of the tenant role's own privileges.
          const ownSchemaRes = await runRawSql(organizationId, cookie, internalTable.id, {
            sql: `SELECT * FROM "{{self}}"`,
          });
          expect([200, 201]).toContain(ownSchemaRes.statusCode);

          const res = await runRawSql(organizationId, cookie, internalTable.id, {
            sql: `SELECT * FROM "${other.tenantSchema}"."${otherRelation.id}"`,
          });
          // 422: AllExceptionsFilter's QueryFailedError branch, carrying the raw Postgres error
          // message through unmodified - a Postgres permission error, not an application-level
          // rejection, and naming the *other* workspace's schema specifically.
          expect(res.statusCode).toBe(422);
          expect(res.body.message).toMatch(new RegExp(`permission denied for schema ${other.tenantSchema}`, 'i'));
        });
      } finally {
        if (organizationId) await cleanupWorkspace(organizationId);
        if (otherOrganizationId) await cleanupWorkspace(otherOrganizationId);
      }
    });

    it('runs a DDL type conversion against a table B0 transferred ownership of, and that table is owned by the tenant role', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpWorkspace();
          organizationId = workspace.organizationId;
          const { tenantSchema, cookie } = workspace;

          await createTable(organizationId, cookie, 'ddl_owned_tbl');
          const { internalTable, relation } = await tableAndRelation(organizationId, 'ddl_owned_tbl');

          // Case 6, folded in here: the physical table B0's create-table path just created is owned
          // by the tenant role, verified via pg_tables.
          await expectOwnedByTenant(tenantSchema, relation.id, organizationId);

          const res = await runRawSql(organizationId, cookie, internalTable.id, {
            sql: `ALTER TABLE "{{self}}" ALTER COLUMN gpa TYPE numeric USING gpa::numeric`,
          });
          expect([200, 201]).toContain(res.statusCode);

          const [column] = await getTooljetDbDataSource().query(
            `SELECT data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = 'gpa'`,
            [tenantSchema, relation.id]
          );
          expect(column.data_type).toBe('numeric');
        });
      } finally {
        if (organizationId) await cleanupWorkspace(organizationId);
      }
    });

    it('reconciles column metadata after a raw SQL step adds a column - new uuid minted, existing uuids unchanged', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpWorkspace();
          organizationId = workspace.organizationId;
          const { cookie } = workspace;

          await createTable(organizationId, cookie, 'reconcile_tbl');
          const { internalTable, relation } = await tableAndRelation(organizationId, 'reconcile_tbl');
          const priorIdUuid = relation.configurations.columns.column_names['id'];
          const priorGpaUuid = relation.configurations.columns.column_names['gpa'];

          const res = await runRawSql(organizationId, cookie, internalTable.id, {
            sql: `ALTER TABLE "{{self}}" ADD COLUMN note character varying`,
          });
          expect([200, 201]).toContain(res.statusCode);

          const manager = getDefaultDataSource().manager;
          const updatedRelation = await manager.findOneOrFail(InternalTableRelation, { where: { id: relation.id } });
          const columnNames = updatedRelation.configurations.columns.column_names;
          expect(columnNames['id']).toBe(priorIdUuid);
          expect(columnNames['gpa']).toBe(priorGpaUuid);
          expect(columnNames['note']).toBeTruthy();
          expect(columnNames['note']).not.toBe(priorIdUuid);
          expect(columnNames['note']).not.toBe(priorGpaUuid);
        });
      } finally {
        if (organizationId) await cleanupWorkspace(organizationId);
      }
    });

    it('requires confirmed:true to revert an add_column migration, with the exact warning text, and succeeds once confirmed', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpWorkspace();
          organizationId = workspace.organizationId;
          const { cookie, tenantSchema } = workspace;

          await createTable(organizationId, cookie, 'revert_confirm_acceptance_tbl');
          await addColumn(organizationId, cookie, 'revert_confirm_acceptance_tbl', 'note');
          const { internalTable, relation } = await tableAndRelation(organizationId, 'revert_confirm_acceptance_tbl');
          const addColumnMigration = await getDefaultDataSource().manager.findOneOrFail(InternalTableMigration, {
            where: { internalTableId: internalTable.id, kind: 'structured' as any },
            order: { sequence: 'DESC' },
          });
          expect((addColumnMigration.payload as any).action).toBe('add_column');

          const revertSql = { sql: 'ALTER TABLE "{{self}}" DROP COLUMN note' };

          const withoutConfirm = await revertMigration(
            organizationId,
            cookie,
            internalTable.id,
            addColumnMigration.id,
            revertSql
          );
          expect(withoutConfirm.statusCode).toBe(400);
          expect(withoutConfirm.body.message).toContain(
            'Reverting this migration will drop column "note" and permanently delete its data'
          );

          const withConfirm = await revertMigration(organizationId, cookie, internalTable.id, addColumnMigration.id, {
            ...revertSql,
            confirmed: true,
          });
          expect([200, 201]).toContain(withConfirm.statusCode);

          const [column] = await getTooljetDbDataSource().query(
            `SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = 'note'`,
            [tenantSchema, relation.id]
          );
          expect(column).toBeUndefined();
        });
      } finally {
        if (organizationId) await cleanupWorkspace(organizationId);
      }
    });

    it('appends a revert as a new migration chained via reverts_migration_id, and it promotes forward like any other migration', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpWorkspace();
          organizationId = workspace.organizationId;
          const { cookie, tenantSchema, environments } = workspace;
          const devEnvId = environments.find((e) => e.priority === 1).id;
          const stagingEnvId = environments.find((e) => e.priority === 2).id;

          await createTable(organizationId, cookie, 'revert_promote_tbl');
          await addColumn(organizationId, cookie, 'revert_promote_tbl', 'note');
          const { internalTable } = await tableAndRelation(organizationId, 'revert_promote_tbl');
          const manager = getDefaultDataSource().manager;

          // Promote create_table + add_column to staging first - a raw SQL migration always replays
          // against a relation whose earlier structured DDL already committed in a prior promote,
          // mirroring how promoteTable only ever promotes the missing set since the last promote.
          const firstPromote = await promote(organizationId, cookie, internalTable.id, devEnvId);
          expect([200, 201]).toContain(firstPromote.statusCode);
          const stagingRelationBefore = await manager.findOneOrFail(InternalTableRelation, {
            where: { internalTableId: internalTable.id, environmentId: stagingEnvId },
          });
          const [beforeColumn] = await getTooljetDbDataSource().query(
            `SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = 'note'`,
            [tenantSchema, stagingRelationBefore.id]
          );
          expect(beforeColumn).toBeTruthy();

          const addColumnMigration = await manager.findOneOrFail(InternalTableMigration, {
            where: { internalTableId: internalTable.id, kind: 'structured' as any },
            order: { sequence: 'DESC' },
          });

          const revertRes = await revertMigration(organizationId, cookie, internalTable.id, addColumnMigration.id, {
            sql: 'ALTER TABLE "{{self}}" DROP COLUMN note',
            confirmed: true,
          });
          expect([200, 201]).toContain(revertRes.statusCode);

          const revertMigrationRow = await manager.findOneOrFail(InternalTableMigration, {
            where: { internalTableId: internalTable.id, kind: 'raw_sql' as any },
          });
          expect(revertMigrationRow.revertsMigrationId).toBe(addColumnMigration.id);

          // Second promote replays the appended revert migration through Task B2's replay path.
          const secondPromote = await promote(organizationId, cookie, internalTable.id, devEnvId);
          expect([200, 201]).toContain(secondPromote.statusCode);
          expect(secondPromote.body.result).toMatchObject({ applied_migrations: 1 });

          // Assert on the target environment's actual physical state, not just the chain's row count.
          const stagingRelationAfter = await manager.findOneOrFail(InternalTableRelation, {
            where: { internalTableId: internalTable.id, environmentId: stagingEnvId },
          });
          const [afterColumn] = await getTooljetDbDataSource().query(
            `SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = 'note'`,
            [tenantSchema, stagingRelationAfter.id]
          );
          expect(afterColumn).toBeUndefined();
          const [idColumn] = await getTooljetDbDataSource().query(
            `SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = 'id'`,
            [tenantSchema, stagingRelationAfter.id]
          );
          expect(idColumn).toBeTruthy();
        });
      } finally {
        if (organizationId) await cleanupWorkspace(organizationId);
      }
    });
  });
});
