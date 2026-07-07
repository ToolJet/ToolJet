import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { useLicenseStore } from '@/_stores/licenseStore';
import { WorkspaceGitSyncModal } from '@/_ui/WorkspaceGitSyncModal';
import { toast } from 'react-hot-toast';
import { ToolTip } from '@/_components';
import { PushAppsModal } from '@ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal';

export function WorkspaceGitCTA({ showCommit = true }) {
  const [showModal, setShowModal] = useState(false);
  const [initialTab, setInitialTab] = useState('push');
  const [showDsSyncModal, setShowDsSyncModal] = useState(false);
  const { currentBranch, orgGitConfig, actions, hasUnsyncedDatasources, isMultiBranchingEnabled } =
    useWorkspaceBranchesStore((state) => ({
      currentBranch: state.currentBranch,
      orgGitConfig: state.orgGitConfig,
      actions: state.actions,
      hasUnsyncedDatasources: state.hasUnsyncedDatasources,
      isMultiBranchingEnabled: state.isMultiBranchingEnabled,
    }));

  const featureAccess = useLicenseStore((state) => state.featureAccess);

  if (!featureAccess?.gitSync || !orgGitConfig) return null;

  const defaultGitBranch = orgGitConfig?.default_git_branch || orgGitConfig?.defaultGitBranch || 'main';
  const isOnDefaultBranch =
    currentBranch?.is_default || currentBranch?.isDefault || currentBranch?.name === defaultGitBranch;
  // In single-branch mode the default branch is the only branch you work on, so commit/push must
  // be enabled there. Treat it as a non-default branch for push purposes (multi-branch keeps the
  // default = pull-only behavior).
  const canPushCurrentBranch = !isOnDefaultBranch || !isMultiBranchingEnabled;

  const openModal = (tab) => {
    setInitialTab(tab);
    setShowModal(true);
  };

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

  const handlePullClick = async () => {
    if (await checkRemoteBranch()) openModal('pull');
  };

  const handleCommitClick = async () => {
    if (await checkRemoteBranch()) openModal('push');
  };

  return (
    <>
      <div className="lifecycle-cta-button">
        <Button variant="secondary" onClick={handlePullClick} data-cy="workspace-git-pull-button">
          <SolidIcon fill="var(--icon-accent)" viewBox="0 0 16 16" name="pull-changes" width="16" />
          <span>Pull</span>
        </Button>
      </div>

      {showCommit && canPushCurrentBranch && (
        <div className="lifecycle-cta-button">
          <Button variant="secondary" onClick={handleCommitClick} data-cy="workspace-git-commit-button">
            <SolidIcon fill="var(--icon-accent)" viewBox="0 0 16 16" name="commit" width="16" />
            <span>Commit</span>
          </Button>
        </div>
      )}

      {showCommit && isOnDefaultBranch && isMultiBranchingEnabled && hasUnsyncedDatasources && (
        <ToolTip message="There are data source which are not synced in remote git" placement="bottom">
          <div className="lifecycle-cta-button">
            <Button
              variant="secondary"
              onClick={() => setShowDsSyncModal(true)}
              data-cy="workspace-ds-sync-button"
              style={{ borderColor: '#E54D2E', color: '#E54D2E' }}
            >
              <SolidIcon fill="#E54D2E" name="refresh" width="16" />
              <span>Sync</span>
            </Button>
          </div>
        </ToolTip>
      )}

      {showModal && <WorkspaceGitSyncModal initialTab={initialTab} onClose={() => setShowModal(false)} />}
      {PushAppsModal && showDsSyncModal && (
        <PushAppsModal
          show={showDsSyncModal}
          onClose={() => setShowDsSyncModal(false)}
          resourceType="datasource"
          onSuccess={() => setShowDsSyncModal(false)}
        />
      )}
    </>
  );
}

export default WorkspaceGitCTA;
