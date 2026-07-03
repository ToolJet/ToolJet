import React, { useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { shallow } from 'zustand/shallow';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { toast } from 'react-hot-toast';
import { PushAppsModal } from '@ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal';
import { PushValidationErrorModal } from '@ee/modules/Appbuilder/components/GitSyncManager/PushValidationErrorModal';
import { gitSyncService } from '@/_services';

/**
 * LifecycleCTAButton - Dynamic button that shows git operations based on branch type
 *
 * States:
 * - Default Branch: "Pull commit" - Opens git sync modal with pull/push tabs
 * - Feature Branch: "Commit" - Opens git sync modal to commit changes
 */
const LifecycleCTAButton = () => {
  const { moduleId } = useModuleContext();

  const {
    selectedVersion,
    toggleGitSyncModal,
    creationMode,
    featureAccess,
    isGitSyncConfigured,
    appId,
    appName,
    appType,
  } = useStore(
    (state) => ({
      selectedVersion: state.selectedVersion,
      toggleGitSyncModal: state.toggleGitSyncModal,
      creationMode: state.appStore.modules[moduleId]?.app?.creationMode,
      featureAccess: state?.license?.featureAccess,
      isGitSyncConfigured: state.isGitSyncConfigured,
      appId: state.appStore.modules[moduleId]?.app?.appId,
      appName: state.appStore.modules[moduleId]?.app?.appName,
      appType: state.appStore.modules[moduleId]?.app?.appType,
    }),
    shallow
  );

  const developmentVersions = useStore((state) => state.developmentVersions);

  const [showPushModal, setShowPushModal] = useState(false);
  const [pushValidationError, setPushValidationError] = useState(null);

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

  // App is synced only when its main-branch draft (status=DRAFT, versionType=version) has
  // isSynced=true. Filtering to DRAFT+version-type excludes feature-branch versions
  // (versionType=branch) — getVersionsByEnvironment has no branchId filter, so feature-branch
  // drafts with isSynced=true (set on push) would otherwise falsely mark the app as synced
  // on main before it has ever been pulled there.
  const isAppSyncedToGit = developmentVersions?.some(
    (v) => v.isSynced === true && v.status === 'DRAFT' && (v.versionType === 'version' || v.version_type === 'version')
  );
  const isUnsynced = workspaceActiveBranch && isOnDefaultBranch && !isAppSyncedToGit;

  // Determine button state based on git configuration and branch type
  const getButtonConfig = () => {
    if (!isGitSyncConfigured) {
      // Git is in the plan but not configured in the workspace
      return {
        label: 'Configure Git',
        icon: 'commit',
        variant: 'secondary',
        disabled: false,
        unsynced: false,
      };
    }

    if (isUnsynced) {
      // App has never been pushed to git — show "Sync" with red indicator
      return {
        label: 'Sync',
        icon: 'refresh',
        variant: 'secondary',
        disabled: false,
        unsynced: true,
      };
    }

    if (isOnDefaultBranch) {
      // Default branch - show "Pull commit" button
      return {
        label: 'Pull commit',
        icon: 'commit',
        variant: 'secondary',
        disabled: false,
        unsynced: false,
      };
    } else {
      // Feature branch - show "Commit" button
      return {
        label: 'Commit',
        icon: 'commit',
        variant: 'secondary',
        disabled: false,
        unsynced: false,
      };
    }
  };

  const config = getButtonConfig();
  const handleClick = async () => {
    // Guard Commit button on feature branches — check remote branch still exists
    if (isUnsynced) {
      try {
        const rt = appType === 'module' ? 'module' : 'app';
        const result = await gitSyncService.validatePush(appId, rt);
        if (!result.valid) {
          setPushValidationError({
            errorType: result.errorType,
            resourceType: result.resourceType || rt,
            affectedResources: result.affectedResources || [],
          });
          return;
        }
      } catch {
        // validation endpoint unavailable — fall through to push modal
      }
      setShowPushModal(true);
      return;
    }
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
    <>
      {showPushModal && (
        <PushAppsModal
          show={showPushModal}
          onClose={() => setShowPushModal(false)}
          appGitId={appId}
          versionId={selectedVersion?.id}
          appName={appName}
          resourceType={appType === 'module' ? 'module' : 'app'}
          onSuccess={() => setShowPushModal(false)}
        />
      )}
      {pushValidationError && (
        <PushValidationErrorModal
          show={!!pushValidationError}
          onClose={() => setPushValidationError(null)}
          errorType={pushValidationError.errorType}
          resourceType={pushValidationError.resourceType}
          affectedResources={pushValidationError.affectedResources}
        />
      )}
      <div className="lifecycle-cta-button">
        <ToolTip
          message={config.unsynced ? 'App not synced in remote git' : ''}
          placement="bottom"
          show={config.unsynced}
        >
          <Button
            variant={config.variant}
            onClick={handleClick}
            disabled={config.disabled}
            data-tooltip-id="editor-header-tooltip"
            data-tooltip-content={config.tooltip}
            data-cy="lifecycle-cta-button"
            style={config.unsynced ? { borderColor: '#E54D2E' } : undefined}
          >
            <SolidIcon
              fill={config.unsynced ? '#E54D2E' : 'var(--icon-accent)'}
              viewBox="0 0 16 16"
              name={config.icon}
              width="16"
            />
            <span>{config.label}</span>
          </Button>
        </ToolTip>
      </div>
    </>
  );
};

export default LifecycleCTAButton;
