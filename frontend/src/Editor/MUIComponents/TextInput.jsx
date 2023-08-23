import React, { useEffect, useRef, useState } from 'react';
import { TextField } from '@mui/material';

export const TextInput = function TextInput({
  height,
  validate,
  properties,
  styles,
  setExposedVariable,
  fireEvent,
  registerAction,
  component,
  darkMode,
  dataCy,
}) {
  const textInputRef = useRef();

  const [disable, setDisable] = useState(styles.disabledState);
  const [value, setValue] = useState(properties.value);
  const [visibility, setVisibility] = useState(styles.visibility);
  const { isValid, validationError } = validate(value);

  const computedStyles = {
    height,
    borderRadius: `${styles.borderRadius}px`,
    color: darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor,
    borderColor: styles.borderColor,
    backgroundColor: darkMode && ['#fff'].includes(styles.backgroundColor) ? '#232e3c' : styles.backgroundColor,
    boxShadow: styles.boxShadow,
  };

  useEffect(() => {
    disable !== styles.disabledState && setDisable(styles.disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styles.disabledState]);

  useEffect(() => {
    visibility !== styles.visibility && setVisibility(styles.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styles.visibility]);

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  useEffect(() => {
    setValue(properties.value);
    setExposedVariable('value', properties.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  registerAction('setFocus', async function () {
    textInputRef.current.focus();
  });
  registerAction('setBlur', async function () {
    textInputRef.current.blur();
  });
  registerAction('disable', async function (value) {
    setDisable(value);
  });
  registerAction('visibility', async function (value) {
    setVisibility(value);
  });
  registerAction(
    'setText',
    async function (text) {
      setValue(text);
      setExposedVariable('value', text).then(fireEvent('onChange'));
    },
    [setValue]
  );
  registerAction(
    'clear',
    async function () {
      setValue('');
      setExposedVariable('value', '').then(fireEvent('onChange'));
    },
    [setValue]
  );

  return (
    <TextField
      multiline
      size="small"
      helperText={validationError}
      className={`text-input ${visibility || 'invisible'}`}
      sx={{
        width: '100%',
        minWidth: '38px',
        '& .MuiFormHelperText-root': {
          color: styles.errTextColor,
        },
        '& .MuiInputLabel-root': {
          color: styles.borderColor,
        },
        '& .MuiOutlinedInput-root': {
          height,
          minHeight: '38px',
          borderRadius: `${styles.borderRadius}px`,
          color: darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor,
          backgroundColor: darkMode && ['#fff'].includes(styles.backgroundColor) ? '#232e3c' : styles.backgroundColor,
          boxShadow: styles.boxShadow,
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: styles.borderColor,
        },
      }}
      id={textInputRef}
      onKeyUp={(e) => {
        if (e.key == 'Enter') {
          setValue(e.target.value);
          setExposedVariable('value', e.target.value).then(() => {
            fireEvent('onEnterPressed');
          });
        }
      }}
      onChange={(e) => {
        setValue(e.target.value);
        setExposedVariable('value', e.target.value);
        fireEvent('onChange');
      }}
      onBlur={(e) => {
        e.stopPropagation();
        fireEvent('onBlur');
      }}
      onFocus={(e) => {
        e.stopPropagation();
        fireEvent('onFocus');
      }}
      type="text"
      value={value}
      label={properties.placeholder}
      variant="outlined"
    />
  );
};
