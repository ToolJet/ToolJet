import React, { useEffect, useRef, useState } from 'react';

export const TextInput = function TextInput({
  height,
  validate,
  properties,
  styles,
  setExposedVariable,
  fireEvent,
  component,
  darkMode,
  dataCy,
}) {
  const textInputRef = useRef();

  const [disable, setDisable] = useState(styles.disabledState);
  const [value, setValue] = useState(properties.value);
  const [visibility, setVisibility] = useState(styles.visibility);
  const { isValid, validationError } = validate(value);
  const [showValidationError, setShowValidationError] = useState(false);

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

  useEffect(() => {
    setExposedVariable('setFocus', async function () {
      textInputRef.current.focus();
    });
    setExposedVariable('setBlur', async function () {
      textInputRef.current.blur();
    });
    setExposedVariable('disable', async function (value) {
      setDisable(value);
    });
    setExposedVariable('visibility', async function (value) {
      setVisibility(value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setExposedVariable('setText', async function (text) {
      setValue(text);
      setExposedVariable('value', text).then(fireEvent('onChange'));
    });
    setExposedVariable('clear', async function () {
      setValue('');
      setExposedVariable('value', '').then(fireEvent('onChange'));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setValue]);

  return (
    <div data-disabled={disable} className={`text-input ${visibility || 'invisible'}`}>
      <input
        ref={textInputRef}
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
          setShowValidationError(true);
          e.stopPropagation();
          fireEvent('onBlur');
        }}
        onFocus={(e) => {
          e.stopPropagation();
          fireEvent('onFocus');
        }}
        type="text"
        className={`form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon ${
          darkMode && 'dark-theme-placeholder'
        }`}
        placeholder={properties.placeholder}
        style={computedStyles}
        value={value}
        data-cy={dataCy}
      />
      <div
        className="invalid-feedback"
        data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}
        style={{ color: styles.errTextColor }}
      >
        {showValidationError && validationError}
      </div>
    </div>
  );
};
