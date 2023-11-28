import React, { useEffect, useRef, useState } from 'react';
import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import { ToolTip } from '@/_components/ToolTip';
import * as Icons from '@tabler/icons-react';
import Loader from '@/ToolJetUI/Loader/Loader';

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
    iconColor,
  } = styles;

  const [disable, setDisable] = useState(disabledState || loadingState);
  const [value, setValue] = useState(properties.value);
  const [visibility, setVisibility] = useState(properties.visibility);
  const { isValid, validationError } = validate(value);
  const [showValidationError, setShowValidationError] = useState(false);
  const currentState = useCurrentState();
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState);
  const [elementWidth, setElementWidth] = useState(0);
  const computedStyles = {
    borderRadius: `${borderRadius}px`,
    color: darkMode && textColor === '#11181C' ? '#ECEDEE' : textColor,
    borderColor: ['#D7DBDF'].includes(borderColor) ? (darkMode ? '#4C5155' : '#D7DBDF') : borderColor,
    backgroundColor: darkMode && ['#fff'].includes(backgroundColor) ? '#313538' : backgroundColor,
    boxShadow: boxShadow,
    padding: styles.iconVisibility ? '3px 28px' : '3px 5px',
  };

  console.log('height---', height);
  if (padding === 'default' && parseInt(height) !== 32) {
    computedStyles.height = height;
  } else computedStyles.height = padding == 'default' ? '32px' : '38px';

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

  useEffect(() => {
    disable !== disabledState && setDisable(disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    visibility !== properties.visibility && setVisibility(properties.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  useEffect(() => {
    setValue(properties.value);
    setExposedVariable('value', properties.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

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
  return (
    <>
      <>
        {properties?.tooltip?.length > 0 ? (
          <ToolTip message={tooltip}>
            <>
              <div
                data-disabled={disable}
                className={`text-input d-flex ${alignment == 'top' && 'flex-column'}  ${
                  direction == 'alignrightinspector' && alignment == 'side' && 'flex-row-reverse'
                }
      ${direction == 'alignrightinspector' && alignment == 'top' && 'text-right'}
      ${visibility || 'invisible'}`}
                style={{ height: height, padding: padding == 'default' && '3px 2px', position: 'relative' }}
              >
                {label?.length > 0 && (
                  <label
                    style={{
                      color: darkMode && color == '#11181C' ? '#fff' : color,
                      width: label?.length == 0 ? '0%' : auto ? 'auto' : alignment == 'side' ? `${width}%` : '100%',
                      maxWidth: auto && alignment == 'side' ? '70%' : '100%',
                      overflowWrap: 'break-word',
                      marginRight:
                        label?.length > 0 && direction == 'alignleftinspector' && alignment == 'side' && '9px',
                      marginLeft:
                        label?.length > 0 && direction == 'alignrightinspector' && alignment == 'side' && '9px',
                    }}
                  >
                    {label}
                    <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
                  </label>
                )}
                {component?.definition?.styles?.iconVisibility?.value && (
                  <IconElement
                    style={{
                      width: '16',
                      height: '16',
                      right: direction == 'alignleftinspector' && alignment == 'side' && `${elementWidth - 21}px`,
                      left:
                        direction == 'alignrightinspector' && alignment == 'side' ? `6px` : alignment == 'top' && `6px`,
                      position: 'absolute',
                      top: alignment == 'side' ? '19px' : '38.5px',
                      transform: ' translateY(-50%)',
                      color: iconColor,
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
                {loadingState && <Loader style={{ ...loaderStyle }} width="16" />}
              </div>
              {showValidationError && (
                <div
                  className="tj-text-sm"
                  data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}
                  style={{ color: errTextColor, textAlign: direction == 'alignleftinspector' && 'end' }}
                >
                  {showValidationError && validationError}
                </div>
              )}
            </>
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
              {label?.length > 0 && (
                <label
                  style={{
                    color: darkMode && color == '#11181C' ? '#fff' : color,
                    width: label?.length == 0 ? '0%' : auto ? 'auto' : alignment == 'side' ? `${width}%` : '100%',
                    maxWidth: auto && alignment == 'side' ? '70%' : '100%',
                    overflowWrap: 'break-word',
                    marginRight: label?.length > 0 && direction == 'alignleftinspector' && alignment == 'side' && '9px',
                    marginLeft: label?.length > 0 && direction == 'alignrightinspector' && alignment == 'side' && '9px',
                  }}
                >
                  {label}
                  <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
                </label>
              )}
              {component?.definition?.styles?.iconVisibility?.value && (
                <IconElement
                  style={{
                    width: '16',
                    height: '16',
                    right: direction == 'alignleftinspector' && alignment == 'side' && `${elementWidth - 21}px`,
                    left:
                      direction == 'alignrightinspector' && alignment == 'side' ? `6px` : alignment == 'top' && `6px`,
                    position: 'absolute',
                    top: alignment == 'side' ? '19px' : '38.5px',
                    transform: ' translateY(-50%)',
                    color: iconColor,
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
                disabled={loadingState}
              />
              {loadingState && <Loader style={{ ...loaderStyle }} width="16" />}
            </div>
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
        )}
      </>
    </>
  );
};
