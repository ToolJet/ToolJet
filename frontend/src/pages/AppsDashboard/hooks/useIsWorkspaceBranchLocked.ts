import { isGitSyncLicenseInvalid } from '@/_helpers/gitSyncLicense';
import { useLicenseStore } from '@/_stores/licenseStore';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

import type { ILicenseStore } from '@/_stores/types/licenseStore';
import type { IWorkspaceBranchesStore } from '@/_stores/types/workspaceBranchesStore';
interface IUseIsWorkspaceBranchLockedResult {
  isBranchLocked: boolean;
  isOnFeatureBranch: boolean;
  isGitSyncLicenseLocked: boolean;
  isGitSyncSingleBranchDelete: boolean;
}

export function useIsWorkspaceBranchLocked(): IUseIsWorkspaceBranchLockedResult {
  const featureAccess = useLicenseStore((state: ILicenseStore) => state.featureAccess);
  const orgGitConfig = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.orgGitConfig);
  const isInitialized = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.isInitialized);
  const currentBranch = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.currentBranch);
  const isGitSyncConfigured = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.isGitSyncConfigured);

  if (!isInitialized || !orgGitConfig)
    return {
      isBranchLocked: false,
      isOnFeatureBranch: false,
      isGitSyncLicenseLocked: false,
      isGitSyncSingleBranchDelete: false,
    };

  // TODO: Unsynced apps (pre-git or not yet pushed) are always mutable, even on master
  // if (app?.app_versions?.[0]?.is_synced === false) return false;

  const isBranchingEnabled = orgGitConfig?.is_branching_enabled || orgGitConfig?.isBranchingEnabled;
  const isDefaultBranch = currentBranch?.is_default || currentBranch?.isDefault;

  const isGitSyncLicenseLocked = isGitSyncConfigured && isGitSyncLicenseInvalid(featureAccess);

  return {
    isBranchLocked: Boolean(isBranchingEnabled && isDefaultBranch),
    isOnFeatureBranch: Boolean(isBranchingEnabled && !isDefaultBranch),
    isGitSyncLicenseLocked,
    isGitSyncSingleBranchDelete: !isBranchingEnabled,
  };
}
