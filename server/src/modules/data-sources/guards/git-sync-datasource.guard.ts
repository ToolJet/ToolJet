import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import {
  assertGitSyncEditAllowedForOrg,
  assertGitSyncCreateAllowedForOrg,
} from '@modules/git-sync-configs/guards/git-sync-edit-guard';

/**
 * CREATE guard: a data source can't be created on the default branch when branching is enabled
 * (and no feature-branch creates when branching is disabled). is_synced isn't checked on create.
 * Branch comes from the `branch_id` query param.
 */
@Injectable()
export class GitSyncDataSourceCreateGuard implements CanActivate {
  constructor(protected readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.user?.organizationId;
    if (!organizationId) return true;
    const branchId = request.query?.branch_id;
    await assertGitSyncCreateAllowedForOrg(this.gitSyncConfigsUtilService, organizationId, branchId, 'data source');
    return true;
  }
}

/**
 * EDIT guard: blocks editing a git-synced data source version on the default branch (and
 * feature-branch ops when branching is disabled). Resolves the DSV from `:id` + `branch_id`.
 */
@Injectable()
export class GitSyncDataSourceEditGuard implements CanActivate {
  constructor(protected readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.user?.organizationId;
    const dataSourceId = request.params?.id;
    if (!organizationId || !dataSourceId) return true;
    const branchId = request.query?.branch_id;

    const dsv = await dbTransactionWrap((manager: EntityManager) =>
      manager.findOne(DataSourceVersion, {
        where: { dataSourceId, ...(branchId ? { branchId } : {}) },
        select: ['id', 'branchId', 'isSynced'],
      })
    );
    await assertGitSyncEditAllowedForOrg(
      this.gitSyncConfigsUtilService,
      organizationId,
      { branchId: dsv?.branchId ?? branchId, isSynced: !!dsv?.isSynced },
      'data source'
    );
    return true;
  }
}
