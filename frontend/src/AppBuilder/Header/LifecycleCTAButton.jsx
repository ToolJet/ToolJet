import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { shallow } from 'zustand/shallow';

/**
 * LifecycleCTAButton - Dynamic button that shows git operations based on branch type
 *
 * States:
 * - Default Branch: "Pull commit" - Opens git sync modal with pull/push tabs
 * - Feature Branch: "Commit" - Opens git sync modal to commit changes
 */
const LifecycleCTAButton = () => {
  const { moduleId } = useModuleContext();

  const { selectedVersion, toggleGitSyncModal, creationMode, featureAccess, isEditorFreezed } = useStore(
    (state) => ({
      selectedVersion: state.selectedVersion,
      toggleGitSyncModal: state.toggleGitSyncModal,
      creationMode: state.appStore.modules[moduleId]?.app?.creationMode,
      featureAccess: state?.license?.featureAccess,
      isEditorFreezed: state.isEditorFreezed,
    }),
    shallow
  );

  // Determine if we're on default branch or feature branch
  // - versionType === 'version' means default branch
  // - versionType === 'branch' means feature branch
  const isOnDefaultBranch = selectedVersion?.versionType === 'version' || selectedVersion?.versionType !== 'branch';

  // Determine button state based on branch type
  const getButtonConfig = () => {
    const isGitSyncEnabled = featureAccess?.gitSync;
    console.log('isEditorFreezed:', isEditorFreezed);
    console.log('is on default branch', isOnDefaultBranch);
    if (isOnDefaultBranch) {
      // Default branch - show "Pull commit" button
      return {
        label: 'Pull commit',
        icon: 'gitsync',
        variant: 'secondary',
        disabled: !isGitSyncEnabled,
      };
    } else {
      // Feature branch - show "Commit" button
      return {
        label: 'Commit',
        icon: 'gitbranch',
        variant: 'secondary',
        disabled: !isGitSyncEnabled,
      };
    }
  };

  const config = getButtonConfig();
  console.log('config testing', config);

  const handleClick = () => {
    // Open the git sync modal (which has pull/push tabs)
    console.log('here');
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
        <SolidIcon name={config.icon} width="14" />
        <span className="tw-ml-2">{config.label}</span>
      </Button>
    </div>
  );
};

export default LifecycleCTAButton;
