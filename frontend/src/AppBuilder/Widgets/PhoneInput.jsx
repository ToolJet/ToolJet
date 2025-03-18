import React from 'react';
import { default as ReactPhoneInput } from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useInput } from './BaseComponents/hooks/useInput';
import Loader from '@/ToolJetUI/Loader/Loader';
import Label from '@/_ui/Label';

export const PhoneInput = (props) => {
  const { properties, styles, componentName, darkMode } = props;
  const inputLogic = useInput(props);
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
  const { label, placeholder, isCountryChangeEnabled } = properties;
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
    color: textColor,
    backgroundColor,
    border: `${isFocused ? '1.5px' : '1px'} solid ${inputBorderColor}`,
  };

  const buttonStyle = {
    backgroundColor: backgroundColor,
    border: `${isFocused ? '1.5px' : '1px'} solid ${inputBorderColor}`,
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
        className={`text-input d-flex ${
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
          onKeyUp={handleKeyUp}
          disableDropdown={isCountryChangeEnabled}
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
