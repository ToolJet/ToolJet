import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

export function useIsWorkspaceBranchLocked() {
  const orgGitConfig = useWorkspaceBranchesStore((state) => state.orgGitConfig);
  const isInitialized = useWorkspaceBranchesStore((state) => state.isInitialized);
  const currentBranch = useWorkspaceBranchesStore((state) => state.currentBranch);

  if (!isInitialized || !orgGitConfig) return false;

  const isBranchingEnabled = orgGitConfig?.is_branching_enabled || orgGitConfig?.isBranchingEnabled;
  const isDefault = currentBranch?.is_default || currentBranch?.isDefault;

  return !!(isBranchingEnabled && isDefault);
}
