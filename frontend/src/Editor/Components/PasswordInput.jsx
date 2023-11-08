import React, { useState } from 'react';
import Loader from '@/ToolJetUI/Loader/Loader';
import { ToolTip } from '@/_components/ToolTip';

const PasswordInputField = ({
  disabledState,
  onChange,
  placeholder,
  value,
  computedStyles,
  dataCy,
  darkMode,
  showValidationError,
  isValid,
  setShowValidationError,
}) => (
  <input
    disabled={disabledState}
    onChange={(e) => {
      onChange(e.target.value);
      setShowValidationError(true);
    }}
    type={'password'}
    className={`tj-text-input-widget  ${!isValid && showValidationError ? 'is-invalid' : ''} validation-without-icon ${
      darkMode && 'dark-theme-placeholder'
    }`}
    placeholder={placeholder}
    value={value}
    style={computedStyles}
    data-cy={dataCy}
  />
);

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
  const { borderRadius, backgroundColor, boxShadow } = styles;
  const { visibility, disabledState, tooltip, loadingState } = properties;

  const placeholder = properties.placeholder;

  const [passwordValue, setPasswordValue] = useState('');
  const { isValid, validationError } = validate(passwordValue);
  const [showValidationError, setShowValidationError] = useState(false);

  const computedStyles = {
    height,
    display: visibility ? '' : 'none',
    borderRadius: `${borderRadius}px`,
    color: darkMode ? '#fff' : '#11181C',
    borderColor: 'var(--tj-text-input-widget-border-default)',
    backgroundColor: darkMode && ['#ffffff'].includes(backgroundColor) ? '#232e3c' : backgroundColor,
    boxShadow: boxShadow,
  };

  React.useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passwordValue, isValid]);

  return (
    <div>
      {properties?.tooltip?.length > 0 ? (
        <ToolTip message={properties?.tooltip}>
          <>
            <PasswordInputField
              disabledState={disabledState}
              onChange={(value) => {
                setPasswordValue(value);
                setExposedVariable('value', value);
                fireEvent('onChange');
              }}
              placeholder={placeholder}
              value={passwordValue}
              computedStyles={computedStyles}
              dataCy={dataCy}
              darkMode={darkMode}
              showValidationError={showValidationError}
              isValid={isValid}
              setShowValidationError={setShowValidationError}
            />
          </>
        </ToolTip>
      ) : (
        <PasswordInputField
          disabledState={disabledState}
          onChange={(value) => {
            setPasswordValue(value);
            setExposedVariable('value', value);
            fireEvent('onChange');
          }}
          placeholder={placeholder}
          value={passwordValue}
          computedStyles={computedStyles}
          dataCy={dataCy}
          darkMode={darkMode}
          showValidationError={showValidationError}
          isValid={isValid}
          setShowValidationError={setShowValidationError}
        />
      )}

      {loadingState && <Loader width="16" />}
      <div className="invalid-feedback" data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}>
        {showValidationError && validationError}
      </div>
    </div>
  );
};
