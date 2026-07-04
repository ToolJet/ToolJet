import React, { useCallback, useEffect, useMemo, useRef } from 'react';
// eslint-disable-next-line import/no-unresolved
import Input, { getCountries } from 'react-phone-number-input/input';
import { getCountryCallingCodeSafe } from './utils';
// eslint-disable-next-line import/no-unresolved
import en from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';
import {
  getLabelFontSize,
  getLabelWidthOfInput,
  getWidthTypeOfComponentStyles,
} from '../BaseComponents/hooks/useInput';
import { useControlledInput } from '../BaseComponents/hooks/useControlledInput';
import Loader from '@/ToolJetUI/Loader/Loader';
import { IconX } from '@tabler/icons-react';
import Label from '@/_ui/Label';
import { CountrySelect } from './CountrySelect';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';

export const PhoneInput = (props) => {
  const { id, properties, styles, componentName, darkMode, fireEvent, dataCy } = props;
  const { label, placeholder, isCountryChangeEnabled, defaultCountry = 'US', showClearBtn } = properties;

  // Validation applies to the national number: strip the calling code of the
  // patch's target country (falls back to the last rendered country for the
  // hook's render-time validation, which passes no patch).
  const countryRef = useRef(defaultCountry);
  const validateRef = useRef(props.validate);
  validateRef.current = props.validate;
  const validatePhone = useCallback(
    (val, patch) => {
      const activeCountry = patch?.country ?? countryRef.current;
      const code = getCountryCallingCodeSafe(activeCountry);
      return validateRef.current?.(`${val ?? ''}`.replace(`+${code}`, ''));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.validate] // identity change re-triggers the hook's isValid re-exposure
  );

  const inputLogic = useControlledInput({
    ...props,
    validate: validatePhone,
  });
  const {
    inputRef,
    labelRef,
    dispatch,
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
    handlePhoneCurrencyInputChange,
    value,
    country,
  } = inputLogic;
  countryRef.current = country;

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
  const isInitialRender = useRef(true);

  const countryCode = getCountryCallingCodeSafe(country);
  const safeCountry = countryCode ? country : 'US'; // fall back to a valid country so the library never gets an unknown one.

  // Normalize value to an E.164 value expected by library.
  // prepend the calling code so the library never warns ("Expected E.164…") or fires a spurious onChange which leads to value flickering.
  const inputValue = (() => {
    const normalizedValue = `${value ?? ''}`.trim();
    if (!normalizedValue) return '';
    if (normalizedValue.startsWith('+')) return normalizedValue;
    return countryCode ? `+${countryCode}${normalizedValue}` : normalizedValue;
  })();

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

  // Country change (dropdown / defaultCountry binding) — the E.164 rebase +
  // country/calling-code resolution live in PhoneInputContract.setCountryCode.
  const onCountryChange = (nextCountry) => {
    dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'setCountryCode', args: [nextCountry] }]);
  };

  const onInputValueChange = (value) => {
    handlePhoneCurrencyInputChange(value);
  };

  const handleKeyUp = (e) => {
    if (e.key === 'Enter') {
      fireEvent('onEnterPressed');
    }
  };

  useEffect(() => {
    if (!isInitialRender.current) {
      onCountryChange(defaultCountry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCountry]);

  // Declared after the guarded effects so their mount pass still sees true.
  useEffect(() => {
    isInitialRender.current = false;
  }, []);

  const disabledState = disable || loading;

  const loaderStyle = {
    right: direction === 'right' && defaultAlignment === 'side' && hasLabel ? `${labelWidth + 11}px` : '11px',
    top: defaultAlignment === 'top' ? hasLabel && 'calc(50% + 10px)' : '',
    transform: defaultAlignment === 'top' && hasLabel && ' translateY(-50%)',
    zIndex: 3,
  };

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
                onCountryChange(selectedOption.value);
              }
            }}
            componentId={id}
            dataCy={dataCy}
          />
          <Input
            ref={inputRef}
            country={safeCountry}
            international={true}
            value={inputValue}
            onChange={onInputValueChange}
            placeholder={placeholder}
            style={computedStyles}
            id={`component-${id}`}
            disabled={disabledState}
            aria-disabled={disabledState}
            aria-busy={loading}
            aria-required={isMandatory}
            aria-hidden={!visibility}
            aria-invalid={!isValid && showValidationError}
            aria-label={!auto && labelWidth == 0 && label?.length != 0 ? label : undefined}
            className={`tj-text-input-widget ${
              !isValid && showValidationError ? 'is-invalid' : ''
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
