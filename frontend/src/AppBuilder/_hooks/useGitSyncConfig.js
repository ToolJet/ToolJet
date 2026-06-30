import useStore from '@/AppBuilder/_stores/store';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

export const useGitSyncConfig = () => {
  const orgGit = useStore((state) => state.orgGit);
  const orgGitConfig = useWorkspaceBranchesStore((state) => state.orgGitConfig);

  const isGitSyncEnabled =
    orgGit?.git_ssh?.is_enabled ||
    orgGit?.git_https?.is_enabled ||
    orgGit?.git_lab?.is_enabled ||
    !!(orgGitConfig?.isEnabled ?? orgGitConfig?.is_enabled);

  const defaultBranch = orgGit?.git_https?.github_branch || orgGit?.git_ssh?.github_branch || 'main';
  return { isGitSyncEnabled, defaultBranch };
};
