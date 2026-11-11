import React, { useState } from 'react';

import { useAppsStore } from '@/_stores/appsStore';
import { useIsWorkspaceBranchLocked } from '../hooks/useIsWorkspaceBranchLocked';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import BuildWithAIAssistantDialog from '@ee/modules/Dashboard/components/BuildWithAIDialog';

import { type TAppType } from '../helper';

interface BuildWithAIButtonProps {
  appType: TAppType;
  'data-cy'?: string;
}

export default function BuildWithAIButton({ appType, 'data-cy': dataCy }: BuildWithAIButtonProps) {
  const toggleSwitchBranchModal = useAppsStore((state) => state.toggleSwitchBranchModal);

  const { isBranchLocked } = useIsWorkspaceBranchLocked();

  const [openBuildWithAIDialog, setOpenBuildWithAIDialog] = useState(false);

  if (appType === 'workflow') return null;

  const handleClick = () => {
    if (isBranchLocked) {
      toggleSwitchBranchModal({ open: true, postSwitchActionDetails: { type: 'create', appDetails: null } });
      return;
    }

    setOpenBuildWithAIDialog(true);
  };

  return (
    <>
      <Button variant="outline" className="tw-border-border-weak" data-cy={dataCy} onClick={handleClick}>
        <SolidIcon name="tooljetai" width={16} height={16} />
        Build with AI
      </Button>

      <BuildWithAIAssistantDialog open={openBuildWithAIDialog} handleOpenChange={setOpenBuildWithAIDialog} />
    </>
  );
}
