import { useGlobalDataSourcesStatus, useDataSourcesActions } from '@/_stores/dataSourcesStore';
import toast from 'react-hot-toast';
import useRouter from '@/_hooks/use-router';
import React, { useCallback, useState } from 'react';

const useUnsavedChanges = () => {
  const globalDataSourcesStatus = useGlobalDataSourcesStatus();
  const { setGlobalDataSourceStatus } = useDataSourcesActions();
  const { isEditing, isSaving, unSavedModalVisible, action } = globalDataSourcesStatus;
  const [nextRoute, setNextRoute] = useState('');
  const router = useRouter();

  const checkForUnsavedChanges = useCallback(
    (nextRoute, e) => {
      if (isEditing) {
        e.preventDefault();
        setNextRoute(nextRoute);
        setGlobalDataSourceStatus({ unSavedModalVisible: true });
      } else if (isSaving) {
        toast.error('Cannot perform operation until changes are saved');
      }
    },
    [isEditing, isSaving]
  );

  const handleActions = useCallback(
    (action) => {
      if (isEditing) {
        setGlobalDataSourceStatus({ unSavedModalVisible: true, action: action });
      } else if (isSaving) {
        toast.error('Cannot perform operation until changes are saved');
      } else {
        setGlobalDataSourceStatus({ unSavedModalVisible: false, isEditing: false, action: null });
        action();
      }
    },
    [isEditing, isSaving]
  );

  const resetUnsavedChangesModal = () => {
    setGlobalDataSourceStatus({ unSavedModalVisible: false, action: null, isEditing: false });
  };

  const handleDiscardChanges = useCallback(
    (nextRoute) => {
      if (!nextRoute) {
        action && action();
      }
      router.history(nextRoute);
      setGlobalDataSourceStatus({ unSavedModalVisible: false, isEditing: false, action: null });
    },
    [action]
  );

  return {
    checkForUnsavedChanges,
    resetUnsavedChangesModal,
    handleDiscardChanges,
    unSavedModalVisible,
    nextRoute,
    handleActions,
  };
};

export default useUnsavedChanges;
