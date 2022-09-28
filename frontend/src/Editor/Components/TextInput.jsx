import React, { useEffect, useState } from 'react';

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
  const [value, setValue] = useState(properties.value);
  const { isValid, validationError } = validate(value);

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);
  useEffect(() => {
    setValue(properties.value);
    setExposedVariable('value', properties.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

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
    <div className="text-input">
      <input
        disabled={styles.disabledState}
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
        type="text"
        className={`form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon ${
          darkMode && 'dark-theme-placeholder'
        }`}
        placeholder={properties.placeholder}
        style={{ height, display: styles.visibility ? '' : 'none', borderRadius: `${styles.borderRadius}px` }}
        value={value}
        data-cy={`draggable-widget-${String(component.name).toLowerCase()}`}
      />
      <div className="invalid-feedback" data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}>
        {validationError}
      </div>
    </div>
  );
};
