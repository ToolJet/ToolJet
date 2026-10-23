import { useMatch } from 'react-router-dom';

import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

export function useIsWorkspaceBranchLocked() {
  const isAppsDashboardPage = useMatch('/:workspaceId');

  const orgGitConfig = useWorkspaceBranchesStore((state) => state.orgGitConfig);
  const isInitialized = useWorkspaceBranchesStore((state) => state.isInitialized);
  const currentBranch = useWorkspaceBranchesStore((state) => state.currentBranch);

  const branchingEnabledPages = Boolean(isAppsDashboardPage);

  if (!isInitialized || !orgGitConfig || !branchingEnabledPages) return false;

  const isBranchingEnabled = orgGitConfig?.is_branching_enabled || orgGitConfig?.isBranchingEnabled;
  const isDefault = currentBranch?.is_default || currentBranch?.isDefault;

  return !!(isBranchingEnabled && isDefault);
}
