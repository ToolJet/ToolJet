import React, { useEffect, useMemo, useRef } from 'react';
// eslint-disable-next-line import/no-unresolved
import Input, { getCountries, getCountryCallingCode } from 'react-phone-number-input/input';
import { getCountryCallingCodeSafe, toE164 } from './utils';
// eslint-disable-next-line import/no-unresolved
import en from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';
import {
  getLabelFontSize,
  getLabelHeight,
  getLabelWidthOfInput,
  getWidthTypeOfComponentStyles,
  useInput,
} from '../BaseComponents/hooks/useInput';
import Loader from '@/ToolJetUI/Loader/Loader';
import { IconX } from '@tabler/icons-react';
import Label from '@/_ui/Label';
import { BOX_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { CountrySelect } from './CountrySelect';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';

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
    country,
    setCountry,
    setPhoneInputValue,
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
    labelFontSize,
    padding,
  } = styles;

  const labelFontSizeValue = getLabelFontSize(labelFontSize);
  const _width = getLabelWidthOfInput(widthType, width);
  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const hasLabel = (label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0);
  const isInitialRender = useRef(true);

  const countryCode = getCountryCallingCodeSafe(country);
  const safeCountry = countryCode ? country : 'US'; // fall back to a valid country so the library never gets an unknown one.

  // Normalize to the E.164 value the library expects, so it never warns
  // ("Expected E.164…") or fires a corrective onChange that flickers the value. This
  // shares the same rule as every other write and is idempotent, so a value
  // that has already been normalized passes through unchanged.
  const inputValue = countryCode ? toE164(value, countryCode, countryCode) : `${value ?? ''}`.trim();

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

  /**
   * Changes the active country and re-bases the current value onto its calling code.
   *   - Strips the previously applied calling code prefix from the current value, and prepends the new country's calling code.
   *   - Updates the country and input value states.
   *
   * NOTE -
   * `react-phone-number-input` expects `value` to be an E.164 number consistent with the `country` prop.
   * Changing `country` alone leaves the old calling code on `value` (e.g. country "US" + "+91XXXXXXXXXX" still holds IN);
   * the library then mangles the number and fires a corrective `onChange`, which can spiral into a re-render loop.
   */
  const onCountryChange = (nextCountry) => {
    const newCode = getCountryCallingCodeSafe(nextCountry);
    if (!newCode) return;

    // Strip the PREVIOUS country's code, which is the one the current value carries.
    const nextValue = toE164(value, newCode, getCountryCallingCodeSafe(country));

    // Return early so a re-resolved-but-unchanged country won't trigger re-renders.
    if (nextCountry === country && nextValue === value) return;

    setCountry(nextCountry);
    // Pass nextCountry so the value is validated/published against the new country,
    // since the `country` state closure isn't updated until the re-render.
    setPhoneInputValue(nextValue, nextCountry);
  };

  const onInputValueChange = (value) => {
    setPhoneInputValue(value);
    fireEvent('onChange');
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
      });
      isInitialRender.current = false;
    }
  }, []);

  // Accepts either a country code ('CN') or a calling code ('+86'),
  // then routes through onCountryChange, which re-bases the value onto the new calling code and ignores an unresolvable country.
  useEffect(() => {
    setExposedVariables({
      setCountryCode: (code) => {
        const resolvedCountry = getCountryCallingCodeSafe(code)
          ? code
          : getCountries().find((c) => `+${getCountryCallingCode(c)}` === code) || '';
        onCountryChange(resolvedCountry);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, value]);

  useEffect(() => {
    if (!isInitialRender.current) {
      onCountryChange(defaultCountry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCountry]);

  const disabledState = disable || loading;

  const loaderStyle = {
    right: direction === 'right' && defaultAlignment === 'side' && hasLabel ? `${labelWidth + 11}px` : '11px',
    top: defaultAlignment === 'top' ? hasLabel && `calc(50% + ${getLabelHeight(labelFontSize) / 2}px)` : '',
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
  // Half the label's own height: the button is positioned against the whole widget, so it must be
  // pushed down by half of whatever a top-aligned label consumes to land on the middle of the
  // field. A fixed 10px was only correct at the 12px default. Mirrors the BaseInput fix.
  const clearButtonTop =
    defaultAlignment === 'top' && hasLabel ? `calc(50% + ${getLabelHeight(labelFontSize) / 2}px)` : '50%';

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
        {/*
          `h-100` is `height: 100% !important` (tabler.scss:6829), which an inline height cannot
          override, so the class is dropped and BOTH branches set the height here. Top-aligned, the
          field sits below the label in a flex column, so a full wrapper height is added to the
          label's and the content spills out of its own widget box as the label grows; subtracting
          the label height keeps it contained until the label alone exceeds the box. The side
          branch restores exactly what the class used to supply.
        */}
        <div
          data-cy={`${String(dataCy).toLowerCase()}-actionable-section`}
          className="d-flex"
          style={{
            boxShadow,
            borderRadius: `${borderRadius}px`,
            ...getWidthTypeOfComponentStyles(widthType, width, auto, defaultAlignment),
            ...(defaultAlignment === 'top' && label?.length != 0
              ? {
                  height: `calc(100% - ${getLabelHeight(labelFontSize)}px - ${
                    padding === 'default' ? BOX_PADDING * 2 : 0
                  }px)`,
                  flex: 1,
                }
              : { height: '100%' }),
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
              // Reveal here rather than inside onInputValueChange: that is also the typing handler,
              // and a keystroke must not accuse the user mid-edit.
              // Clearing is a completed action, not a keystroke, so it reveals any resulting error the way a blur does.
              inputLogic.setShowValidationError(true);
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
