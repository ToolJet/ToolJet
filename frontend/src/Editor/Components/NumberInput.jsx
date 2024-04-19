import React, { useRef, useEffect, useState } from 'react';
import './numberinput.scss';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import * as Icons from '@tabler/icons-react';
import Loader from '@/ToolJetUI/Loader/Loader';
import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
const tinycolor = require('tinycolor2');
import Label from '@/_ui/Label';

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
  currentLayout,
}) {
  const { loadingState, disabledState, label, placeholder } = properties;
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
  const _width = (width / 100) * 70; // Max width which label can go is 70% for better UX calculate width based on this value

  useEffect(() => {
    setExposedVariable('label', label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    if (alignment == 'top' && ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0)))
      adjustHeightBasedOnAlignment(true);
    else adjustHeightBasedOnAlignment(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alignment, label?.length, currentLayout, width, auto]);

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
    component?.definition?.styles?.iconVisibility?.value,
    labelRef?.current?.getBoundingClientRect()?.width,
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
    height: height == 36 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
    borderRadius: `${borderRadius}px`,
    color: darkMode && textColor === '#11181C' ? '#ECEDEE' : textColor,
    borderColor: isFocused
      ? accentColor
      : ['#D7DBDF'].includes(borderColor)
      ? darkMode
        ? '#6D757D7A'
        : '#6A727C47'
      : borderColor,
    '--tblr-input-border-color-darker': tinycolor(borderColor).darken(24).toString(),
    backgroundColor:
      darkMode && ['#ffffff', '#ffffffff', '#fff'].includes(backgroundColor) ? '#313538' : backgroundColor,

    boxShadow: boxShadow,
    padding: styles.iconVisibility ? '8px 10px 8px 29px' : '8px 10px 8px 10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
      setExposedVariable('value', null).then(fireEvent('onChange'));
    }
    if (!isNaN(Number(parseFloat(e.target.value)))) {
      setExposedVariable('value', Number(parseFloat(e.target.value))).then(fireEvent('onChange'));
    }
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
    if (!isNaN(newValue)) {
      setExposedVariable('value', newValue).then(fireEvent('onChange'));
    }
  };
  const handleDecrement = (e) => {
    e.preventDefault();
    const newValue = (value || 0) - 1;
    setValue(newValue);
    if (!isNaN(newValue)) {
      setExposedVariable('value', newValue).then(fireEvent('onChange'));
    }
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
          data-cy={`label-${String(component.name).toLowerCase()}`}
          data-disabled={disable || loading}
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
          {component?.definition?.styles?.iconVisibility?.value && !isResizing && (
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
                    : '11px', //23 ::  is 10 px inside the input + 1 px border + 12px margin right
                position: 'absolute',
                top: `${
                  defaultAlignment === 'side'
                    ? '50%'
                    : (label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0)
                    ? 'calc(50% + 10px)'
                    : '50%'
                }`,
                transform: ' translateY(-50%)',
                color: iconColor,
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
                  height={`${height / 2}px`}
                  style={{
                    top: defaultAlignment === 'top' && label?.length > 0 && width > 0 ? '21px' : '1px',
                    right:
                      labelWidth == 0
                        ? '1px'
                        : alignment == 'side' && direction === 'right'
                        ? `${labelWidth + 1}px`
                        : '1px',
                    borderLeft: darkMode ? '1px solid #313538' : '1px solid #D7D7D7',
                    borderBottom: darkMode ? '.5px solid #313538' : '0.5px solid #D7D7D7',
                    borderTopRightRadius: borderRadius - 1,
                    backgroundColor: !darkMode ? 'white' : 'black',
                    zIndex: 3,
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
                        ? '1px'
                        : alignment == 'side' && direction === 'right'
                        ? `${labelWidth + 1}px`
                        : '1px',
                    bottom: '1px',
                    borderLeft: darkMode ? '1px solid #313538' : '1px solid #D7D7D7',
                    borderTop: darkMode ? '0.5px solid #313538' : '0.5px solid #D7D7D7',
                    borderBottomRightRadius: borderRadius - 1,
                    backgroundColor: !darkMode ? 'white' : 'black',
                    zIndex: 3,
                  }}
                  width={padding == 'default' ? `${height / 2 - 1}px` : `${height / 2 + 1}px`}
                  height={`${height / 2}px`}
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
            style={{
              color: errTextColor,
              textAlign: direction == 'left' && 'end',
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
