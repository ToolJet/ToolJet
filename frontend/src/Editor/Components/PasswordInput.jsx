import React, { useState } from 'react';

export const PasswordInput = ({
  height,
  validate,
  properties,
  styles,
  setExposedVariable,
  darkMode,
  component,
  fireEvent,
  dataCy,
}) => {
  const { visibility, disabledState, borderRadius, backgroundColor, boxShadow } = styles;

  const placeholder = properties.placeholder;

  const [passwordValue, setPasswordValue] = useState('');
  const { isValid, validationError } = validate(passwordValue);
  const [showValidationError, setShowValidationError] = useState(false);

  const computedStyles = {
    height,
    display: visibility ? '' : 'none',
    borderRadius: `${borderRadius}px`,
    color: darkMode && '#fff',
    borderColor: darkMode && '#DADCDE',
    backgroundColor: darkMode && ['#ffffff'].includes(backgroundColor) ? '#232e3c' : backgroundColor,
    boxShadow: boxShadow,
  };

  React.useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passwordValue, isValid]);

  return (
    <div>
      <input
        disabled={disabledState}
        onChange={(e) => {
          setPasswordValue(e.target.value);
          setExposedVariable('value', e.target.value);
          fireEvent('onChange');
          setShowValidationError(true);
        }}
        type={'password'}
        className={`form-control ${!isValid && showValidationError ? 'is-invalid' : ''} validation-without-icon ${
          darkMode && 'dark-theme-placeholder'
        }`}
        placeholder={placeholder}
        value={passwordValue}
        style={computedStyles}
        data-cy={dataCy}
      />
      <div className="invalid-feedback" data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}>
        {showValidationError && validationError}
      </div>
    </div>
  );
};
