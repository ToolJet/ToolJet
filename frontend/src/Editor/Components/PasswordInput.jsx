import React, { useState, useEffect, useRef } from 'react';
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
  textInputRef,
  elementWidth,
}) => (
  <div
    // data-disabled={disable}
    className={`text-input d-flex ${alignment == 'top' && 'flex-column'}  ${
      direction == 'alignrightinspector' && alignment == 'side' && 'flex-row-reverse'
    }
    ${direction == 'alignrightinspector' && alignment == 'top' && 'text-right'}`}
    // style={{ height: height, padding: padding == 'default' && '3px 2px', position: 'relative' }}
  >
    <label
      style={{
        color: darkMode && color == '#11181C' ? '#fff' : color,
        width: label?.length == 0 ? '0%' : auto ? 'auto' : alignment == 'side' ? `${width}%` : '100%',
        maxWidth: auto && alignment == 'side' ? '70%' : '100%',
        overflowWrap: 'break-word',
        marginRight: label?.length > 0 && direction == 'alignleftinspector' && alignment == 'side' && '9px',
        marginLeft: label?.length > 0 && direction == 'alignrightinspector' && alignment == 'side' && '9px',
        marginTop: alignment == 'side' && '16px',
        lineHeight: alignment == 'side' && '0px',
      }}
    >
      {label}
    </label>
    <div
      onClick={() => {
        // alert('hi');
        setIconVisibility(!iconVisibility);
      }}
      style={{
        width: '7',
        height: '7',
        right: alignment == 'top' ? `6px` : direction == 'alignleftinspector' && alignment == 'side' && `6px`,
        left: direction == 'alignrightinspector' && alignment == 'side' && `${elementWidth - 21}px`,
        position: 'absolute',
        top: alignment == 'side' ? '19px' : '38.5px',
        transform: ' translateY(-50%)',
      }}
      stroke={1.5}
    >
      <SolidIcon className="password-component-eye" name={iconVisibility ? 'eye' : 'eyedisable'} />
    </div>
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
      ref={textInputRef}
      autoComplete="new-password" // Use an unrecognized value to prevent suggestions
    />
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
  isResizing,
}) => {
  const { borderRadius, backgroundColor, boxShadow, width, alignment, direction, color, auto, padding, errTextColor } =
    styles;
  const { visibility, disabledState, tooltip, loadingState, label } = properties;
  const [iconVisibility, setIconVisibility] = useState(false);
  const [elementWidth, setElementWidth] = useState(0);

  const textInputRef = useRef();

  const placeholder = properties.placeholder;

  const [passwordValue, setPasswordValue] = useState('');
  const { isValid, validationError } = validate(passwordValue);
  const [showValidationError, setShowValidationError] = useState(false);

  const loaderStyle = {
    left: direction === 'alignrightinspector' && alignment === 'side' ? `${elementWidth - 19}px` : undefined,
    top: alignment === 'top' && '28px',
  };
  useEffect(() => {
    if (textInputRef.current) {
      const width = textInputRef.current.getBoundingClientRect().width;
      setElementWidth(width);
    }
  }, [isResizing, width, auto, alignment, component?.definition?.styles?.iconVisibility?.value]);

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
    <>
      <div style={{ height: height, padding: padding == 'default' && '3px 2px', position: 'relative' }}>
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
                textInputRef={textInputRef}
                isResizing={isResizing}
                elementWidth={elementWidth}
              />
            </>
          </ToolTip>
        ) : (
          <>
            <div>
              <div
                // data-disabled={disable}
                className={`text-input d-flex ${alignment == 'top' && 'flex-column'}  ${
                  direction == 'alignrightinspector' && alignment == 'side' && 'flex-row-reverse'
                }
          ${direction == 'alignrightinspector' && alignment == 'top' && 'text-right'}`}
                // style={{ height: height, padding: padding == 'default' && '3px 2px', position: 'relative' }}
              >
                <label
                  style={{
                    color: darkMode && color == '#11181C' ? '#fff' : color,
                    width: label?.length == 0 ? '0%' : auto ? 'auto' : alignment == 'side' ? `${width}%` : '100%',
                    maxWidth: auto && alignment == 'side' ? '70%' : '100%',
                    overflowWrap: 'break-word',
                    marginRight: label.length > 0 && direction == 'alignleftinspector' && alignment == 'side' && '9px',
                    marginLeft: label.length > 0 && direction == 'alignrightinspector' && alignment == 'side' && '9px',
                    marginTop: alignment == 'side' && '16px',
                    lineHeight: alignment == 'side' && '0px',
                  }}
                >
                  {label}
                </label>
                <div
                  onClick={() => {
                    setIconVisibility(!iconVisibility);
                  }}
                  style={{
                    width: '7',
                    height: '7',
                    right:
                      alignment == 'top' ? `6px` : direction == 'alignleftinspector' && alignment == 'side' && `6px`,
                    left: direction == 'alignrightinspector' && alignment == 'side' && `${elementWidth - 21}px`,
                    position: 'absolute',
                    top: alignment == 'side' ? '19px' : '38.5px',
                    transform: ' translateY(-50%)',
                  }}
                  stroke={1.5}
                >
                  <SolidIcon className="password-component-eye" name={iconVisibility ? 'eye' : 'eyedisable'} />
                </div>
                <input
                  disabled={disabledState}
                  onChange={(e) => {
                    // onChange(e.target.value);
                    setShowValidationError(true);
                  }}
                  type={iconVisibility ? 'text' : 'password'}
                  className={`tj-text-input-widget  ${
                    !isValid && showValidationError ? 'is-invalid' : ''
                  } validation-without-icon ${darkMode && 'dark-theme-placeholder'}`}
                  placeholder={placeholder}
                  // value={value}
                  style={computedStyles}
                  data-cy={dataCy}
                  ref={textInputRef}
                  autoComplete="new-password" // Use an unrecognized value to prevent suggestions
                />
              </div>

              {loadingState && <Loader width="16" />}
              {showValidationError && (
                <div
                  className="tj-text-sm"
                  data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}
                  style={{ color: errTextColor, textAlign: direction == 'alignleftinspector' && 'end' }}
                >
                  {showValidationError && validationError}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};
