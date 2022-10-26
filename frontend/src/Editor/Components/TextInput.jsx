import React, { useEffect, useState, useRef } from 'react';

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
  };

  useEffect(() => {
    disable !== styles.disabledState && setDisable(styles.disabledState);
  }, [styles.disabledState]);

  useEffect(() => {
    visibility !== styles.visibility && setVisibility(styles.visibility);
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
    <div data-disabled={disable} className={`text-input ${visibility || 'invisible'}`} data-cy="text-disable-div">
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
        data-cy={`draggable-widget-${String(component.name).toLowerCase()}`}
      />
      <div className="invalid-feedback" data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}>
        {validationError}
      </div>
    </div>
  );
};
