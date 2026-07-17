import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { useLicenseStore } from '@/_stores/licenseStore';
import { WorkspaceGitSyncModal } from '@/_ui/WorkspaceGitSyncModal';
import { toast } from 'react-hot-toast';
import { isGitSyncLicenseInvalid } from '@/_helpers/gitSyncLicense';
import { PushAppsModal } from '@ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal';

// Single dashboard git control: one "Pull commit" button that opens the workspace git modal.
// Push (commit) is offered only on the data-sources page, and only when the current branch is
// actually pushable — i.e. single-branch mode OR a multi-branch feature branch. The multi-branch
// default branch (and every apps/modules page) is pull-only.
export function WorkspaceGitCTA({ isDataSourcesPage = false }) {
  const [showModal, setShowModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const { currentBranch, orgGitConfig, actions, isMultiBranchingEnabled, isGitSyncConfigured, hasUnsyncedDatasources } =
    useWorkspaceBranchesStore((state) => ({
      currentBranch: state.currentBranch,
      orgGitConfig: state.orgGitConfig,
      actions: state.actions,
      isMultiBranchingEnabled: state.isMultiBranchingEnabled,
      isGitSyncConfigured: state.isGitSyncConfigured,
      hasUnsyncedDatasources: state.hasUnsyncedDatasources,
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
  // Data sources pushed locally but never committed to git — only surfaces on the default branch,
  // where "unsynced" is a meaningful state (feature-branch DSVs are always in sync by definition).
  const showSyncButton = isDataSourcesPage && isOnDefaultBranch && hasUnsyncedDatasources;

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
          <span>Pull</span>
        </Button>
      </div>

      {showSyncButton && (
        <div className="lifecycle-cta-button">
          <ToolTip message="There are data source which are not synced in remote git" placement="bottom">
            <Button
              variant="secondary"
              onClick={() => setShowPushModal(true)}
              disabled={gitLicenseLocked}
              style={{ borderColor: '#E54D2E' }}
              data-cy="workspace-git-sync-datasources-button"
            >
              <SolidIcon fill="#E54D2E" viewBox="0 0 16 16" name="refresh" width="16" />
              <span>Sync</span>
            </Button>
          </ToolTip>
        </div>
      )}

      {!gitLicenseLocked && showModal && (
        <WorkspaceGitSyncModal
          initialTab={allowPush ? 'push' : 'pull'}
          allowPush={allowPush}
          onClose={() => setShowModal(false)}
        />
      )}

      {!gitLicenseLocked && showPushModal && (
        <PushAppsModal
          show={showPushModal}
          onClose={() => setShowPushModal(false)}
          resourceType="datasource"
          onSuccess={() => setShowPushModal(false)}
        />
      )}
    </>
  );
}

export default WorkspaceGitCTA;
