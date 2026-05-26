import { GITConnectionType, OrganizationGitSync } from '@entities/organization_git_sync.entity';

// Combined "is git sync active for this org" answer — licence entitlement +
// provider configuration (DB row OR env-mapped). When isEnabled=false the
// options/orgGit fields are blanked so callers don't need to re-check.
export interface GitSyncDetails {
  isEnabled: boolean;
  options: {
    type: GITConnectionType | null;
    defaultBranch: { id: string; name: string } | null;
    isBranchingEnabled: boolean;
  };
  orgGit: OrganizationGitSync | null;
}

export interface IGitSyncConfigsUtilService {
  // isGetConfigs=true returns the loaded OrganizationGitSync entity on the response
  // (relations + env-shadow fields populated). Use sparingly: the entity carries
  // sensitive provider rows — strip secrets if surfacing externally.
  getDetails(organizationId: string, isGetConfigs: boolean): Promise<GitSyncDetails>;
}
