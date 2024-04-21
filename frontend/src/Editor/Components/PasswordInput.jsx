import React from 'react';

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

  const [passwordValue, setPasswordValue] = React.useState(properties.password);
  const { isValid, validationError } = validate(passwordValue);
  const [showPasswdFlag, setShowPasswdFlag] = React.useState(false);
  React.useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [passwordValue, isValid]);

  React.useEffect(() => {
    setPasswordValue(properties.password);
    setExposedVariable('value', properties.password).then(() => fireEvent('onChange'));
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [properties.password]);

  return (
    <div>
      <input
        disabled={disabledState}
        onChange={(e) => {
          setPasswordValue(e.target.value);
          setExposedVariable('value', e.target.value).then(() => fireEvent('onChange'));
        }}
        type={'password'}
        className={`form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon ${darkMode && 'dark-theme-placeholder'
          }`}
        placeholder={placeholder}
        value={passwordValue}
        style={{
          height,
          display: visibility ? '' : 'none',
          borderRadius: `${borderRadius}px`,
          backgroundColor,
          boxShadow,
        }}
        data-cy={dataCy}
      />
      <div className="invalid-feedback" data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}>
        {validationError}
      </div>
    </div>
  );
};
