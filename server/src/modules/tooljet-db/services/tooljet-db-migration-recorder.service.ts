import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, In, IsNull, QueryRunner } from 'typeorm';
import { isEmpty } from 'lodash';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { InternalTableMigrationApplication } from '@entities/internal_table_migration_application.entity';
import { RequestContext } from '@modules/request-context/service';
import { findTenantSchema } from 'src/helpers/tooljet_db.helper';
import { buildTableSchemaSnapshot, TableSchemaSnapshot } from '../helpers/table-schema-snapshot';
import { TooljetDbRelationResolverService } from './relation-resolver.service';
import { TooljetDbActions } from '../types';

/**
 * What record() persists: which of the nine structured ops this is, and the exact request it was
 * given. The action is what lets adjudicatePending (and, later, reverse generation) pick the right
 * question to ask of a payload it otherwise cannot interpret.
 */
export interface StructuredMigrationPayload<TRequest = any> {
  action: TooljetDbActions;
  request: TRequest;
}

function columnNamed(snapshot: TableSchemaSnapshot, name: string) {
  return snapshot.columns.find((column) => column.name === name);
}

function sameColumnSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((name) => set.has(name));
}

function foreignKeyMatches(
  snapshot: TableSchemaSnapshot,
  request: { column_names: string[]; referenced_column_names: string[] }
) {
  return snapshot.foreign_keys.some(
    (fk) =>
      sameColumnSet(fk.column_names, request.column_names) &&
      sameColumnSet(fk.referenced_column_names, request.referenced_column_names)
  );
}

/**
 * One predicate per structured op, keyed the same way TooljetDbTableOperationsService.getActionHandler
 * is. Each asks the recorded request's own question of a live introspection snapshot: "does the
 * table now look like this request was applied?" Sound only while the migration being adjudicated
 * is the most recent thing that happened to this relation - the same contiguity assumption every
 * other snapshot use in this module relies on.
 *
 * Foreign key predicates compare column-name sets only, never the referenced table's identity: the
 * referenced_table a snapshot reports is a physical relation id, and resolving a logical table name
 * to one requires a workspace-scoped lookup a pure predicate does not have. A false-positive confirm
 * here (right columns, wrong referenced table) is not reachable in practice - fetchAndCheckIfValid
 * ForeignKeyTables validates the payload before create_foreign_key/update_foreign_key ever run.
 */
export const ADJUDICATION_PREDICATES: Partial<
  Record<TooljetDbActions, (request: any, snapshot: TableSchemaSnapshot) => boolean>
> = {
  create_table: (request, snapshot) =>
    request.columns.every((column: any) => !!columnNamed(snapshot, column.column_name)),

  // An empty column list only ever happens when the relation itself is gone - Postgres has no way
  // to have a real table with zero columns.
  drop_table: (_request, snapshot) => snapshot.columns.length === 0,

  add_column: (request, snapshot) => !!columnNamed(snapshot, request.column.column_name),

  drop_column: (request, snapshot) => !columnNamed(snapshot, request.column.column_name),

  edit_table: (request, snapshot) =>
    (request.columns as Array<{ old_column?: any; new_column?: any }>).every(({ old_column, new_column }) => {
      const deletedOrRenamed =
        !isEmpty(old_column) && (isEmpty(new_column) || old_column.column_name !== new_column.column_name);
      if (deletedOrRenamed && columnNamed(snapshot, old_column.column_name)) return false;
      if (!isEmpty(new_column) && !columnNamed(snapshot, new_column.column_name)) return false;
      return true;
    }),

  edit_column: (request, snapshot) => {
    const { column } = request;
    const renamed = column.new_column_name && column.new_column_name !== column.column_name;
    if (renamed && columnNamed(snapshot, column.column_name)) return false;
    return !!columnNamed(snapshot, column.new_column_name || column.column_name);
  },

  create_foreign_key: (request, snapshot) =>
    (request.foreign_keys as any[]).every((fk) => foreignKeyMatches(snapshot, fk)),

  update_foreign_key: (request, snapshot) =>
    !snapshot.foreign_keys.some((fk) => fk.name === request.foreign_key_id) &&
    (request.foreign_keys as any[]).every((fk) => foreignKeyMatches(snapshot, fk)),

  delete_foreign_key: (request, snapshot) => !snapshot.foreign_keys.some((fk) => fk.name === request.foreign_key_id),
};

/**
 * Owns the two-table bookkeeping around a structured migration: the migration row itself and its
 * pending application. Real in CE - the chain is not a licensed feature, only promotion is.
 *
 * `record` inserts both rows before the caller runs any DDL, with `resulting_schema` left NULL and
 * `applied_at` left NULL; `confirm` fills both in once the DDL has actually run; `discard` removes
 * both if it didn't. This is the same NULL-means-pending contract the applications table already
 * documents - a crash between record() and confirm()/discard() leaves a row adjudicatePending()
 * resolves the next time this relation is touched.
 */
@Injectable()
export class TooljetDbMigrationRecorderService {
  constructor(
    protected readonly manager: EntityManager,
    @InjectEntityManager('tooljetDb')
    protected readonly tooljetDbManager: EntityManager,
    protected readonly relationResolverService: TooljetDbRelationResolverService
  ) {}

  /**
   * Inserts the migration and its pending application. Runs in its own committed transaction unless
   * `manager` is passed - create_table already opens its own app-DB transaction and must fold this
   * write into it, so its commit and the relation/table-registry writes stay atomic together.
   * Every other structured op records after its own DDL has already committed, so it takes no
   * manager and commits this write immediately.
   */
  async record(
    payload: StructuredMigrationPayload,
    internalTable: InternalTable,
    relation: InternalTableRelation,
    manager?: EntityManager
  ): Promise<InternalTableMigration> {
    const write = (entityManager: EntityManager) =>
      this.insertPendingMigration(payload, internalTable, relation, entityManager);

    if (manager) return write(manager);
    return this.manager.transaction((transactionManager) => write(transactionManager));
  }

  private async insertPendingMigration(
    payload: StructuredMigrationPayload,
    internalTable: InternalTable,
    relation: InternalTableRelation,
    entityManager: EntityManager
  ): Promise<InternalTableMigration> {
    const sequence = await this.nextSequence(internalTable.id, entityManager);
    const branchId = await this.relationResolverService.resolveBranchIdFor(internalTable.organizationId, entityManager);

    const migration = entityManager.create(InternalTableMigration, {
      internalTableId: internalTable.id,
      sequence: String(sequence),
      branchId,
      kind: 'structured',
      payload,
      resultingSchema: null,
      tooljetVersion: globalThis.TOOLJET_VERSION || null,
      createdBy: (RequestContext.currentContext?.req as any)?.user?.id ?? null,
    });
    await entityManager.save(migration);

    await entityManager.save(
      entityManager.create(InternalTableMigrationApplication, {
        migrationId: migration.id,
        relationId: relation.id,
        appliedAt: null,
      })
    );

    return migration;
  }

  /**
   * A timestamp, not a counter: `now()` wins whenever it is already past the table's highest
   * recorded sequence, which is always true for the first real migration after the rollout
   * baselines (sequence 1/2). The `max + 1` fallback only matters for several migrations recorded
   * within the same request, where `Date.now()` would otherwise repeat. Scoped per table, not per
   * workspace - two different tables recording at the same millisecond is not a collision.
   */
  private async nextSequence(internalTableId: string, entityManager: EntityManager): Promise<number> {
    const [{ max }] = await entityManager.query(
      `SELECT MAX(sequence) AS max FROM internal_table_migrations WHERE internal_table_id = $1`,
      [internalTableId]
    );
    const highest = max === null ? 0 : Number(max);
    const now = Date.now();
    return now > highest ? now : highest + 1;
  }

  /**
   * Introspects the relation and writes what it found as this migration's resulting_schema,
   * marking the application applied in the same pair of writes. Looks the owning internal table up
   * by id rather than taking it as a parameter - drop_table's confirm runs after the registry row
   * is already soft-deleted, so the lookup has to tolerate that.
   */
  async confirm(
    migration: InternalTableMigration,
    relation: InternalTableRelation,
    tjdbQueryRunner: QueryRunner
  ): Promise<void> {
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { id: migration.internalTableId },
      withDeleted: true,
    });
    const schema = findTenantSchema(internalTable.organizationId);
    const columnNames = relation.configurations?.columns?.column_names ?? {};
    const resultingSchema = await buildTableSchemaSnapshot(tjdbQueryRunner, schema, relation.id, columnNames);

    await this.manager.update(
      InternalTableMigration,
      { id: migration.id },
      { resultingSchema: resultingSchema as any }
    );
    await this.manager.update(
      InternalTableMigrationApplication,
      { migrationId: migration.id, relationId: relation.id },
      { appliedAt: new Date() }
    );
  }

  /**
   * Removes both rows recorded for a migration that never actually happened. Never wraps or
   * swallows what it's given - callers invoke this from a DDL catch block and must go on to rethrow
   * the real Postgres error, not whatever this cleanup itself produces.
   */
  async discard(migration: InternalTableMigration, relation: InternalTableRelation): Promise<void> {
    await this.manager.delete(InternalTableMigrationApplication, {
      migrationId: migration.id,
      relationId: relation.id,
    });
    await this.manager.delete(InternalTableMigration, { id: migration.id });
  }

  /**
   * Crash recovery: resolves every application still pending against this relation by asking each
   * migration's own recorded request whether the live table now matches it. One introspection
   * covers every pending row, since they are all being judged against the same current shape.
   */
  async adjudicatePending(internalTable: InternalTable, relation: InternalTableRelation): Promise<void> {
    const pendingApplications = await this.manager.find(InternalTableMigrationApplication, {
      where: { relationId: relation.id, appliedAt: IsNull() },
    });
    if (!pendingApplications.length) return;

    const pendingMigrations = await this.manager.find(InternalTableMigration, {
      where: { id: In(pendingApplications.map((application) => application.migrationId)) },
    });

    const schema = findTenantSchema(internalTable.organizationId);
    const columnNames = relation.configurations?.columns?.column_names ?? {};
    const tjdbQueryRunner = this.tooljetDbManager.connection.createQueryRunner();
    await tjdbQueryRunner.connect();
    try {
      const snapshot = await buildTableSchemaSnapshot(tjdbQueryRunner, schema, relation.id, columnNames);

      for (const migration of pendingMigrations) {
        const payload = migration.payload as StructuredMigrationPayload;
        const predicate = ADJUDICATION_PREDICATES[payload?.action];
        const matches = predicate ? predicate(payload.request, snapshot) : false;

        if (matches) {
          await this.confirm(migration, relation, tjdbQueryRunner);
        } else {
          await this.discard(migration, relation);
        }
      }
    } finally {
      await tjdbQueryRunner.release();
    }
  }
}
