import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { User } from '@entities/user.entity';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';

/**
 * Guards branching operations (create / switch / delete branch, and any write scoped to a
 * specific branch). When the workspace does NOT support multiple branches
 * (isMultiBranchingEnabled=false — the multi-branch license entitlement is missing OR the
 * workspace is in single-branch mode), the caller must be on the default branch: a request whose
 * active branch (user.branchId, resolved in the JWT strategy) is a non-default branch is rejected.
 *
 * When multi-branching IS enabled, any branch context is permitted and the guard is a no-op.
 */
@Injectable()
export class BranchingOperationGuard implements CanActivate {
  constructor(private readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    const { isMultiBranchingEnabled, options } = await this.gitSyncConfigsUtilService.getDetails(user?.organizationId);

    // Multi-branching available → any branch context is permitted.
    if (isMultiBranchingEnabled) return true;

    // Single-branch mode: only the default branch may be operated on. user.branchId is always
    // resolved (defaults to the org's default branch when the request specifies none), so a
    // mismatch here means the caller is explicitly targeting a non-default branch.
    const defaultBranchId = options?.defaultBranch?.id;
    if (user?.branchId && defaultBranchId && user.branchId !== defaultBranchId) {
      throw new ForbiddenException(
        'This workspace is in single-branch mode. Branch operations are only allowed on the default branch.'
      );
    }
    return true;
  }
}
