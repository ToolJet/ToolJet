import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { useLicenseStore } from '@/_stores/licenseStore';
import { WorkspaceGitSyncModal } from '@/_ui/WorkspaceGitSyncModal';
import { toast } from 'react-hot-toast';
import { isGitSyncLicenseInvalid } from '@/_helpers/gitSyncLicense';

// Single dashboard git control: one "Pull commit" button that opens the workspace git modal.
// Push (commit) is offered only on the data-sources page, and only when the current branch is
// actually pushable — i.e. single-branch mode OR a multi-branch feature branch. The multi-branch
// default branch (and every apps/modules page) is pull-only.
export function WorkspaceGitCTA({ isDataSourcesPage = false }) {
  const [showModal, setShowModal] = useState(false);
  const { currentBranch, orgGitConfig, actions, isMultiBranchingEnabled, isGitSyncConfigured } =
    useWorkspaceBranchesStore((state) => ({
      currentBranch: state.currentBranch,
      orgGitConfig: state.orgGitConfig,
      actions: state.actions,
      isMultiBranchingEnabled: state.isMultiBranchingEnabled,
      isGitSyncConfigured: state.isGitSyncConfigured,
    }));

  const featureAccess = useLicenseStore((state) => state.featureAccess);

  // Render whenever git is licensed OR still configured (so a license-locked workspace keeps the
  // git-sync-enabled look — the button is shown but disabled by the Header's lock wrapper).
  if ((!featureAccess?.gitSync && !isGitSyncConfigured) || !orgGitConfig) return null;

  // Expired/invalid license with git still configured.
  const gitLicenseLocked = isGitSyncConfigured && isGitSyncLicenseInvalid(featureAccess);

  const defaultGitBranch = orgGitConfig?.default_git_branch || orgGitConfig?.defaultGitBranch || 'main';
  const isOnDefaultBranch =
    !currentBranch || currentBranch.is_default || currentBranch.isDefault || currentBranch.name === defaultGitBranch;
  // Pushable everywhere except the multi-branch default branch.
  const allowPush = isDataSourcesPage && (!isMultiBranchingEnabled || !isOnDefaultBranch);

  const checkRemoteBranch = async () => {
    const branchName = currentBranch?.name;
    if (!branchName) return true;
    const existsOnRemote = await actions.checkBranchExistsOnRemote(branchName);
    if (!existsOnRemote) {
      toast.error('Branch does not exist in git. Delete this branch and create a new one to continue to make changes.');
      return false;
    }
    return true;
  };

  const handleOpen = async () => {
    if (await checkRemoteBranch()) setShowModal(true);
  };

  return (
    <>
      <div className="lifecycle-cta-button">
        <Button
          variant="secondary"
          onClick={handleOpen}
          disabled={gitLicenseLocked}
          data-cy="workspace-git-pull-commit-button"
        >
          <SolidIcon fill="var(--icon-accent)" viewBox="0 0 16 16" name="pull-changes" width="16" />
          <span>Pull commit</span>
        </Button>
      </div>

      {!gitLicenseLocked && showModal && (
        <WorkspaceGitSyncModal
          initialTab={allowPush ? 'push' : 'pull'}
          allowPush={allowPush}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default WorkspaceGitCTA;
