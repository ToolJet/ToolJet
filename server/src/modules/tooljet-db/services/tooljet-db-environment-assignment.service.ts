import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, QueryRunner } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { findTenantSchema, isSQLModeDisabled, transferTableOwnershipToTenant } from 'src/helpers/tooljet_db.helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { InternalTableMigration, InternalTableMigrationKind } from '@entities/internal_table_migration.entity';
import { buildTableSchemaSnapshot } from '../helpers/table-schema-snapshot';
import { BaselineMigration, rewriteSerialDefaults, synthesizeBaseline } from '../helpers/baseline-synthesis';
import { TooljetDbMigrationRecorderService } from './tooljet-db-migration-recorder.service';
import { computeMissingMigrations } from './tooljet-db-promote.service';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';

type AssignmentResult = { productionRelationId: string; developmentRelationId: string };

export type RepairBaselineResult = { baseline_error: null; migrations_recorded: number };

export type BaselineErrorRow = {
  tableId: string;
  tableName: string;
  environmentId: string;
  environmentName: string;
  baselineError: string;
};

export type TableMigrationChainEntry = {
  id: string;
  kind: InternalTableMigrationKind;
  name: string | null;
  sequence: string;
  createdAt: Date;
  createdBy: string | null;
};

export type EnvironmentMigrationState = {
  environmentId: string;
  environmentName: string;
  appliedMigrationIds: string[];
  baselineError: string | null;
};

export type TableMigrationsResult = {
  migrations: TableMigrationChainEntry[];
  environments: EnvironmentMigrationState[];
};

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
  constructor(
    private readonly manager: EntityManager,
    @InjectEntityManager('tooljetDb')
    private readonly tooljetDbManager: EntityManager,
    private readonly migrationRecorderService: TooljetDbMigrationRecorderService,
    private readonly licenseTermsService: LicenseTermsService
  ) {}

  /**
   * Re-attempts `synthesizeBaseline` for a table carrying `baseline_error`, never classifies
   * repairability up front — some reasons are stale state that's since been fixed, some (a missing
   * physical relation) never will be, and the only honest way to tell them apart is to try again.
   *
   * Targets whichever of the table's relations actually holds the data: the highest-priority one.
   * For a table created after the rollout there is exactly one relation (development, since
   * `create_table` always resolves with no environment named); for a table migration B repointed,
   * that's production — the empty `LIKE`-cloned development twin is a structural copy, never the
   * source of truth for "what does this table actually look like right now".
   *
   * No licence gate (Task 7, step 3) — real logic in CE. An unlicensed workspace needs this most:
   * buying a licence later should not leave them with a table they still can't promote.
   */
  async repairBaseline(internalTableId: string, organizationId: string): Promise<RepairBaselineResult> {
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { id: internalTableId, organizationId },
    });
    if (!internalTable) throw new NotFoundException('Table not found');

    // Branching is not shipped for TJDB yet, but scope to the default branch anyway rather than
    // reduce across every branch this table happens to have relations on — matches how promote's
    // own resolveSourceAndTarget pins branch_id before doing anything else.
    const defaultBranch = await this.manager.findOne(WorkspaceBranch, { where: { organizationId, isDefault: true } });
    if (!defaultBranch) throw new NotFoundException('Workspace has no default branch');

    const relations = await this.manager.find(InternalTableRelation, {
      where: { internalTableId, branchId: defaultBranch.id },
    });
    if (!relations.length) throw new NotFoundException('Table has no relation to repair');

    const environments = await this.manager.find(AppEnvironment, { where: { organizationId } });
    const priorityById = new Map(environments.map((environment) => [environment.id, Number(environment.priority)]));
    const dataRelation = relations.reduce((highest, current) =>
      (priorityById.get(current.environmentId) ?? -1) > (priorityById.get(highest.environmentId) ?? -1)
        ? current
        : highest
    );

    // Idempotent: nothing to repair if this relation's chain is already intact. Without this guard
    // a second call (or a call on a table that was never broken) would re-synthesize and insert a
    // duplicate baseline chain — there is no uniqueness constraint on (internal_table_id, sequence)
    // to catch it.
    if (dataRelation.baselineError === null) {
      return { baseline_error: null, migrations_recorded: 0 };
    }

    const schema = findTenantSchema(organizationId);
    const queryRunner = this.manager.connection.createQueryRunner();
    const tjdbQueryRunner = this.tooljetDbManager.connection.createQueryRunner();
    await queryRunner.connect();
    await tjdbQueryRunner.connect();
    try {
      let migrations: BaselineMigration[];
      try {
        migrations = await synthesizeBaseline(
          queryRunner,
          tjdbQueryRunner,
          schema,
          dataRelation.id,
          dataRelation.configurations
        );
      } catch (error) {
        await this.manager.update(InternalTableRelation, { id: dataRelation.id }, { baselineError: error.message });
        throw new BadRequestException(error.message);
      }

      await this.manager.transaction(async (transactionManager) => {
        for (const migration of migrations) {
          const saved = await transactionManager.save(
            transactionManager.create(InternalTableMigration, {
              internalTableId,
              sequence: String(migration.sequence),
              branchId: dataRelation.branchId,
              kind: 'baseline',
              payload: migration.payload,
              resultingSchema: migration.resultingSchema,
              tooljetVersion: globalThis.TOOLJET_VERSION || null,
            })
          );
          await this.migrationRecorderService.recordApplications([saved.id], dataRelation, transactionManager);
          await this.migrationRecorderService.confirmApplications([saved.id], dataRelation, transactionManager);
        }
        // Every relation for this table, not just the one just repaired — a baseline_error on the
        // migration-B twin (copied verbatim from the relation this just re-baselined) describes the
        // same table, and is equally stale now that the chain exists.
        await transactionManager.update(InternalTableRelation, { internalTableId }, { baselineError: null });
      });

      return { baseline_error: null, migrations_recorded: migrations.length };
    } finally {
      await queryRunner.release();
      await tjdbQueryRunner.release();
    }
  }

  /**
   * Every relation in the organization currently carrying a `baseline_error` — the un-actioned
   * counterpart to `repairBaseline`. Pure read: lists what needs repair, doesn't attempt it.
   *
   * Named/exported so a sibling read (e.g. gating raw SQL migrations on a clean baseline) can reuse
   * this same `baseline_error IS NOT NULL` predicate instead of re-deriving it.
   */
  async listBaselineErrors(organizationId: string): Promise<BaselineErrorRow[]> {
    return this.manager
      .createQueryBuilder(InternalTableRelation, 'relation')
      .innerJoin(InternalTable, 'table', 'table.id = relation.internal_table_id')
      .innerJoin(AppEnvironment, 'environment', 'environment.id = relation.environment_id')
      .where('table.organization_id = :organizationId', { organizationId })
      .andWhere('table.deleted_at IS NULL')
      .andWhere('relation.baseline_error IS NOT NULL')
      .select('table.id', 'tableId')
      .addSelect('table.table_name', 'tableName')
      .addSelect('environment.id', 'environmentId')
      .addSelect('environment.name', 'environmentName')
      .addSelect('relation.baseline_error', 'baselineError')
      .getRawMany();
  }

  /**
   * One table's full migration chain plus, per environment, which of those migrations are confirmed
   * applied there and whether that environment's relation carries a `baseline_error`.
   *
   * "Applied on environment X" is never re-derived here — `computeMissingMigrations` already answers
   * it: called with `targetRelation: null` it drops the anti-join and returns X's entire confirmed
   * set (see its own doc comment), which is exactly "applied so far", not a diff. An environment with
   * no relation yet (never promoted to) reports an empty applied set and no baseline error, the same
   * "nothing confirmed" meaning a null relation already carries there.
   *
   * The baseline-error reason reuses `listBaselineErrors`'s column/join shape, scoped to this table's
   * relations instead of the whole organization, rather than a second `baseline_error` query shape.
   */
  async getTableMigrations(internalTableId: string, organizationId: string): Promise<TableMigrationsResult> {
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { id: internalTableId, organizationId },
    });
    if (!internalTable) throw new NotFoundException('Table not found');

    const migrations = await this.manager.find(InternalTableMigration, {
      where: { internalTableId },
      order: { sequence: 'ASC', id: 'ASC' },
    });

    // Same gate viewTables() uses: every org has all app_environments rows seeded regardless of
    // license, so an unlicensed org must have the extra rows filtered here, not at row-creation time.
    const multiEnvironmentEnabled = await this.licenseTermsService.getLicenseTerms(
      LICENSE_FIELD.MULTI_ENVIRONMENT,
      organizationId
    );
    const allEnvironments = await this.manager.find(AppEnvironment, { where: { organizationId } });
    const environments = multiEnvironmentEnabled
      ? allEnvironments
      : allEnvironments.filter((environment) => environment.priority === 1);
    const relations = await this.manager.find(InternalTableRelation, { where: { internalTableId } });
    const relationByEnvironmentId = new Map(relations.map((relation) => [relation.environmentId, relation]));

    const environmentStates = await Promise.all(
      environments.map(async (environment): Promise<EnvironmentMigrationState> => {
        const relation = relationByEnvironmentId.get(environment.id);
        const appliedMigrations = relation
          ? await computeMissingMigrations(internalTableId, relation, null, this.manager)
          : [];
        return {
          environmentId: environment.id,
          environmentName: environment.name,
          appliedMigrationIds: appliedMigrations.map((migration) => migration.id),
          baselineError: relation?.baselineError ?? null,
        };
      })
    );

    return {
      migrations: migrations.map((migration) => ({
        id: migration.id,
        kind: migration.kind,
        name: migration.name,
        sequence: migration.sequence,
        createdAt: migration.createdAt,
        createdBy: migration.createdBy,
      })),
      environments: environmentStates,
    };
  }

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

    if (!isSQLModeDisabled()) {
      await transferTableOwnershipToTenant(tjdbQueryRunner, schema, developmentRelationId, `user_${organizationId}`);
    }

    // 6. LIKE INCLUDING ALL copies serial columns' DEFAULT verbatim - still pointing at the
    // production table's sequence. Rewrite each to a fresh sequence owned by the twin, or a
    // development insert would advance production's counter.
    await this.rewriteTwinSerialDefaults(
      tjdbQueryRunner,
      schema,
      productionRelationId,
      developmentRelationId,
      columnNames,
      organizationId
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
    columnNames: Record<string, string>,
    organizationId: string
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
      const createStatement = substitute(statement.replace('CREATE SEQUENCE ', 'CREATE SEQUENCE IF NOT EXISTS '));
      await tjdbQueryRunner.query(createStatement);

      // The sequence is created as the TJDB admin (this connection), never the twin table's new
      // owner (Task B0) - `ALTER SEQUENCE ... OWNED BY` below requires both to match, or Postgres
      // refuses with "sequence must have same owner as table it is linked to". Skipped, same as
      // transferTableOwnershipToTenant, when the tenant role doesn't exist (pre-per-tenant-role
      // workspace) - the twin table's own transfer above already left it admin-owned in that case,
      // so leaving the sequence admin-owned too keeps them matching.
      if (!isSQLModeDisabled()) {
        const dbUser = `user_${organizationId}`;
        const [role] = await tjdbQueryRunner.query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [dbUser]);
        if (role) {
          const sequenceName = createStatement.replace('CREATE SEQUENCE IF NOT EXISTS ', '');
          await tjdbQueryRunner.query(`ALTER SEQUENCE ${sequenceName} OWNER TO "${dbUser}"`);
        }
      }
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
