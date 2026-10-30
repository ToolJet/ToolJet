import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { isUUID } from 'class-validator';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { TooljetDbRelationConfigurations } from '../types';

const DEVELOPMENT_PRIORITY = 1;

/** The one wording for "owned table, but not promoted into this (environment, branch)". Names, never logical ids. */
export function tableNotInEnvironmentMessage(tableNames: string[]): string {
  return tableNames.length === 1
    ? `Table "${tableNames[0]}" has no relation in this environment`
    : `Tables "${tableNames.join('", "')}" have no relation in this environment`;
}

export interface ResolveOptions {
  /** Export reads (proxy GET/HEAD): an environment the licence no longer covers may still be named. */
  readOnly?: boolean;
}

/**
 * Resolves (logical table id, environment, branch) -> physical relation name.
 *
 * Real in CE, not a stub: a relation id is the only way to name a physical table, so an EE-only
 * resolver would leave CE nothing to resolve to. The licence gate lives in
 * AppEnvironmentUtilService.resolveEnvironmentId and is shared by both editions; the EE subclass
 * of this service exists only to satisfy the same-path service rule, not to override this behaviour.
 *
 * Fail-closed contract: an id the caller does not own, or that has no relation in this
 * (environment, branch), is OMITTED from the returned map. It is never passed through un-rewritten.
 * The caller decides the status code, because only the caller knows the position the id came from.
 */
@Injectable()
export class TooljetDbRelationResolverService {
  constructor(
    protected readonly manager: EntityManager,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly licenseTermsService: LicenseTermsService
  ) {}

  /**
   * An unlicensed workspace always resolves to development (resolveEnvironmentId's contract), so a
   * request that names no environment - every released app's bare run route - resolves cleanly
   * against development even when development is empty and the workspace's real data sits at a
   * higher, unreachable priority. That is 200 with zero rows: indistinguishable from data loss.
   * AppEnvironmentUtilService only refuses an EXPLICIT non-development request, and must not grow
   * this TJDB-shaped rule - it is shared with apps. So the sibling check lives here instead, folded
   * into the bulk relation lookup below (join in the priority, no second query) rather than costing
   * a per-request round trip of its own.
   */
  async resolve(
    organizationId: string,
    logicalTableIds: string[],
    requestedEnvironmentId?: string,
    manager?: EntityManager,
    options: ResolveOptions = {}
  ): Promise<Map<string, string>> {
    const entityManager = manager || this.manager;
    const environmentId = await this.resolveEnvironment(
      organizationId,
      requestedEnvironmentId,
      entityManager,
      options.readOnly
    );

    if (!logicalTableIds.length) return new Map();

    const branchId = await this.resolveBranch(organizationId, entityManager);

    const rows = await entityManager
      .createQueryBuilder(InternalTableRelation, 'relation')
      .innerJoin('internal_tables', 'it', 'it.id = relation.internal_table_id')
      .innerJoin('app_environments', 'ae', 'ae.id = relation.environment_id')
      .where('relation.internal_table_id IN (:...ids)', { ids: logicalTableIds })
      .andWhere('relation.branch_id = :branchId', { branchId })
      .andWhere('it.organization_id = :organizationId', { organizationId })
      .andWhere('it.deleted_at IS NULL')
      .select('relation.id', 'relationId')
      .addSelect('relation.internal_table_id', 'internalTableId')
      .addSelect('relation.environment_id', 'environmentId')
      .addSelect('ae.priority', 'priority')
      .getRawMany<{ relationId: string; internalTableId: string; environmentId: string; priority: number }>();

    const resolved = new Map<string, string>();
    let isUnlicensed: boolean | undefined;

    for (const tableId of logicalTableIds) {
      const rowsForTable = rows.filter((row) => row.internalTableId === tableId);
      const resolvedRow = rowsForTable.find((row) => row.environmentId === environmentId);
      if (!resolvedRow) continue;

      resolved.set(tableId, resolvedRow.relationId);

      // Only the row migration B re-pointed upward (id === logical id) holds the data above an empty
      // development twin. A promoted table's higher relations are schema-only replays; development
      // stays its source of truth, so it keeps serving after a lapse.
      const resolvedToDevelopment = resolvedRow.priority === DEVELOPMENT_PRIORITY;
      const hasLegacyRelationAboveDevelopment = rowsForTable.some(
        (row) => row.priority > DEVELOPMENT_PRIORITY && row.relationId === tableId
      );
      if (!resolvedToDevelopment || !hasLegacyRelationAboveDevelopment) continue;

      isUnlicensed ??= !(await this.licenseTermsService.getLicenseTerms(
        LICENSE_FIELD.MULTI_ENVIRONMENT,
        organizationId
      ));
      if (isUnlicensed) {
        throw new ForbiddenException(
          'Multi-environment is not enabled for this organization. Please contact the super admin.'
        );
      }
    }

    const unresolved = logicalTableIds.filter((tableId) => !resolved.has(tableId));
    for (const tableId of await this.tablesWithoutRelations(organizationId, unresolved, entityManager)) {
      resolved.set(tableId, tableId);
    }

    return resolved;
  }

  /**
   * Live tables among `tableIds` with no relation on any branch or environment. Their data sits in the
   * physical table named by their own id, the relation migration A writes: during an async upgrade's
   * data phase, until A commits, and for a table the previous release created during a rollback.
   * After A, every table has a relation, so a table missing only from this environment stays omitted.
   */
  async tablesWithoutRelations(organizationId: string, tableIds: string[], manager: EntityManager): Promise<string[]> {
    // Callers pass physical names and request input too; only a uuid can be a table id.
    tableIds = tableIds.filter((tableId) => isUUID(tableId));
    if (!tableIds.length) return [];
    const rows: { id: string }[] = await manager.query(
      `SELECT it.id FROM internal_tables it
       WHERE it.id = ANY($1::uuid[]) AND it.organization_id = $2 AND it.deleted_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM internal_table_relations r WHERE r.internal_table_id = it.id)`,
      [tableIds, organizationId]
    );
    return rows.map((row) => row.id);
  }

  /**
   * Reverse of resolve(): relation id -> logical table id. No environment/branch predicate — a
   * relation id is already unique and implies both, so adding them would reject exactly the
   * cross-environment foreign keys this exists to report. Same fail-closed contract as resolve():
   * a relation id the workspace does not own is omitted from the map, never passed through.
   */
  async resolveLogicalIds(
    organizationId: string,
    relationIds: string[],
    manager?: EntityManager
  ): Promise<Map<string, string>> {
    const entityManager = manager || this.manager;
    if (!relationIds.length) return new Map();

    const relations = await entityManager
      .createQueryBuilder(InternalTableRelation, 'relation')
      .innerJoin('internal_tables', 'it', 'it.id = relation.internal_table_id')
      .where('relation.id IN (:...ids)', { ids: relationIds })
      .andWhere('it.organization_id = :organizationId', { organizationId })
      .andWhere('it.deleted_at IS NULL')
      .getMany();

    const logicalIds = new Map(relations.map((relation) => [relation.id, relation.internalTableId]));
    const unresolved = relationIds.filter((relationId) => !logicalIds.has(relationId));
    for (const tableId of await this.tablesWithoutRelations(organizationId, unresolved, entityManager)) {
      logicalIds.set(tableId, tableId);
    }
    return logicalIds;
  }

  async getRelation(
    organizationId: string,
    internalTableId: string,
    requestedEnvironmentId?: string,
    manager?: EntityManager
  ): Promise<InternalTableRelation> {
    const entityManager = manager || this.manager;
    // Through resolve() so the single-table path gets the same licence-lapse 403 - never a silent
    // fall-through to development for a table that also lives in a higher environment.
    const relationId = (
      await this.resolve(organizationId, [internalTableId], requestedEnvironmentId, entityManager)
    ).get(internalTableId);
    let relation = relationId && (await entityManager.findOne(InternalTableRelation, { where: { id: relationId } }));
    if (!relation && relationId === internalTableId) {
      // resolve() mapped a table with no relations to itself - build the row migration A will write.
      const [table] = await entityManager.query(
        `SELECT configurations FROM internal_tables WHERE id = $1 AND organization_id = $2`,
        [internalTableId, organizationId]
      );
      if (table)
        relation = entityManager.create(InternalTableRelation, {
          id: internalTableId,
          internalTableId,
          configurations: table.configurations,
        });
    }

    if (!relation) {
      const internalTable = await entityManager.findOne(InternalTable, {
        where: { id: internalTableId, organizationId },
        select: ['tableName'],
      });
      throw new NotFoundException(
        internalTable ? tableNotInEnvironmentMessage([internalTable.tableName]) : 'Table not found in this environment'
      );
    }
    return relation;
  }

  /**
   * Inverts relation.configurations.columns.column_names (name -> uuid) to find the name a
   * column uuid currently maps to. Read-only: does not throw for a uuid the relation no longer
   * has (column deleted/renamed away) - callers decide how to handle that, same fail-closed-to-
   * caller spirit as resolve()/resolveLogicalIds() above.
   */
  async resolveColumnName(
    organizationId: string,
    internalTableId: string,
    columnUuid: string,
    requestedEnvironmentId?: string,
    manager?: EntityManager
  ): Promise<string | null> {
    return (
      (
        await this.resolveColumnNames(organizationId, internalTableId, [columnUuid], requestedEnvironmentId, manager)
      ).get(columnUuid) ?? null
    );
  }

  /**
   * Batch variant of resolveColumnName(): one getRelation() load, resolve every uuid against it.
   * Use from call sites needing more than one column resolved per operation (update_rows with
   * several columns, join_tables with both sides) to avoid N relation loads per operation.
   */
  async resolveColumnNames(
    organizationId: string,
    internalTableId: string,
    columnUuids: string[],
    requestedEnvironmentId?: string,
    manager?: EntityManager
  ): Promise<Map<string, string | null>> {
    const relation = await this.getRelation(organizationId, internalTableId, requestedEnvironmentId, manager);
    const configurations = relation.configurations as TooljetDbRelationConfigurations;
    const columnNames: Record<string, string> = configurations?.columns?.column_names || {};
    const uuidToName = new Map<string, string>();
    for (const [name, uuid] of Object.entries(columnNames)) {
      uuidToName.set(uuid, name);
    }

    const resolved = new Map<string, string | null>();
    for (const columnUuid of columnUuids) {
      resolved.set(columnUuid, uuidToName.get(columnUuid) ?? null);
    }
    return resolved;
  }

  /**
   * Unlicensed workspaces resolve to priority 1 and a request that NAMES another environment is
   * refused rather than answered from development — resolveEnvironmentId already does exactly that.
   *
   * A read-only request may name an environment the licence no longer covers: a lapse disables
   * promotion and writes there, never access to the data already in it. The id needs no ownership
   * check of its own - resolve()'s join on the table's workspace matches nothing for a foreign id.
   */
  protected async resolveEnvironment(
    organizationId: string,
    requestedEnvironmentId: string | undefined,
    manager: EntityManager,
    readOnly = false
  ): Promise<string> {
    if (readOnly && requestedEnvironmentId) return requestedEnvironmentId;
    return this.appEnvironmentUtilService.resolveEnvironmentId(organizationId, requestedEnvironmentId, manager);
  }

  /**
   * Today every relation is written against the workspace default branch and this always resolves
   * to it - branch is written everywhere but never read as a discriminator yet. The predicate
   * exists as the one seam a future branch-aware caller (user.branchId) needs to change, not a
   * dead abstraction. CE's WorkspaceBranchService is a NotFoundException stub — do not call it.
   */
  protected async resolveBranch(organizationId: string, manager: EntityManager): Promise<string> {
    const branch = await manager.findOne(WorkspaceBranch, {
      where: { organizationId, isDefault: true },
    });

    if (!branch) throw new NotFoundException('Workspace has no default branch');
    return branch.id;
  }

  // Thin wrappers so create_table can place a new relation without duplicating the rules above.
  async resolveEnvironmentIdFor(organizationId: string, manager?: EntityManager): Promise<string> {
    return this.resolveEnvironment(organizationId, undefined, manager || this.manager);
  }

  async resolveBranchIdFor(organizationId: string, manager?: EntityManager): Promise<string> {
    return this.resolveBranch(organizationId, manager || this.manager);
  }

  /**
   * Given a co_relation_id (git-sync's cross-instance identity for a logical table, not this
   * table's own environment/branch) and the (environment, branch) of a relation already in hand,
   * finds that other table's relation in the exact same (environment, branch). This is a direct
   * sibling lookup, not resolveEnvironment/resolveBranch's priority-1/licence-aware resolution -
   * for a foreign key embedded in a payload that already pins the environment and branch it targets
   * (apply() applying create_table/add_column), re-deriving "the current environment" would be
   * wrong the moment more than one relation exists for a table.
   *
   * Sets the returned relation's `internalTable` (declared on the entity, not eager-loaded here)
   * so callers that also need the logical table's name - e.g. for error messages - don't have to
   * issue a second lookup for it.
   */
  async resolveSiblingByCoRelationId(
    organizationId: string,
    coRelationId: string,
    environmentId: string,
    branchId: string,
    manager?: EntityManager
  ): Promise<InternalTableRelation> {
    // A falsy coRelationId (undefined/null/'') must fail closed here, not reach the query: TypeORM
    // drops an undefined or null property from the WHERE clause instead of filtering on it, so
    // `findOne` would return whatever row comes first for this organizationId, wiring a foreign key
    // or {{table.x}} raw SQL reference to an arbitrary, unrelated table instead of failing loudly.
    if (!coRelationId) throw new NotFoundException(`Referenced table not found for reference ${coRelationId}`);

    const entityManager = manager || this.manager;
    const internalTable = await entityManager.findOne(InternalTable, {
      where: { organizationId, co_relation_id: coRelationId },
    });
    if (!internalTable) throw new NotFoundException(`Referenced table not found for reference ${coRelationId}`);

    const relation = await entityManager.findOne(InternalTableRelation, {
      where: { internalTableId: internalTable.id, environmentId, branchId },
    });
    if (!relation) throw new NotFoundException(tableNotInEnvironmentMessage([internalTable.tableName]));

    relation.internalTable = internalTable;
    return relation;
  }
}
