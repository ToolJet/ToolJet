import React, { useRef, useEffect, useState } from 'react';
import './numberinput.scss';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import * as Icons from '@tabler/icons-react';
import Loader from '@/ToolJetUI/Loader/Loader';

const tinycolor = require('tinycolor2');
import Label from '@/_ui/Label';
import { useGridStore } from '@/_stores/gridStore';

export const NumberInput = function NumberInput({
  id,
  height,
  properties,
  validate,
  styles,
  setExposedVariable,
  setExposedVariables,
  fireEvent,
  darkMode,
  dataCy,
  validation,
  componentName,
}) {
  const isInitialRender = useRef(true);
  const { loadingState, disabledState, label, placeholder } = properties;
  const isResizing = useGridStore((state) => state.resizingComponentId === id);
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
    accentColor,
  } = styles;

  const textColor = darkMode && ['#232e3c', '#000000ff'].includes(styles.textColor) ? '#CFD3D8' : styles.textColor;
  const isMandatory = validation?.mandatory ?? false;
  const minValue = validation?.minValue ?? null;
  const maxValue = validation?.maxValue ?? null;
  const [visibility, setVisibility] = useState(properties.visibility);
  const [loading, setLoading] = useState(loadingState);
  const [showValidationError, setShowValidationError] = useState(false);
  const [value, setValue] = React.useState(Number(parseFloat(properties.value).toFixed(properties.decimalPlaces)));
  const [validationStatus, setValidationStatus] = useState(validate(value));
  const { isValid, validationError } = validationStatus;
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef(null);

  const [disable, setDisable] = useState(disabledState || loadingState);
  const labelRef = useRef();
  const _width = (width / 100) * 70; // Max width which label can go is 70% for better UX calculate width based on this value

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    setInputValue(Number(parseFloat(value).toFixed(properties.decimalPlaces)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.decimalPlaces]);

  useEffect(() => {
    setInputValue(Number(parseFloat(properties.value).toFixed(properties.decimalPlaces)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  const handleBlur = (e) => {
    setInputValue(Number(parseFloat(e.target.value).toFixed(properties.decimalPlaces)));
    setShowValidationError(true);
    e.stopPropagation();
    fireEvent('onBlur');
    setIsFocused(false);
  };
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disable]);

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
    if (isInitialRender.current) return;
    const validationStatus = validate(value);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  }, [validate]);

  useEffect(() => {
    const exposedVariables = {
      setFocus: async function () {
        inputRef.current.focus();
      },
      setBlur: async function () {
        inputRef.current.blur();
      },
      setText: async function (text) {
        if (text) {
          const newValue = Number(parseFloat(text));
          setInputValue(newValue);
          fireEvent('onChange');
        }
      },
      clear: async function () {
        setInputValue('');
        fireEvent('onChange');
      },
      setLoading: async function (loading) {
        setLoading(loading);
        setExposedVariable('isLoading', loading);
      },
      setVisibility: async function (state) {
        setVisibility(state);
        setExposedVariable('isVisible', state);
      },
      setDisable: async function (disable) {
        setDisable(disable);
        setExposedVariable('isDisabled', disable);
      },
      label: label,
      isMandatory: isMandatory,
      isLoading: loading,
      isVisible: visibility,
      isDisabled: disable,
      isValid: isValid,
    };
    if (!isNaN(value)) {
      exposedVariables.value = value;
    }
    setExposedVariables(exposedVariables);

    isInitialRender.current = false;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (labelRef?.current) {
      const absolutewidth = labelRef?.current?.getBoundingClientRect()?.width;
      setLabelWidth(absolutewidth);
    } else setLabelWidth(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isResizing,
    width,
    auto,
    defaultAlignment,
    styles?.iconVisibility,
    labelRef?.current?.getBoundingClientRect()?.width,
    isMandatory,
    padding,
    direction,
    alignment,
  ]);

  const computedStyles = {
    height: height == 36 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
    borderRadius: `${borderRadius}px`,
    boxShadow: boxShadow,
    padding: styles?.iconVisibility
      ? height < 20
        ? '0px 10px 0px 29px'
        : '8px 10px 8px 29px'
      : height < 20
      ? '0px 10px'
      : '8px 10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: textColor !== '#1B1F24' ? textColor : disable || loading ? 'var(--text-disabled)' : 'var(--text-primary)',
    borderColor: isFocused
      ? accentColor != '4368E3'
        ? accentColor
        : 'var(--primary-accent-strong)'
      : borderColor != '#CCD1D5'
      ? borderColor
      : disable || loading
      ? 'var(--borders-disabled-on-white-dimmed)'
      : 'var(--borders-default)',
    '--tblr-input-border-color-darker': tinycolor(borderColor).darken(24).toString(),
    backgroundColor: !['#ffffff', '#ffffffff', '#fff'].includes(backgroundColor)
      ? backgroundColor
      : disable || loading
      ? darkMode
        ? 'var(--surfaces-app-bg-default)'
        : 'var(--surfaces-surface-03)'
      : 'var(--surfaces-surface-01)',
  };

  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const [labelWidth, setLabelWidth] = useState(0);

  const iconName = styles.icon; // Replace with the name of the icon you want
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] == undefined ? Icons['IconHome2'] : Icons[iconName];
  // eslint-disable-next-line import/namespace

  const handleChange = (e) => {
    if (e.target.value == '') {
      setInputValue(null);
      fireEvent('onChange');
    } else {
      setInputValue(Number(parseFloat(e.target.value)));
    }
    if (!isNaN(Number(parseFloat(e.target.value)))) {
      fireEvent('onChange');
    }
  };

  const handleIncrement = (e) => {
    e.preventDefault(); // Prevent the default button behavior (form submission, page reload)

    const newValue = (value || 0) + 1;
    setInputValue(newValue);
    if (!isNaN(newValue)) {
      fireEvent('onChange');
    }
  };
  const handleDecrement = (e) => {
    e.preventDefault();
    const newValue = (value || 0) - 1;
    setInputValue(newValue);
    if (!isNaN(newValue)) {
      fireEvent('onChange');
    }
  };

  const setInputValue = (value) => {
    setValue(value);
    if (!isNaN(value)) {
      setExposedVariable('value', value);
    }
    const validationStatus = validate(value);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  };

  const loaderStyle = {
    right:
      direction === 'right' &&
      defaultAlignment === 'side' &&
      ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0))
        ? `${labelWidth + 11 + 20}px` // 23 px usual + 20 for number input arrows
        : '31px',
    top: `${
      defaultAlignment === 'top'
        ? ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0)) &&
          'calc(50% + 10px)'
        : ''
    }`,
    transform:
      defaultAlignment === 'top' &&
      ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0)) &&
      ' translateY(-50%)',
    zIndex: 3,
  };

  const renderInput = () => {
    return (
      <>
        <div
          data-cy={`label-${String(componentName).toLowerCase()}`}
          className={`text-input tj-number-input-widget  d-flex  ${
            defaultAlignment === 'top' &&
            ((width != 0 && label && label?.length != 0) || (auto && width == 0 && label && label?.length != 0))
              ? 'flex-column'
              : 'align-items-center '
          }  ${direction === 'right' && defaultAlignment === 'side' ? 'flex-row-reverse' : ''}
         ${direction === 'right' && defaultAlignment === 'top' ? 'text-right' : ''}
         ${visibility || 'invisible'}`}
          style={{
            position: 'relative',
            width: '100%',
            display: !visibility ? 'none' : 'flex',
            whiteSpace: 'nowrap',
          }}
          data-disabled={disable || loading}
        >
          <Label
            label={label}
            width={width}
            labelRef={labelRef}
            darkMode={darkMode}
            color={color}
            defaultAlignment={defaultAlignment}
            direction={direction}
            auto={auto}
            isMandatory={isMandatory}
            _width={_width}
            labelWidth={labelWidth}
          />
          {styles?.iconVisibility && !isResizing && (
            <IconElement
              data-cy={'text-input-icon'}
              style={{
                width: '16px',
                height: '16px',
                left:
                  direction === 'right'
                    ? '11px'
                    : defaultAlignment === 'top'
                    ? '11px'
                    : (label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0)
                    ? `${labelWidth + 11}px`
                    : '11px', //11 ::  is 10 px inside the input + 1 px border + 12px margin right
                position: 'absolute',
                top: `${
                  defaultAlignment === 'side'
                    ? '50%'
                    : (label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0)
                    ? 'calc(50% + 10px)'
                    : '50%'
                }`,
                transform: ' translateY(-50%)',
                color: iconColor !== '#CFD3D859' ? iconColor : 'var(--icons-weak-disabled)',
                zIndex: 3,
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
            autoComplete="off"
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                setInputValue(e.target.value);
                fireEvent('onEnterPressed');
              }
            }}
            onFocus={(e) => {
              setIsFocused(true);
              e.stopPropagation();
              setTimeout(() => {
                fireEvent('onFocus');
              }, 0);
            }}
          />
          {!isResizing && (
            <>
              <div onClick={(e) => handleIncrement(e)}>
                <SolidIcon
                  width={padding == 'default' ? `${height / 2 - 1}px` : `${height / 2 + 1}px`}
                  height={padding == 'default' ? `${height / 2 - 1}px` : `${height / 2 + 1}px`}
                  fill={'var(--icons-default)'}
                  style={{
                    top: defaultAlignment === 'top' && label?.length > 0 && width > 0 ? '21px' : '1px',
                    right:
                      labelWidth == 0
                        ? '1px'
                        : alignment == 'side' && direction === 'right'
                        ? `${labelWidth + 1}px`
                        : '1px',
                    borderLeft:
                      disable || loading
                        ? '1px solid var(--borders-weak-disabled)'
                        : '1px solid var(--borders-default)',
                    borderBottom:
                      disable || loading
                        ? '1px solid var(--borders-weak-disabled)'
                        : '.5px solid var(--borders-default)',
                    borderTopRightRadius: borderRadius - 1,
                    backgroundColor: 'transparent',
                    zIndex: 3,
                  }}
                  className="numberinput-up-arrow arrow number-input-arrow"
                  name="TriangleDownCenter"
                ></SolidIcon>
              </div>

              <div onClick={(e) => handleDecrement(e)}>
                <SolidIcon
                  fill={'var(--icons-default)'}
                  style={{
                    right:
                      labelWidth == 0
                        ? '1px'
                        : alignment == 'side' && direction === 'right'
                        ? `${labelWidth + 1}px`
                        : '1px',
                    bottom: '1px',
                    borderLeft:
                      disable || loading
                        ? '1px solid var(--borders-weak-disabled)'
                        : '1px solid var(--borders-default)',
                    borderTop:
                      disable || loading
                        ? '1px solid var(--borders-weak-disabled)'
                        : '.5px solid var(--borders-default)',
                    borderBottomRightRadius: borderRadius - 1,
                    backgroundColor: 'transparent',
                    zIndex: 3,
                  }}
                  width={padding == 'default' ? `${height / 2 - 1}px` : `${height / 2 + 1}px`}
                  height={padding == 'default' ? `${height / 2 - 1}px` : `${height / 2 + 1}px`}
                  className="numberinput-down-arrow arrow number-input-arrow"
                  name="TriangleUpCenter"
                ></SolidIcon>
              </div>
            </>
          )}
          {loading && <Loader style={{ ...loaderStyle }} width="16" />}
        </div>
        {showValidationError && visibility && (
          <div
            data-cy={`${String(componentName).toLowerCase()}-invalid-feedback`}
            style={{
              color: errTextColor !== '#D72D39' ? errTextColor : 'var(--status-error-strong)',
              textAlign: direction == 'left' && 'end',
              fontSize: '11px',
              fontWeight: '400',
              lineHeight: '16px',
            }}
          >
            {showValidationError && validationError}
          </div>
        )}
      </>
    );
  };

  return <div>{renderInput()}</div>;
};
