import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { AppVersion } from '@entities/app_version.entity';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { assertGitSyncEditAllowedForOrg } from '@modules/git-sync-configs/guards/git-sync-edit-guard';

/**
 * Blocks query create/update against a git-synced draft on the default branch (and feature-branch
 * ops when branching is disabled). Resolves the target app version from the `:versionId` route
 * param. Only applies to HTTP requests — internal callers (git pull/import) bypass it.
 */
@Injectable()
export class GitSyncQueryEditGuard implements CanActivate {
  constructor(protected readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const versionId = request.params?.versionId;
    const organizationId = request.user?.organizationId;
    if (!versionId || !organizationId) return true;

    const appVersion = await dbTransactionWrap((manager: EntityManager) =>
      manager.findOne(AppVersion, { where: { id: versionId }, select: ['id', 'branchId', 'status', 'isSynced'] })
    );
    if (!appVersion) return true;

    await assertGitSyncEditAllowedForOrg(
      this.gitSyncConfigsUtilService,
      organizationId,
      { branchId: appVersion.branchId, status: appVersion.status, isSynced: appVersion.isSynced },
      'query'
    );
    return true;
  }
}
