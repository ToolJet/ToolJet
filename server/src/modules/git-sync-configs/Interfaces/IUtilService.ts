import { GITConnectionType, OrganizationGitSync } from '@entities/organization_git_sync.entity';

// Combined "is git sync active for this org" answer — licence entitlement +
// provider configuration (DB row OR env-mapped). When isEnabled=false the type/orgGit
// fields are blanked and isBranchingEnabled is false. options.defaultBranch is ALWAYS
// populated regardless of isEnabled — every org has a default branch and branch_id is
// mandatory on version rows, so gitsync-off callers still need it.
export interface GitSyncDetails {
  isEnabled: boolean;
  // Whether the workspace supports multiple git branches: git sync on + multi-branch license
  // entitlement + branching enabled (is_branching_enabled=true; false = single-branch mode).
  // False in every disabled/non-licensed path.
  isMultiBranchingEnabled: boolean;
  options: {
    type: GITConnectionType | null;
    defaultBranch: { id: string; name: string } | null;
    isBranchingEnabled: boolean;
  };
  orgGit: OrganizationGitSync | null;
}

export interface GetDetailsOptions {
  // isGetConfigs — when true the loaded OrganizationGitSync entity is included on the
  //   response (relations + env-resolved provider config populated). Use sparingly: the
  //   entity carries sensitive provider rows — strip secrets if surfacing externally.
  isGetConfigs?: boolean;
  // isGitMandatory — when true the empty-return paths throw instead of returning empty:
  //   451 (Unavailable For Legal Reasons) if git sync isn't on the license,
  //   422 (Unprocessable Content) if any config/provider/branch gate fails.
  isGitMandatory?: boolean;
  // isMultiBranchingMandatory — when true, additionally require multi-branching to be enabled
  //   (implies git is mandatory). Same error handling as isGitMandatory: 451 if the multi-branch
  //   license entitlement is missing, 422 if the workspace is in single-branch mode.
  isMultiBranchingMandatory?: boolean;
}

export interface IGitSyncConfigsUtilService {
  // orgGitObj — optional pre-loaded entity; skips the internal OrganizationGitSync findOne.
  getDetails(
    organizationId: string,
    orgGitObj?: OrganizationGitSync,
    options?: GetDetailsOptions
  ): Promise<GitSyncDetails>;

  // True when a git provider is CONNECTED but the git-sync license is inactive (expired/invalid).
  // In this "locked" state the whole workspace is read-only until git sync is turned off — used to
  // block edits/creates server-side (getDetails().isEnabled is false here, so it can't detect it).
  isGitEditLocked(organizationId: string): Promise<boolean>;
}
