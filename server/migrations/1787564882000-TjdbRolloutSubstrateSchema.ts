import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableUnique } from 'typeorm';

// Pure-DDL half of "Migration A" (`data-migrations/1787564882760-TjdbRolloutMigrationASubstrate.ts`),
// split out so the 3 new tables + internal_tables shape changes exist even on a deploy that skips
// `db:migrate:data`. The data migration backfills relations/baselines into what this creates.
//
// Revert order matters and isn't enforced mechanically (both the schema and data datasources write
// to the same `migrations` table, and TypeORM reverts by insertion id, not timestamp):
//   TjdbRolloutMigrationBEnvironmentAssignment1788252587903 (down)
//   -> TjdbRolloutMigrationASubstrate1787564882760 (down)
//   -> this migration (down)
// See src/modules/tooljet-db/AGENTS.md for the environments data model this substrate supports.
export class TjdbRolloutSubstrateSchema1787564882000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.createRelationsTable(queryRunner);
    await this.createMigrationsTable(queryRunner);
    await this.createMigrationApplicationsTable(queryRunner);
    await this.addSoftDeleteToInternalTables(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
    // Partial unique index instead of the plain constraint: once something starts soft-deleting
    // tables (setting deleted_at), a deleted table's name must be free for reuse. No read site of
    // internal_tables changes here — deleted_at is never set today, so every row's predicate is
    // trivially true and behavior is unchanged.
    await queryRunner.query(`ALTER TABLE internal_tables DROP CONSTRAINT organization_id_table_name_unique`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX organization_id_table_name_unique
      ON internal_tables (organization_id, table_name)
      WHERE deleted_at IS NULL
    `);
  }
}
