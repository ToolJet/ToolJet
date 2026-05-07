import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { shallow } from 'zustand/shallow';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { toast } from 'react-hot-toast';

/**
 * LifecycleCTAButton - Dynamic button that shows git operations based on branch type
 *
 * States:
 * - Default Branch: "Pull commit" - Opens git sync modal with pull/push tabs
 * - Feature Branch: "Commit" - Opens git sync modal to commit changes
 */
const LifecycleCTAButton = () => {
  const { moduleId } = useModuleContext();

  const { selectedVersion, toggleGitSyncModal, creationMode, featureAccess, isGitSyncConfigured } = useStore(
    (state) => ({
      selectedVersion: state.selectedVersion,
      toggleGitSyncModal: state.toggleGitSyncModal,
      creationMode: state.appStore.modules[moduleId]?.app?.creationMode,
      featureAccess: state?.license?.featureAccess,
      isGitSyncConfigured: state.isGitSyncConfigured,
    }),
    shallow
  );

  const isGitSyncEnabled = featureAccess?.gitSync;

  if (!isGitSyncEnabled) {
    return null;
  }

  // Determine if we're on default branch or feature branch
  // For platform git sync: use workspace branch context
  // For per-app branching: fall back to versionType check
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const workspaceActiveBranch = useWorkspaceBranchesStore((state) => state.currentBranch);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const wsActions = useWorkspaceBranchesStore((state) => state.actions);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const orgGit = useStore((state) => state.orgGit);
  const defaultBranchName = orgGit?.git_https?.github_branch || orgGit?.git_ssh?.github_branch || 'main';
  const isOnDefaultBranch = workspaceActiveBranch
    ? workspaceActiveBranch.is_default ||
      workspaceActiveBranch.isDefault ||
      workspaceActiveBranch.name === defaultBranchName
    : selectedVersion?.versionType === 'version' || selectedVersion?.versionType !== 'branch';

  // Determine button state based on git configuration and branch type
  const getButtonConfig = () => {
    if (!isGitSyncConfigured) {
      // Git is in the plan but not configured in the workspace
      return {
        label: 'Configure Git',
        icon: 'commit',
        variant: 'secondary',
        disabled: false,
      };
    }

    if (isOnDefaultBranch) {
      // Default branch - show "Pull commit" button
      return {
        label: 'Pull commit',
        icon: 'commit',
        variant: 'secondary',
        disabled: false,
      };
    } else {
      // Feature branch - show "Commit" button
      return {
        label: 'Commit',
        icon: 'commit',
        variant: 'secondary',
        disabled: false,
      };
    }
  };

  const config = getButtonConfig();
  const handleClick = async () => {
    // Guard Commit button on feature branches — check remote branch still exists
    if (!isOnDefaultBranch && isGitSyncConfigured && workspaceActiveBranch?.name) {
      const existsOnRemote = await wsActions.checkBranchExistsOnRemote(workspaceActiveBranch.name);
      if (!existsOnRemote) {
        toast.error(
          'Branch does not exist in git. Delete this branch and create a new one to continue to make changes.'
        );
        return;
      }
    }
    toggleGitSyncModal(creationMode);
  };

  return (
    <div className="lifecycle-cta-button">
      <Button
        variant={config.variant}
        onClick={handleClick}
        disabled={config.disabled}
        data-tooltip-id="editor-header-tooltip"
        data-tooltip-content={config.tooltip}
        data-cy="lifecycle-cta-button"
      >
        <SolidIcon fill="var(--icon-accent)" viewBox="0 0 16 16" name={config.icon} width="16" />
        <span>{config.label}</span>
      </Button>
    </div>
  );
};

export default LifecycleCTAButton;
