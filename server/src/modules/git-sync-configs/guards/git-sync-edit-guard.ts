import { ForbiddenException } from '@nestjs/common';
import { AppVersionStatus } from '@entities/app_version.entity';

export interface GitSyncEditGuardParams {
  // From GitSyncConfigsUtilService.getDetails(organizationId):
  isGitSyncEnabled: boolean; // git sync configured AND licensed
  isMultiBranchingEnabled: boolean; // multi-branch mode
  defaultBranchId: string | null;
  // The target row being mutated:
  branchId: string | null | undefined;
  isSynced: boolean;
  // App versions carry a DRAFT/PUBLISHED/RELEASED status; data source versions don't — pass
  // undefined for those (the synced-on-default rule then applies regardless of status).
  status?: AppVersionStatus | string;
  // Used in the error message, e.g. 'version', 'component', 'query', 'data source'.
  resourceLabel?: string;
}

/**
 * Central git-sync edit guard. Throws when a mutation is not permitted under git sync:
 *
 *   1. Branching DISABLED (single-branch mode): operations on a FEATURE branch (branch_id !=
 *      default) are rejected. The default branch is the working branch and stays fully writable.
 *   2. Branching ENABLED (multi-branch mode): a git-synced DRAFT on the DEFAULT branch is
 *      read-only — edits must be made on a feature branch and flow back via push + merge.
 *      (Data source versions have no draft status, so the rule is just "synced + default branch".)
 *
 * No-op when git sync is off.
 */
export function assertGitSyncEditAllowed(params: GitSyncEditGuardParams): void {
  const { isGitSyncEnabled, isMultiBranchingEnabled, defaultBranchId, branchId, isSynced, status, resourceLabel } =
    params;
  if (!isGitSyncEnabled) return;

  const label = resourceLabel || 'resource';
  const onDefaultBranch = !branchId || (defaultBranchId != null && branchId === defaultBranchId);

  if (!isMultiBranchingEnabled) {
    if (!onDefaultBranch) {
      throw new ForbiddenException(
        'Branching is disabled for this workspace. Feature branch operations are not allowed.'
      );
    }
    return;
  }

  const isDraft = status === undefined ? true : status === AppVersionStatus.DRAFT;
  if (onDefaultBranch && isDraft && isSynced === true) {
    throw new ForbiddenException(
      `This ${label} is synced with git on the default branch. Create a feature branch to make changes.`
    );
  }
}

/**
 * Guard for CREATE operations (no existing row, so is_synced isn't checked):
 *   - Branching disabled: feature-branch creates rejected; default-branch creates allowed.
 *   - Branching enabled: creating on the DEFAULT branch is rejected — author on a feature branch.
 * No-op when git sync is off.
 */
export function assertGitSyncCreateAllowed(params: Omit<GitSyncEditGuardParams, 'isSynced' | 'status'>): void {
  const { isGitSyncEnabled, isMultiBranchingEnabled, defaultBranchId, branchId, resourceLabel } = params;
  if (!isGitSyncEnabled) return;

  const label = resourceLabel || 'resource';
  const onDefaultBranch = !branchId || (defaultBranchId != null && branchId === defaultBranchId);

  if (!isMultiBranchingEnabled) {
    if (!onDefaultBranch) {
      throw new ForbiddenException(
        'Branching is disabled for this workspace. Feature branch operations are not allowed.'
      );
    }
    return;
  }

  if (onDefaultBranch) {
    throw new ForbiddenException(
      `A ${label} cannot be created on the default branch. Switch to a feature branch to make changes.`
    );
  }
}

// Minimal shape of GitSyncConfigsUtilService needed by the resolve-and-assert helpers.
interface GitDetailsResolver {
  getDetails(organizationId: string): Promise<{
    isEnabled: boolean;
    isMultiBranchingEnabled: boolean;
    options?: { defaultBranch?: { id: string; name?: string } | null };
  }>;
  isGitEditLocked(organizationId: string): Promise<boolean>;
}

/**
 * Workspace-wide lock: git is configured but the license is inactive (expired/invalid). In this
 * state the whole workspace is read-only — every edit/create is blocked until git sync is turned
 * off. Independent of branch. No-op when git sync is off or licensed.
 */
export async function assertNotGitLicenseLocked(resolver: GitDetailsResolver, organizationId: string): Promise<void> {
  if (await resolver.isGitEditLocked(organizationId)) {
    throw new ForbiddenException('Your plan has expired. Turn off git sync to continue.');
  }
}

// Resolves git details for the org and runs the edit guard. Callers pass only the target row fields.
export async function assertGitSyncEditAllowedForOrg(
  resolver: GitDetailsResolver,
  organizationId: string,
  target: { branchId: string | null | undefined; isSynced: boolean; status?: AppVersionStatus | string },
  resourceLabel: string
): Promise<void> {
  await assertNotGitLicenseLocked(resolver, organizationId);
  const details = await resolver.getDetails(organizationId);
  assertGitSyncEditAllowed({
    isGitSyncEnabled: details.isEnabled,
    isMultiBranchingEnabled: details.isMultiBranchingEnabled,
    defaultBranchId: details.options?.defaultBranch?.id ?? null,
    branchId: target.branchId,
    isSynced: target.isSynced,
    status: target.status,
    resourceLabel,
  });
}

// Same as above but for CREATE operations.
export async function assertGitSyncCreateAllowedForOrg(
  resolver: GitDetailsResolver,
  organizationId: string,
  branchId: string | null | undefined,
  resourceLabel: string
): Promise<void> {
  await assertNotGitLicenseLocked(resolver, organizationId);
  const details = await resolver.getDetails(organizationId);
  assertGitSyncCreateAllowed({
    isGitSyncEnabled: details.isEnabled,
    isMultiBranchingEnabled: details.isMultiBranchingEnabled,
    defaultBranchId: details.options?.defaultBranch?.id ?? null,
    branchId,
    resourceLabel,
  });
}
