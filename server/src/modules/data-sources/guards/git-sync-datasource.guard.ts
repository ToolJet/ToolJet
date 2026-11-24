import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { assertGitSyncCreateAllowedForOrg } from '@modules/git-sync-configs/guards/git-sync-edit-guard';
import { assertDataSourceEditAllowed } from './data-source-edit-rule';

export { assertDataSourceEditAllowed } from './data-source-edit-rule';
export type { DataSourceEditTarget } from './data-source-edit-rule';

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
  constructor(
    protected readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.user?.organizationId;
    const dataSourceId = request.params?.id;
    if (!organizationId || !dataSourceId) return true;
    await assertDataSourceEditAllowed(this.gitSyncConfigsUtilService, this.appEnvironmentUtilService, {
      organizationId,
      dataSourceId,
      branchId: request.query?.branch_id,
      environmentId: request.query?.environment_id,
      name: request.body?.name,
      options: request.body?.options,
    });
    return true;
  }
}
