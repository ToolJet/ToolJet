import React, { forwardRef } from 'react';
import Label from '@/_ui/Label';
import Loader from '@/ToolJetUI/Loader/Loader';
import * as Icons from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';
import { BOX_PADDING } from '../../AppCanvas/appCanvasConstants';
import { getLabelWidthOfInput, getWidthTypeOfComponentStyles } from './hooks/useInput';

import './baseInput.scss';

const RenderInput = forwardRef((props, ref) => {
  const { inputType, ...restProps } = props;

  return inputType !== 'textarea' ? <input {...restProps} ref={ref} /> : <textarea {...restProps} ref={ref} />;
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
  isDynamicHeightEnabled,
  id,
  classes = null,
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
    widthType,
  } = styles;

  const { label, placeholder } = properties;
  const _width = getLabelWidthOfInput(widthType, width);
  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';

  const inputStyles = {
    color: !['#1B1F24', '#000', '#000000ff'].includes(textColor)
      ? textColor
      : disable || loading
      ? 'var(--text-disabled)'
      : 'var(--text-primary)',
    textOverflow: 'ellipsis',
    backgroundColor: 'inherit',
  };

  let loaderStyle;
  // for textarea loader position is fixed on top right of input box.
  if (inputType !== 'textarea') {
    loaderStyle = {
      zIndex: 3,
    };
  } else {
    loaderStyle = {
      zIndex: 3,
      alignSelf: 'start',
    };
  }

  // eslint-disable-next-line import/namespace
  const IconElement = Icons[icon] ?? Icons['IconHome2'];

  return (
    <>
      <div
        data-cy={`label-${String(componentName).toLowerCase()}`}
        className={`text-input scrollbar-container d-flex ${
          defaultAlignment === 'top' &&
          ((width != 0 && label?.length != 0) || (auto && width == 0 && label && label?.length != 0))
            ? 'flex-column'
            : ''
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
          top={inputType === 'textarea' && defaultAlignment === 'side' && '9px'}
          widthType={widthType}
          inputId={`component-${id}`}
          classes={{
            labelContainer: cn({
              'tw-self-center': inputType !== 'textarea' && defaultAlignment !== 'top',
              'tw-flex-shrink-0': defaultAlignment === 'top',
            }),
          }}
        />

        <div
          className={cn(
            'tw-px-2.5 tw-py-2 tw-border tw-border-solid tw-flex tw-items-center tw-gap-1.5 tj-text-input-widget-container',
            classes?.inputContainer
          )}
          style={{
            borderRadius: `${borderRadius}px`,
            borderColor:
              !isValid && showValidationError
                ? 'var(--cc-error-systemStatus)'
                : isFocused
                ? accentColor != '4368E3'
                  ? accentColor
                  : 'var(--primary-accent-strong)'
                : borderColor != '#CCD1D5'
                ? borderColor
                : disable || loading
                ? '1px solid var(--borders-disabled-on-white)'
                : 'var(--borders-default)',
            '--tblr-input-border-color-darker': getModifiedColor(borderColor, 8),
            backgroundColor:
              backgroundColor != '#fff'
                ? backgroundColor
                : disable || loading
                ? darkMode
                  ? 'var(--surfaces-app-bg-default)'
                  : 'var(--surfaces-surface-03)'
                : 'var(--surfaces-surface-01)',
            boxShadow,
            ...(isDynamicHeightEnabled && { minHeight: `${height}px` }),
            ...(defaultAlignment === 'top' &&
              label?.length != 0 && {
                height: `calc(100% - 20px - ${padding === 'default' ? BOX_PADDING * 2 : 0}px)`, // 20px is label height
                flex: 1,
              }),
            ...getWidthTypeOfComponentStyles(widthType, width, auto, alignment),
          }}
        >
          {showLeftIcon && (
            <IconElement
              data-cy={'text-input-icon'}
              className={cn('tw-shrink-0', classes?.leftIcon)}
              style={{
                width: '16px',
                height: '16px',
                color: iconColor !== '#CFD3D859' ? iconColor : 'var(--icons-weak-disabled)',
                zIndex: 3,
                ...(inputType === 'textarea' && { alignSelf: 'start' }),
              }}
              stroke={2}
            />
          )}

          <RenderInput
            inputType={inputType}
            data-cy={dataCy}
            ref={inputRef}
            type={inputType}
            className={cn(
              `tj-text-input-widget ${!isValid && showValidationError ? 'is-invalid' : ''} validation-without-icon`,
              classes?.input
            )}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyUp={handleKeyUp}
            placeholder={placeholder}
            style={inputStyles}
            {...additionalInputProps}
            id={`component-${id}`}
            aria-disabled={disable || loading}
            aria-busy={loading}
            aria-required={isMandatory}
            aria-hidden={!visibility}
            aria-invalid={!isValid && showValidationError}
            aria-label={!auto && labelWidth == 0 && label?.length != 0 ? label : undefined}
          />

          {loading ? <Loader classes={classes} style={loaderStyle} absolute={false} width="16" /> : rightIcon}
        </div>
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
