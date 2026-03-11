import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { shallow } from 'zustand/shallow';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

/**
 * LifecycleCTAButton - Dynamic button that shows git operations based on branch type
 *
 * States:
 * - Default Branch: "Pull commit" - Opens git sync modal with pull/push tabs
 * - Feature Branch: "Commit" - Opens git sync modal to commit changes
 */
const LifecycleCTAButton = () => {
  const { moduleId } = useModuleContext();

  const { selectedVersion, toggleGitSyncModal, creationMode, featureAccess, isEditorFreezed, isGitSyncConfigured, orgGit } =
    useStore(
      (state) => ({
        selectedVersion: state.selectedVersion,
        toggleGitSyncModal: state.toggleGitSyncModal,
        creationMode: state.appStore.modules[moduleId]?.app?.creationMode,
        featureAccess: state?.license?.featureAccess,
        isEditorFreezed: state.isEditorFreezed,
        isGitSyncConfigured: state.isGitSyncConfigured,
        orgGit: state.orgGit,
      }),
      shallow
    );

  // Hook must be called before any early returns (React Rules of Hooks)
  const workspaceActiveBranch = useWorkspaceBranchesStore((state) => state.currentBranch);

  const isGitSyncEnabled = featureAccess?.gitSync;

  // If git sync is not available in the plan or license is expired, hide completely
  if (!isGitSyncEnabled) {
    return null;
  }

  // Determine if we're on default branch or feature branch
  // Consider both the version type and the workspace's active branch
  const defaultBranchName = orgGit?.git_https?.github_branch || orgGit?.git_ssh?.github_branch || 'main';
  const isOnBranchVersion = selectedVersion?.versionType === 'branch' || selectedVersion?.version_type === 'branch';
  const isWorkspaceOnNonDefaultBranch =
    workspaceActiveBranch?.name &&
    workspaceActiveBranch.name !== defaultBranchName &&
    !workspaceActiveBranch?.is_default &&
    !workspaceActiveBranch?.isDefault;
  const isOnDefaultBranch = !isOnBranchVersion && !isWorkspaceOnNonDefaultBranch;

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
  const handleClick = () => {
    // Open the git sync modal (which has pull/push tabs)
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
      >
        <SolidIcon fill="var(--icon-accent)" viewBox="0 0 16 16" name={config.icon} width="16" />
        <span>{config.label}</span>
      </Button>
    </div>
  );
};

export default LifecycleCTAButton;
