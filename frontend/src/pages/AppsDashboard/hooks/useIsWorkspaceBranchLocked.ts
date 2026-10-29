import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import type { IWorkspaceBranchesStore } from '@/_stores/types/workspaceBranchesStore';

interface IUseIsWorkspaceBranchLockedResult {
  isBranchLocked: boolean;
  isBranchingEnabledFeature: boolean;
}

export function useIsWorkspaceBranchLocked(feature: string): IUseIsWorkspaceBranchLockedResult {
  const orgGitConfig = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.orgGitConfig);
  const isInitialized = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.isInitialized);
  const currentBranch = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.currentBranch);

  const isBranchingEnabledFeature = ['front-end', 'module'].includes(feature);

  if (!isInitialized || !orgGitConfig || !isBranchingEnabledFeature)
    return { isBranchLocked: false, isBranchingEnabledFeature };

  // TODO: Unsynced apps (pre-git or not yet pushed) are always mutable, even on master
  // if (app?.app_versions?.[0]?.is_synced === false) return false;

  const isBranchingEnabled = orgGitConfig?.is_branching_enabled || orgGitConfig?.isBranchingEnabled;
  const isDefaultBranch = currentBranch?.is_default || currentBranch?.isDefault;

  return { isBranchLocked: Boolean(isBranchingEnabled && isDefaultBranch), isBranchingEnabledFeature };
}
