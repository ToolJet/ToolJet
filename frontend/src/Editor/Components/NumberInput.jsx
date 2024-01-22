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
  const minValue = resolveReferences(component?.definition?.validation?.minValue?.value, currentState) ?? null;
  const maxValue = resolveReferences(component?.definition?.validation?.maxValue?.value, currentState) ?? null;

  const [visibility, setVisibility] = useState(properties.visibility);
  const [loading, setLoading] = useState(loadingState);
  const [showValidationError, setShowValidationError] = useState(false);
  const [value, setValue] = React.useState(Number(parseFloat(properties.value).toFixed(properties.decimalPlaces)));
  const { isValid, validationError } = validate(value);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef(null);
  const currentState = useCurrentState();
  const [disable, setDisable] = useState(disabledState || loadingState);
  const labelRef = useRef();

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
    setValue(Number(parseFloat(e.target.value).toFixed(properties.decimalPlaces)));

    setShowValidationError(true);
    e.stopPropagation();
    fireEvent('onBlur');
    setIsFocused(false);
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
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    setExposedVariable('setVisibility', async function (state) {
      setVisibility(state);
      setExposedVariable('isVisible', state);
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
  useEffect(() => {
    if (labelRef.current) {
      const width = labelRef.current.offsetWidth;
      padding == 'default' ? setLabelWidth(width + 7) : setLabelWidth(width + 5);
    } else setLabelWidth(0);

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
  ]);

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  const computedStyles = {
    height: height == 40 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height - 4 : height,
    borderRadius: `${borderRadius}px`,
    color: darkMode && textColor === '#11181C' ? '#ECEDEE' : textColor,
    borderColor: isFocused
      ? '#3E63DD'
      : ['#D7DBDF'].includes(borderColor)
      ? darkMode
        ? '#4C5155'
        : '#D7DBDF'
      : borderColor,
    backgroundColor: darkMode && ['#fff'].includes(backgroundColor) ? '#313538' : backgroundColor,
    boxShadow:
      boxShadow !== '0px 0px 0px 0px #00000040' ? boxShadow : isFocused ? '0px 0px 0px 1px #3E63DD4D' : boxShadow,
    padding: styles.iconVisibility
      ? padding == 'default'
        ? '3px 5px 3px 29px'
        : '3px 5px 3px 29px'
      : '3px 5px 3px 5px',
  };

  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const [labelWidth, setLabelWidth] = useState(0);

  const iconName = styles.icon; // Replace with the name of the icon you want
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] == undefined ? Icons['IconHome2'] : Icons[iconName];
  // eslint-disable-next-line import/namespace

  const handleChange = (e) => {
    setValue(Number(parseFloat(e.target.value)));
    if (e.target.value == '') {
      setValue(null);
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
    setValue(newValue);
    fireEvent('onChange');
  };
  const handleDecrement = (e) => {
    e.preventDefault();
    const newValue = (value || 0) - 1;
    setValue(newValue);
    fireEvent('onChange');
  };
  useEffect(() => {
    setExposedVariable('setFocus', async function () {
      inputRef.current.focus();
    });
    setExposedVariable('setBlur', async function () {
      inputRef.current.blur();
    });
    setExposedVariable('setText', async function (text) {
      if (text) {
        const newValue = Number(parseFloat(text));
        setValue(newValue);
        setExposedVariable('value', text).then(fireEvent('onChange'));
      }
    });

    setExposedVariable('clear', async function () {
      setValue('');
      setExposedVariable('value', '').then(fireEvent('onChange'));
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderInput = () => {
    const loaderStyle = {
      right: alignment == 'top' ? `33px` : direction == 'left' ? `33px` : `${labelWidth + 35}px`,
      top: alignment == 'side' ? '' : `53%`,
      transform: alignment == 'top' && label?.length == 0 && 'translateY(-50%)',
    };

    return (
      <>
        <div
          data-disabled={disable || loading}
          className={`text-input overflow-hidden d-flex ${
            defaultAlignment === 'top' ? 'flex-column' : 'align-items-center '
          }  ${direction === 'right' && defaultAlignment === 'side' ? 'flex-row-reverse' : ''}
         ${direction === 'right' && defaultAlignment === 'top' ? 'text-right' : ''}
         ${visibility || 'invisible'}`}
          style={{
            padding: padding === 'default' ? '2px' : '',
            position: 'relative',
            width: '100%',
            display: !visibility ? 'none' : 'flex',
            whiteSpace: 'nowrap',
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
                textAlign: direction == 'right' ? 'right' : 'left',
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
                      ? '13px'
                      : '11px'
                    : defaultAlignment === 'top'
                    ? padding == 'default'
                      ? '13px'
                      : '11px'
                    : `${labelWidth + 15}px`,
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
          <input
            ref={inputRef}
            disabled={disable || loading}
            onChange={handleChange}
            onBlur={handleBlur}
            type="number"
            className={`${!isValid && showValidationError ? 'is-invalid' : ''} input-number  tj-text-input-widget`}
            placeholder={placeholder}
            style={computedStyles}
            value={value}
            data-cy={dataCy}
            min={minValue}
            max={maxValue}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                setValue(e.target.value);
                setExposedVariable('value', e.target.value);
                fireEvent('onEnterPressed');
              }
            }}
            onFocus={(e) => {
              setIsFocused(true);
              e.stopPropagation();
              fireEvent('onFocus');
            }}
          />
          {!isResizing && (
            <>
              <div onClick={(e) => handleIncrement(e)}>
                <SolidIcon
                  width={padding == 'default' ? `${height / 2 - 1}px` : `${height / 2 + 1}px`}
                  height={`${
                    height == 40 ? (padding == 'default' ? 18 : 20) : padding == 'default' ? height / 2 - 3 : height / 2
                  }px`}
                  style={{
                    top:
                      defaultAlignment === 'top' && label?.length > 0 && width > 0
                        ? padding == 'default'
                          ? '23px'
                          : '21px'
                        : padding == 'default'
                        ? '3px'
                        : '1px',
                    right:
                      labelWidth == 0
                        ? padding == 'default'
                          ? '3px'
                          : '0px'
                        : alignment == 'side' && direction === 'right'
                        ? `${labelWidth + 5}px`
                        : padding == 'default'
                        ? '3px'
                        : '1px',
                    borderLeft: darkMode ? '1px solid #313538' : '1px solid #D7D7D7',
                    borderBottom: darkMode ? '.5px solid #313538' : '0.5px solid #D7D7D7',
                    borderTopRightRadius: borderRadius - 1,
                    backgroundColor: !darkMode ? 'white' : 'black',
                  }}
                  className="numberinput-up-arrow arrow"
                  name="cheveronup"
                ></SolidIcon>
              </div>

              <div onClick={(e) => handleDecrement(e)}>
                <SolidIcon
                  style={{
                    right:
                      labelWidth == 0
                        ? padding == 'default'
                          ? '3px'
                          : '0px'
                        : alignment == 'side' && direction === 'right'
                        ? `${labelWidth + 5}px`
                        : padding == 'default'
                        ? '3px'
                        : '1px',
                    bottom: padding == 'default' ? '3px' : '1px',
                    borderLeft: darkMode ? '1px solid #313538' : '1px solid #D7D7D7',
                    borderTop: darkMode ? '0.5px solid #313538' : '0.5px solid #D7D7D7',
                    borderBottomRightRadius: borderRadius - 1,
                    backgroundColor: !darkMode ? 'white' : 'black',
                  }}
                  width={padding == 'default' ? `${height / 2 - 1}px` : `${height / 2 + 1}px`}
                  height={`${
                    height == 40 ? (padding == 'default' ? 18 : 20) : padding == 'default' ? height / 2 - 3 : height / 2
                  }px`}
                  className="numberinput-down-arrow arrow"
                  name="cheverondown"
                ></SolidIcon>
              </div>
            </>
          )}

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
