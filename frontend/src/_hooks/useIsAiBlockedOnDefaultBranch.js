import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

export function useIsAiBlockedOnDefaultBranch() {
  return useWorkspaceBranchesStore((state) => {
    if (!state.isInitialized || !state.orgGitConfig) return false;
    const isBranchingEnabled = !!(state.orgGitConfig?.is_branching_enabled || state.orgGitConfig?.isBranchingEnabled);
    if (!isBranchingEnabled) return false;
    const isOnDefaultBranch = !!(state.currentBranch?.is_default || state.currentBranch?.isDefault);
    return isOnDefaultBranch;
  });
}

export function getIsAiBlockedOnDefaultBranch() {
  const state = useWorkspaceBranchesStore.getState();
  if (!state.isInitialized || !state.orgGitConfig) return false;
  const isBranchingEnabled = !!(state.orgGitConfig?.is_branching_enabled || state.orgGitConfig?.isBranchingEnabled);
  if (!isBranchingEnabled) return false;
  const isOnDefaultBranch = !!(state.currentBranch?.is_default || state.currentBranch?.isDefault);
  return isOnDefaultBranch;
}
