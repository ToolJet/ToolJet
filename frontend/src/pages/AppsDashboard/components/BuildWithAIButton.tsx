import React, { useState } from 'react';

import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import BuildWithAIAssistantDialog from '@ee/modules/Dashboard/components/BuildWithAIDialog';

import { type TAppType } from '../helper';

interface BuildWithAIButtonProps {
  appType: TAppType;
  'data-cy'?: string;
}

export default function BuildWithAIButton({ appType, 'data-cy': dataCy }: BuildWithAIButtonProps) {
  const [openBuildWithAIDialog, setOpenBuildWithAIDialog] = useState(false);

  if (appType === 'workflow') return null;

  return (
    <>
      <Button
        variant="outline"
        className="tw-border-border-weak"
        data-cy={dataCy}
        onClick={() => setOpenBuildWithAIDialog(true)}
      >
        <SolidIcon name="tooljetai" width={16} height={16} />
        Build with AI
      </Button>

      <BuildWithAIAssistantDialog open={openBuildWithAIDialog} handleOpenChange={setOpenBuildWithAIDialog} />
    </>
  );
}
