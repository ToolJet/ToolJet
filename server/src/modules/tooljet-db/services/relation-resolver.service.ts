import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';

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
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService
  ) {}

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

    const relations = await entityManager
      .createQueryBuilder(InternalTableRelation, 'relation')
      .innerJoin('internal_tables', 'it', 'it.id = relation.internal_table_id')
      .where('relation.internal_table_id IN (:...ids)', { ids: logicalTableIds })
      .andWhere('relation.environment_id = :environmentId', { environmentId })
      .andWhere('relation.branch_id = :branchId', { branchId })
      .andWhere('it.organization_id = :organizationId', { organizationId })
      .andWhere('it.deleted_at IS NULL')
      .getMany();

    return new Map(relations.map((relation) => [relation.internalTableId, relation.id]));
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
