import { tooljetDbOrmconfig } from 'ormconfig';
import { DataSource, MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { findTenantSchema } from '@helpers/tooljet_db.helper';
import { synthesizeBaseline } from '@modules/tooljet-db/helpers/baseline-synthesis';

const MIGRATION_NAME = 'TjdbRolloutMigrationASubstrate1787564882760';

// "Migration A": the data half of the environment substrate. Every existing internal_tables row
// gets an internal_table_relations row at the priority-1 (development) environment on the org's
// default branch, plus a synthesized baseline recording what the physical table already looks
// like. No license check anywhere here — assigning licensed workspaces' data to production is a
// separate later migration (Migration B). See src/modules/tooljet-db/AGENTS.md for the data model
// this implements.
//
// The 3 internal_table* tables + internal_tables' soft-delete/unique-index shape are created by the
// sibling schema migration `migrations/1787564882000-TjdbRolloutSubstrateSchema.ts` — DDL ownership
// lives entirely there; this migration only backfills data into them. Revert order (not enforced
// mechanically — both data sources share one `migrations` table, reverted by insertion id, not
// timestamp): TjdbRolloutMigrationBEnvironmentAssignment1788252587903 (down) -> this migration
// (down) -> TjdbRolloutSubstrateSchema1787564882000 (down).
type InternalTableRow = { id: string; organization_id: string; configurations: any };

export class TjdbRolloutMigrationASubstrate1787564882760 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.dedupeAndLockDownCoRelationId(queryRunner);

    const tooljetDbConnection = new DataSource({ ...tooljetDbOrmconfig, name: `${MIGRATION_NAME}Tjdb` } as any);
    await tooljetDbConnection.initialize();
    const tjdbQueryRunner = tooljetDbConnection.createQueryRunner();
    try {
      await this.repairAndBaselineEveryTable(queryRunner, tjdbQueryRunner);
    } finally {
      await tjdbQueryRunner.release();
      await tooljetDbConnection.destroy();
    }

    // Only safe once every internal_tables row has a relation carrying its configurations.
    await queryRunner.query(`ALTER TABLE internal_tables DROP COLUMN configurations`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'internal_tables',
      new TableColumn({ name: 'configurations', type: 'jsonb', isNullable: true })
    );
    // Restore the install's shape from each table's priority-1-environment relation. Prefer this
    // migration's own row (id = internal_table_id) if present, else the development-environment
    // relation, else the earliest — deterministic even when Migration B has created a second
    // relation per table. Duplicate co_relation_id cleanup and column-identity repair are data
    // changes, not shape — not undone.
    await queryRunner.query(`
      UPDATE internal_tables it
      SET configurations = pick.configurations
      FROM (
        SELECT DISTINCT ON (r.internal_table_id) r.internal_table_id, r.configurations
        FROM internal_table_relations r
        JOIN app_environments e ON e.id = r.environment_id
        ORDER BY r.internal_table_id, (r.id = r.internal_table_id) DESC, e.priority ASC, r.created_at ASC
      ) pick
      WHERE pick.internal_table_id = it.id
    `);

    await queryRunner.query(
      `ALTER TABLE internal_tables DROP CONSTRAINT IF EXISTS organization_id_co_relation_id_unique`
    );
    await queryRunner.query(`ALTER TABLE internal_tables ALTER COLUMN co_relation_id DROP NOT NULL`);
  }

  private async dedupeAndLockDownCoRelationId(queryRunner: QueryRunner): Promise<void> {
    // The import guard (tooljet-db-import-export.service.ts) is a non-atomic SELECT-then-INSERT
    // and can race, so duplicates are possible even though normal writes never intend them.
    await queryRunner.query(
      `UPDATE internal_tables SET co_relation_id = gen_random_uuid() WHERE co_relation_id IS NULL`
    );
    await queryRunner.query(`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY organization_id, co_relation_id ORDER BY created_at, id) AS rn
        FROM internal_tables
      )
      UPDATE internal_tables it
      SET co_relation_id = gen_random_uuid()
      FROM ranked
      WHERE it.id = ranked.id AND ranked.rn > 1
    `);
    await queryRunner.query(`ALTER TABLE internal_tables ALTER COLUMN co_relation_id SET NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE internal_tables
      ADD CONSTRAINT organization_id_co_relation_id_unique UNIQUE (organization_id, co_relation_id)
    `);
  }

  private async repairAndBaselineEveryTable(queryRunner: QueryRunner, tjdbQueryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM internal_tables`);
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Building relations + baselines for ${total} internal table(s).`);
    const progress = new MigrationProgress(MIGRATION_NAME, total || 1);

    const devEnvByOrg = new Map<string, string>(
      (await queryRunner.query(`SELECT organization_id, id FROM app_environments WHERE priority = 1`)).map((r) => [
        r.organization_id,
        r.id,
      ])
    );
    const defaultBranchByOrg = new Map<string, string>(
      (
        await queryRunner.query(
          `SELECT organization_id, id FROM organization_git_sync_branches WHERE is_default = true`
        )
      ).map((r) => [r.organization_id, r.id])
    );

    const getBatch = (_em, skip: number, take: number): Promise<InternalTableRow[]> =>
      queryRunner.query(
        `SELECT id, organization_id, configurations FROM internal_tables ORDER BY id LIMIT $1 OFFSET $2`,
        [take, skip]
      );

    const processBatch = async (_em, batch: InternalTableRow[]): Promise<void> => {
      for (const row of batch) {
        try {
          await this.repairAndBaselineOneTable(queryRunner, tjdbQueryRunner, row, devEnvByOrg, defaultBranchByOrg);
        } catch (error) {
          // Never abort the whole migration for one relation — the failure is recorded per-row.
          console.error(`${MIGRATION_NAME}: table=${row.id} org=${row.organization_id} failed unexpectedly.`, error);
        }
        progress.show();
      }
    };

    await processDataInBatches(queryRunner.manager, getBatch, processBatch, 100);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Relations + baselines built for ${total} internal table(s).`);
  }

  private async repairAndBaselineOneTable(
    queryRunner: QueryRunner,
    tjdbQueryRunner: QueryRunner,
    row: InternalTableRow,
    devEnvByOrg: Map<string, string>,
    defaultBranchByOrg: Map<string, string>
  ): Promise<void> {
    const environmentId = devEnvByOrg.get(row.organization_id);
    const branchId = defaultBranchByOrg.get(row.organization_id);
    if (!environmentId || !branchId) {
      console.error(
        `${MIGRATION_NAME}: org=${row.organization_id} missing a development environment or default branch; skipping table=${row.id}.`
      );
      return;
    }

    const schema = findTenantSchema(row.organization_id);
    const configurations = await this.repairColumnIdentity(tjdbQueryRunner, schema, row);

    let baselineError: string | null = null;
    let migrations: Array<{ sequence: number; payload: any; resultingSchema: any }> = [];
    try {
      migrations = await synthesizeBaseline(queryRunner, tjdbQueryRunner, schema, row.id, configurations);
    } catch (error) {
      baselineError = error.message;
    }

    // Everything below writes to the app DB, which — per migrationsTransactionMode: 'all' — shares
    // one transaction with every other row this migration touches. A SAVEPOINT scopes a genuine
    // failure here to this relation alone; without it, one bad row would poison every row after it
    // ("current transaction is aborted") even though the catch in the caller looks like it recovered.
    await queryRunner.query(`SAVEPOINT relation_repair`);
    try {
      const [inserted] = await queryRunner.query(
        `INSERT INTO internal_table_relations (id, internal_table_id, environment_id, branch_id, configurations, baseline_error, created_at)
         VALUES ($1, $1, $2, $3, $4, $5, now())
         ON CONFLICT (internal_table_id, environment_id, branch_id) DO NOTHING
         RETURNING id`,
        [row.id, environmentId, branchId, configurations, baselineError]
      );
      if (!inserted) {
        // Already processed by an earlier run of this migration (dev revert/rerun cycle) — the
        // migrations/applications rows below were inserted then too, don't duplicate them.
        await queryRunner.query(`RELEASE SAVEPOINT relation_repair`);
        return;
      }

      for (const migration of migrations) {
        const [{ id: migrationId }] = await queryRunner.query(
          `INSERT INTO internal_table_migrations
           (internal_table_id, sequence, branch_id, kind, payload, resulting_schema, tooljet_version, created_at)
           VALUES ($1, $2, $3, 'baseline', $4, $5, $6, now())
           RETURNING id`,
          [
            row.id,
            migration.sequence,
            branchId,
            migration.payload,
            migration.resultingSchema,
            (globalThis as any).TOOLJET_VERSION || null,
          ]
        );
        await queryRunner.query(
          `INSERT INTO internal_table_migration_applications (migration_id, relation_id, applied_at)
           VALUES ($1, $2, now())`,
          [migrationId, row.id]
        );
      }
      await queryRunner.query(`RELEASE SAVEPOINT relation_repair`);
    } catch (error) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT relation_repair`);
      throw error;
    }
  }

  /**
   * Mints uuids for any physical column missing from configurations.columns.column_names and
   * drops the literal "undefined" key some rows picked up from the editColumn bug this migration
   * also fixes. The root cause of the gap: the original backfill (UpdateInternalTablesConfigurationsColumn)
   * queried information_schema.columns without a table_schema filter, silently returning zero rows
   * for every org whose tenant schema isn't "public".
   */
  private async repairColumnIdentity(
    tjdbQueryRunner: QueryRunner,
    schema: string,
    row: InternalTableRow
  ): Promise<any> {
    const physicalColumns: Array<{ column_name: string }> = await tjdbQueryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
      [schema, row.id]
    );

    const configurations = row.configurations ?? { columns: { column_names: {}, configurations: {} } };
    configurations.columns ??= { column_names: {}, configurations: {} };
    const columnNames = configurations.columns.column_names ?? (configurations.columns.column_names = {});
    const columnConfigurations = configurations.columns.configurations ?? (configurations.columns.configurations = {});

    delete columnNames['undefined'];

    for (const { column_name } of physicalColumns) {
      if (columnNames[column_name]) continue;
      const columnUuid = uuidv4();
      columnNames[column_name] = columnUuid;
      columnConfigurations[columnUuid] = {};
    }

    return configurations;
  }
}
