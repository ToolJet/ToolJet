import useStore from '@/AppBuilder/_stores/store';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { isGitSyncLicenseInvalid } from '@/_helpers/gitSyncLicense';

export const useGitSyncConfig = () => {
  const orgGit = useStore((state) => state.orgGit);
  const orgGitConfig = useWorkspaceBranchesStore((state) => state.orgGitConfig);
  const featureAccess = useStore((state) => state?.license?.featureAccess);

  // A provider connected in the workspace — license-independent (git_https/ssh/lab.is_enabled and
  // is_git_sync_configured both reflect DB state, not the license).
  const isGitSyncConfigured =
    orgGit?.git_ssh?.is_enabled ||
    orgGit?.git_https?.is_enabled ||
    orgGit?.git_lab?.is_enabled ||
    !!(orgGitConfig?.is_git_sync_configured ?? orgGitConfig?.isGitSyncConfigured);

  const isGitSyncEnabled = isGitSyncConfigured || !!(orgGitConfig?.isEnabled ?? orgGitConfig?.is_enabled);

  // Licensed is derived from the license entitlement + validity (expired/invalid license → not
  // licensed). Only treated as unlicensed once featureAccess has loaded.
  const isGitSyncLicensed = !isGitSyncLicenseInvalid(featureAccess);

  // Git is set up but the license no longer covers it → the whole editor must be frozen until
  // the user turns git off (from workspace settings → configure git).
  const isGitSyncLicenseLocked = isGitSyncConfigured && !isGitSyncLicensed;

  const defaultBranch = orgGit?.git_https?.github_branch || orgGit?.git_ssh?.github_branch || 'main';
  return { isGitSyncEnabled, isGitSyncConfigured, isGitSyncLicensed, isGitSyncLicenseLocked, defaultBranch };
};
