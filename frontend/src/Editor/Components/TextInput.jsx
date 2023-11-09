import React, { useEffect, useRef, useState } from 'react';
import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import { ToolTip } from '@/_components/ToolTip';
import * as Icons from '@tabler/icons-react';

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
  isResizing,
}) {
  const textInputRef = useRef();
  const { loadingState, tooltip, disabledState, label, placeholder } = properties;
  const {
    padding,
    borderRadius,
    borderColor,
    backgroundColor,
    textColor,
    boxShadow,
    width,
    alignment,
    direction,
    color,
    auto,
    errTextColor,
  } = styles;

  const [disable, setDisable] = useState(disabledState);
  const [value, setValue] = useState(value);
  const [visibility, setVisibility] = useState(properties.visibility);
  const { isValid, validationError } = validate(value);
  const [showValidationError, setShowValidationError] = useState(false);
  const currentState = useCurrentState();
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState);
  const computedStyles = {
    height: padding == 'default' ? `calc(${height}px - 5px)` : height,
    borderRadius: `${borderRadius}px`,
    color: darkMode && textColor === '#11181C' ? '#ECEDEE' : textColor,
    borderColor: ['#D7DBDF'].includes(borderColor) ? (darkMode ? '#4C5155' : '#D7DBDF') : borderColor,
    backgroundColor: darkMode && ['#fff'].includes(backgroundColor) ? '#313538' : backgroundColor,
    boxShadow: boxShadow,
  };

  const [elementWidth, setElementWidth] = useState(0);

  useEffect(() => {
    if (textInputRef.current) {
      const width = textInputRef.current.getBoundingClientRect().width;
      setElementWidth(width);
    }
  }, [isResizing, width]);

  useEffect(() => {
    disable !== disabledState && setDisable(disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    visibility !== visibility && setVisibility(visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  useEffect(() => {
    setValue(value);
    setExposedVariable('value', value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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
  const iconName = styles.icon; // Replace with the name of the icon you want
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] == undefined ? Icons['IconHome2'] : Icons[iconName];
  // eslint-disable-next-line import/namespace
  console.log('IconElement', Icons[iconName] == undefined);
  return (
    <>
      {loadingState === true && (
        <div className="d-flex align-items-center justify-content-center" style={{ width: '100%', height }}>
          <center>
            <div className="spinner-border" role="status"></div>
          </center>
        </div>
      )}
      {!loadingState && (
        <>
          {properties?.tooltip?.length > 0 ? (
            <ToolTip message={tooltip}>
              <div
                data-disabled={disable}
                className={`text-input d-flex ${alignment == 'top' && 'flex-column'}  ${
                  direction == 'alignrightinspector' && alignment == 'side' && 'flex-row-reverse'
                }
      ${direction == 'alignrightinspector' && alignment == 'top' && 'text-right'}
      ${visibility || 'invisible'}`}
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
                  <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
                </label>
                {component?.definition?.styles?.iconVisibility?.value && (
                  <IconElement
                    style={{
                      width: '16',
                      height: '16',
                      right: direction == 'alignleftinspector' && alignment == 'side' && `${elementWidth - 21}px`,
                      left: direction == 'alignrightinspector' && alignment == 'side' && `6px`,
                      position: 'absolute',
                      top: alignment == 'side' ? '50%' : '32px',
                      transform: ' translateY(-50%)',
                    }}
                    stroke={1.5}
                  />
                )}
                <input
                  className={`tj-text-input-widget ${!isValid ? 'is-invalid' : ''} validation-without-icon ${
                    darkMode && 'dark-theme-placeholder'
                  }`}
                  ref={textInputRef}
                  onKeyUp={(e) => {
                    if (e.key == 'Enter') {
                      setValue(e.target.value);
                      setExposedVariable('value', e.target.value);
                      fireEvent('onEnterPressed');
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
                  placeholder={placeholder}
                  style={computedStyles}
                  value={value}
                  data-cy={dataCy}
                />
              </div>
            </ToolTip>
          ) : (
            <div>
              <div
                data-disabled={disable}
                className={`text-input d-flex ${alignment == 'top' && 'flex-column'}  ${
                  direction == 'alignrightinspector' && alignment == 'side' && 'flex-row-reverse'
                }
      ${direction == 'alignrightinspector' && alignment == 'top' && 'text-right'}
      ${visibility || 'invisible'}`}
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
                  <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
                </label>
                {component?.definition?.styles?.iconVisibility?.value && (
                  <IconElement
                    style={{
                      width: '16',
                      height: '16',
                      right: direction == 'alignleftinspector' && alignment == 'side' && `${elementWidth - 21}px`,
                      left: direction == 'alignrightinspector' && alignment == 'side' && `6px`,
                      position: 'absolute',
                      top: alignment == 'side' ? '50%' : '32px',
                      transform: ' translateY(-50%)',
                    }}
                    stroke={1.5}
                  />
                )}
                <input
                  className={`tj-text-input-widget ${!isValid ? 'is-invalid' : ''} validation-without-icon ${
                    darkMode && 'dark-theme-placeholder'
                  }`}
                  ref={textInputRef}
                  onKeyUp={(e) => {
                    if (e.key == 'Enter') {
                      setValue(e.target.value);
                      setExposedVariable('value', e.target.value);
                      fireEvent('onEnterPressed');
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
                  placeholder={placeholder}
                  style={computedStyles}
                  value={value}
                  data-cy={dataCy}
                />
              </div>
              {showValidationError && (
                <div
                  className="tj-text-sm"
                  data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}
                  style={{ color: errTextColor }}
                >
                  {showValidationError && validationError}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};
