import Label from '@/_ui/Label';
import React, { useEffect, useRef, useState } from 'react';
import DatePickerComponent from 'react-datepicker';
import cx from 'classnames';
import CustomDatePickerHeader from '@/AppBuilder/CodeBuilder/Elements/CustomDatePickerHeader';
import * as Icons from '@tabler/icons-react';
import { DatepickerInput } from './DatepickerInput';
import moment from 'moment';

const DISABLED_DATE_FORMAT = 'MM/DD/YYYY';

export const DatepickerV2 = ({
  height,
  properties,
  validation,
  styles,
  setExposedVariable,
  setExposedVariables,
  validate,
  onComponentClick,
  componentName,
  id,
  darkMode,
  fireEvent,
  dataCy,
}) => {
  const dateInputRef = useRef(null);
  const {
    label,
    defaultValue,
    dateFormat,
    timeFormat,
    isDateSelectionEnabled,
    isTimeSelectionEnabled,
    is24HourFormatEnabled,
    timezoneInterval,
  } = properties;

  const { disabledDates } = validation;
  const {
    selectedTextColor,
    fieldBorderRadius,
    justifyContent,
    boxShadow,
    labelColor,
    alignment,
    direction,
    iconDirection,
    fieldBorderColor,
    fieldBackgroundColor,
    labelWidth,
    icon,
    iconVisibility,
    errTextColor,
    auto: labelAutoWidth,
    iconColor,
    accentColor,
    padding,
  } = styles;

  const [date, setDate] = useState(defaultValue);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [loading, setLoading] = useState(properties.loadingState);
  const [disable, setDisable] = useState(properties.disabledState);
  const [excludedDates, setExcludedDates] = React.useState([]);
  const [focus, setFocus] = useState(false);

  const selectedDateFormat = isTimeSelectionEnabled ? `${dateFormat} ${timeFormat}` : dateFormat;

  const computeDateString = (date) => {
    console.log('This is the weird date', date);
    if (isDateSelectionEnabled) {
      console.log('moment(date).format(selectedDateFormat)', moment(date).format(selectedDateFormat));
      return moment(date).format(selectedDateFormat);
    }

    if (!isDateSelectionEnabled && isTimeSelectionEnabled) {
      return moment(date).format('LT');
    }
  };

  const onDateChange = (date) => {
    // setShowValidationError(true);
    setInputValue(date);
    fireEvent('onSelect');
  };

  const setInputValue = (value) => {
    setDate(value);
    setExposedVariable('value', value ? computeDateString(value) : undefined);
    const validationStatus = validate(computeDateString(value));
    // setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  };

  useEffect(() => {
    setVisibility(properties.visibility);
  }, [properties.visibility]);

  useEffect(() => {
    setLoading(properties.loadingState);
  }, [properties.loadingState]);

  useEffect(() => {
    setDisable(properties.disabledState);
  }, [properties.disabledState]);

  useEffect(() => {
    if (Array.isArray(disabledDates) && disabledDates.length > 0) {
      const _exluded = [];
      disabledDates?.map((item) => {
        if (moment(item, DISABLED_DATE_FORMAT).isValid()) {
          _exluded.push(moment(item, DISABLED_DATE_FORMAT).toDate());
        }
      });
      setExcludedDates(_exluded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledDates]);

  useEffect(() => {
    const dateMomentInstance = defaultValue && moment(defaultValue, selectedDateFormat);
    setInputValue(dateMomentInstance && dateMomentInstance.isValid() ? dateMomentInstance.toDate() : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computedStyles = {
    height: height == 36 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
    borderRadius: `${fieldBorderRadius}px`,
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
  };

  const _width = (labelWidth / 100) * 70;

  const iconName = styles.icon; // Replace with the name of the icon you want
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] == undefined ? Icons['IconHome2'] : Icons[iconName];

  return (
    <div
      data-cy={`label-${String(componentName).toLowerCase()} `}
      className={cx('d-flex', {
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
        // labelRef={labelRef}
        darkMode={darkMode}
        color={labelColor}
        defaultAlignment={alignment}
        direction={direction}
        auto={labelAutoWidth}
        // isMandatory={isMandatory}
        _width={_width}
        top={'1px'}
      />
      <div className="w-100 px-0 h-100">
        <DatePickerComponent
          className={`input-field form-control validation-without-icon px-2`}
          popperClassName={cx('tj-table-datepicker', {
            'tj-timepicker-widget': !isDateSelectionEnabled && isTimeSelectionEnabled,
            'tj-datepicker-widget': isDateSelectionEnabled,
            'theme-dark dark-theme': darkMode,
          })}
          onChange={(date) => {
            setFocus(true);
            onDateChange(date);
          }}
          // selected={date}
          value={date !== null ? computeDateString(date) : 'select date'}
          dateFormat={!isDateSelectionEnabled && isTimeSelectionEnabled ? 'HH:mm' : dateFormat}
          customInput={
            <DatepickerInput
              dateInputRef={dateInputRef}
              setFocus={setFocus}
              IconElement={IconElement}
              iconStyles={iconStyles}
              inputStyles={computedStyles}
              loaderStyles={loaderStyles}
              loading={loading}
              disable={disable}
              onDateChange={onDateChange}
            />
          }
          showTimeSelect={isTimeSelectionEnabled}
          showTimeSelectOnly={!isDateSelectionEnabled && isTimeSelectionEnabled}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          excludeDates={excludedDates}
          showPopperArrow={false}
          renderCustomHeader={(headerProps) => <CustomDatePickerHeader {...headerProps} />}
          shouldCloseOnSelect
          popperProps={{ strategy: 'fixed' }}
          timeIntervals={15}
          timeFormat={is24HourFormatEnabled ? 'HH:mm' : 'h:mm aa'}
          onCalendarClose={() => {
            setFocus(false);
          }}
        />
      </div>
    </div>
  );
};
