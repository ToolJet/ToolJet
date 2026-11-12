import React, { useState } from 'react';

import { useAppsStore } from '@/_stores/appsStore';
import { useLicenseStore } from '@/_stores/licenseStore';
import { useIsWorkspaceBranchLocked } from '../hooks/useIsWorkspaceBranchLocked';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import BuildWithAIAssistantDialog from '@ee/modules/Dashboard/components/BuildWithAIDialog';

import { type TAppType } from '../helper';
import type { ILicenseStore } from '@/_stores/types/licenseStore';

interface BuildWithAIButtonProps {
  appType: TAppType;
  'data-cy'?: string;
}

export default function BuildWithAIButton({ appType, 'data-cy': dataCy }: BuildWithAIButtonProps) {
  const toggleSwitchBranchModal = useAppsStore((state) => state.toggleSwitchBranchModal);

  const isModulesFeatureEnabled = useLicenseStore(
    (state: ILicenseStore) => state.featureAccess?.modulesEnabled ?? false
  );

  const { isBranchLocked, isGitSyncLicenseLocked } = useIsWorkspaceBranchLocked();

  const [openBuildWithAIDialog, setOpenBuildWithAIDialog] = useState(false);

  const isCreationDisabled = isGitSyncLicenseLocked || (appType === 'module' && !isModulesFeatureEnabled);

  if (appType === 'workflow') return null;

  const handleClick = () => {
    if (isCreationDisabled) return;

    if (isBranchLocked) {
      toggleSwitchBranchModal({ open: true, postSwitchActionDetails: { type: 'create', appDetails: null } });
      return;
    }

    setOpenBuildWithAIDialog(true);
  };

  return (
    <>
      <Button
        variant="outline"
        className="tw-border-border-weak"
        data-cy={dataCy}
        onClick={handleClick}
        disabled={isCreationDisabled}
      >
        <SolidIcon name="tooljetai" width={16} height={16} />
        Build with AI
      </Button>

      <BuildWithAIAssistantDialog open={openBuildWithAIDialog} handleOpenChange={setOpenBuildWithAIDialog} />
    </>
  );
}
