import React from 'react';
import * as Icons from '@tabler/icons-react';
import { DatepickerInput } from './DatepickerInput';
import TimepickerInput from './TimepickerInput';
import cx from 'classnames';
import Label from '@/_ui/Label';
import DatePickerComponent from 'react-datepicker';
import CustomDatePickerHeader from './CustomDatePickerHeader';
const tinycolor = require('tinycolor2');

export const BaseDateComponent = ({
  styles,
  height,
  disable,
  loading,
  darkMode,
  label,
  focus,
  visibility,
  isMandatory,
  componentName,
  datePickerRef,
  componentProps,
  customHeaderProps,
  customTimeInputProps,
  customDateInputProps,
}) => {
  const {
    selectedTextColor,
    fieldBorderRadius,
    borderRadius,
    boxShadow,
    labelColor,
    alignment,
    direction,
    iconDirection,
    fieldBorderColor,
    fieldBackgroundColor,
    labelWidth,
    iconVisibility,
    auto: labelAutoWidth,
    iconColor,
    accentColor,
    padding,
    errTextColor,
  } = styles;

  const computedStyles = {
    height: height == 36 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
    width: '100%',
    borderColor: focus
      ? accentColor != '#4368E3'
        ? accentColor
        : 'var(--primary-accent-strong)'
      : fieldBorderColor != '#CCD1D5'
      ? fieldBorderColor
      : disable || loading
      ? '1px solid var(--borders-disabled-on-white)'
      : 'var(--borders-default)',
    '--tblr-input-border-color-darker': tinycolor(fieldBorderColor).darken(24).toString(),
    borderRadius: `${fieldBorderRadius || borderRadius}px`,
    color: !['#1B1F24', '#000', '#000000ff'].includes(selectedTextColor)
      ? selectedTextColor
      : disable || loading
      ? 'var(--text-disabled)'
      : 'var(--text-primary)',
    boxShadow: boxShadow,
    backgroundColor:
      fieldBackgroundColor != '#fff'
        ? fieldBackgroundColor
        : disable || loading
        ? darkMode
          ? 'var(--surfaces-app-bg-default)'
          : 'var(--surfaces-surface-03)'
        : 'var(--surfaces-surface-01)',
    paddingLeft: '10px',
    ...(iconVisibility && {
      ...(iconDirection === 'left' ? { paddingLeft: '30px' } : { paddingRight: '30px' }),
    }),
  };

  const loaderStyles = {
    right:
      direction === 'right' &&
      alignment === 'side' &&
      ((label?.length > 0 && labelWidth > 0) || (labelAutoWidth && labelWidth == 0 && label && label?.length != 0))
        ? `${labelWidth + 11}px`
        : '11px',
    top: `${
      alignment === 'top'
        ? ((label?.length > 0 && labelWidth > 0) ||
            (labelAutoWidth && labelWidth == 0 && label && label?.length != 0)) &&
          '50%'
        : 'calc(50% - 7px)'
    }`,
    transform:
      alignment === 'top' &&
      ((label?.length > 0 && labelWidth > 0) || (labelAutoWidth && labelWidth == 0 && label && label?.length != 0)) &&
      ' translateY(-50%)',
    zIndex: 3,
  };

  const iconStyles = {
    width: '16px',
    height: '16px',
    transform: ' translateY(-50%)',
    color: iconColor !== '#CFD3D859' ? iconColor : 'var(--icons-weak-disabled)',
    zIndex: 3,
    display: iconVisibility ? 'block' : 'none',
    [iconDirection]: '10px',
  };

  const _width = (labelWidth / 100) * 70;

  const iconName = styles.icon; // Replace with the name of the icon you want
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] == undefined ? Icons['IconHome2'] : Icons[iconName];

  return (
    <div
      data-cy={`label-${String(componentName).toLowerCase()}`}
      className={cx('d-flex datetimepicker-component', {
        [alignment === 'top' &&
        ((labelWidth != 0 && label?.length != 0) || (labelAutoWidth && labelWidth == 0 && label && label?.length != 0))
          ? 'flex-column'
          : 'align-items-center']: true,
        'flex-row-reverse': direction === 'right' && alignment === 'side',
        'text-right': direction === 'right' && alignment === 'top',
        invisible: !visibility,
        visibility: visibility,
      })}
      style={{
        position: 'relative',
        whiteSpace: 'nowrap',
        width: '100%',
      }}
    >
      <Label
        label={label}
        width={labelWidth}
        darkMode={darkMode}
        color={labelColor}
        defaultAlignment={alignment}
        direction={direction}
        auto={labelAutoWidth}
        isMandatory={isMandatory}
        _width={_width}
        top={'1px'}
      />
      <div className="w-100 px-0 h-100">
        <DatePickerComponent
          className={`input-field form-control validation-without-icon px-2`}
          popperClassName={cx('tj-table-datepicker tj-datepicker-widget', {
            'theme-dark dark-theme': darkMode,
          })}
          ref={datePickerRef}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          showPopperArrow={false}
          shouldCloseOnSelect={false}
          popperPlacement="bottom-start"
          popperModifiers={[
            {
              name: 'flip',
              enabled: false,
            },
          ]}
          portalId="component-portal"
          {...componentProps}
          customInput={
            <DatepickerInput
              IconElement={IconElement}
              iconStyles={iconStyles}
              inputStyles={computedStyles}
              loaderStyles={loaderStyles}
              loading={loading}
              disable={disable}
              visibility={visibility}
              errTextColor={errTextColor}
              direction={direction}
              {...customDateInputProps}
            />
          }
          customTimeInput={<TimepickerInput darkMode={darkMode} {...customTimeInputProps} />}
          renderCustomHeader={(headerProps) => (
            <CustomDatePickerHeader {...headerProps} {...customHeaderProps} darkMode={darkMode} />
          )}
        />
      </div>
    </div>
  );
};
