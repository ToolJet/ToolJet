import React, { useState } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { useLicenseStore } from '@/_stores/licenseStore';
import { WorkspaceGitSyncModal } from '@/_ui/WorkspaceGitSyncModal';

export function WorkspaceGitCTA() {
  const [showModal, setShowModal] = useState(false);

  const { currentBranch, orgGitConfig } = useWorkspaceBranchesStore((state) => ({
    currentBranch: state.currentBranch,
    orgGitConfig: state.orgGitConfig,
  }));

  const featureAccess = useLicenseStore((state) => state.featureAccess);

  if (!featureAccess?.gitSync || !orgGitConfig) return null;

  const defaultGitBranch = orgGitConfig?.default_git_branch || orgGitConfig?.defaultGitBranch || 'main';
  const isOnDefaultBranch =
    currentBranch?.is_default || currentBranch?.isDefault || currentBranch?.name === defaultGitBranch;

  return (
    <>
      <ButtonSolid variant="secondary" onClick={() => setShowModal(true)} className="tj-text-xsm">
        <SolidIcon fill="var(--icon-accent)" viewBox="0 0 16 16" name="commit" width="16" />
        <span>{isOnDefaultBranch ? 'Pull changes' : 'Commit'}</span>
      </ButtonSolid>

      {showModal && <WorkspaceGitSyncModal isOnDefaultBranch={isOnDefaultBranch} onClose={() => setShowModal(false)} />}
    </>
  );
}

export default WorkspaceGitCTA;
