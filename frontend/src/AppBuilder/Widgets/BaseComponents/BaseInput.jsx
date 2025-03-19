import React, { forwardRef } from 'react';
import Label from '@/_ui/Label';
import Loader from '@/ToolJetUI/Loader/Loader';
import * as Icons from '@tabler/icons-react';
const tinycolor = require('tinycolor2');

const RenderInput = forwardRef((props, ref) => {
  return props.inputType !== 'textarea' ? <input {...props} ref={ref} /> : <textarea {...props} ref={ref} />;
});

export const BaseInput = ({
  height,
  styles,
  properties,
  darkMode,
  componentName,
  dataCy,
  // From useInput hook
  inputRef,
  labelRef,
  visibility,
  loading,
  labelWidth,
  validationError,
  showValidationError,
  isFocused,
  isMandatory,
  disable,
  value,
  handleChange,
  handleBlur,
  handleFocus,
  handleKeyUp,
  isValid,
  // Input specific props
  inputType = 'text',
  additionalInputProps = {},
  rightIcon,
  getCustomStyles,
}) => {
  const {
    padding,
    borderRadius,
    borderColor,
    backgroundColor,
    textColor,
    boxShadow,
    width,
    alignment,
    direction,
    color,
    auto,
    errTextColor,
    iconColor,
    accentColor,
    iconVisibility: showLeftIcon,
    icon,
  } = styles;

  const { label, placeholder } = properties;
  const _width = (width / 100) * 70;
  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';

  const computedStyles = {
    height: height == 36 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
    borderRadius: `${borderRadius}px`,
    color: !['#1B1F24', '#000', '#000000ff'].includes(textColor)
      ? textColor
      : disable || loading
      ? 'var(--text-disabled)'
      : 'var(--text-primary)',
    borderColor: isFocused
      ? accentColor != '4368E3'
        ? accentColor
        : 'var(--primary-accent-strong)'
      : borderColor != '#CCD1D5'
      ? borderColor
      : disable || loading
      ? '1px solid var(--borders-disabled-on-white)'
      : 'var(--borders-default)',
    '--tblr-input-border-color-darker': tinycolor(borderColor).darken(24).toString(),
    backgroundColor:
      backgroundColor != '#fff'
        ? backgroundColor
        : disable || loading
        ? darkMode
          ? 'var(--surfaces-app-bg-default)'
          : 'var(--surfaces-surface-03)'
        : 'var(--surfaces-surface-01)',
    boxShadow,
    padding: showLeftIcon ? '8px 10px 8px 29px' : '8px 10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  let loaderStyle;
  // for textarea loader position is fixed on top right of input box.
  if (inputType !== 'textarea') {
    loaderStyle = {
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
  } else {
    loaderStyle = {
      right:
        direction === 'right' &&
        defaultAlignment === 'side' &&
        ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0))
          ? `${labelWidth + 11}px`
          : '11px',
      top: defaultAlignment === 'top' ? '30px' : '10px',
      transform: 'none',
      zIndex: 3,
    };
  }

  // eslint-disable-next-line import/namespace
  const IconElement = Icons[icon] ?? Icons['IconHome2'];

  const finalStyles = getCustomStyles ? getCustomStyles(computedStyles) : computedStyles;

  return (
    <>
      <div
        data-cy={`label-${String(componentName).toLowerCase()}`}
        className={`text-input d-flex ${
          defaultAlignment === 'top' &&
          ((width != 0 && label?.length != 0) || (auto && width == 0 && label && label?.length != 0))
            ? 'flex-column'
            : inputType != 'textarea' && 'align-items-center'
        } ${direction === 'right' && defaultAlignment === 'side' ? 'flex-row-reverse' : ''}
        ${direction === 'right' && defaultAlignment === 'top' ? 'text-right' : ''}
        ${visibility || 'invisible'}`}
        style={{
          position: 'relative',
          whiteSpace: 'nowrap',
          width: '100%',
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
          top={inputType === 'textarea' && defaultAlignment === 'side' && '9px'}
        />

        {showLeftIcon && (
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
                  : '11px',
              position: 'absolute',
              top:
                inputType === 'textarea'
                  ? defaultAlignment === 'top'
                    ? '38px'
                    : '18px'
                  : defaultAlignment === 'side'
                  ? '50%'
                  : (label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0)
                  ? 'calc(50% + 10px)'
                  : '50%',
              transform: 'translateY(-50%)',
              color: iconColor !== '#CFD3D859' ? iconColor : 'var(--icons-weak-disabled)',
              zIndex: 3,
            }}
            stroke={1.5}
          />
        )}
        <RenderInput
          inputType={inputType}
          data-cy={dataCy}
          ref={inputRef}
          type={inputType}
          className={`tj-text-input-widget ${
            !isValid && showValidationError ? 'is-invalid' : ''
          } validation-without-icon`}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyUp={handleKeyUp}
          disabled={disable || loading}
          placeholder={placeholder}
          style={finalStyles}
          {...additionalInputProps}
        />

        {rightIcon}
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
