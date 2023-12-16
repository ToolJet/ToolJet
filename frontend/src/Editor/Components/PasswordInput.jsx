import React, { useEffect, useRef, useState } from 'react';
import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import { ToolTip } from '@/_components/ToolTip';
import * as Icons from '@tabler/icons-react';
import Loader from '@/ToolJetUI/Loader/Loader';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const PasswordInput = function PasswordInput({
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
  adjustHeightBasedOnAlignment,
}) {
  const textInputRef = useRef();
  const labelRef = useRef();

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
  const [passwordValue, setPasswordValue] = useState(properties.value);
  const [visibility, setVisibility] = useState(properties.visibility);
  const { isValid, validationError } = validate(passwordValue);
  const [showValidationError, setShowValidationError] = useState(false);
  const currentState = useCurrentState();
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState);
  const [elementWidth, setElementWidth] = useState(0);
  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const [iconVisibility, setIconVisibility] = useState(false);
  const [loading, setLoading] = useState(loadingState);

  const computedStyles = {
    height: height == 36 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
    borderRadius: `${borderRadius}px`,
    color: darkMode && textColor === '#11181C' ? '#ECEDEE' : textColor,
    borderColor: ['#D7DBDF'].includes(borderColor) ? (darkMode ? '#4C5155' : '#D7DBDF') : borderColor,
    backgroundColor: darkMode && ['#fff'].includes(backgroundColor) ? '#313538' : backgroundColor,
    boxShadow: boxShadow,
    padding: styles.iconVisibility
      ? padding == 'default'
        ? '3px 24px 3px 23px'
        : '3px 24px 3px 22px'
      : '3px 24px 3px 5px',
  };
  const loaderStyle = {
    right: direction === 'right' && defaultAlignment === 'side' ? `${elementWidth}px` : undefined,
    top: `${defaultAlignment === 'top' ? `calc(50% + 2px)` : ''}`,
  };

  useEffect(() => {
    if (labelRef.current) {
      const width = labelRef.current.offsetWidth;
      padding == 'default' ? setElementWidth(width + 17) : setElementWidth(width + 15);
    } else setElementWidth(5);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isResizing,
    width,
    auto,
    defaultAlignment,
    component?.definition?.styles?.iconVisibility?.value,
    label?.length,
    isMandatory,
    padding,
    direction,
    alignment,
    isMandatory,
  ]);

  useEffect(() => {
    disable !== disabledState && setDisable(disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    visibility !== properties.visibility && setVisibility(properties.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    loading !== loadingState && setLoading(loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  useEffect(() => {
    setPasswordValue(properties.value);
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
      setPasswordValue(text);
      setExposedVariable('value', text).then(fireEvent('onChange'));
    });
    setExposedVariable('clear', async function () {
      setPasswordValue('');
      setExposedVariable('value', '').then(fireEvent('onChange'));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPasswordValue]);

  const iconName = styles.icon; // Replace with the name of the icon you want
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] == undefined ? Icons['IconHome2'] : Icons[iconName];
  // eslint-disable-next-line import/namespace

  useEffect(() => {
    if (alignment == 'top' && label?.length > 0) adjustHeightBasedOnAlignment(true);
    else adjustHeightBasedOnAlignment(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alignment, label?.length]);

  useEffect(() => {
    setExposedVariable('isMandatory', isMandatory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMandatory]);

  useEffect(() => {
    setExposedVariable('isLoading', loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    setExposedVariable('setLoading', async function (loading) {
      setLoading(loading);
      setExposedVariable('isLoading', loading);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.loadingState]);

  useEffect(() => {
    setExposedVariable('isVisibile', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    setExposedVariable('setVisibility', async function (state) {
      setVisibility(state);
      setExposedVariable('isVisibile', state);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    setExposedVariable('setDisable', async function (disable) {
      setDisable(disable);
      setExposedVariable('isDisabled', disable);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    setExposedVariable('isDisabled', disable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disable]);

  const renderInput = () => (
    <>
      <div
        data-disabled={disable || loading}
        className={`text-input d-flex ${defaultAlignment === 'top' ? 'flex-column' : 'align-items-center '}  ${
          direction === 'right' && defaultAlignment === 'side' ? 'flex-row-reverse' : ''
        }
      ${direction === 'right' && defaultAlignment === 'top' ? 'text-right' : ''}
      ${visibility || 'invisible'}`}
        style={{
          padding: padding === 'default' ? '2px' : '',
          position: 'relative',
        }}
      >
        {label && width > 0 && (
          <label
            ref={labelRef}
            style={{
              color: darkMode && color === '#11181C' ? '#fff' : color,
              width: label?.length === 0 ? '0%' : auto ? 'auto' : defaultAlignment === 'side' ? `${width}%` : '100%',
              maxWidth: auto && defaultAlignment === 'side' ? '70%' : '100%',
              marginRight: label?.length > 0 && direction === 'left' && defaultAlignment === 'side' ? '9px' : '',
              marginLeft: label?.length > 0 && direction === 'right' && defaultAlignment === 'side' ? '9px' : '',
              display: 'block',
              overflow: label?.length > 18 && 'hidden', // Hide any content that overflows the box
              textOverflow: 'ellipsis', // Display ellipsis for overflowed content
              fontWeight: 500,
            }}
          >
            {label}
            <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
          </label>
        )}
        {component?.definition?.styles?.iconVisibility?.value && !isResizing && (
          <IconElement
            style={{
              width: '16px',
              height: '16px',
              left:
                direction === 'right'
                  ? padding == 'default'
                    ? '8px'
                    : '5px'
                  : defaultAlignment === 'top'
                  ? padding == 'default'
                    ? '8px'
                    : '5px'
                  : `${elementWidth}px`,
              position: 'absolute',
              top: `${
                defaultAlignment === 'side' ? '50%' : label?.length > 0 && width > 0 ? 'calc(50% + 10px)' : '50%'
              }`,
              transform: ' translateY(-50%)',
              color: iconColor,
            }}
            stroke={1.5}
          />
        )}
        {!loading && !isResizing && (
          <div
            onClick={() => {
              setIconVisibility(!iconVisibility);
            }}
            style={{
              width: '7',
              height: '7',
              position: 'absolute',
              right:
                alignment == 'top'
                  ? padding == 'none'
                    ? `6px`
                    : '8px'
                  : direction == 'left'
                  ? padding == 'none'
                    ? `6px`
                    : '8px'
                  : `${elementWidth}px`,
              top: alignment == 'side' ? '50%' : label?.length > 0 && width > 0 ? `calc(50% + 10px)` : '50%',
              transform: ' translateY(-50%)',
            }}
            stroke={1.5}
          >
            <SolidIcon width={14} className="password-component-eye" name={!iconVisibility ? 'eye1' : 'eyedisable'} />
          </div>
        )}
        <input
          className={`tj-text-input-widget ${
            !isValid && showValidationError ? 'is-invalid' : ''
          } validation-without-icon ${darkMode && 'dark-theme-placeholder'}`}
          ref={textInputRef}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              setPasswordValue(e.target.value);
              setExposedVariable('value', e.target.value);
              fireEvent('onEnterPressed');
            }
          }}
          onChange={(e) => {
            setPasswordValue(e.target.value);
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
          type={!iconVisibility ? 'password' : 'text'}
          placeholder={placeholder}
          style={computedStyles}
          value={passwordValue}
          data-cy={dataCy}
          disabled={disable || loading}
        />
        {loading && <Loader style={{ ...loaderStyle }} width="16" />}
      </div>
      {showValidationError && visibility && (
        <div
          className="tj-text-sm"
          data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}
          style={{ color: errTextColor, textAlign: direction === 'left' && 'end' }}
        >
          {showValidationError && validationError}
        </div>
      )}
    </>
  );

  return (
    <>
      {tooltip?.length > 0 ? (
        <ToolTip message={tooltip}>
          <div>{renderInput()}</div>
        </ToolTip>
      ) : (
        <div>{renderInput()}</div>
      )}
    </>
  );
};
