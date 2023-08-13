import React, { useRef, useEffect, useState } from 'react';
import { ToolTip } from '@/_components';
import { appService } from '@/_services';
import { handleHttpErrorMessages, validateName } from '../../_helpers/utils';
import InfoOrErrorBox from './InfoOrErrorBox';

function EditAppName({ appId, appName, onNameChanged }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [name, setName] = useState(appName);
  const [isValid, setIsValid] = useState(true);
  const [isMaxLengthExceeded, setIsMaxLengthExceeded] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Track editing state
  const inputRef = useRef(null);

  useEffect(() => {
    setName(appName);
  }, [appName]);

  const saveAppName = async (newName) => {
    const trimmedName = newName.trim();
    if (!validateName(trimmedName, 'App name').status) {
      setIsValid(false);
      setIsMaxLengthExceeded(false);
      return;
    }
    if (trimmedName.length > 50) {
      setIsMaxLengthExceeded(true);
      setIsValid(true);
      return;
    }
    if (trimmedName === appName) {
      setName(trimmedName);
      setIsValid(true);
      setIsMaxLengthExceeded(false);
      setIsEditing(false); // Turn off editing when save is successful
      return;
    }
    try {
      await appService.saveApp(appId, { name: trimmedName });
      onNameChanged(trimmedName);
      setIsValid(true);
      setIsMaxLengthExceeded(false);
      setIsEditing(false); // Turn off editing when save is successful
    } catch (error) {
      handleHttpErrorMessages(error, 'app');
    }
  };

  const handleBlur = (e) => {
    saveAppName(e.target.value);
  };

  const handleFocus = () => {
    setIsValid(true);
    setIsMaxLengthExceeded(false);
    setIsEditing(true); // Turn on editing when the input is focused
  };

  return (
    <div className={`app-name input-icon ${darkMode ? 'dark' : ''}`}>
      <ToolTip message={name} placement="bottom">
        <input
          ref={inputRef}
          type="text"
          onChange={(e) => {
            if (document.getElementsByClassName('tooltip').length) {
              document.getElementsByClassName('tooltip')[0].style.display = 'none';
            }
            setIsValid(true);
            setIsMaxLengthExceeded(false);
            validateName(e.target.value, 'App name', true);
            setName(e.target.value);
          }}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onClick={() => {
            inputRef.current.select();
            setIsEditing(true); // Turn on editing when the input is clicked
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              inputRef.current.blur();
            }
          }}
          className={`form-control-plaintext form-control-plaintext-sm ${
            (isValid && !isMaxLengthExceeded) || !isValid ? '' : 'is-invalid'
          }`}
          value={name}
          maxLength={50}
          data-cy="app-name-input"
        />
      </ToolTip>
      <InfoOrErrorBox
        active={isMaxLengthExceeded || isEditing} // Active when length exceeded or editing
        message="Maximum length reached"
        isError={true}
      />
    </div>
  );
}

export default EditAppName;
