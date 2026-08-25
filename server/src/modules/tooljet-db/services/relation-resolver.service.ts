import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';

/**
 * Resolves (logical table id, environment, branch) -> physical relation name.
 *
 * Real in CE, not a stub: a relation id is the only way to name a physical table, so an EE-only
 * resolver would leave CE nothing to resolve to. CE pins the priority-1 environment, which is also
 * the licence-lapse behaviour. EE (H5) overrides resolveEnvironment to honour the requested id.
 *
 * Fail-closed contract: an id the caller does not own, or that has no relation in this
 * (environment, branch), is OMITTED from the returned map. It is never passed through unrewritten.
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
}
