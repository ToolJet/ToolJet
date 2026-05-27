import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

/**
 * Returns true when AI features should be blocked because the user is on the
 * default (master) branch in a branching-enabled workspace.
 *
 * AI is only allowed on feature branches — users must switch to a feature
 * branch before using any AI functionality.
 */
export function useIsAiBlockedOnDefaultBranch() {
  return useWorkspaceBranchesStore((state) => {
    if (!state.isInitialized || !state.orgGitConfig) return false;
    const isBranchingEnabled = !!(state.orgGitConfig?.is_branching_enabled || state.orgGitConfig?.isBranchingEnabled);
    if (!isBranchingEnabled) return false;
    const isOnDefaultBranch = !!(state.currentBranch?.is_default || state.currentBranch?.isDefault);
    return isOnDefaultBranch;
  });
}

/**
 * Non-hook version for use inside Zustand slices / callbacks where hooks
 * aren't available.
 */
export function getIsAiBlockedOnDefaultBranch() {
  const state = useWorkspaceBranchesStore.getState();
  if (!state.isInitialized || !state.orgGitConfig) return false;
  const isBranchingEnabled = !!(state.orgGitConfig?.is_branching_enabled || state.orgGitConfig?.isBranchingEnabled);
  if (!isBranchingEnabled) return false;
  const isOnDefaultBranch = !!(state.currentBranch?.is_default || state.currentBranch?.isDefault);
  return isOnDefaultBranch;
}
