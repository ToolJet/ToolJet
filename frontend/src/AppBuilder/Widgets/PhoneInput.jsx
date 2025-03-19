import React from 'react';
import { default as ReactPhoneInput } from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useInput } from './BaseComponents/hooks/useInput';
import Loader from '@/ToolJetUI/Loader/Loader';
import Label from '@/_ui/Label';

export const PhoneInput = (props) => {
  const { properties, styles, componentName, darkMode } = props;
  const transformedProps = {
    ...props,
    inputType: 'phone',
  };
  const inputLogic = useInput(transformedProps);
  const {
    inputRef,
    labelRef,
    value,
    visibility,
    loading,
    disable,
    validationStatus,
    showValidationError,
    isFocused,
    labelWidth,
    iconVisibility,
    setIconVisibility,
    isValid,
    validationError,
    isMandatory,
    setInputValue,
    handleChange,
    handleBlur,
    handleFocus,
    handleKeyUp,
  } = inputLogic;
  const { label, placeholder, isCountryChangeEnabled, defaultCountry = 'us' } = properties;
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

  const inputBorderColor = isFocused
    ? accentColor != '4368E3'
      ? accentColor
      : 'var(--primary-accent-strong)'
    : borderColor != '#CCD1D5'
    ? borderColor
    : disable || loading
    ? '1px solid var(--borders-disabled-on-white)'
    : 'var(--borders-default)';

  const inputStyle = {
    color: darkMode && textColor === '#1B1F24' ? '#FFF' : textColor,
    backgroundColor: disable ? '#e4e7eb' : darkMode && backgroundColor === '#fff' ? '#1c2025' : backgroundColor,
    border: `${isFocused ? '1.5px' : '1px'} solid ${inputBorderColor}`,
    boxShadow,
    borderRadius: `${borderRadius}px`,
  };

  const dropdownStyle = {
    backgroundColor: darkMode ? '#1B1F24' : '#fff',
    color: darkMode ? '#fff' : '#1B1F24',
  };

  const searchStyle = {
    backgroundColor: darkMode ? '#1B1F24' : '#fff',
    color: darkMode ? '#fff' : '#1B1F24',
  };

  const containerStyle = {
    backgroundColor: darkMode ? '#1B1F24' : '#fff',
    color: darkMode ? '#fff' : '#1B1F24',
    borderRadius: `${borderRadius}px`,
  };

  const buttonStyle = {
    backgroundColor: disable ? '#e4e7eb' : darkMode && backgroundColor === '#fff' ? '#1c2025' : backgroundColor,
    border: `${isFocused ? '1.5px' : '1px'} solid ${inputBorderColor}`,
    borderTopLeftRadius: `${borderRadius}px`,
    borderBottomLeftRadius: `${borderRadius}px`,
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
        <ReactPhoneInput
          placeholder={placeholder}
          value={value}
          onChange={setInputValue}
          enableSearch={true}
          ref={inputRef}
          inputStyle={inputStyle}
          buttonStyle={buttonStyle}
          searchPlaceholder="Search"
          disabled={disable || loading}
          onBlur={handleBlur}
          onFocus={handleFocus}
          inputProps={{
            autoFocus: true,
          }}
          onKeyDown={handleKeyUp}
          disableDropdown={!isCountryChangeEnabled}
          {...(defaultCountry !== 'none' && { country: defaultCountry })}
          countryCodeEditable={isCountryChangeEnabled}
          dropdownStyle={dropdownStyle}
          searchStyle={searchStyle}
          containerStyle={containerStyle}
        />
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
