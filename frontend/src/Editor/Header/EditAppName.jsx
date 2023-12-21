import React, { useRef, useEffect, useState } from 'react';
import { ToolTip } from '@/_components';
import { appsService } from '@/_services';
import { handleHttpErrorMessages, validateName } from '@/_helpers/utils';
import InfoOrErrorBox from './InfoOrErrorBox';
import { toast } from 'react-hot-toast';

function EditAppName({ appId, appName = '', onNameChanged }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [name, setName] = useState(appName);
  const [isValid, setIsValid] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [warningText, setWarningText] = useState('');

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
    if (validateName(trimmedName, 'App', false, true)?.errorMsg) {
      setName(appName);
      clearError();
      setIsEditing(false);
      return;
    }

    if (trimmedName === appName) {
      setIsValid(true);
      setIsEditing(false);
      setName(appName);
      return;
    }

    try {
      await appsService.saveApp(appId, { name: trimmedName });
      onNameChanged(trimmedName);
      setIsValid(true);
      setIsEditing(false);
      toast.success('App name successfully updated!');
    } catch (error) {
      if (error.statusCode === 409) {
        setError('App name already exists');
      } else {
        clearError();
        setName(appName);
        setIsEditing(false);
        handleHttpErrorMessages(error, 'app');
      }
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown); // Clean up the event listener
    };
  }, []);

  const handleBlur = () => {
    saveAppName(name);
  };

  const handleFocus = () => {
    setIsValid(true);
    setIsEditing(true);
  };

  const handleInput = (e) => {
    const newValue = e.target.value;
    setName(newValue);
    if (newValue.length >= 50) {
      setWarningText('Maximum length has been reached');
    } else {
      setWarningText('');
      clearError();
    }
  };

  const borderColor = isError
    ? 'var(--light-tomato-10, #DB4324)' // Apply error border color
    : darkMode
    ? 'var(--dark-border-color, #2D3748)' // Change this to the appropriate dark border color
    : 'var(--light-border-color, #FFF0EE)';

  return (
    <div className={`app-name input-icon ${darkMode ? 'dark' : ''}`}>
      <ToolTip message={name} placement="bottom" isVisible={!isEditing}>
        <input
          ref={inputRef}
          type="text"
          onChange={() => {
            //this was quick fix. replace this with actual tooltip props and state later
            if (document.getElementsByClassName('tooltip').length) {
              document.getElementsByClassName('tooltip')[0].style.display = 'none';
            }
          }}
          onInput={handleInput}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onClick={() => {
            inputRef.current.select();
            setIsEditing(true);
          }}
          className={`form-control-plaintext form-control-plaintext-sm ${
            (!isError && !isEditing) || isValid ? '' : 'is-invalid'
          } ${isError ? 'error' : ''}`} // Add the 'error' class when there's an error
          style={{ border: `1px solid ${borderColor}` }}
          value={name}
          maxLength={50}
          data-cy="app-name-input"
        />
      </ToolTip>
      <InfoOrErrorBox
        active={isError || isEditing}
        message={
          errorMessage ||
          warningText ||
          (name.length >= 50 ? 'Maximum length has been reached' : 'App name should be unique and max 50 characters')
        }
        isWarning={warningText || name.length >= 50}
        isError={isError}
        darkMode={darkMode}
        additionalClassName={isError ? 'error' : ''}
      />
    </div>
  );
}

export default EditAppName;
