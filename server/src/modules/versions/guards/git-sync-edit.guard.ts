import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import {
  assertGitSyncEditAllowedForOrg,
  assertVersionEditable,
} from '@modules/git-sync-configs/guards/git-sync-edit-guard';

/**
 * Route guard for version-scoped mutations (components, etc.). Runs AFTER ValidAppGuard, which
 * attaches the resolved app (`request.tj_app`) with its target version. Blocks edits to a
 * git-synced draft on the default branch (and feature-branch ops when branching is disabled).
 * No-op when git sync is off or when no app/version is on the request.
 */
@Injectable()
export class GitSyncEditGuard implements CanActivate {
  constructor(protected readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const app = request.tj_app;
    const version = app?.appVersions?.[0];
    if (!app || !version) return true;

    // Saved (published/released) versions are immutable regardless of git state.
    assertVersionEditable(version.status);

    await assertGitSyncEditAllowedForOrg(
      this.gitSyncConfigsUtilService,
      app.organizationId,
      { branchId: version.branchId, status: version.status, isSynced: version.isSynced },
      'component'
    );
    return true;
  }
}
