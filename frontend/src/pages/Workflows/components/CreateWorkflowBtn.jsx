import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button/Button';

import { useWorkflowListStore } from '../store';

export default function CreateWorkflowBtn({ disabled }) {
  const { t } = useTranslation();

  const setAppDialogState = useWorkflowListStore((state) => state.setAppDialogState);

  const handleOpenCreateWorkflowDialog = () => {
    setAppDialogState({ type: 'create' });
  };

  return (
    <Button
      isLucid
      variant="secondary"
      leadingIcon="plus"
      data-cy="create-new-workflows-button"
      disabled={disabled}
      onClick={handleOpenCreateWorkflowDialog}
    >
      {t('workflowsDashboard.header.createNewApplication')}
    </Button>
  );
}
