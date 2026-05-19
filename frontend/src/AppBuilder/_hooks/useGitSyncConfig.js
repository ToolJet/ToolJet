import useStore from '@/AppBuilder/_stores/store';

export const useGitSyncConfig = () => {
  const orgGit = useStore((state) => state.orgGit);
  const isGitSyncEnabled = orgGit?.git_ssh?.is_enabled || orgGit?.git_https?.is_enabled || orgGit?.git_lab?.is_enabled;
  const defaultBranch = orgGit?.git_https?.github_branch || orgGit?.git_ssh?.github_branch || 'main';
  return { isGitSyncEnabled, defaultBranch };
};
