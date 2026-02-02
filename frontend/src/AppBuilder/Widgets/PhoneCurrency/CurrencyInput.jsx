import React, { useEffect, useMemo, useRef } from 'react';
import { default as ReactCurrencyInput, formatValue } from 'react-currency-input-field';
import { useInput, getWidthTypeOfComponentStyles, getLabelWidthOfInput } from '../BaseComponents/hooks/useInput';
import Loader from '@/ToolJetUI/Loader/Loader';
import Label from '@/_ui/Label';
import { CountrySelect } from './CountrySelect';
import { CurrencyMap } from './constants';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';

// Parse value to number based on the number format
// Always returns a number for consistent exposed value
export const parseValueToNumber = (val, numberFormat) => {
  if (val === undefined || val === null || val === '') return 0;

  const strVal = String(val);

  // Check if value is a raw number (no commas, just digits and optionally one decimal point)
  // This handles the case after format switch when we store "1234.56"
  if (/^-?\d+\.?\d*$/.test(strVal)) {
    return parseFloat(strVal) || 0;
  }

  let normalized;
  if (numberFormat === 'eu') {
    // European format: dot is group separator, comma is decimal
    // e.g., "1.234,56" → "1234.56"
    normalized = strVal.replace(/\./g, '').replace(',', '.');
  } else {
    // US/UK format: comma is group separator, dot is decimal
    // e.g., "1,234.56" → "1234.56"
    normalized = strVal.replace(/,/g, '');
  }
  return parseFloat(normalized) || 0;
};

export const CurrencyInput = (props) => {
  const { id, properties, styles, componentName, darkMode, setExposedVariables, fireEvent } = props;
  const transformedProps = {
    ...props,
    inputType: 'currency',
  };
  const inputLogic = useInput(transformedProps);

  const {
    inputRef,
    labelRef,
    visibility,
    loading,
    disable,
    showValidationError,
    handlePhoneCurrencyInputChange,
    isFocused,
    labelWidth,
    isValid,
    validationError,
    isMandatory,
    handleBlur,
    handleFocus,
    value,
    country,
    setCountry,
  } = inputLogic;
  const {
    label,
    placeholder,
    decimalPlaces,
    isCountryChangeEnabled,
    defaultCountry = 'US',
    showFlag = true,
    numberFormat = 'us',
  } = properties;

  // Track previous number format to detect format changes
  const previousNumberFormat = useRef(numberFormat);
  // Get separators based on number format
  const separators = useMemo(() => {
    if (numberFormat === 'eu') {
      return { groupSeparator: '.', decimalSeparator: ',' };
    }
    // Default: US/UK style
    return { groupSeparator: ',', decimalSeparator: '.' };
  }, [numberFormat]);

  const handleKeyUp = (e) => {
    if (e.key === 'Enter') {
      fireEvent('onEnterPressed');
    }
  };

  const options = useMemo(() => {
    return Object.keys(CurrencyMap).map((ele) => ({
      label: `${CurrencyMap[ele].prefix} (${CurrencyMap[ele].currency})`,
      value: ele,
      country: CurrencyMap[ele].country,
    }));
  }, []);

  const onInputValueChange = (value) => {
    handlePhoneCurrencyInputChange(value);
    setExposedVariables({
      country: country,
    });
  };

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
  const disabledState = disable || loading;
  const isInitialRender = useRef(true);
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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderLeft: 'none',
  };

  const loaderStyle = {
    right:
      direction === 'right' &&
      defaultAlignment === 'side' &&
      ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0))
        ? `${labelWidth + 11}px`
        : '11px',
    top:
      defaultAlignment === 'top'
        ? ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0)) &&
          'calc(50% + 10px)'
        : '',
    transform:
      defaultAlignment === 'top' &&
      ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0)) &&
      ' translateY(-50%)',
    zIndex: 3,
  };

  const formattedValue = (value) => {
    return formatValue({
      value: `${value}`,
      groupSeparator: separators.groupSeparator,
      decimalSeparator: separators.decimalSeparator,
    });
  };

  useEffect(() => {
    if (!isInitialRender.current) {
      setCountry(defaultCountry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCountry]);

  // Normalize value when number format changes
  useEffect(() => {
    if (!isInitialRender.current && previousNumberFormat.current !== numberFormat && value) {
      // Convert value from old format to raw number, then the component will re-render with new format
      const rawNumber = parseValueToNumber(value, previousNumberFormat.current);
      if (!isNaN(rawNumber) && rawNumber !== 0) {
        // Store as raw number string - the component will format it with new separators
        handlePhoneCurrencyInputChange(String(rawNumber));
      }
    }
    previousNumberFormat.current = numberFormat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberFormat]);

  useEffect(() => {
    if (!isInitialRender.current) {
      setExposedVariables({
        country: country,
        formattedValue: `${CurrencyMap[country]?.prefix} ${formattedValue(value)}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, value, numberFormat]);

  useEffect(() => {
    if (!isInitialRender.current) {
      setExposedVariables({
        value: parseValueToNumber(value, numberFormat),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, numberFormat]);

  useEffect(() => {
    if (isInitialRender.current) {
      setExposedVariables({
        country: country,
        formattedValue: `${CurrencyMap[country]?.prefix} ${formattedValue(value)}`,
        value: parseValueToNumber(value, numberFormat),
        setCountryCode: (code) => {
          setCountry(code);
        },
      });
      isInitialRender.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labelClasses = { labelContainer: defaultAlignment === 'top' && 'tw-flex-shrink-0' };

  return (
    <>
      <div
        data-cy={`label-${String(componentName).toLowerCase()}`}
        className={`text-input d-flex phone-input-widget ${
          defaultAlignment === 'top' &&
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
        />
        <div
          className="d-flex h-100"
          style={{
            boxShadow,
            borderRadius: `${borderRadius}px`,
            ...getWidthTypeOfComponentStyles(widthType, width, auto, defaultAlignment),
          }}
        >
          <CountrySelect
            value={{
              label: `${CurrencyMap?.[country]?.prefix} (${CurrencyMap?.[country]?.currency})`,
              value: country,
              country: CurrencyMap?.[country]?.country,
            }}
            options={options}
            isCountryChangeEnabled={isCountryChangeEnabled}
            disabledState={disabledState}
            borderRadius={borderRadius}
            isValid={isValid}
            filterOption={(option, inputValue) => {
              return (
                option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
                option.data.country.toLowerCase().includes(inputValue.toLowerCase())
              );
            }}
            computedStyles={computedStyles}
            showValidationError={showValidationError}
            darkMode={darkMode}
            isCurrencyInput={true}
            showFlag={showFlag}
            onChange={(selectedOption) => {
              if (selectedOption) {
                setCountry(selectedOption.value);
                fireEvent('onChange');
              }
            }}
            componentId={id}
          />
          <ReactCurrencyInput
            ref={inputRef}
            placeholder={placeholder}
            className={`tj-text-input-widget ${
              !isValid && showValidationError ? 'is-invalid' : ''
            } validation-without-icon`}
            value={value}
            decimalsLimit={decimalPlaces}
            groupSeparator={separators.groupSeparator}
            decimalSeparator={separators.decimalSeparator}
            style={computedStyles}
            data-ignore-hover={true}
            onValueChange={(newVal) => {
              if (newVal === value) return;
              onInputValueChange(newVal);
            }}
            prefix={''}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyUp={handleKeyUp}
            id={`component-${id}`}
            aria-disabled={disabledState}
            aria-busy={loading}
            aria-required={isMandatory}
            aria-hidden={!visibility}
            aria-invalid={!isValid && showValidationError}
            aria-label={!auto && labelWidth == 0 && label?.length != 0 ? label : undefined}
          />
        </div>
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
