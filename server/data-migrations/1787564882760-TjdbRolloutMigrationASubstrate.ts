import { tooljetDbOrmconfig } from 'ormconfig';
import { DataSource, MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableUnique } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { findTenantSchema } from '@helpers/tooljet_db.helper';
import {
  buildTableSchemaSnapshot,
  TableSchemaSnapshotColumn,
  TableSchemaSnapshotForeignKey,
} from '@modules/tooljet-db/helpers/table-schema-snapshot';

const MIGRATION_NAME = 'TjdbRolloutMigrationASubstrate1787564882760';

// "Migration A": pure substrate. Every existing internal_tables row gets an
// internal_table_relations row at the priority-1 (development) environment on the org's default
// branch, plus a synthesized baseline recording what the physical table already looks like. No
// licence check anywhere here — assigning licensed workspaces' data to production is a separate
// later migration. See ~/Documents/Obsidian/.mind/feature/tjdb-environments-architecture.md
// ("Data model", "The baseline") for the schema and design this implements.
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

  // --- Schema: the three new tables. Raw SQL only — nothing in this migration reads through
  // TypeORM entities, it only creates the tables. ---

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
          // Not in the architecture doc's ERD — records why a table couldn't be baselined instead
          // of failing the whole migration. NULL = baselined fine.
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
      migrations = await this.synthesizeBaseline(queryRunner, tjdbQueryRunner, schema, row.id, configurations);
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
   * that shape).
   */
  private async synthesizeBaseline(
    queryRunner: QueryRunner,
    tjdbQueryRunner: QueryRunner,
    schema: string,
    tableId: string,
    configurations: any
  ): Promise<Array<{ sequence: number; payload: any; resultingSchema: any }>> {
    const [{ oid }] = await tjdbQueryRunner.query(`SELECT to_regclass($1) AS oid`, [`"${schema}"."${tableId}"`]);
    if (!oid) throw new Error(`physical relation "${schema}"."${tableId}" does not exist`);

    const columnNames = configurations.columns.column_names;
    const snapshot = await buildTableSchemaSnapshot(tjdbQueryRunner, schema, tableId, columnNames);

    // Referenced tables live in this same tenant schema - cross-workspace foreign keys are not
    // reachable through the app (fetchAndCheckIfValidForeignKeyTables scopes candidates to the
    // organization), so the composite-PK check never needs to cross a schema boundary.
    for (const fk of snapshot.foreign_keys) {
      const referencedSnapshot = await buildTableSchemaSnapshot(tjdbQueryRunner, schema, fk.referenced_table, {});
      if (
        referencedSnapshot.primary_key.length > 1 &&
        fk.referenced_column_names.some((c) => referencedSnapshot.primary_key.includes(c))
      ) {
        throw new Error(
          `foreign key "${fk.name}" references composite primary key of "${schema}"."${fk.referenced_table}"`
        );
      }
    }

    // resulting_schema is "shape at authoring time" per migration row, not a shared final shape —
    // the sequence-1 (create) row predates the FKs, so it must not claim them.
    const migrations: Array<{ sequence: number; payload: any; resultingSchema: any }> = [
      {
        sequence: 1,
        payload: {
          ddl: this.buildCreateTableDdl(schema, snapshot.columns, snapshot.primary_key),
          refs: {},
          // Portability contract (also used by raw-SQL migrations from H7 on): the DDL never bakes
          // in a physical relation id. "{{self}}" is the relation this migration is replayed onto;
          // every other placeholder is a key into `refs`, resolved through the FK's co_relation_id
          // to whichever relation stands for that table in the replay target's own environment.
          // column_uuids rides alongside the DDL so replay can assign the same column identities
          // the source table already has, instead of minting fresh ones for the target relation.
          column_uuids: columnNames,
        },
        resultingSchema: {
          columns: snapshot.columns,
          primary_key: snapshot.primary_key,
          unique_constraints: snapshot.unique_constraints,
          indexes: snapshot.indexes,
          foreign_keys: [],
        },
      },
    ];
    if (snapshot.foreign_keys.length) {
      const refs: Record<string, string> = {};
      const ddl = await this.buildForeignKeyDdl(queryRunner, schema, snapshot.foreign_keys, refs);
      migrations.push({
        sequence: 2,
        payload: { ddl, refs },
        resultingSchema: {
          columns: snapshot.columns,
          primary_key: snapshot.primary_key,
          unique_constraints: snapshot.unique_constraints,
          indexes: snapshot.indexes,
          foreign_keys: snapshot.foreign_keys,
        },
      });
    }

    return migrations;
  }

  // Schema is baked in as a literal, not a placeholder: TJDB's tenant schema is one per
  // organization, shared by every environment - unlike a relation id, it never differs between
  // the relation this migration was recorded against and whatever relation replays it.
  private buildCreateTableDdl(
    schema: string,
    columns: TableSchemaSnapshotColumn[],
    primaryKeyColumns: string[]
  ): string {
    const columnDdl = columns.map((col) => {
      const notNull = col.is_nullable ? '' : ' NOT NULL';
      const withDefault = col.default ? ` DEFAULT ${col.default}` : '';
      return `  "${col.name}" ${col.data_type}${notNull}${withDefault}`;
    });
    if (primaryKeyColumns.length) {
      columnDdl.push(`  PRIMARY KEY (${primaryKeyColumns.map((c) => `"${c}"`).join(', ')})`);
    }
    return `CREATE TABLE "${schema}"."{{self}}" (\n${columnDdl.join(',\n')}\n)`;
  }

  /**
   * Every row this migration baselines still satisfies relation.id === internal_table.id (the
   * pre-H3 rollout invariant), including whatever a foreign key references - so a referenced
   * relation id is looked up as an internal_tables id directly. This shortcut is only safe here;
   * normal perform()/replay code must go through the relation resolver instead.
   */
  private async buildForeignKeyDdl(
    queryRunner: QueryRunner,
    schema: string,
    foreignKeys: TableSchemaSnapshotForeignKey[],
    refs: Record<string, string>
  ): Promise<string> {
    const placeholderByRelationId = new Map<string, string>();
    const statements: string[] = [];

    for (const fk of foreignKeys) {
      let placeholder = placeholderByRelationId.get(fk.referenced_table);
      if (!placeholder) {
        const [row] = await queryRunner.query(`SELECT co_relation_id FROM internal_tables WHERE id = $1`, [
          fk.referenced_table,
        ]);
        if (!row)
          throw new Error(`foreign key "${fk.name}" references unknown internal table "${fk.referenced_table}"`);
        placeholder = `ref_${placeholderByRelationId.size}`;
        placeholderByRelationId.set(fk.referenced_table, placeholder);
        refs[placeholder] = row.co_relation_id;
      }

      statements.push(
        `ALTER TABLE "${schema}"."{{self}}" ADD CONSTRAINT "${fk.name}" FOREIGN KEY (${fk.column_names
          .map((c) => `"${c}"`)
          .join(', ')}) REFERENCES "${schema}"."{{${placeholder}}}" (${fk.referenced_column_names
          .map((c) => `"${c}"`)
          .join(', ')})`
      );
    }

    return statements.join(';\n');
  }
}
