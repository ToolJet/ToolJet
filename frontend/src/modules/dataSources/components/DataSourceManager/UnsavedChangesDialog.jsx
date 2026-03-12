import React from 'react';

import { ConfirmDialog } from '@/_components';
import useGlobalDatasourceUnsavedChanges from '@/_hooks/useGlobalDatasourceUnsavedChanges';

export default function UnsavedChangesDialog() {
  const { handleDiscardChanges, handleSaveChanges, handleContinueEditing, unSavedModalVisible, nextRoute } =
    useGlobalDatasourceUnsavedChanges();

  return (
    <ConfirmDialog
      title={'Unsaved Changes'}
      show={unSavedModalVisible}
      message={'Datasource has unsaved changes. Are you sure you want to discard them?'}
      onConfirm={() => handleDiscardChanges(nextRoute)}
      onCancel={handleSaveChanges}
      confirmButtonText={'Discard'}
      cancelButtonText={'Save changes'}
      confirmButtonType="dangerPrimary"
      cancelButtonType="tertiary"
      backdropClassName="datasource-selection-confirm-backdrop"
      onCloseIconClick={handleContinueEditing}
    />
  );
}
