import React from 'react';

export const PasswordInput = ({
  height,
  validate,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  darkMode,
}) => {
  const value = exposedVariables.value;
  const { visibility, disabledState, borderRadius } = styles;
  const placeholder = properties.placeholder;

  const currentValidState = exposedVariables.isValid;

  const validationData = validate(value);

  const { isValid, validationError } = validationData;

  if (currentValidState !== isValid) {
    setExposedVariable('isValid', isValid);
  }

  return (
    <div>
      <input
        disabled={disabledState}
        onChange={(e) => {
          setExposedVariable('value', e.target.value);
        }}
        type={'password'}
        className={`form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon ${
          darkMode && 'dark-theme-placeholder'
        }`}
        placeholder={placeholder}
        value={exposedVariables.value}
        style={{ height, display: visibility ? '' : 'none', borderRadius: `${borderRadius}px` }}
      />

      <div className="invalid-feedback">{validationError}</div>
    </div>
  );
};
