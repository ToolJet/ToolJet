/**
 * Task B3: revert. `POST .../table/:tableId/migrations/:migrationId/revert` is a thin wrapper over
 * Task B1's raw SQL step creation - the target id comes from the URL (never the body), and an
 * `add_column` target requires `confirmed: true` since undoing it drops the column and its data.
 *
 * Same isolation model as tjdb-raw-sql-migration.spec.ts: every test opens its own real, separate
 * Postgres connection as the tenant role, so it runs inside withRealTransactions and builds its own
 * workspace from scratch.
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
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { buildTableSchemaSnapshot } from '@modules/tooljet-db/helpers/table-schema-snapshot';
// EE token: getProviders() registers the edition-resolved class as the DI token, same reason
// tooljetdb-migration-replay.spec.ts imports it from @ee rather than @modules.
import { TooljetDbTableOperationsService } from '@ee/tooljet-db/services/tooljet-db-table-operations.service';

describe('TooljetDb revert migration', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let tjdbAvailable: boolean;
    let tableOperationsService: TooljetDbTableOperationsService;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tjdbAvailable = !!getTooljetDbDataSource();
      tableOperationsService = app.get(TooljetDbTableOperationsService);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    async function setUpWorkspace() {
      const email = `revert-${uuidv4()}@tooljet.io`;
      const { user } = await createUser(app, {
        email,
        firstName: 'Revert',
        lastName: 'Test',
        groups: ['admin', 'end-user'],
      });
      const organizationId = user.defaultOrganizationId;
      const tenantSchema = `workspace_${organizationId}`;
      const environments = await ensureAppEnvironments(app, organizationId);
      const branch = await getDefaultDataSource().manager.findOneOrFail(WorkspaceBranch, {
        where: { organizationId, isDefault: true },
      });

      // Real provisioning, not just the schema: recordRawSqlMigration (which revert delegates to)
      // opens its own connection as the tenant role - createUser() never provisions that.
      await app
        .get(TooljetDbTableOperationsService)
        .createTooljetDbTenantSchemaAndRole(organizationId, getDefaultDataSource().manager);

      const { tokenCookie } = await login(app, email);
      return { organizationId, tenantSchema, cookie: tokenCookie, environments, branchId: branch.id };
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

    async function internalTableFor(organizationId: string, tableName: string) {
      return getDefaultDataSource().manager.findOneOrFail(InternalTable, { where: { organizationId, tableName } });
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

    it('404s when the migration belongs to a different table', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpWorkspace();
          organizationId = workspace.organizationId;
          const { cookie } = workspace;

          await createTable(organizationId, cookie, 'revert_404_a');
          await createTable(organizationId, cookie, 'revert_404_b');
          const tableA = await internalTableFor(organizationId, 'revert_404_a');
          const tableB = await internalTableFor(organizationId, 'revert_404_b');

          const migrationA = await getDefaultDataSource().manager.findOneOrFail(InternalTableMigration, {
            where: { internalTableId: tableA.id },
          });

          const res = await revertMigration(organizationId, cookie, tableB.id, migrationA.id, {
            sql: 'SELECT 1',
          });
          expect(res.statusCode).toBe(404);
        });
      } finally {
        if (organizationId) await cleanupWorkspace(organizationId);
      }
    });

    it("404s (without leaking the destructive-column warning) when tableId belongs to a different organization than the caller's own", async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      let otherOrganizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          // Table + destructive migration live in a different org than the one making the call.
          const otherWorkspace = await setUpWorkspace();
          otherOrganizationId = otherWorkspace.organizationId;
          await createTable(otherOrganizationId, otherWorkspace.cookie, 'revert_org_scope_tbl');
          await addColumn(otherOrganizationId, otherWorkspace.cookie, 'revert_org_scope_tbl', 'note');
          const foreignTable = await internalTableFor(otherOrganizationId, 'revert_org_scope_tbl');
          const foreignAddColumnMigration = await getDefaultDataSource().manager.findOneOrFail(InternalTableMigration, {
            where: { internalTableId: foreignTable.id, kind: 'structured' as any },
            order: { sequence: 'DESC' },
          });

          const workspace = await setUpWorkspace();
          organizationId = workspace.organizationId;
          const { cookie } = workspace;

          // organizationId in the URL matches the caller's own session throughout - only tableId
          // points at another org's table. Must 404 before ever deciding whether the target is
          // destructive, not leak the column name it would drop.
          const res = await revertMigration(organizationId, cookie, foreignTable.id, foreignAddColumnMigration.id, {
            sql: 'ALTER TABLE "{{self}}" DROP COLUMN note',
          });
          expect(res.statusCode).toBe(404);
          expect(JSON.stringify(res.body)).not.toContain('note');
        });
      } finally {
        if (organizationId) await cleanupWorkspace(organizationId);
        if (otherOrganizationId) await cleanupWorkspace(otherOrganizationId);
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

          await createTable(organizationId, cookie, 'revert_confirm_tbl');
          await addColumn(organizationId, cookie, 'revert_confirm_tbl', 'note');
          const internalTable = await internalTableFor(organizationId, 'revert_confirm_tbl');
          const addColumnMigration = await getDefaultDataSource().manager.findOneOrFail(InternalTableMigration, {
            where: { internalTableId: internalTable.id, kind: 'structured' as any },
            order: { sequence: 'DESC' },
          });
          expect((addColumnMigration.payload as any).action).toBe('add_column');

          const relation = await getDefaultDataSource().manager.findOneOrFail(InternalTableRelation, {
            where: { internalTableId: internalTable.id },
          });
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

    it('does not require confirmed for a non-add_column structured migration - the discriminator is scoped, not blanket', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpWorkspace();
          organizationId = workspace.organizationId;
          const { cookie } = workspace;

          await createTable(organizationId, cookie, 'revert_nonaddcol_tbl');
          const internalTable = await internalTableFor(organizationId, 'revert_nonaddcol_tbl');
          const createTableMigration = await getDefaultDataSource().manager.findOneOrFail(InternalTableMigration, {
            where: { internalTableId: internalTable.id },
          });
          expect((createTableMigration.payload as any).action).toBe('create_table');

          const res = await revertMigration(organizationId, cookie, internalTable.id, createTableMigration.id, {
            sql: 'SELECT 1',
          });
          expect([200, 201]).toContain(res.statusCode);
        });
      } finally {
        if (organizationId) await cleanupWorkspace(organizationId);
      }
    });

    it('appends a new migration chained via reverts_migration_id, leaving the target migration untouched, and replays through promote', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpWorkspace();
          organizationId = workspace.organizationId;
          const { cookie, environments, branchId } = workspace;

          await createTable(organizationId, cookie, 'revert_chain_tbl');
          await addColumn(organizationId, cookie, 'revert_chain_tbl', 'note');
          const internalTable = await internalTableFor(organizationId, 'revert_chain_tbl');
          const manager = getDefaultDataSource().manager;

          const addColumnMigration = await manager.findOneOrFail(InternalTableMigration, {
            where: { internalTableId: internalTable.id, kind: 'structured' as any },
            order: { sequence: 'DESC' },
          });
          const chainCountBefore = await manager.count(InternalTableMigration, {
            where: { internalTableId: internalTable.id },
          });
          const targetSnapshotBefore = { ...addColumnMigration };

          const res = await revertMigration(organizationId, cookie, internalTable.id, addColumnMigration.id, {
            sql: 'ALTER TABLE "{{self}}" DROP COLUMN note',
            confirmed: true,
          });
          expect([200, 201]).toContain(res.statusCode);

          const chainCountAfter = await manager.count(InternalTableMigration, {
            where: { internalTableId: internalTable.id },
          });
          expect(chainCountAfter).toBe(chainCountBefore + 1);

          // The target migration itself is untouched - the chain only ever grows.
          const reloadedTarget = await manager.findOneOrFail(InternalTableMigration, {
            where: { id: addColumnMigration.id },
          });
          expect(reloadedTarget.payload).toEqual(targetSnapshotBefore.payload);
          expect(reloadedTarget.resultingSchema).toEqual(targetSnapshotBefore.resultingSchema);

          const revertMigrationRow = await manager.findOneOrFail(InternalTableMigration, {
            where: { internalTableId: internalTable.id, kind: 'raw_sql' as any },
          });
          expect(revertMigrationRow.revertsMigrationId).toBe(addColumnMigration.id);

          // Promote: replay into a fresh relation in another environment, through Task B2's replay
          // path - proves the appended revert migration promotes forward like any other raw SQL
          // migration, not just that its row exists. Two calls, structured migrations then the
          // revert, mirroring how TooljetDbPromoteService.promoteTable always promotes only the
          // `missingIds` since the last promote - a raw SQL migration replays against a relation
          // whose earlier structured DDL already committed in a prior promote, never in the same
          // uncommitted transaction as the physical CREATE TABLE it depends on.
          const nonDevEnvironment = environments.find((environment) => environment.priority !== 1);
          const targetRelation = await manager.save(
            manager.create(InternalTableRelation, {
              id: uuidv4(),
              internalTableId: internalTable.id,
              environmentId: nonDevEnvironment.id,
              branchId,
              configurations: null,
            })
          );
          const fullChain = (
            await manager.find(InternalTableMigration, { where: { internalTableId: internalTable.id } })
          ).sort((a, b) => Number(a.sequence) - Number(b.sequence));
          const structuredIds = fullChain.filter((m) => m.kind === 'structured').map((m) => m.id);
          const revertIds = fullChain.filter((m) => m.kind === 'raw_sql').map((m) => m.id);

          await tableOperationsService.applyMigrations(structuredIds, targetRelation);
          const relationAfterStructured = await manager.findOneOrFail(InternalTableRelation, {
            where: { id: targetRelation.id },
          });
          await tableOperationsService.applyMigrations(revertIds, relationAfterStructured);

          const reloadedTargetRelation = await manager.findOneOrFail(InternalTableRelation, {
            where: { id: targetRelation.id },
          });
          const queryRunner = getTooljetDbDataSource().createQueryRunner();
          try {
            const targetSnapshot = await buildTableSchemaSnapshot(
              queryRunner,
              `workspace_${organizationId}`,
              reloadedTargetRelation.id,
              reloadedTargetRelation.configurations.columns.column_names
            );
            expect(targetSnapshot.columns.find((c) => c.name === 'note')).toBeUndefined();
            expect(targetSnapshot.columns.find((c) => c.name === 'id')).toBeTruthy();
          } finally {
            await queryRunner.release();
          }
        });
      } finally {
        if (organizationId) await cleanupWorkspace(organizationId);
      }
    });
  });
});
