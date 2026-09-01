import { Injectable } from '@nestjs/common';
import { EntityManager, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { findTenantSchema } from 'src/helpers/tooljet_db.helper';
import { buildTableSchemaSnapshot } from '../helpers/table-schema-snapshot';
import { rewriteSerialDefaults } from '../helpers/baseline-synthesis';

type AssignmentResult = { productionRelationId: string; developmentRelationId: string };

/**
 * Rollout migration B's per-table routine, factored out so migration B can loop it and task 7 can
 * call it for a single repaired table. See ~/Documents/Obsidian/.mind/feature/tjdb-environments-architecture.md.
 *
 * Connection model: every `internal_table*` app-DB statement runs on the `appManager` the caller
 * passes - the migration passes `queryRunner.manager` (its own transaction), task 7's live caller
 * passes its injected manager. There is NO `this.manager` in the write path and NO local
 * transaction: migration B and migration A are both data migrations under
 * `migrationsTransactionMode: 'all'`, so B's writes share A's single uncommitted transaction; a
 * second pool cannot see A's rows and would deadlock on the `internal_tables` lock A holds for its
 * `DROP COLUMN`. Row isolation is the caller's `SAVEPOINT` per table, mirroring migration A.
 *
 * The tenant-schema DDL (`CREATE TABLE ... LIKE`, serial rewrite) runs on `tjdbQueryRunner`, a
 * separate physical database - same non-transactional tradeoff migration A accepts, mitigated by
 * `IF NOT EXISTS` guards so a re-run after a crash is a clean no-op.
 */
@Injectable()
export class TooljetDbEnvironmentAssignmentService {
  /**
   * Re-points the migration-A relation (the row where `id === internal_table_id`) to the
   * workspace's highest-priority environment and materializes an empty development twin next to it.
   *
   * Idempotent by the `id === internal_table_id` predicate, never by environment: migration A's
   * rows satisfy the equality and nothing minted since does. Every step is a no-op on a re-run -
   * the repoint is skipped once the row is already at production, the twin insert is
   * `ON CONFLICT DO NOTHING`, and steps 5-7 are all guarded - so a run that crashed between the
   * committed relation writes and the physical `CREATE TABLE` is repaired by simply running again.
   *
   * Returns `null` only when there is nothing to do: no migration-A relation for this table, or the
   * workspace is not multi-environment.
   */
  async assignExistingTableToEnvironments(
    internalTableId: string,
    organizationId: string,
    appManager: EntityManager,
    tjdbQueryRunner: QueryRunner
  ): Promise<AssignmentResult | null> {
    // 1. The migration-A relation for this table, if it still exists in A's shape.
    const [relation] = await appManager.query(
      `SELECT id, internal_table_id, environment_id, branch_id, configurations, baseline_error
       FROM internal_table_relations
       WHERE id = internal_table_id AND internal_table_id = $1`,
      [internalTableId]
    );
    if (!relation) return null;

    // 2. Resolve environments by id: production = highest priority, development = priority 1.
    const environments: Array<{ id: string; priority: number }> = await appManager.query(
      `SELECT id, priority FROM app_environments WHERE organization_id = $1 ORDER BY priority`,
      [organizationId]
    );
    const development = environments.find((environment) => Number(environment.priority) === 1);
    const production = environments.reduce(
      (highest, current) => (Number(current.priority) > Number(highest.priority) ? current : highest),
      environments[0]
    );
    if (!development || !production || production.id === development.id) return null;

    const schema = findTenantSchema(organizationId);
    const columnNames: Record<string, string> = relation.configurations?.columns?.column_names ?? {};
    const productionRelationId: string = relation.id;

    // 3. Repoint the existing relation to production (skipped if a prior run already did it).
    if (relation.environment_id === development.id) {
      await appManager.query(`UPDATE internal_table_relations SET environment_id = $1 WHERE id = $2`, [
        production.id,
        productionRelationId,
      ]);
    }

    // 4. Insert the empty development twin. Configurations + baseline_error copied verbatim - the
    // twin carries the same column identity, and a baseline_error table still gets a twin (it just
    // cannot be promoted until task 7 repairs it).
    await appManager.query(
      `INSERT INTO internal_table_relations
         (id, internal_table_id, environment_id, branch_id, configurations, baseline_error, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (internal_table_id, environment_id, branch_id) DO NOTHING`,
      [
        uuidv4(),
        relation.internal_table_id,
        development.id,
        relation.branch_id,
        relation.configurations,
        relation.baseline_error,
      ]
    );

    const [developmentRelation] = await appManager.query(
      `SELECT id FROM internal_table_relations
       WHERE internal_table_id = $1 AND environment_id = $2 AND branch_id = $3`,
      [relation.internal_table_id, development.id, relation.branch_id]
    );
    if (!developmentRelation) return null;
    // The uuid minted for the INSERT above loses to an existing twin via this re-read, by design -
    // the returned id and the minted uuid can differ on a re-run.
    const developmentRelationId: string = developmentRelation.id;

    // 5. Materialize the physical twin from the production table's shape. LIKE needs no portability
    // (same schema), so it is not gated on the portable baseline. IF NOT EXISTS: a prior run may
    // have created it before crashing. A crash between this CREATE TABLE and the caller's SAVEPOINT
    // release orphans a uuid-named physical table with no relation row - garbage to be swept, never
    // corruption; the relation writes are already committed and the re-run repairs from there.
    await tjdbQueryRunner.query(
      `CREATE TABLE IF NOT EXISTS "${schema}"."${developmentRelationId}" (LIKE "${schema}"."${productionRelationId}" INCLUDING ALL)`
    );

    // 6. LIKE INCLUDING ALL copies serial columns' DEFAULT verbatim - still pointing at the
    // production table's sequence. Rewrite each to a fresh sequence owned by the twin, or a
    // development insert would advance production's counter.
    await this.rewriteTwinSerialDefaults(
      tjdbQueryRunner,
      schema,
      productionRelationId,
      developmentRelationId,
      columnNames
    );

    // 7. Tick the baseline create migration against the twin so a later dev->production promote sees
    // a non-empty confirmed set. Raw insert on `appManager` (not the recorder, which writes through
    // its own pool) - mirrors migration A's own application-row insert. A baseline_error table has
    // no baseline migration rows and is skipped.
    const [createMigration] = await appManager.query(
      `SELECT id FROM internal_table_migrations
       WHERE internal_table_id = $1 AND kind = 'baseline' AND sequence = 1`,
      [relation.internal_table_id]
    );
    if (createMigration) {
      await appManager.query(
        `INSERT INTO internal_table_migration_applications (migration_id, relation_id, applied_at)
         VALUES ($1, $2, now())
         ON CONFLICT (migration_id, relation_id) DO NOTHING`,
        [createMigration.id, developmentRelationId]
      );
    }

    return { productionRelationId, developmentRelationId };
  }

  private async rewriteTwinSerialDefaults(
    tjdbQueryRunner: QueryRunner,
    schema: string,
    productionRelationId: string,
    developmentRelationId: string,
    columnNames: Record<string, string>
  ): Promise<void> {
    const snapshot = await buildTableSchemaSnapshot(tjdbQueryRunner, schema, developmentRelationId, columnNames);
    // Match against the production relation id - that is the sequence name LIKE copied in. On a
    // re-run the defaults already point at the twin, so nothing matches and this is a no-op.
    const { columns, sequenceDdl, ownershipDdl } = rewriteSerialDefaults(
      schema,
      productionRelationId,
      snapshot.columns
    );

    const substitute = (ddl: string) => ddl.replace(/\{\{self\}\}/g, developmentRelationId);

    for (const statement of sequenceDdl) {
      await tjdbQueryRunner.query(substitute(statement.replace('CREATE SEQUENCE ', 'CREATE SEQUENCE IF NOT EXISTS ')));
    }
    for (let index = 0; index < columns.length; index++) {
      const rewritten = columns[index];
      if (rewritten.default === snapshot.columns[index].default) continue;
      await tjdbQueryRunner.query(
        `ALTER TABLE "${schema}"."${developmentRelationId}" ALTER COLUMN "${rewritten.name}" SET DEFAULT ${substitute(
          rewritten.default
        )}`
      );
    }
    for (const statement of ownershipDdl) {
      await tjdbQueryRunner.query(substitute(statement));
    }
  }
}
