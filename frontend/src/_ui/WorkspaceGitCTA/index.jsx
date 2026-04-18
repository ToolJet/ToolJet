import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Separator } from '@/components/ui/Rocket/shadcn/separator';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { useLicenseStore } from '@/_stores/licenseStore';
import { WorkspaceGitSyncModal } from '@/_ui/WorkspaceGitSyncModal';

export function WorkspaceGitCTA() {
  const [showModal, setShowModal] = useState(false);
  const [initialTab, setInitialTab] = useState('push');
  const { currentBranch, orgGitConfig } = useWorkspaceBranchesStore((state) => ({
    currentBranch: state.currentBranch,
    orgGitConfig: state.orgGitConfig,
  }));

  const featureAccess = useLicenseStore((state) => state.featureAccess);

  if (!featureAccess?.gitSync || !orgGitConfig) return null;

  const defaultGitBranch = orgGitConfig?.default_git_branch || orgGitConfig?.defaultGitBranch || 'main';
  const isOnDefaultBranch =
    currentBranch?.is_default || currentBranch?.isDefault || currentBranch?.name === defaultGitBranch;
  const openModal = (tab) => {
    setInitialTab(tab);
    setShowModal(true);
  };

  return (
    <>
      <Button isLucid size="medium" variant="ghost" leadingIcon="arrow-down-to-line" onClick={() => openModal('pull')}>
        Pull
      </Button>

      {!isOnDefaultBranch && (
        <>
          <Separator orientation="vertical" className="tw-bg-border-weak tw-h-4" />

          <Button
            isLucid
            size="medium"
            variant="ghost"
            leadingIcon="git-commit-horizontal"
            onClick={() => openModal('push')}
          >
            Commit
          </Button>
        </>
      )}

      {showModal && (
        <WorkspaceGitSyncModal
          isOnDefaultBranch={isOnDefaultBranch}
          initialTab={initialTab}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default WorkspaceGitCTA;
