import React from 'react';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import LockedBranchBanner from '@/AppBuilder/Header/LockedBranchBanner';

export function WorkspaceLockedBanner() {
  const { currentBranch, orgGitConfig, isInitialized } = useWorkspaceBranchesStore((state) => ({
    currentBranch: state.currentBranch,
    orgGitConfig: state.orgGitConfig,
    isInitialized: state.isInitialized,
  }));

  if (!isInitialized || !orgGitConfig) return null;

  const isBranchingEnabled = orgGitConfig?.is_branching_enabled || orgGitConfig?.isBranchingEnabled;
  const isOnDefaultBranch = currentBranch?.is_default || currentBranch?.isDefault;
  const isVisible = isBranchingEnabled && isOnDefaultBranch;

  return (
    <LockedBranchBanner
      isVisible={isVisible}
      branchName={currentBranch?.name || ''}
      reason="main_config_branch"
    />
  );
}

export default WorkspaceLockedBanner;
