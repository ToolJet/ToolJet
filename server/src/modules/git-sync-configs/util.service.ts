import { HttpException, Injectable } from '@nestjs/common';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { GitSyncDetails, IGitSyncConfigsUtilService } from './Interfaces/IUtilService';

// CE stub. Git sync is an EE-only feature, so the community edition always reports the
// disabled state. The full implementation lives in ee/git-sync-configs/util.service.ts.
@Injectable()
export class GitSyncConfigsUtilService implements IGitSyncConfigsUtilService {
  async getDetails(
    _organizationId: string,
    _orgGitObj?: OrganizationGitSync,
    _isGetConfigs?: boolean,
    isGitMandatory: boolean = false
  ): Promise<GitSyncDetails> {
    // Mandatory-git callers expect git to be enabled; on CE it never is, so surface the
    // same 451 the EE license gate would. Non-mandatory callers get the disabled shape.
    if (isGitMandatory) {
      throw new HttpException('Git Sync is not available on the current license plan.', 451);
    }
    return {
      isEnabled: false,
      options: { type: null, defaultBranch: null, isBranchingEnabled: false },
      orgGit: null,
    };
  }
}
