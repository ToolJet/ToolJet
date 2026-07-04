import React, { useEffect, useMemo, useRef } from 'react';
import { default as ReactCurrencyInput } from 'react-currency-input-field';
import {
  getLabelFontSize,
  getWidthTypeOfComponentStyles,
  getLabelWidthOfInput,
} from '../BaseComponents/hooks/useInput';
import { useControlledInput } from '../BaseComponents/hooks/useControlledInput';
import Loader from '@/ToolJetUI/Loader/Loader';
import { IconX } from '@tabler/icons-react';
import Label from '@/_ui/Label';
import { CountrySelect } from './CountrySelect';
import { CurrencyMap } from './constants';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';
import { parseValueToNumber } from './utils';

// Re-export: definition moved to ./utils so the CurrencyInput contract
// (_engine/contracts.ts) can share it without importing a React component.
export { parseValueToNumber } from './utils';

export const CurrencyInput = (props) => {
  const { id, properties, styles, componentName, darkMode, fireEvent, dataCy } = props;
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

  const inputLogic = useControlledInput({
    ...props,
    // CSA parameters the contract reducers read from current state.
    contractState: { decimalPlaces, numberFormat },
  });

  const {
    inputRef,
    labelRef,
    dispatch,
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
  } = inputLogic;

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
  };

  const setCountryCode = (code, { fireOnChange = false } = {}) => {
    const commands = [{ kind: 'INVOKE_CSA', componentId: id, action: 'setCountryCode', args: [code] }];
    if (fireOnChange) commands.push({ kind: 'FIRE_EVENT', componentId: id, event: 'onChange' });
    dispatch(commands);
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

  useEffect(() => {
    if (!isInitialRender.current) {
      setCountryCode(defaultCountry);
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

  // Derived exposures (parsed value / formattedValue / country) moved into
  // CurrencyInputContract — every setValue/setCountryCode patch carries them.
  // Declared after the guarded effects so their mount pass still sees true.
  useEffect(() => {
    isInitialRender.current = false;
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
                setCountryCode(selectedOption.value, { fireOnChange: true });
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
