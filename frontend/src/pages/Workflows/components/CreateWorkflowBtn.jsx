import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button/Button';
import { useAppsStore } from '@/pages/shared/store';

export default function CreateWorkflowBtn({ label, disabled, dataCy = 'create-new-workflows-button' }) {
  const { t } = useTranslation();

  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);

  const handleOpenCreateWorkflowDialog = () => {
    setAppDialogState({ type: 'create' });
  };

  return (
    <Button
      isLucid
      variant="secondary"
      leadingIcon="plus"
      data-cy={dataCy}
      disabled={disabled}
      onClick={handleOpenCreateWorkflowDialog}
    >
      {label}
    </Button>
  );
}
