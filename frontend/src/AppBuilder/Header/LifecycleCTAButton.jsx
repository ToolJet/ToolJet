import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { shallow } from 'zustand/shallow';

/**
 * LifecycleCTAButton - Dynamic button that changes based on environment and version state
 *
 * States:
 * - Development: "Commit" - Opens git sync modal to commit changes
 * - Staging: "Promote" - Promotes version to next environment
 * - Production: "Release" - Releases version to production
 * - Released: "Launch" - Opens app in new tab
 */
const LifecycleCTAButton = () => {
  const { moduleId } = useModuleContext();

  const {
    branchingEnabled,
    selectedEnvironment,
    isVersionReleased,
    appId,
    slug,
    toggleGitSyncModal,
    creationMode,
    featureAccess,
    isEditorFreezed,
    currentPageHandle,
  } = useStore(
    (state) => ({
      branchingEnabled: state.branchingEnabled,
      selectedEnvironment: state.selectedEnvironment,
      isVersionReleased: state.releasedVersionId === state.selectedVersion?.id,
      selectedVersion: state.selectedVersion,
      appId: state.appStore.modules[moduleId]?.app?.appId,
      slug: state.appStore.modules[moduleId]?.app?.slug,
      toggleGitSyncModal: state.toggleGitSyncModal,
      creationMode: state.appStore.modules[moduleId]?.app?.creationMode,
      featureAccess: state?.license?.featureAccess,
      isEditorFreezed: state.isEditorFreezed,
      currentPageHandle: state?.modules[moduleId]?.currentPageHandle,
    }),
    shallow
  );

  // Determine button state based on environment and version status
  const getButtonConfig = () => {
    const envName = selectedEnvironment?.name?.toLowerCase();
    const envPriority = selectedEnvironment?.priority;

    // Released state (highest priority)
    if (isVersionReleased) {
      return {
        label: 'Launch',
        icon: 'externallink',
        variant: 'primary',
        action: 'launch',
        tooltip: 'Open app in new tab',
      };
    }

    // Development environment - Commit
    if (envPriority === 1 || envName === 'development') {
      const isGitSyncEnabled = featureAccess?.gitSync && (creationMode === 'GIT' || !isEditorFreezed);
      return {
        label: 'Commit',
        icon: 'gitbranch',
        variant: 'secondary',
        action: 'commit',
        tooltip: branchingEnabled ? 'Commit changes to current branch' : 'Commit changes to repository',
        disabled: !isGitSyncEnabled,
      };
    }

    // Staging environment - Promote
    if (envPriority === 2 || envName === 'staging') {
      return {
        label: 'Promote',
        icon: 'gitmerge',
        variant: 'secondary',
        action: 'promote',
        tooltip: 'Promote version to production',
      };
    }

    // Production environment - Release
    if (envPriority === 3 || envName === 'production') {
      return {
        label: 'Release',
        icon: 'rocket',
        variant: 'primary',
        action: 'release',
        tooltip: 'Release version to users',
      };
    }

    // Default to commit
    return {
      label: 'Commit',
      icon: 'gitbranch',
      variant: 'secondary',
      action: 'commit',
      tooltip: 'Commit changes',
    };
  };

  const config = getButtonConfig();

  const handleClick = () => {
    switch (config.action) {
      case 'commit':
        toggleGitSyncModal(creationMode);
        break;
      case 'launch': {
        // Open app in new tab
        const appUrl = `/applications/${slug || appId}/${currentPageHandle || ''}`;
        window.open(appUrl, '_blank');
        break;
      }
      case 'promote':
        // TODO: Trigger promote modal/action
        console.log('Promote action - to be implemented');
        break;
      case 'release':
        // TODO: Trigger release modal/action
        console.log('Release action - to be implemented');
        break;
      default:
        break;
    }
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
