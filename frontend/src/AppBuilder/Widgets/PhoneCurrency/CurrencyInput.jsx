import React, { useEffect, useMemo, useRef } from 'react';
import { default as ReactCurrencyInput } from 'react-currency-input-field';
import { useInput } from '../BaseComponents/hooks/useInput';
import Loader from '@/ToolJetUI/Loader/Loader';
import Label from '@/_ui/Label';
import { CountrySelect } from './CountrySelect';
import { CurrencyMap } from './constants';
const tinycolor = require('tinycolor2');

export const CurrencyInput = (props) => {
  const { properties, styles, componentName, darkMode, setExposedVariables, fireEvent } = props;
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
  const { label, placeholder, decimalPlaces, isCountryChangeEnabled, defaultCountry = 'US' } = properties;

  const handleKeyUp = (e) => {
    if (e.key === 'Enter') {
      fireEvent('onEnterPressed');
    }
  };

  const options = useMemo(() => {
    return Object.keys(CurrencyMap).map((country) => ({
      label: `${CurrencyMap[country].prefix} (${CurrencyMap[country].currency})`,
      value: country,
    }));
  }, []);

  const onInputValueChange = (value) => {
    setExposedVariables({
      country: country,
      formattedValue: `${CurrencyMap?.[country]?.prefix || ''} ${inputRef.current?.value}`,
    });
    handlePhoneCurrencyInputChange(value);
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
  } = styles;
  const _width = (width / 100) * 70;
  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const disabledState = disable || loading;
  const isInitialRender = useRef(true);
  const computedStyles = {
    height: '100%',
    borderRadius: `${borderRadius}px`,
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
    '--tblr-input-border-color-darker': tinycolor(borderColor).darken(24).toString(),
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
    borderBottomLeftRadius: '0px',
    borderTopLeftRadius: '0px',
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

  useEffect(() => {
    if (isInitialRender.current) {
      setExposedVariables({
        country: country,
        formattedValue: `${CurrencyMap?.[country]?.prefix || ''} ${inputRef.current?.value}`,
        value: value,
        setCountryCode: (code) => {
          setCountry(code);
        },
      });
      isInitialRender.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isInitialRender.current) {
      setCountry(defaultCountry);
    }
  }, [defaultCountry]);

  console.log('CurrencyMap?.[country]?.prefix', CurrencyMap?.[country]?.prefix);

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
        />
        <div className="d-flex h-100 w-100" style={{ boxShadow, borderRadius: `${borderRadius}px` }}>
          <CountrySelect
            value={{ label: `${CurrencyMap?.[country]?.prefix} (${CurrencyMap?.[country]?.currency})`, value: country }}
            options={options}
            isCountryChangeEnabled={isCountryChangeEnabled}
            disabledState={disabledState}
            borderRadius={borderRadius}
            isValid={isValid}
            computedStyles={computedStyles}
            showValidationError={showValidationError}
            darkMode={darkMode}
            isCurrencyInput={true}
            onChange={(selectedOption) => {
              if (selectedOption) {
                setCountry(selectedOption.value);
                setExposedVariables({
                  country: selectedOption.value,
                  formattedValue: `${CurrencyMap?.[selectedOption.value]?.prefix || ''} ${inputRef.current?.value}`,
                });
              }
            }}
          />
          <ReactCurrencyInput
            ref={inputRef}
            placeholder={placeholder}
            className={`tj-text-input-widget ${
              !isValid && showValidationError ? 'is-invalid' : ''
            } validation-without-icon`}
            value={value}
            decimalsLimit={decimalPlaces}
            style={computedStyles}
            data-ignore-hover={true}
            onValueChange={(value) => onInputValueChange(value)}
            prefix={`${CurrencyMap?.[country]?.prefix || ''} `}
            disabled={disabledState}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyUp={handleKeyUp}
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
