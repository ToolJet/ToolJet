import React, { useRef, useEffect, useState } from 'react';
import './numberinput.scss';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';
import * as Icons from '@tabler/icons-react';
import Loader from '@/ToolJetUI/Loader/Loader';
import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';

export const NumberInput = function NumberInput({
  height,
  properties,
  validate,
  styles,
  setExposedVariable,
  fireEvent,
  component,
  darkMode,
  dataCy,
  isResizing,
  adjustHeightBasedOnAlignment,
}) {
  const { loadingState, tooltip, disabledState, label, placeholder } = properties;
  const {
    padding,
    borderRadius,
    borderColor,
    backgroundColor,
    // textColor,
    boxShadow,
    width,
    alignment,
    direction,
    color,
    auto,
    errTextColor,
    iconColor,
  } = styles;

  const textColor = darkMode && ['#232e3c', '#000000ff'].includes(styles.textColor) ? '#fff' : styles.textColor;
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState) ?? false;
  const [visibility, setVisibility] = useState(properties.visibility);
  const [loading, setLoading] = useState(loadingState);
  const [showValidationError, setShowValidationError] = useState(false);
  const { isValid, validationError } = validate(value);

  const [value, setValue] = React.useState(Number(parseFloat(properties.value).toFixed(properties.decimalPlaces)));
  const inputRef = useRef(null);
  const currentState = useCurrentState();
  const [disable, setDisable] = useState(disabledState || loadingState);
  const labelStyles = {
    width: '100%',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    background: 'red',
    overflow: 'hidden',
  };

  useEffect(() => {
    if (alignment == 'top' && label?.length > 0) {
      adjustHeightBasedOnAlignment(true);
    } else adjustHeightBasedOnAlignment(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alignment, label?.length]);

  useEffect(() => {
    setValue(Number(parseFloat(value).toFixed(properties.decimalPlaces)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.decimalPlaces]);

  useEffect(() => {
    setValue(Number(parseFloat(properties.value).toFixed(properties.decimalPlaces)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  const handleBlur = (e) => {
    if (!isNaN(parseFloat(properties.minValue)) && parseFloat(e.target.value) < parseFloat(properties.minValue)) {
      setValue(Number(parseFloat(properties.minValue)));
    } else setValue(Number(parseFloat(e.target.value).toFixed(properties.decimalPlaces)));
    setShowValidationError(true);
    e.stopPropagation();
    // fireEvent('onBlur');
  };

  useEffect(() => {
    if (!isNaN(value)) {
      setExposedVariable('value', value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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

  const computedStyles = {
    height: height == 36 ? (padding == 'default' ? '32px' : '38px') : padding == 'default' ? height - 5 : height,
    borderRadius: `${borderRadius}px`,
    color: darkMode && textColor === '#11181C' ? '#ECEDEE' : textColor,
    borderColor: ['#D7DBDF'].includes(borderColor) ? (darkMode ? '#4C5155' : '#D7DBDF') : borderColor,
    backgroundColor: darkMode && ['#fff'].includes(backgroundColor) ? '#313538' : backgroundColor,
    boxShadow: boxShadow,
    padding: styles.iconVisibility ? '3px px 3px 28px' : '3px 12px 3px 5px',
  };

  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const [elementWidth, setElementWidth] = useState(0);
  useEffect(() => {
    if (inputRef.current) {
      const width = inputRef.current.getBoundingClientRect().width;
      setElementWidth(width);
    }
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
  ]);
  const iconName = styles.icon; // Replace with the name of the icon you want
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] == undefined ? Icons['IconHome2'] : Icons[iconName];
  // eslint-disable-next-line import/namespace

  const handleChange = (e) => {
    if (
      !isNaN(parseFloat(properties.minValue)) &&
      !isNaN(parseFloat(properties.maxValue)) &&
      parseFloat(properties.minValue) > parseFloat(properties.maxValue)
    ) {
      setValue(Number(parseFloat(properties.maxValue)));
    } else if (
      !isNaN(parseFloat(properties.maxValue)) &&
      parseFloat(e.target.value) > parseFloat(properties.maxValue)
    ) {
      setValue(Number(parseFloat(properties.maxValue)));
    } else {
      setValue(Number(parseFloat(e.target.value)));
    }
    fireEvent('onChange');
  };
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

  const handleIncrement = (e) => {
    e.preventDefault(); // Prevent the default button behavior (form submission, page reload)

    const newValue = (value || 0) + 1;

    if (!isNaN(parseFloat(properties.maxValue)) && newValue > parseFloat(properties.maxValue)) {
      setValue(Number(parseFloat(properties.maxValue)));
    } else if (!isNaN(parseFloat(properties.minValue)) && newValue < parseFloat(properties.minValue)) {
      setValue(Number(parseFloat(properties.minValue)));
    } else {
      setValue(newValue);
    }

    fireEvent('onChange');
  };
  const handleDecrement = (e) => {
    e.preventDefault();
    const newValue = (value || 0) - 1;

    if (!isNaN(parseFloat(properties.minValue)) && newValue < parseFloat(properties.minValue)) {
      setValue(Number(parseFloat(properties.minValue)));
    } else if (!isNaN(parseFloat(properties.maxValue)) && newValue > parseFloat(properties.maxValue)) {
      setValue(Number(parseFloat(properties.maxValue)));
    } else {
      setValue(newValue);
    }

    fireEvent('onChange');
  };

  const renderInput = () => {
    const loaderStyle = {
      left: direction === 'right' && defaultAlignment === 'side' ? `${elementWidth - 43}px` : undefined,
      top: label?.length > 0 && width > 0 && defaultAlignment === 'top' && '30px',
      right: '25px',
    };

    return (
      <>
        <div
          data-disabled={disable || loading}
          className={`text-input ${defaultAlignment === 'top' ? 'flex-column' : ''}  ${
            direction === 'right' && defaultAlignment === 'side' ? 'flex-row-reverse' : ''
          }
        ${direction === 'right' && defaultAlignment === 'top' ? 'text-right' : ''}
        `}
          style={{
            // height: height === 37 ? 37 : height,
            padding: padding === 'default' ? '3px 2px' : '',
            position: 'relative',
            width: '100%',
            display: !visibility ? 'none' : 'flex',
          }}
        >
          {label && width > 0 && (
            <label
              // className={defaultAlignment === 'side' && ``}
              style={{
                color: darkMode && color === '#11181C' ? '#fff' : color,
                width: label?.length === 0 ? '0%' : auto ? 'auto' : defaultAlignment === 'side' ? `${width}%` : '100%',
                maxWidth: auto && defaultAlignment === 'side' ? '70%' : '100%',
                // overflowWrap: 'break-word',
                marginRight: label?.length > 0 && direction === 'left' && defaultAlignment === 'side' ? '9px' : '',
                marginLeft: label?.length > 0 && direction === 'right' && defaultAlignment === 'side' ? '9px' : '',
                display: 'block',
                overflow: 'hidden', // Hide any content that overflows the box
                textOverflow: 'ellipsis', // Display ellipsis for overflowed content
                // whiteSpace: 'nowrap',
                fontWeight: 500,
              }}
            >
              <span style={{ ...labelStyles }}>{label}</span>
              <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
            </label>
          )}
          {component?.definition?.styles?.iconVisibility?.value && !isResizing && (
            <IconElement
              style={{
                width: '16px',
                height: '16px',
                right: direction === 'left' && defaultAlignment === 'side' ? `${elementWidth - 19}px` : '',
                left:
                  direction === 'right' && defaultAlignment === 'side'
                    ? '6px'
                    : defaultAlignment === 'top'
                    ? '6px'
                    : '',
                position: 'absolute',
                top: defaultAlignment === 'side' ? '18px' : label?.length > 0 && width > 0 ? '42px' : '18px',
                transform: ' translateY(-50%)',
                color: iconColor,
              }}
              stroke={1.5}
            />
          )}
          <div onClick={(e) => handleIncrement(e)}>
            <SolidIcon
              style={{
                backgroundColor: darkMode ? 'black' : 'white',
                top:
                  defaultAlignment === 'top'
                    ? padding == 'default'
                      ? '24px'
                      : '21px'
                    : padding == 'default'
                    ? '4px'
                    : '1px',
                left:
                  alignment == 'side' && direction === 'right'
                    ? padding == 'default'
                      ? `${elementWidth - 22}px`
                      : `${elementWidth - 24}px`
                    : undefined,
                right: padding == 'default' ? '3px' : '1px',
                height: padding == 'default' ? '16px' : '19px',
                borderLeft: darkMode ? '1px solid #313538' : '1px solid #D7D7D7',
                borderBottom: darkMode ? '1px solid #313538' : '1px solid #D7D7D7',
                borderTopRightRadius: borderRadius,
              }}
              className="numberinput-up-arrow arrow"
              name="cheveronup"
            ></SolidIcon>
          </div>
          <input
            ref={inputRef}
            disabled={disable || loading}
            onChange={handleChange}
            onBlur={handleBlur}
            type="number"
            className={`${
              !isValid && showValidationError ? 'is-invalid' : ''
            } input-number tj-text-input-widget form-control`}
            placeholder={placeholder}
            style={computedStyles}
            value={value}
            data-cy={dataCy}
            min={properties.minValue}
            max={properties.maxValue}
          />
          <div onClick={(e) => handleDecrement(e)}>
            <SolidIcon
              style={{
                backgroundColor: darkMode ? 'black' : 'white',
                left:
                  alignment == 'side' && direction === 'right'
                    ? padding == 'default'
                      ? `${elementWidth - 22}px`
                      : `${elementWidth - 24}px`
                    : undefined,
                right: padding == 'default' ? '3px' : '1px',
                height: padding == 'default' ? '16px' : '19px',
                bottom: padding == 'default' ? '4px' : '1px',
                borderLeft: darkMode ? '1px solid #313538' : '1px solid #D7D7D7',
                borderTop: darkMode ? '1px solid #313538' : '1px solid #D7D7D7',
                borderBottomRightRadius: borderRadius,
              }}
              className="numberinput-down-arrow arrow"
              name="cheverondown"
            ></SolidIcon>
          </div>

          {loading && <Loader style={{ ...loaderStyle }} width="16" />}
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
  };

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
