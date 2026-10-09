import React, { useEffect, useMemo, useRef } from 'react';
import { default as ReactCurrencyInput, formatValue } from 'react-currency-input-field';
import {
  useInput,
  getLabelFontSize,
  getWidthTypeOfComponentStyles,
  getLabelWidthOfInput,
} from '../BaseComponents/hooks/useInput';
import Loader from '@/ToolJetUI/Loader/Loader';
import { IconX } from '@tabler/icons-react';
import Label from '@/_ui/Label';
import { CountrySelect } from './CountrySelect';
import { CurrencyMap, getNumberFormatConfig, parseValueToNumber } from './constants';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';

export const CurrencyInput = (props) => {
  const { id, properties, styles, componentName, darkMode, setExposedVariables, fireEvent, dataCy } = props;
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
    setCurrencyInputValue,
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
    showClearBtn,
  } = properties;

  // Separator characters (rendered as-is) and the locale that drives grouping positions.
  const { separators, intlConfig } = useMemo(() => {
    const { locale, groupSeparator, decimalSeparator } = getNumberFormatConfig(numberFormat);
    return { separators: { groupSeparator, decimalSeparator }, intlConfig: { locale } };
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

  // `numericValue` is the library-parsed float (from onValueChange);
  // it keeps the exposed numeric `value` accurate and set BEFORE onChange fires.
  const onInputValueChange = (displayValue, numericValue) => {
    setCurrencyInputValue(displayValue ?? '', numericValue);
    fireEvent('onChange');
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
    labelFontSize,
  } = styles;

  const labelFontSizeValue = getLabelFontSize(labelFontSize);
  const _width = getLabelWidthOfInput(widthType, width);
  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const hasLabel = (label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0);
  const disabledState = disable || loading;
  const isInitialRender = useRef(true);
  // The format the current `value` string is in; needed to parse it before a format switch reformats it.
  const previousNumberFormat = useRef(numberFormat);
  const hasValue = value !== '' && value !== null && value !== undefined;
  const shouldShowClearBtn = showClearBtn && hasValue && !disabledState && !loading;
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

  const loaderStyle = {
    right: direction === 'right' && defaultAlignment === 'side' && hasLabel ? `${labelWidth + 11}px` : '11px',
    top: defaultAlignment === 'top' ? hasLabel && 'calc(50% + 10px)' : '',
    transform: defaultAlignment === 'top' && hasLabel && ' translateY(-50%)',
    zIndex: 3,
  };
  const clearButtonRight =
    direction === 'right' && defaultAlignment === 'side' && hasLabel ? `${labelWidth + 11}px` : '11px';
  const clearButtonTop = defaultAlignment === 'top' && hasLabel ? 'calc(50% + 10px)' : '50%';
  const clearButtonTransform = 'translateY(-50%)';

  const formattedValue = (value) => {
    return formatValue({
      value: `${value}`,
      intlConfig,
      ...separators,
    });
  };

  useEffect(() => {
    if (!isInitialRender.current) {
      setCountry(defaultCountry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCountry]);

  // Reformat when the number format changes:
  // rebuild the display string from the format-agnostic number
  // so it re-renders with the new separators without mis-parsing.
  useEffect(() => {
    if (isInitialRender.current) return;
    // `value` is still in the PREVIOUS format's separators here, so parse it with that format.
    const num = parseValueToNumber(value, previousNumberFormat.current);
    previousNumberFormat.current = numberFormat;
    // Reformat any non-empty value; guarding on emptiness (not `num !== 0`) so "0"/"0,00" reformat too.
    if (value !== '' && value !== null && value !== undefined && Number.isFinite(num)) {
      setCurrencyInputValue(String(num), num);
    }
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
          dataCy={dataCy}
          fontSize={labelFontSizeValue}
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
            dataCy={dataCy}
          />
          <ReactCurrencyInput
            ref={inputRef}
            placeholder={placeholder}
            className={`tj-text-input-widget ${
              !isValid && showValidationError ? 'is-invalid' : ''
            } validation-without-icon`}
            value={value}
            decimalsLimit={Number(decimalPlaces) || 0}
            intlConfig={intlConfig}
            groupSeparator={separators.groupSeparator}
            decimalSeparator={separators.decimalSeparator}
            style={computedStyles}
            data-ignore-hover={true}
            onValueChange={(newVal, _name, values) => {
              if (newVal === value) return;
              // `values.float` is the library-parsed number; pass it so the exposed value is accurate.
              onInputValueChange(newVal, values?.float);
            }}
            prefix={''}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyUp={handleKeyUp}
            id={`component-${id}`}
            disabled={disabledState}
            aria-disabled={disabledState}
            aria-busy={loading}
            aria-required={isMandatory}
            aria-hidden={!visibility}
            aria-invalid={!isValid && showValidationError}
            aria-label={!auto && labelWidth == 0 && label?.length != 0 ? label : undefined}
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
          data-cy={`${String(dataCy).toLowerCase()}-invalid-feedback`}
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
