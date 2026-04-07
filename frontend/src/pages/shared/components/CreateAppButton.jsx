import React from 'react';

import { useAppsStore } from '@/_stores/appsStore';
import { Button } from '@/components/ui/Button/Button';

export default function CreateAppButton({ label, disabled, appType, isWorkspaceBranchLocked = false }) {
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const setOpenSwitchBranchModal = useAppsStore((state) => state.setOpenSwitchBranchModal);

  const handleOpenCreateAppDialog = () => {
    if (isWorkspaceBranchLocked && appType === 'front-end') {
      setOpenSwitchBranchModal(true);
      return;
    }

    setAppDialogState({ type: 'create' });
  };

  return (
    <Button
      isLucid
      variant="secondary"
      leadingIcon="plus"
      data-cy="create-new-app-button"
      disabled={disabled}
      onClick={handleOpenCreateAppDialog}
    >
      {label}
    </Button>
  );
}
