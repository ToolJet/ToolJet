// TODO: Clean up code

import React, { useRef, useEffect, useState } from 'react';
import { ToolTip } from '@/_components';
import { appsService } from '@/_services';
import { handleHttpErrorMessages, validateName } from '@/_helpers/utils';
import { InfoOrErrorBox } from './InfoOrErrorBox';
import { toast } from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import InlineEdit from '@/_ui/InlineEdit';

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
    <div className="tw-h-full tw-flex tw-items-center">
      <ToolTip message={name} placement="bottom" isVisible={appCreationMode !== 'GIT'}>
        <InlineEdit
          value={name}
          onSave={handleSave}
          onCancel={handleCancel}
          placeholder="Enter app name..."
          maxLength={50}
          validation={validateAppName}
          className={`${isError ? 'error' : ''}`}
          textClassName="tw-w-auto tw-h-8 !tw-inline-block tw-font-medium"
          inputClassName="tw-h-8"
          data-cy="app-name-input"
        />
      </ToolTip>
      <InfoOrErrorBox
        active={isError}
        message={errorMessage || warningText || `${messageType} name should be unique and max 50 characters`}
        isWarning={warningText}
        isError={isError}
        darkMode={darkMode}
        additionalClassName={isError ? 'error' : ''}
      />
    </div>
  );
}

export default EditAppName;
