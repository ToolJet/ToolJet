/**
 * Rollout migration A: the data half of the environment substrate. Every existing internal_tables
 * row gets an internal_table_relations row at the priority-1 (development) environment on the
 * org's default branch, plus a synthesized baseline recording what the physical table already
 * looks like. Only once every row has a relation does `up()` drop internal_tables.configurations
 * - the guard on that precondition is this file's main subject: no spec existed for this migration
 * at all before it, so the guard's own failure branch (destroying `configurations` from under an
 * org that never got a relation) was structurally unreachable by CI.
 *
 * Migration A has already run for real against the shared test database (schema migrations are
 * applied once via `db:migrate`, not per test) - `internal_tables.configurations` is already gone
 * and `organization_id_co_relation_id_unique` already exists. Every test below therefore opens its
 * own real QueryRunner transaction, undoes just those two schema effects for the lifetime of that
 * transaction (`resetToPreMigrationSchema`), seeds a pre-migration-shaped row through the same
 * connection, runs the migration, asserts, then rolls the whole transaction back - Postgres DDL is
 * transactional, so the rollback restores the real "already migrated" schema exactly as it was,
 * leaving nothing for any other test or spec file to trip over.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  initTestApp,
  closeTestApp,
  getDefaultDataSource,
  getTooljetDbDataSource,
  ensureAppEnvironments,
  withRealTransactions,
} from 'test-helper';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { TjdbRolloutMigrationASubstrate1787564882760 } from '../../../../data-migrations/1787564882760-TjdbRolloutMigrationASubstrate';

describe('TjdbRolloutMigrationASubstrate1787564882760', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let tooljetDbAvailable: boolean;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tooljetDbAvailable = !!getTooljetDbDataSource();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    async function priorityEnv(organizationId: string, priority: number): Promise<{ id: string }> {
      const [environment] = await getDefaultDataSource().query(
        `SELECT id FROM app_environments WHERE organization_id = $1 AND priority = $2`,
        [organizationId, priority]
      );
      return environment;
    }

    async function defaultBranchId(organizationId: string): Promise<string> {
      const branch = await getDefaultDataSource().manager.findOneOrFail(WorkspaceBranch, {
        where: { organizationId, isDefault: true },
      });
      return branch.id;
    }

    async function newWorkspace(email: string): Promise<string> {
      const { user } = await createUser(app, { email, groups: ['admin', 'end-user'] });
      const organizationId = user.defaultOrganizationId;
      await ensureAppEnvironments(app, organizationId);
      await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "workspace_${organizationId}"`);
      return organizationId;
    }

    async function cleanupWorkspace(organizationId: string): Promise<void> {
      await getTooljetDbDataSource()
        .query(`DROP SCHEMA IF EXISTS "workspace_${organizationId}" CASCADE`)
        .catch(() => undefined);
      await getDefaultDataSource()
        .query(`DELETE FROM organizations WHERE id = $1`, [organizationId])
        .catch(() => undefined);
    }

    /** Undoes exactly the two schema-level effects `up()` leaves behind, on this transaction's
     *  connection only - not a full `down()` (no rows exist yet to restore configurations from,
     *  and NOT NULL is idempotent either way). Rolling the transaction back at the end of each
     *  test restores the real, already-migrated schema. */
    async function resetToPreMigrationSchema(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`ALTER TABLE internal_tables ADD COLUMN IF NOT EXISTS configurations jsonb`);
      await queryRunner.query(
        `ALTER TABLE internal_tables DROP CONSTRAINT IF EXISTS organization_id_co_relation_id_unique`
      );
    }

    /** Reproduces migration A's INPUT state (pre-migration): a physical TJDB table with one row
     *  and an `internal_tables` row carrying `configurations` - but no relation, no baseline yet.
     *  That's migration A's job. Optionally a physical foreign key to `referencesTableId`. Inserts
     *  through `queryRunner` (not the pooled default connection) so the row is visible to the
     *  migration run sharing that same transaction. */
    async function seedPreMigrationTable(
      queryRunner: QueryRunner,
      organizationId: string,
      tableName: string,
      opts: { referencesTableId?: string; createdAt?: Date } = {}
    ): Promise<{ tableId: string; schema: string; configurations: any }> {
      const tjDs = getTooljetDbDataSource();
      const schema = `workspace_${organizationId}`;
      const tableId = uuidv4();

      const columnNames: Record<string, string> = { id: uuidv4(), name: uuidv4() };
      if (opts.referencesTableId) columnNames.parent_id = uuidv4();
      const configurations = { columns: { column_names: columnNames, configurations: {} } };

      await queryRunner.query(
        `INSERT INTO internal_tables (id, organization_id, table_name, co_relation_id, configurations, created_at)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamp, now()))`,
        [tableId, organizationId, tableName, uuidv4(), configurations, opts.createdAt ?? null]
      );

      const fkColumn = opts.referencesTableId ? `, "parent_id" integer` : '';
      await tjDs.query(
        `CREATE TABLE "${schema}"."${tableId}" ("id" SERIAL PRIMARY KEY, "name" character varying${fkColumn})`
      );
      await tjDs.query(`INSERT INTO "${schema}"."${tableId}" ("name") VALUES ('seeded-row')`);
      if (opts.referencesTableId) {
        await tjDs.query(
          `ALTER TABLE "${schema}"."${tableId}" ADD CONSTRAINT "fk_${tableId}" FOREIGN KEY ("parent_id")
           REFERENCES "${schema}"."${opts.referencesTableId}" ("id")`
        );
      }

      return { tableId, schema, configurations };
    }

    // Every test below runs the migration's real `up`/`down` against its own real QueryRunner
    // transaction (`withRealTransactions` - needed so the seeded org/environment rows commit for
    // real and are visible to that separate connection), then rolls that transaction back and
    // drops its workspace. Nothing here needs to survive past its own `it()`.

    it('should refuse to drop internal_tables.configurations, leaving it intact, when an internal_tables row has no relation', async () => {
      expect(tooljetDbAvailable).toBe(true);
      await withRealTransactions(async () => {
        const organizationId = await newWorkspace(`mig-a-guard-${uuidv4()}@tooljet.io`);
        try {
          // Break the org: delete its priority-1 (development) environment so
          // repairAndBaselineOneTable can't resolve one and never writes a relation for this row -
          // the exact precondition the new guard exists to catch.
          const development = await priorityEnv(organizationId, 1);
          await getDefaultDataSource().query(`DELETE FROM app_environments WHERE id = $1`, [development.id]);

          const migration = new TjdbRolloutMigrationASubstrate1787564882760();
          const queryRunner = getDefaultDataSource().createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();
          try {
            await resetToPreMigrationSchema(queryRunner);
            const { tableId, configurations } = await seedPreMigrationTable(queryRunner, organizationId, 'orphaned');

            await expect(migration.up(queryRunner)).rejects.toThrow(/refusing to drop/);

            const [row] = await queryRunner.query(`SELECT configurations FROM internal_tables WHERE id = $1`, [
              tableId,
            ]);
            expect(row.configurations).toEqual(configurations);

            const [{ exists }] = await queryRunner.query(
              `SELECT EXISTS (
                 SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'internal_tables' AND column_name = 'configurations'
               ) AS exists`
            );
            expect(exists).toBe(true);

            const relations = await queryRunner.query(
              `SELECT id FROM internal_table_relations WHERE internal_table_id = $1`,
              [tableId]
            );
            expect(relations).toHaveLength(0);
          } finally {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
          }
        } finally {
          await cleanupWorkspace(organizationId);
        }
      });
    }, 60_000);

    it('should create a development relation and a confirmed sequence-1 baseline migration for a plain table', async () => {
      expect(tooljetDbAvailable).toBe(true);
      await withRealTransactions(async () => {
        const organizationId = await newWorkspace(`mig-a-normal-${uuidv4()}@tooljet.io`);
        try {
          const development = await priorityEnv(organizationId, 1);
          const branchId = await defaultBranchId(organizationId);

          const migration = new TjdbRolloutMigrationASubstrate1787564882760();
          const queryRunner = getDefaultDataSource().createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();
          try {
            await resetToPreMigrationSchema(queryRunner);
            const { tableId, configurations } = await seedPreMigrationTable(queryRunner, organizationId, 'plain');

            await migration.up(queryRunner);

            const [relation] = await queryRunner.query(
              `SELECT * FROM internal_table_relations WHERE internal_table_id = $1`,
              [tableId]
            );
            expect(relation).toMatchObject({
              id: tableId,
              internal_table_id: tableId,
              environment_id: development.id,
              branch_id: branchId,
            });
            expect(relation.configurations).toEqual(configurations);

            const applications = await queryRunner.query(
              `SELECT m.sequence, m.kind, a.applied_at FROM internal_table_migration_applications a
               JOIN internal_table_migrations m ON m.id = a.migration_id
               WHERE m.internal_table_id = $1 AND a.relation_id = $2`,
              [tableId, relation.id]
            );
            expect(applications).toHaveLength(1);
            expect(Number(applications[0].sequence)).toBe(1);
            expect(applications[0].kind).toBe('baseline');
            expect(applications[0].applied_at).not.toBeNull();
          } finally {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
          }
        } finally {
          await cleanupWorkspace(organizationId);
        }
      });
    }, 60_000);

    it('should restore internal_tables.configurations byte-for-byte on down() after up()', async () => {
      expect(tooljetDbAvailable).toBe(true);
      await withRealTransactions(async () => {
        const organizationId = await newWorkspace(`mig-a-down-${uuidv4()}@tooljet.io`);
        try {
          const migration = new TjdbRolloutMigrationASubstrate1787564882760();
          const queryRunner = getDefaultDataSource().createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();
          try {
            await resetToPreMigrationSchema(queryRunner);
            const { tableId, configurations } = await seedPreMigrationTable(queryRunner, organizationId, 'roundtrip');

            await migration.up(queryRunner);

            const [{ exists: stillHasColumn }] = await queryRunner.query(
              `SELECT EXISTS (
                 SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'internal_tables' AND column_name = 'configurations'
               ) AS exists`
            );
            expect(stillHasColumn).toBe(false);

            await migration.down(queryRunner);

            const [row] = await queryRunner.query(`SELECT configurations FROM internal_tables WHERE id = $1`, [
              tableId,
            ]);
            expect(row.configurations).toEqual(configurations);
          } finally {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
          }
        } finally {
          await cleanupWorkspace(organizationId);
        }
      });
    }, 60_000);

    it('should baseline a physical foreign key as a confirmed sequence-2 migration', async () => {
      expect(tooljetDbAvailable).toBe(true);
      await withRealTransactions(async () => {
        const organizationId = await newWorkspace(`mig-a-fk-${uuidv4()}@tooljet.io`);
        try {
          const migration = new TjdbRolloutMigrationASubstrate1787564882760();
          const queryRunner = getDefaultDataSource().createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();
          try {
            await resetToPreMigrationSchema(queryRunner);
            const parent = await seedPreMigrationTable(queryRunner, organizationId, 'fk_parent');
            const child = await seedPreMigrationTable(queryRunner, organizationId, 'fk_child', {
              referencesTableId: parent.tableId,
            });

            await migration.up(queryRunner);

            const sequences = await queryRunner.query(
              `SELECT m.sequence FROM internal_table_migration_applications a
               JOIN internal_table_migrations m ON m.id = a.migration_id
               WHERE m.internal_table_id = $1 AND a.applied_at IS NOT NULL
               ORDER BY m.sequence`,
              [child.tableId]
            );
            expect(sequences.map((row) => Number(row.sequence))).toEqual([1, 2]);
          } finally {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
          }
        } finally {
          await cleanupWorkspace(organizationId);
        }
      });
    }, 60_000);

    // dedupeAndLockDownCoRelationId refuses to guess which side of a collision git-sync actually
    // tracks (reassigning either row's co_relation_id would orphan it from its repo entry) - it
    // throws and leaves both rows exactly as they were, same fail-loud shape as the orphan guard.
    it('should refuse to run and leave both rows untouched when two tables collide on co_relation_id', async () => {
      expect(tooljetDbAvailable).toBe(true);
      await withRealTransactions(async () => {
        const organizationId = await newWorkspace(`mig-a-dedupe-${uuidv4()}@tooljet.io`);
        try {
          const migration = new TjdbRolloutMigrationASubstrate1787564882760();
          const queryRunner = getDefaultDataSource().createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();
          try {
            await resetToPreMigrationSchema(queryRunner);
            const first = await seedPreMigrationTable(queryRunner, organizationId, 'collide_first');
            const second = await seedPreMigrationTable(queryRunner, organizationId, 'collide_second');

            const sharedCoRelationId = uuidv4();
            await queryRunner.query(`UPDATE internal_tables SET co_relation_id = $1 WHERE id = ANY($2::uuid[])`, [
              sharedCoRelationId,
              [first.tableId, second.tableId],
            ]);

            await expect(migration.up(queryRunner)).rejects.toThrow(/share a co_relation_id/);

            const rows = await queryRunner.query(
              `SELECT id, co_relation_id FROM internal_tables WHERE id = ANY($1::uuid[])`,
              [[first.tableId, second.tableId]]
            );
            expect(rows).toHaveLength(2);
            expect(rows.every((row) => row.co_relation_id === sharedCoRelationId)).toBe(true);
          } finally {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
          }
        } finally {
          await cleanupWorkspace(organizationId);
        }
      });
    }, 60_000);
  });
});
