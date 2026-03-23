import { useCallback } from 'react';
import toast from 'react-hot-toast';
import useRouter from '@/_hooks/use-router';
import { useGlobalDataSourcesStatus, useDataSourcesActions } from '@/_stores/dataSourcesStore';

const useGlobalDatasourceUnsavedChanges = () => {
  const globalDataSourcesStatus = useGlobalDataSourcesStatus();
  const { setGlobalDataSourceStatus } = useDataSourcesActions();
  const { isEditing, isSaving, unSavedModalVisible, action, saveAction, nextRoute } = globalDataSourcesStatus;
  const router = useRouter();

  const checkForUnsavedChanges = useCallback(
    (targetRoute, e) => {
      if (isEditing) {
        e.preventDefault();
        setGlobalDataSourceStatus({ unSavedModalVisible: true, nextRoute: targetRoute });
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
        toast.error('Cannot perform operation until changes are saved', { style: { minWidth: '400px' } });
      } else {
        setGlobalDataSourceStatus({ unSavedModalVisible: false, isEditing: false, action: null, nextRoute: null });
        typeof action === 'function' && action();
      }
    },
    [isEditing, isSaving]
  );

  const resetUnsavedChangesModal = () => {
    setGlobalDataSourceStatus({ unSavedModalVisible: false, action: null, isEditing: false, nextRoute: null });
  };

  const handleDiscardChanges = useCallback(
    (passedRoute) => {
      const routeToNavigate = typeof passedRoute === 'string' && passedRoute ? passedRoute : nextRoute;
      
      if (!routeToNavigate) {
        action && action();
      } else {
        router.history(routeToNavigate);
      }
      setGlobalDataSourceStatus({ unSavedModalVisible: false, isEditing: false, action: null, nextRoute: null });
    },
    [action, nextRoute, router]
  );

  const handleSaveChanges = () => {
    setGlobalDataSourceStatus({ unSavedModalVisible: false });
    typeof saveAction === 'function' && saveAction();
  };

  const handleContinueEditing = () => {
    setGlobalDataSourceStatus({ unSavedModalVisible: false, action: null, nextRoute: null });
  };

  return {
    checkForUnsavedChanges,
    resetUnsavedChangesModal,
    handleDiscardChanges,
    unSavedModalVisible,
    nextRoute,
    handleActions,
    handleSaveChanges,
    handleContinueEditing,
  };
};

export default useGlobalDatasourceUnsavedChanges;
