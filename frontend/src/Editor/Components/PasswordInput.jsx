import React from 'react';

export const PasswordInput = ({ height, validate, properties, styles, setExposedVariable, darkMode, component }) => {
  const { visibility, disabledState, borderRadius } = styles;
  const placeholder = properties.placeholder;

  const [passwordValue, setPasswordValue] = React.useState('');
  const { isValid, validationError } = validate(passwordValue);

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
        }}
        type={'password'}
        className={`form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon ${
          darkMode && 'dark-theme-placeholder'
        }`}
        placeholder={placeholder}
        value={passwordValue}
        style={{ height, display: visibility ? '' : 'none', borderRadius: `${borderRadius}px` }}
        data-cy={`draggable-widget-${String(component.name).toLowerCase()}`}
      />

      <div className="invalid-feedback" data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}>
        {validationError}
      </div>
    </div>
  );
};
