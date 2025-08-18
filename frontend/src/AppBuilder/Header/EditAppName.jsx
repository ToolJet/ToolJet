// TODO: Clean up code

import React, { useRef, useEffect, useState } from 'react';
import { ToolTip } from '@/_components';
import { appsService } from '@/_services';
import { handleHttpErrorMessages, validateName } from '@/_helpers/utils';
import { toast } from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { AppModal } from '@/_components/AppModal';
import { PenLine } from 'lucide-react';

function EditAppName() {
  const { moduleId } = useModuleContext();
  const [appId, appName, setAppName, appCreationMode] = useStore(
    (state) => [
      state.appStore.modules[moduleId].app.appId,
      state.appStore.modules[moduleId].app.appName,
      state.setAppName,
      state.appStore.modules[moduleId].app.creationMode,
    ],
    shallow
  );

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [name, setName] = useState(appName);
  const [isValid, setIsValid] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [warningText, setWarningText] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);

  useEffect(() => {
    setName(appName);
  }, [appName]);

  const clearError = () => {
    setIsError(false);
    setErrorMessage('');
  };

  const setError = (message) => {
    setIsError(true);
    setErrorMessage(message);
  };

  const handleSave = async (newName) => {
    const trimmedName = newName.trim();
    if (validateName(trimmedName, 'App', false, true)?.errorMsg) {
      setName(appName);
      clearError();
      return;
    }

    if (trimmedName === appName) {
      setIsValid(true);
      setName(appName);
      return;
    }

    try {
      await appsService.saveApp(appId, { name: trimmedName });
      setAppName(trimmedName);
      setIsValid(true);
      toast.success('App name successfully updated!');
    } catch (error) {
      if (error.statusCode === 409) {
        setError('App name already exists');
      } else {
        clearError();
        setName(appName);
        handleHttpErrorMessages(error, 'app');
      }
    }
  };

  const handleRenameApp = async (newAppName, appId) => {
    try {
      await appsService.saveApp(appId, { name: newAppName });
      setAppName(newAppName);
      toast.success('App name has been updated!');
      return true;
    } catch (errorResponse) {
      if (errorResponse.statusCode === 409) {
        return false;
      }
      if (errorResponse.statusCode !== 451) {
        throw errorResponse;
      }
    }
  };

  const handleCancel = () => {
    setName(appName);
    clearError();
  };

  const validateAppName = (value) => {
    if (value.length >= 50) {
      setWarningText('Maximum length has been reached');
      return 'Maximum length has been reached';
    }
    setWarningText('');
    clearError();
    return '';
  };

  // Define the message based on the pageType prop
  const messageType = 'App';

  return (
    <>
      <div className="tw-h-full tw-flex tw-items-center">
        <ToolTip message={name} placement="bottom" isVisible={appCreationMode !== 'GIT'}>
          <button
            className="edit-app-name-button tw-h-8 tw-rounded-lg tw-pr-1 tw-w-auto tw-font-medium tw-cursor-pointer tw-outline-none tw-bg-transparent tw-border tw-border-transparent hover:tw-border-border-strong tw-shadow-none tw-group tw-transition-all tw-duration-300 tw-flex tw-items-center tw-relative"
            type="button"
            onClick={() => setShowRenameModal(true)}
          >
            <span className=" tw-truncate tw-w-full tw-block group-hover:tw-w-[calc(100%-24px)]">{name}</span>
            <span className="tw-absolute tw-right-0.5 tw-top-1 tw-text-icon-default tw-hidden group-hover:tw-block tw-w-7 tw-h-7 tw-items-center tw-justify-center">
              <PenLine width="16" height="16" name="pencil" />
            </span>
          </button>
        </ToolTip>
      </div>

      {showRenameModal && (
        <AppModal
          show={showRenameModal}
          closeModal={() => setShowRenameModal(false)}
          processApp={handleRenameApp}
          selectedAppId={appId}
          selectedAppName={appName}
          title="Rename app"
          actionButton="Rename app"
          actionLoadingButton={'Renaming'}
          appType="app"
        />
      )}
    </>
  );
}

export default EditAppName;
