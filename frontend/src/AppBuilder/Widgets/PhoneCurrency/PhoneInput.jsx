import React, { useEffect, useMemo, useRef } from 'react';
// eslint-disable-next-line import/no-unresolved
import Input, { getCountries, getCountryCallingCode } from 'react-phone-number-input/input';
import { getCountryCallingCodeSafe } from './utils';
// eslint-disable-next-line import/no-unresolved
import en from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';
import { getLabelWidthOfInput, getWidthTypeOfComponentStyles, useInput } from '../BaseComponents/hooks/useInput';
import Loader from '@/ToolJetUI/Loader/Loader';
import { IconX } from '@tabler/icons-react';
import Label from '@/_ui/Label';
import { CountrySelect } from './CountrySelect';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';

const tinycolor = require('tinycolor2');

export const PhoneInput = (props) => {
  const { id, properties, styles, componentName, darkMode, setExposedVariables, fireEvent, dataCy } = props;
  const transformedProps = {
    ...props,
    inputType: 'phone',
  };
  const inputLogic = useInput(transformedProps);
  const {
    inputRef,
    labelRef,
    visibility,
    loading,
    disable,
    showValidationError,
    isFocused,
    labelWidth,
    isValid,
    validationError,
    isMandatory,
    handleBlur,
    handleFocus,
    value,
    handlePhoneCurrencyInputChange,
    country,
    setCountry,
  } = inputLogic;
  const { label, placeholder, isCountryChangeEnabled, defaultCountry = 'US', showClearBtn } = properties;

  const {
    textColor,
    backgroundColor,
    alignment,
    width,
    direction,
    auto,
    color,
    borderColor,
    accentColor,
    errTextColor,
    boxShadow,
    borderRadius,
    widthType,
  } = styles;
  const _width = getLabelWidthOfInput(widthType, width);
  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const hasLabel =
    (label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0);
  const isInitialRender = useRef(true);

  const options = useMemo(
    () =>
      getCountries()
        .map((country) => ({
          label: `${en[country]} +${getCountryCallingCodeSafe(country)}`,
          value: country,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    []
  );

  const onInputValueChange = (value) => {
    setExposedVariables({
      country: country,
      countryCode: `+${getCountryCallingCodeSafe(country)}`,
      formattedValue: `+${getCountryCallingCodeSafe(country)} ${inputRef.current?.value}`,
    });
    handlePhoneCurrencyInputChange(value);
  };

  const handleKeyUp = (e) => {
    if (e.key === 'Enter') {
      fireEvent('onEnterPressed');
    }
  };

  useEffect(() => {
    if (isInitialRender.current) {
      setExposedVariables({
        country: country,
        countryCode: `+${getCountryCallingCodeSafe(country)}`,
        formattedValue: `+${getCountryCallingCodeSafe(country)} ${inputRef.current?.value}`,
        value: value,
        setCountryCode: (code) => {
          let value = getCountryCallingCodeSafe(code);
          if (value) {
            setCountry(code);
          } else {
            value = getCountries().find((country) => `+${getCountryCallingCode(country)}` === code);
            setCountry(value ? value : '');
          }
          setExposedVariables({
            country: country,
            countryCode: `+${getCountryCallingCodeSafe(country)}`,
            formattedValue: `+${getCountryCallingCodeSafe(country)} ${inputRef.current?.value}`,
          });
        },
      });
      isInitialRender.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isInitialRender.current) {
      if (getCountryCallingCodeSafe(defaultCountry)) {
        setCountry(defaultCountry);
      }
    }
  }, [defaultCountry]);

  const disabledState = disable || loading;

  const loaderStyle = {
    right:
      direction === 'right' &&
        defaultAlignment === 'side' &&
        hasLabel
        ? `${labelWidth + 11}px`
        : '11px',
    top:
      defaultAlignment === 'top' ? hasLabel && 'calc(50% + 10px)' : '',
    transform:
      defaultAlignment === 'top' && hasLabel && ' translateY(-50%)',
    zIndex: 3,
  };
  const countryCode = getCountryCallingCodeSafe(country);
  const hasValue = (() => {
    if (value === '' || value === null || value === undefined) return false;
    if (!countryCode) return true;
    const normalizedValue = `${value}`.trim();
    const strippedValue = normalizedValue.replace(new RegExp(`^\\+${countryCode}`), '').trim();
    return strippedValue.length > 0;
  })();
  const shouldShowClearBtn = showClearBtn && hasValue && !disabledState && !loading;
  const clearButtonRight =
    direction === 'right' && defaultAlignment === 'side' && hasLabel ? `${labelWidth + 11}px` : '11px';
  const clearButtonTop = defaultAlignment === 'top' && hasLabel ? 'calc(50% + 10px)' : '50%';
  const clearButtonTransform = 'translateY(-50%)';

  const computedStyles = {
    height: '100%',
    borderRadius: `0px ${borderRadius}px ${borderRadius}px 0px`,
    color: !['#1B1F24', '#000', '#000000ff'].includes(textColor)
      ? textColor
      : disabledState
        ? 'var(--text-disabled)'
        : 'var(--text-primary)',
    borderColor: isFocused
      ? accentColor != '4368E3'
        ? accentColor
        : 'var(--primary-accent-strong)'
      : borderColor != '#CCD1D5'
        ? borderColor
        : disabledState
          ? '1px solid var(--borders-disabled-on-white)'
          : 'var(--borders-default)',
    '--tblr-input-border-color-darker': getModifiedColor(borderColor, 24),
    backgroundColor:
      backgroundColor != '#fff'
        ? backgroundColor
        : disabledState
          ? darkMode
            ? 'var(--surfaces-app-bg-default)'
            : 'var(--surfaces-surface-03)'
          : 'var(--surfaces-surface-01)',
    padding: '8px 10px',
    paddingRight: shouldShowClearBtn ? '32px' : undefined,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderLeft: 'none',
  };

  const labelClasses = { labelContainer: defaultAlignment === 'top' && 'tw-flex-shrink-0' };

  return (
    <>
      <div
        className={`text-input d-flex phone-input-widget ${defaultAlignment === 'top' &&
          ((width != 0 && label?.length != 0) || (auto && width == 0 && label && label?.length != 0))
          ? 'flex-column'
          : 'align-items-center'
          } ${direction === 'right' && defaultAlignment === 'side' ? 'flex-row-reverse' : ''}
        ${direction === 'right' && defaultAlignment === 'top' ? 'text-right' : ''}
        ${visibility || 'invisible'}`}
        style={{
          position: 'relative',
          whiteSpace: 'nowrap',
          width: '100%',
          height: '100%',
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
          widthType={widthType}
          inputId={`component-${id}`}
          classes={labelClasses}
          dataCy={dataCy}
        />
        <div
          data-cy={`${String(dataCy).toLowerCase()}-actionable-section`}
          className="d-flex h-100"
          style={{
            boxShadow,
            borderRadius: `${borderRadius}px`,
            ...getWidthTypeOfComponentStyles(widthType, width, auto, defaultAlignment),
          }}
        >
          <CountrySelect
            value={{ label: `${en[country]} +${getCountryCallingCodeSafe(country)}`, value: country }}
            options={options}
            isCountryChangeEnabled={isCountryChangeEnabled}
            disabledState={disabledState}
            borderRadius={borderRadius}
            isValid={isValid}
            computedStyles={computedStyles}
            showValidationError={showValidationError}
            darkMode={darkMode}
            onChange={(selectedOption) => {
              if (selectedOption) {
                setCountry(selectedOption.value);
              }
            }}
            componentId={id}
            dataCy={dataCy}
          />
          <Input
            ref={inputRef}
            country={country}
            international={true}
            value={value}
            onChange={onInputValueChange}
            placeholder={placeholder}
            style={computedStyles}
            id={`component-${id}`}
            aria-disabled={disabledState}
            aria-busy={loading}
            aria-required={isMandatory}
            aria-hidden={!visibility}
            aria-invalid={!isValid && showValidationError}
            aria-label={!auto && labelWidth == 0 && label?.length != 0 ? label : undefined}
            className={`tj-text-input-widget ${!isValid && showValidationError ? 'is-invalid' : ''
              } validation-without-icon`}
            data-ignore-hover={true}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyUp={handleKeyUp}
            data-cy={`${String(dataCy).toLowerCase()}-input`}
          />
        </div>
        {shouldShowClearBtn && (
          <button
            type="button"
            className="tj-input-clear-btn"
            aria-label="Clear"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              onInputValueChange('');
            }}
            style={{
              position: 'absolute',
              right: clearButtonRight,
              top: clearButtonTop,
              transform: clearButtonTransform,
              zIndex: 3,
            }}
          >
            <IconX size={16} color="var(--borders-strong)" className="cursor-pointer clear-indicator" />
          </button>
        )}
        {loading && <Loader style={loaderStyle} width="16" />}
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
          {validationError}
        </div>
      )}
    </>
  );
};
