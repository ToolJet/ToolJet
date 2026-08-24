import { tooljetDbOrmconfig } from 'ormconfig';
import { DataSource, MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableUnique } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { findTenantSchema } from '@helpers/tooljet_db.helper';

const MIGRATION_NAME = 'TjdbRolloutMigrationASubstrate1787564882760';

// TJDB environments H1 (DEV-85), "migration A": pure substrate. Every existing internal_tables
// row gets an internal_table_relations row at the priority-1 (development) environment on the
// org's default branch, plus a synthesized baseline recording what the physical table already
// looks like. No licence check anywhere here — assigning licensed workspaces' data to production
// is migration B, a separate later ticket. See ~/Documents/Obsidian/.mind/feature/tjdb-environments-
// architecture.md ("Data model", "The baseline") for the schema and design this implements.
type InternalTableRow = { id: string; organization_id: string; configurations: any };

export class TjdbRolloutMigrationASubstrate1787564882760 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.createRelationsTable(queryRunner);
    await this.createMigrationsTable(queryRunner);
    await this.createMigrationApplicationsTable(queryRunner);
    await this.addSoftDeleteToInternalTables(queryRunner);
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
    // Restore the install's shape from each table's priority-1-environment relation. Duplicate
    // co_relation_id cleanup and column-identity repair are data changes, not shape — not undone.
    await queryRunner.query(`
      UPDATE internal_tables it
      SET configurations = r.configurations
      FROM internal_table_relations r
      WHERE r.internal_table_id = it.id
    `);

    await queryRunner.query(
      `ALTER TABLE internal_tables DROP CONSTRAINT IF EXISTS organization_id_co_relation_id_unique`
    );
    await queryRunner.query(`ALTER TABLE internal_tables ALTER COLUMN co_relation_id DROP NOT NULL`);

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

  // --- Schema: the three new tables (H1 scope — no entities yet, see handoff) ---

  private async createRelationsTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'internal_table_relations',
        columns: [
          // Not generated: for rollout-migration rows this is explicitly set to internal_table_id.
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'internal_table_id', type: 'uuid', isNullable: false },
          { name: 'environment_id', type: 'uuid', isNullable: false },
          { name: 'branch_id', type: 'uuid', isNullable: false },
          { name: 'configurations', type: 'jsonb', isNullable: true },
          // Not in the architecture doc's ERD — added during H0/H1 scoping to record why a table
          // couldn't be baselined instead of failing the whole migration. NULL = baselined fine.
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
          { name: 'resulting_schema', type: 'jsonb', isNullable: false },
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

  // --- internal_tables repairs ---

  private async addSoftDeleteToInternalTables(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'internal_tables',
      new TableColumn({ name: 'deleted_at', type: 'timestamp', isNullable: true })
    );
    // Partial unique index instead of the plain constraint: soft-deleted tables (once drop_table
    // starts setting deleted_at, in whatever ticket wires that up) must free their table_name for
    // reuse. No read site of internal_tables is updated in this migration — deleted_at is never
    // set today, so every row's predicate is trivially true and behaviour is unchanged.
    await queryRunner.query(`ALTER TABLE internal_tables DROP CONSTRAINT organization_id_table_name_unique`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX organization_id_table_name_unique
      ON internal_tables (organization_id, table_name)
      WHERE deleted_at IS NULL
    `);
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

  // --- Per-table: repair column identity, insert its relation row, synthesize a baseline ---

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
      migrations = await this.synthesizeBaseline(tjdbQueryRunner, schema, row.id, configurations);
    } catch (error) {
      baselineError = error.message;
    }

    // Everything below writes to the app DB, which — per migrationsTransactionMode: 'all' — shares
    // one transaction with every other row this migration touches. A SAVEPOINT scopes a genuine
    // failure here to this relation alone; without it, one bad row would poison every row after it
    // ("current transaction is aborted") even though the catch in the caller looks like it recovered.
    await queryRunner.query(`SAVEPOINT relation_repair`);
    try {
      await queryRunner.query(
        `INSERT INTO internal_table_relations (id, internal_table_id, environment_id, branch_id, configurations, baseline_error, created_at)
         VALUES ($1, $1, $2, $3, $4, $5, now())
         ON CONFLICT (internal_table_id, environment_id, branch_id) DO NOTHING`,
        [row.id, environmentId, branchId, configurations, baselineError]
      );

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
   * also fixes. Root cause of the gap: the original backfill (UpdateInternalTablesConfigurationsColumn)
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

  /**
   * Pure metadata write: records what the physical table already looks like as one (or two)
   * "baseline" migration rows, fully applied. Never executes DDL against the TJDB — the table's
   * shape already matches what's being recorded. Throws (caller stores the message as
   * baseline_error) for the known unbaselineable cases: missing physical relation, or a foreign
   * key referencing a composite primary key (TJDB's structured-migration format can't represent
   * that shape — see buildResultingSchema.checkNoCompositeKeyForeignKeys).
   */
  private async synthesizeBaseline(
    tjdbQueryRunner: QueryRunner,
    schema: string,
    tableId: string,
    configurations: any
  ): Promise<Array<{ sequence: number; payload: any; resultingSchema: any }>> {
    const [{ oid }] = await tjdbQueryRunner.query(`SELECT to_regclass($1) AS oid`, [`"${schema}"."${tableId}"`]);
    if (!oid) throw new Error(`physical relation "${schema}"."${tableId}" does not exist`);

    const columnNames = configurations.columns.column_names;
    const [columns, primaryKeyColumns, foreignKeys] = await Promise.all([
      tjdbQueryRunner.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
        [schema, tableId]
      ),
      this.fetchPrimaryKeyColumns(tjdbQueryRunner, schema, tableId),
      this.fetchForeignKeys(tjdbQueryRunner, schema, tableId),
    ]);

    for (const fk of foreignKeys) {
      const referencedPk = await this.fetchPrimaryKeyColumns(
        tjdbQueryRunner,
        fk.referenced_schema,
        fk.referenced_table
      );
      if (referencedPk.length > 1 && fk.referenced_column_names.some((c: string) => referencedPk.includes(c))) {
        throw new Error(
          `foreign key "${fk.conname}" references composite primary key of "${fk.referenced_schema}"."${fk.referenced_table}"`
        );
      }
    }

    const columnsSchema = columns.map((col) => ({
      name: col.column_name,
      uuid: columnNames[col.column_name],
      data_type: col.data_type,
      is_nullable: col.is_nullable === 'YES',
      default: col.column_default,
      is_primary_key: primaryKeyColumns.includes(col.column_name),
    }));
    const foreignKeysSchema = foreignKeys.map((fk) => ({
      column_names: fk.column_names,
      referenced_table: fk.referenced_table,
      referenced_column_names: fk.referenced_column_names,
    }));

    // resulting_schema is "shape at authoring time" per migration row, not a shared final shape —
    // the sequence-1 (create) row predates the FKs, so it must not claim them.
    const migrations: Array<{ sequence: number; payload: any; resultingSchema: any }> = [
      {
        sequence: 1,
        payload: { ddl: this.buildCreateTableDdl(tableId, columns, primaryKeyColumns), refs: [] },
        resultingSchema: { columns: columnsSchema, foreign_keys: [] },
      },
    ];
    if (foreignKeys.length) {
      migrations.push({
        sequence: 2,
        payload: { ddl: this.buildForeignKeyDdl(tableId, foreignKeys), refs: foreignKeys.map((fk) => fk.conname) },
        resultingSchema: { columns: columnsSchema, foreign_keys: foreignKeysSchema },
      });
    }

    return migrations;
  }

  private async fetchPrimaryKeyColumns(
    tjdbQueryRunner: QueryRunner,
    schema: string,
    tableName: string
  ): Promise<string[]> {
    const rows: Array<{ column_name: string }> = await tjdbQueryRunner.query(
      `SELECT a.attname AS column_name
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       JOIN unnest(c.conkey) AS ck(attnum) ON true
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ck.attnum
       WHERE c.contype = 'p' AND n.nspname = $1 AND t.relname = $2`,
      [schema, tableName]
    );
    return rows.map((r) => r.column_name);
  }

  private async fetchForeignKeys(
    tjdbQueryRunner: QueryRunner,
    schema: string,
    tableName: string
  ): Promise<
    Array<{
      conname: string;
      column_names: string[];
      referenced_schema: string;
      referenced_table: string;
      referenced_column_names: string[];
    }>
  > {
    return tjdbQueryRunner.query(
      `SELECT
         c.conname,
         array_agg(a.attname::text ORDER BY x.n) AS column_names,
         rn.nspname AS referenced_schema,
         rt.relname AS referenced_table,
         array_agg(ra.attname::text ORDER BY x.n) AS referenced_column_names
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       JOIN pg_class rt ON rt.oid = c.confrelid
       JOIN pg_namespace rn ON rn.oid = rt.relnamespace
       JOIN unnest(c.conkey) WITH ORDINALITY AS x(attnum, n) ON true
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = x.attnum
       JOIN unnest(c.confkey) WITH ORDINALITY AS y(attnum, n) ON y.n = x.n
       JOIN pg_attribute ra ON ra.attrelid = rt.oid AND ra.attnum = y.attnum
       WHERE c.contype = 'f' AND n.nspname = $1 AND t.relname = $2
       GROUP BY c.conname, rn.nspname, rt.relname`,
      [schema, tableName]
    );
  }

  private buildCreateTableDdl(tableId: string, columns: any[], primaryKeyColumns: string[]): string {
    const columnDdl = columns.map((col) => {
      const notNull = col.is_nullable === 'YES' ? '' : ' NOT NULL';
      const withDefault = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      return `  "${col.column_name}" ${col.data_type}${notNull}${withDefault}`;
    });
    if (primaryKeyColumns.length) {
      columnDdl.push(`  PRIMARY KEY (${primaryKeyColumns.map((c) => `"${c}"`).join(', ')})`);
    }
    return `CREATE TABLE "${tableId}" (\n${columnDdl.join(',\n')}\n)`;
  }

  private buildForeignKeyDdl(
    tableId: string,
    foreignKeys: Array<{
      conname: string;
      column_names: string[];
      referenced_table: string;
      referenced_column_names: string[];
    }>
  ): string {
    return foreignKeys
      .map(
        (fk) =>
          `ALTER TABLE "${tableId}" ADD CONSTRAINT "${fk.conname}" FOREIGN KEY (${fk.column_names
            .map((c) => `"${c}"`)
            .join(', ')}) REFERENCES "${fk.referenced_table}" (${fk.referenced_column_names
            .map((c) => `"${c}"`)
            .join(', ')})`
      )
      .join(';\n');
  }
}
