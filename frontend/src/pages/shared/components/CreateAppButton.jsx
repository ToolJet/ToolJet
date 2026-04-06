import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppsStore } from '@/_stores/appsStore';
import { Button } from '@/components/ui/Button/Button';

export default function CreateAppButton({ label, disabled }) {
  const { t } = useTranslation();

  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);

  const handleOpenCreateAppDialog = () => {
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
