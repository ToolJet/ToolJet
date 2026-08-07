import React from 'react';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { useLicenseStore } from '@/_stores/licenseStore';
import LockedBranchBanner from '@/AppBuilder/Header/LockedBranchBanner';
import { isGitSyncLicenseInvalid } from '@/_helpers/gitSyncLicense';

export function WorkspaceLockedBanner({ pageContext = '', variant = 'inline' }) {
  const { currentBranch, orgGitConfig, isInitialized, isGitSyncConfigured } = useWorkspaceBranchesStore((state) => ({
    currentBranch: state.currentBranch,
    orgGitConfig: state.orgGitConfig,
    isInitialized: state.isInitialized,
    isGitSyncConfigured: state.isGitSyncConfigured,
  }));
  const featureAccess = useLicenseStore((state) => state.featureAccess);

  if (!isInitialized || !orgGitConfig) return null;

  // Git configured but the license is expired/invalid → editing is blocked for every resource.
  // Takes precedence over the default-branch lock, shown on any branch.
  if (isGitSyncConfigured && isGitSyncLicenseInvalid(featureAccess)) {
    return (
      <LockedBranchBanner
        isVisible
        branchName={currentBranch?.name || ''}
        reason="git_sync_license_off"
        pageContext={pageContext}
        variant={variant}
      />
    );
  }

  const isBranchingEnabled = orgGitConfig?.is_branching_enabled || orgGitConfig?.isBranchingEnabled;
  const isOnDefaultBranch = currentBranch?.is_default || currentBranch?.isDefault;
  const isVisible = isBranchingEnabled && isOnDefaultBranch;

  return (
    <LockedBranchBanner
      isVisible={isVisible}
      branchName={currentBranch?.name || ''}
      reason="main_config_branch"
      pageContext={pageContext}
      variant={variant}
    />
  );
}

export default WorkspaceLockedBanner;
