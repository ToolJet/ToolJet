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
  setExposedVariables,
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
  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';

  const computedStyles = {
    height: height == 37 ? (padding == 'default' ? '32px' : '38px') : padding == 'default' ? height - 5 : height,
    borderRadius: `${borderRadius}px`,
    color: darkMode && textColor === '#11181C' ? '#ECEDEE' : textColor,
    borderColor: ['#D7DBDF'].includes(borderColor) ? (darkMode ? '#4C5155' : '#D7DBDF') : borderColor,
    backgroundColor: darkMode && ['#fff'].includes(backgroundColor) ? '#313538' : backgroundColor,
    boxShadow: boxShadow,
    padding: styles.iconVisibility ? '3px 28px' : '3px 5px',
  };
  const loaderStyle = {
    left: direction === 'right' && defaultAlignment === 'side' ? `${elementWidth - 19}px` : undefined,
    top: label?.length > 0 && width > 0 && defaultAlignment === 'top' && '30px',
  };
  useEffect(() => {
    if (textInputRef.current) {
      const width = textInputRef.current.getBoundingClientRect().width;
      setElementWidth(width);
    }
  }, [isResizing, width, auto, defaultAlignment, component?.definition?.styles?.iconVisibility?.value, label?.length]);

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
    const exposedVariables = {
      setFocus: async function () {
        textInputRef.current.focus();
      },
      setBlur: async function () {
        textInputRef.current.blur();
      },
      disable: async function (value) {
        setDisable(value);
      },
      visibility: async function (value) {
        setVisibility(value);
      },
    };
    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const exposedVariables = {
      setText: async function (text) {
        setValue(text);
        setExposedVariable('value', text).then(fireEvent('onChange'));
      },
      clear: async function () {
        setValue('');
        setExposedVariable('value', '').then(fireEvent('onChange'));
      },
    };
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setValue]);
  const iconName = styles.icon; // Replace with the name of the icon you want
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] == undefined ? Icons['IconHome2'] : Icons[iconName];
  // eslint-disable-next-line import/namespace

  const renderInput = () => (
    <>
      <div
        data-disabled={disable || loadingState}
        className={`text-input d-flex ${defaultAlignment === 'top' ? 'flex-column' : ''}  ${
          direction === 'right' && defaultAlignment === 'side' ? 'flex-row-reverse' : ''
        }
      ${direction === 'right' && defaultAlignment === 'top' ? 'text-right' : ''}
      ${visibility || 'invisible'}`}
        style={{
          // height: height === 37 ? 37 : height,
          padding: padding === 'default' ? '3px 2px' : '',
          position: 'relative',
        }}
      >
        {label && width > 0 && (
          <label
            className={defaultAlignment === 'side' && `d-flex align-items-center`}
            style={{
              color: darkMode && color === '#11181C' ? '#fff' : color,
              width: label?.length === 0 ? '0%' : auto ? 'auto' : defaultAlignment === 'side' ? `${width}%` : '100%',
              maxWidth: auto && defaultAlignment === 'side' ? '70%' : '100%',
              overflowWrap: 'break-word',
              marginRight: label?.length > 0 && direction === 'left' && defaultAlignment === 'side' ? '9px' : '',
              marginLeft: label?.length > 0 && direction === 'right' && defaultAlignment === 'side' ? '9px' : '',
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
              right: direction === 'left' && defaultAlignment === 'side' ? `${elementWidth - 18}px` : '',
              left:
                direction === 'right' && defaultAlignment === 'side' ? '6px' : defaultAlignment === 'top' ? '6px' : '',
              position: 'absolute',
              top: defaultAlignment === 'side' ? '18px' : label?.length > 0 && width > 0 ? '38.5px' : '18px',
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
            if (e.key === 'Enter') {
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
      {showValidationError && visibility && (
        <div
          className="tj-text-sm"
          data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}
          style={{ color: errTextColor, textAlign: direction == 'left' && 'end' }}
        >
          {showValidationError && validationError}
        </div>
      )}
    </>
  );

  return (
    <>
      {properties?.tooltip?.length > 0 ? (
        <ToolTip message={tooltip}>
          <div>{renderInput()}</div>
        </ToolTip>
      ) : (
        <div>{renderInput()}</div>
      )}
    </>
  );
};
