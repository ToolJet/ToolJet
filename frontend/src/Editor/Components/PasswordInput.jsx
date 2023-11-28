import React, { useState } from 'react';
import Loader from '@/ToolJetUI/Loader/Loader';
import { ToolTip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';

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
  width,
  alignment,
  direction,
  color,
  auto,
  label,
  padding,
  visibility,
  height,
  iconVisibility,
  setIconVisibility,
}) => (
  <div
    // data-disabled={disable}
    className={`text-input d-flex ${alignment == 'top' && 'flex-column'}  ${
      direction == 'alignrightinspector' && alignment == 'side' && 'flex-row-reverse'
    }
    ${direction == 'alignrightinspector' && alignment == 'top' && 'text-right'}`}
    style={{ height: height, padding: padding == 'default' && '3px 2px', position: 'relative' }}
  >
    <label
      style={{
        color: darkMode && color == '#11181C' ? '#fff' : color,
        width: auto ? 'auto' : alignment == 'side' ? `${width}%` : '100%',
        maxWidth: auto && alignment == 'side' ? '70%' : '100%',
        overflowWrap: 'break-word',
        marginRight: label.length > 0 && direction == 'alignleftinspector' && alignment == 'side' && '9px',
        marginLeft: label.length > 0 && direction == 'alignrightinspector' && alignment == 'side' && '9px',
      }}
    >
      {label}
    </label>
    <input
      disabled={disabledState}
      onChange={(e) => {
        onChange(e.target.value);
        setShowValidationError(true);
      }}
      type={iconVisibility ? 'text' : 'password'}
      className={`tj-text-input-widget  ${
        !isValid && showValidationError ? 'is-invalid' : ''
      } validation-without-icon ${darkMode && 'dark-theme-placeholder'}`}
      placeholder={placeholder}
      value={value}
      style={computedStyles}
      data-cy={dataCy}
    />
    <div
      onClick={() => {
        // alert('hi');
        setIconVisibility(!iconVisibility);
      }}
    >
      <SolidIcon
        className="password-component-eye"
        name={iconVisibility ? 'eye' : 'eyedisable'}
        style={{
          width: '7',
          height: '7',
          // right: direction == 'alignleftinspector' && alignment == 'side' && `${elementWidth - 21}px`,
          left: direction == 'alignrightinspector' && alignment == 'side' && `6px`,
          position: 'absolute',
          top: alignment == 'side' ? '50%' : '32px',
          transform: ' translateY(-50%)',
        }}
        stroke={1.5}
      />
    </div>
  </div>
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
  const { borderRadius, backgroundColor, boxShadow, width, alignment, direction, color, auto, padding } = styles;
  const { visibility, disabledState, tooltip, loadingState, label } = properties;
  const [iconVisibility, setIconVisibility] = useState(false);

  const placeholder = properties.placeholder;

  const [passwordValue, setPasswordValue] = useState('');
  const { isValid, validationError } = validate(passwordValue);
  const [showValidationError, setShowValidationError] = useState(false);

  const computedStyles = {
    height: padding == 'default' ? '32px' : '38px',
    display: visibility ? '' : 'none',
    borderRadius: `${borderRadius}px`,
    color: darkMode ? '#fff' : '#11181C',
    borderColor: 'var(--tj-text-input-widget-border-default)',
    backgroundColor: darkMode && ['#ffffff'].includes(backgroundColor) ? '#232e3c' : backgroundColor,
    boxShadow: boxShadow,
    padding: '3px 5px',
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
              iconVisibility={iconVisibility}
              setIconVisibility={setIconVisibility}
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
          label={label}
          alignment={alignment}
          color={color}
          width={width}
          direction={direction}
          auto={auto}
          iconVisibility={iconVisibility}
          setIconVisibility={setIconVisibility}
        />
      )}

      {loadingState && <Loader width="16" />}
      <div className="invalid-feedback" data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}>
        {showValidationError && validationError}
      </div>
    </div>
  );
};
