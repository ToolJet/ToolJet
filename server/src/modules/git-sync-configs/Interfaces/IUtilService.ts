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
  // orgGitObj — optional pre-loaded entity; skips the internal OrganizationGitSync findOne.
  // isGetConfigs — when true the loaded OrganizationGitSync entity is included on the
  //   response (relations + env-resolved provider config populated). Use sparingly: the
  //   entity carries sensitive provider rows — strip secrets if surfacing externally.
  // isGitMandatory — when true the empty-return paths throw instead of returning empty:
  //   451 (Unavailable For Legal Reasons) if git sync isn't on the license,
  //   422 (Unprocessable Content) if any config/provider/branch gate fails.
  getDetails(
    organizationId: string,
    orgGitObj?: OrganizationGitSync,
    isGetConfigs?: boolean,
    isGitMandatory?: boolean
  ): Promise<GitSyncDetails>;
}
