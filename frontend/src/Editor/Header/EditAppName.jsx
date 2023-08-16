import React, { useRef, useEffect, useState } from 'react';
import { ToolTip } from '@/_components';
import { appService } from '@/_services';
import { handleHttpErrorMessages, validateAppName, validateName } from '../../_helpers/utils';
import InfoOrErrorBox from './InfoOrErrorBox';
import { toast } from 'react-hot-toast';

function EditAppName({ appId, appName, onNameChanged }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [name, setName] = useState(appName);
  const [isValid, setIsValid] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const inputRef = useRef(null);

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

  const saveAppName = async (newName) => {
    const trimmedName = newName.trim();
    if (validateAppName(trimmedName).errorMsg) {
      setName(appName);
      clearError();
      toast.error('App name could not be updated. Please try again!');
      setIsEditing(false);
      return;
    }

    if (trimmedName === appName) {
      setIsValid(true);
      setIsEditing(false);
      return;
    }

    try {
      await appService.saveApp(appId, { name: trimmedName });
      onNameChanged(trimmedName);
      setIsValid(true);
      setIsEditing(false);
    } catch (error) {
      if (error.statusCode === 409) {
        setError('App name already exists');
      } else {
        handleHttpErrorMessages(error, 'app');
      }
    }
  };

  const handleBlur = () => {
    saveAppName(name);
  };

  const handleFocus = () => {
    setIsValid(true);
    setIsEditing(true);
  };

  const handleInput = (e) => {
    const newValue = e.target.value;
    setIsValid(true);
    setName(newValue);

    if (newValue.length > 50) {
      setError('Maximum length has been reached');
    } else {
      clearError();
    }
  };

  return (
    <div className={`app-name input-icon ${darkMode ? 'dark' : ''}`}>
      <ToolTip message={name} placement="bottom" isVisible={!isEditing}>
        <input
          ref={inputRef}
          type="text"
          onInput={handleInput}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onClick={() => {
            inputRef.current.select();
            setIsEditing(true);
          }}
          className={`form-control-plaintext form-control-plaintext-sm ${
            (!isError && !isEditing) || isValid ? '' : 'is-invalid'
          }`}
          value={name}
          maxLength={51}
          data-cy="app-name-input"
        />
      </ToolTip>
      <InfoOrErrorBox
        active={isError || isEditing}
        message={errorMessage || 'App name should be unique and max 50 characters'}
        isError={isError}
        darkMode={darkMode}
      />
    </div>
  );
}

export default EditAppName;
