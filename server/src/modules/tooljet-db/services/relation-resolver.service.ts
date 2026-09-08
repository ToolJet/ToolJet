import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';

const DEVELOPMENT_PRIORITY = 1;

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
    manager?: EntityManager
  ): Promise<Map<string, string>> {
    const entityManager = manager || this.manager;
    const environmentId = await this.resolveEnvironment(organizationId, requestedEnvironmentId, entityManager);

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

      const resolvedToDevelopment = resolvedRow.priority === DEVELOPMENT_PRIORITY;
      const hasHigherPrioritySibling = rowsForTable.some((row) => row.priority > DEVELOPMENT_PRIORITY);
      if (!resolvedToDevelopment || !hasHigherPrioritySibling) continue;

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

    return resolved;
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

    return new Map(relations.map((relation) => [relation.id, relation.internalTableId]));
  }

  async getRelation(
    organizationId: string,
    internalTableId: string,
    requestedEnvironmentId?: string,
    manager?: EntityManager
  ): Promise<InternalTableRelation> {
    const entityManager = manager || this.manager;
    const environmentId = await this.resolveEnvironment(organizationId, requestedEnvironmentId, entityManager);
    const branchId = await this.resolveBranch(organizationId, entityManager);

    const relation = await entityManager
      .createQueryBuilder(InternalTableRelation, 'relation')
      .innerJoin('internal_tables', 'it', 'it.id = relation.internal_table_id')
      .where('relation.internal_table_id = :internalTableId', { internalTableId })
      .andWhere('relation.environment_id = :environmentId', { environmentId })
      .andWhere('relation.branch_id = :branchId', { branchId })
      .andWhere('it.organization_id = :organizationId', { organizationId })
      .andWhere('it.deleted_at IS NULL')
      .getOne();

    if (!relation) throw new NotFoundException('Table not found in this environment');
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
    const relation = await this.getRelation(organizationId, internalTableId, requestedEnvironmentId, manager);
    const columnNames: Record<string, string> = relation.configurations?.columns?.column_names || {};
    const entry = Object.entries(columnNames).find(([, uuid]) => uuid === columnUuid);
    return entry ? entry[0] : null;
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
    const columnNames: Record<string, string> = relation.configurations?.columns?.column_names || {};
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
   */
  protected async resolveEnvironment(
    organizationId: string,
    requestedEnvironmentId: string | undefined,
    manager: EntityManager
  ): Promise<string> {
    return this.appEnvironmentUtilService.resolveEnvironmentId(organizationId, requestedEnvironmentId, manager);
  }

  /**
   * Phase 1 writes the workspace default branch everywhere and never reads it as a discriminator;
   * the predicate exists so phase 1.5 only has to change what this returns (user.branchId).
   * CE's WorkspaceBranchService is a NotFoundException stub — do not call it.
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
    const entityManager = manager || this.manager;
    const internalTable = await entityManager.findOne(InternalTable, {
      where: { organizationId, co_relation_id: coRelationId },
    });
    if (!internalTable) throw new NotFoundException(`Referenced table not found for reference ${coRelationId}`);

    const relation = await entityManager.findOne(InternalTableRelation, {
      where: { internalTableId: internalTable.id, environmentId, branchId },
    });
    if (!relation)
      throw new NotFoundException(`Table "${internalTable.tableName}" has no relation in this environment`);

    relation.internalTable = internalTable;
    return relation;
  }
}
