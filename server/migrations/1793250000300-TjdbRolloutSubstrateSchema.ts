// migration-lint: allow-destructive the unique indexes are on new tables, or replace a constraint with a looser partial one
import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableUnique } from 'typeorm';

// Pure-DDL half of "Migration A" (`data-migrations/1793250000800-TjdbRolloutMigrationASubstrate.ts`),
// split out so the 3 new tables + internal_tables shape changes exist even on a deploy that skips
// `db:migrate:data`. The data migration backfills relations/baselines into what this creates.
//
// Revert order matters and isn't enforced mechanically (both the schema and data datasources write
// to the same `migrations` table, and TypeORM reverts by insertion id, not timestamp):
//   TjdbRolloutMigrationBEnvironmentAssignment1793250001100 (down)
//   -> TjdbRolloutMigrationASubstrate1793250000800 (down)
//   -> this migration (down)
// See src/modules/tooljet-db/AGENTS.md for the environments data model this substrate supports.
export class TjdbRolloutSubstrateSchema1793250000300 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Test databases ran this under an earlier timestamp and run it again under this one. Each step
    // creates a table or column with everything that hangs off it in the same transaction, so its
    // presence means the step is done.
    if (!(await queryRunner.hasTable('internal_table_relations'))) await this.createRelationsTable(queryRunner);
    if (!(await queryRunner.hasTable('internal_table_migrations'))) await this.createMigrationsTable(queryRunner);
    if (!(await queryRunner.hasTable('internal_table_migration_applications'))) {
      await this.createMigrationApplicationsTable(queryRunner);
    }
    if (!(await queryRunner.hasColumn('internal_tables', 'deleted_at'))) {
      await this.addSoftDeleteToInternalTables(queryRunner);
    }
    // An earlier revision of Migration A dropped this column on test databases; Migration A reads it.
    await queryRunner.query(`ALTER TABLE internal_tables ADD COLUMN IF NOT EXISTS configurations jsonb`);
    await this.mirrorConfigurationsToInternalTables(queryRunner);
    // Here, not in Migration A: the ALTER takes an ACCESS EXCLUSIVE lock, which in the data phase would
    // block every ToolJet Database read until the phase commits. The previous release creates tables
    // without a co_relation_id; the default gives them one. Migration A fills the existing NULLs.
    await queryRunner.query(`ALTER TABLE internal_tables ALTER COLUMN co_relation_id SET DEFAULT gen_random_uuid()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_mirror_relation_configurations ON internal_table_relations`
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS mirror_relation_configurations()`);
    await queryRunner.query(`ALTER TABLE internal_tables ALTER COLUMN co_relation_id DROP DEFAULT`);
    // drop_table soft-deletes the row and drops its physical tables. Without deleted_at the row
    // would come back as a table with nothing behind it, and a name reused after the delete would
    // break the unique constraint restored below. Relations and migrations cascade.
    await queryRunner.query(`DELETE FROM internal_tables WHERE deleted_at IS NOT NULL`);
    await queryRunner.query(`DROP INDEX IF EXISTS organization_id_table_name_unique`);
    await queryRunner.dropColumn('internal_tables', 'deleted_at');
    await queryRunner.createUniqueConstraint(
      'internal_tables',
      new TableUnique({ name: 'organization_id_table_name_unique', columnNames: ['organization_id', 'table_name'] })
    );

    await queryRunner.dropTable('internal_table_migration_applications');
    await queryRunner.dropTable('internal_table_migrations');
    await queryRunner.dropTable('internal_table_relations');
  }

  /**
   * The previous release reads column settings from internal_tables.configurations; this release writes
   * them to the relation. For this release only, copy every write on a table's id === internal_table_id
   * relation - the physical table the previous release reads - back, so a rollback keeps settings
   * changed after the upgrade. A trigger, not app code: about eight write paths plus raw SQL set them.
   */
  private async mirrorConfigurationsToInternalTables(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.mirror_relation_configurations() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          UPDATE internal_tables SET configurations = NEW.configurations
          WHERE id = NEW.internal_table_id AND configurations IS DISTINCT FROM NEW.configurations;
          RETURN NEW; END; $$
    `);
    // DROP first so a second run (test databases that ran this under an earlier timestamp) succeeds.
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_mirror_relation_configurations ON internal_table_relations`
    );
    // NOT NULL: internal_tables.configurations is NOT NULL, and create_table inserts the relation
    // before it has configurations, then saves them.
    await queryRunner.query(`
      CREATE TRIGGER trg_mirror_relation_configurations
        AFTER INSERT OR UPDATE OF configurations
        ON internal_table_relations
        FOR EACH ROW
        WHEN (NEW.id = NEW.internal_table_id AND NEW.configurations IS NOT NULL)
        EXECUTE FUNCTION mirror_relation_configurations()
    `);
  }

  private async createRelationsTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'internal_table_relations',
        columns: [
          // Not generated: Migration A's backfill sets this to internal_table_id explicitly; a
          // relation created later through the app gets a distinct generated id instead.
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'internal_table_id', type: 'uuid', isNullable: false },
          { name: 'environment_id', type: 'uuid', isNullable: false },
          { name: 'branch_id', type: 'uuid', isNullable: false },
          { name: 'configurations', type: 'jsonb', isNullable: true },
          // Records why a table couldn't be baselined, instead of failing the whole migration.
          // NULL = baselined fine.
          { name: 'baseline_error', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );
    await queryRunner.createForeignKey(
      'internal_table_relations',
      new TableForeignKey({
        columnNames: ['internal_table_id'],
        referencedTableName: 'internal_tables',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'internal_table_relations',
      new TableForeignKey({
        columnNames: ['environment_id'],
        referencedTableName: 'app_environments',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );
    await queryRunner.createForeignKey(
      'internal_table_relations',
      new TableForeignKey({
        columnNames: ['branch_id'],
        referencedTableName: 'organization_git_sync_branches',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createUniqueConstraint(
      'internal_table_relations',
      new TableUnique({ columnNames: ['internal_table_id', 'environment_id', 'branch_id'] })
    );
  }

  private async createMigrationsTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'internal_table_migrations',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, default: 'gen_random_uuid()' },
          { name: 'internal_table_id', type: 'uuid', isNullable: false },
          // A timestamp, not a counter — baselines get literal 1 (create) / 2 (FKs), workspace-wide.
          { name: 'sequence', type: 'numeric', precision: 15, isNullable: false },
          { name: 'parent_migration_id', type: 'uuid', isNullable: true },
          { name: 'branch_id', type: 'uuid', isNullable: false },
          { name: 'kind', type: 'enum', enum: ['structured', 'raw_sql', 'baseline'], isNullable: false },
          { name: 'payload', type: 'jsonb', isNullable: false },
          // NULL means authoring not yet confirmed - the migration-side twin of applied_at IS NULL.
          { name: 'resulting_schema', type: 'jsonb', isNullable: true },
          { name: 'name', type: 'varchar', isNullable: true },
          { name: 'description', type: 'varchar', isNullable: true },
          { name: 'reverts_migration_id', type: 'uuid', isNullable: true },
          { name: 'tooljet_version', type: 'varchar', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );
    await queryRunner.createForeignKey(
      'internal_table_migrations',
      new TableForeignKey({
        columnNames: ['internal_table_id'],
        referencedTableName: 'internal_tables',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'internal_table_migrations',
      new TableForeignKey({
        columnNames: ['parent_migration_id'],
        referencedTableName: 'internal_table_migrations',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );
    await queryRunner.createForeignKey(
      'internal_table_migrations',
      new TableForeignKey({
        columnNames: ['reverts_migration_id'],
        referencedTableName: 'internal_table_migrations',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );
    await queryRunner.createForeignKey(
      'internal_table_migrations',
      new TableForeignKey({
        columnNames: ['branch_id'],
        referencedTableName: 'organization_git_sync_branches',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'internal_table_migrations',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );
    await queryRunner.query(
      `CREATE INDEX internal_table_migrations_table_id_sequence_idx ON internal_table_migrations (internal_table_id, sequence)`
    );
    // A table's baseline chain gets exactly one sequence-1 "create" migration per branch. Without
    // this constraint, two concurrent repairBaseline() calls (TooljetDbEnvironmentAssignmentService)
    // can both pass the service's in-memory idempotency check before either writes, and both insert
    // a sequence=1 baseline row — a promote replaying that chain then runs CREATE TABLE twice. The
    // index turns the second concurrent writer into a loud constraint-violation error instead of a
    // silent duplicate.
    await queryRunner.query(`
      CREATE UNIQUE INDEX internal_table_migrations_baseline_sequence_uniq
      ON internal_table_migrations (internal_table_id, branch_id, sequence)
      WHERE kind = 'baseline'
    `);
  }

  private async createMigrationApplicationsTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'internal_table_migration_applications',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, default: 'gen_random_uuid()' },
          { name: 'migration_id', type: 'uuid', isNullable: false },
          { name: 'relation_id', type: 'uuid', isNullable: false },
          { name: 'applied_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true
    );
    await queryRunner.createForeignKey(
      'internal_table_migration_applications',
      new TableForeignKey({
        columnNames: ['migration_id'],
        referencedTableName: 'internal_table_migrations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'internal_table_migration_applications',
      new TableForeignKey({
        columnNames: ['relation_id'],
        referencedTableName: 'internal_table_relations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createUniqueConstraint(
      'internal_table_migration_applications',
      new TableUnique({ columnNames: ['migration_id', 'relation_id'] })
    );
  }

  private async addSoftDeleteToInternalTables(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'internal_tables',
      new TableColumn({ name: 'deleted_at', type: 'timestamp', isNullable: true })
    );
    // Partial unique index instead of the plain constraint: drop_table soft-deletes (sets
    // deleted_at), and a deleted table's name must be free for reuse.
    // No IF EXISTS: migrationsTransactionMode: 'all' rolls back everything above on any failure,
    // so a retry always starts with the original constraint still present.
    await queryRunner.query(`ALTER TABLE internal_tables DROP CONSTRAINT organization_id_table_name_unique`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX organization_id_table_name_unique
      ON internal_tables (organization_id, table_name)
      WHERE deleted_at IS NULL
    `);
  }
}
