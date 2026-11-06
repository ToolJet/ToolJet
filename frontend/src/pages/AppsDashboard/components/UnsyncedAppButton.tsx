import React, { useState } from 'react';
import { RefreshCcw } from 'lucide-react';

import { gitSyncService } from '@/_services/git_sync.service';
import { PushAppsModal } from '@ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal';
import { PushValidationErrorModal } from '@ee/modules/Appbuilder/components/GitSyncManager/PushValidationErrorModal';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import TooltipComp from '@/components/ui/Rocket/Tooltip';

import type { IWorkspaceBranchesStore } from '@/_stores/types/workspaceBranchesStore';

import { appTypeToDisplayNameMapping, type TAppType } from '../helper';
import type { AppItem } from '../dummyData/types';

interface IUnsyncedAppButtonProps {
  appType: TAppType;
  itemDetails: AppItem;
}

type TPushValidationError = {
  errorType: string;
  resourceType: string;
  affectedResources: string[];
} | null;

export default function UnsyncedAppButton({ appType, itemDetails }: IUnsyncedAppButtonProps) {
  const { id, name, git } = itemDetails;

  const [openPushAppModal, setOpenPushAppModal] = useState(false);
  const [pushValidationError, setPushValidationError] = useState<TPushValidationError>(null);

  const currentBranch = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.currentBranch);
  const isGitSyncConfigured = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.isGitSyncConfigured);

  const isOnDefaultBranch = !!(currentBranch?.is_default || currentBranch?.isDefault);
  const isAppUnsynced = isGitSyncConfigured && currentBranch && isOnDefaultBranch && git?.synced === false;

  if (!isAppUnsynced) return null;

  const handlePushAppToGit = async () => {
    if (!git?.push_version_id) return;

    try {
      const rt = appTypeToDisplayNameMapping[appType];
      const result = await gitSyncService.validatePush(id, rt);

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

    setOpenPushAppModal(true);
  };

  return (
    <>
      <TooltipComp arrow content="Click to push app to git">
        <button
          type="button"
          className="tw-flex tw-items-center tw-justify-center tw-size-5 tw-p-0 tw-border-0 tw-bg-transparent tw-cursor-pointer hover:tw-bg-button-danger-secondary-hover"
          aria-label={`Click to push app to git`}
          onClick={handlePushAppToGit}
        >
          <RefreshCcw size={12} color="var(--icon-danger)" />
        </button>
      </TooltipComp>

      <PushAppsModal
        show={openPushAppModal}
        onClose={() => setOpenPushAppModal(false)}
        resourceType={appTypeToDisplayNameMapping[appType]}
        resourceName={name}
        appName={name}
        appGitId={id}
        versionId={git?.push_version_id}
        appsList={[itemDetails]}
        onSuccess={() => {
          setOpenPushAppModal(false);
          // props.refreshApps?.();
        }}
      />

      {pushValidationError && (
        <PushValidationErrorModal
          show={!!pushValidationError}
          onClose={() => setPushValidationError(null)}
          errorType={pushValidationError.errorType}
          resourceType={pushValidationError.resourceType}
          affectedResources={pushValidationError.affectedResources}
        />
      )}
    </>
  );
}
