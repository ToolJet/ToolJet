import Label from '@/_ui/Label';
import React, { useEffect, useRef, useState } from 'react';
import DatePickerComponent from 'react-datepicker';
import cx from 'classnames';
import * as Icons from '@tabler/icons-react';
import { DatepickerInput } from './DatepickerInput';
import moment from 'moment-timezone';
import { TIMEZONE_OPTIONS_MAP } from '@/AppBuilder/RightSideBar/Inspector/Components/DatepickerV2';
import TimepickerInput from './TimepickerInput';
import {
  convertToIsoWithTimezoneOffset,
  getFormattedSelectTimestamp,
  getSelectedTimestampFromUnixTimestamp,
  getUnixTime,
  getUnixTimestampFromSelectedTimestamp,
  is24HourFormat,
  isDateValid,
} from './DatepickerUtils';

import CustomDatePickerHeader from './CustomDatePickerHeader';

const tinycolor = require('tinycolor2');

const DISABLED_DATE_FORMAT = 'DD/MM/YYYY';

export const DatepickerV2 = ({
  height,
  properties,
  validation,
  styles,
  setExposedVariable,
  setExposedVariables,
  componentName,
  id,
  darkMode,
  fireEvent,
  dataCy,
}) => {
  const dateInputRef = useRef(null);
  const datePickerRef = useRef(null);
  const { label, defaultValue, dateFormat, timeFormat, isTimezoneEnabled } = properties;

  const { disabledDates, mandatory: isMandatory, customRule } = validation;
  const {
    selectedTextColor,
    fieldBorderRadius,
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
  const isInitialRender = useRef(true);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [loading, setLoading] = useState(properties.loadingState);
  const [disable, setDisable] = useState(properties.disabledState);
  const [excludedDates, setExcludedDates] = React.useState([]);
  const [minDate, setMinDate] = useState(moment(validation.minDate, DISABLED_DATE_FORMAT).toDate());
  const [maxDate, setMaxDate] = useState(moment(validation.maxDate, DISABLED_DATE_FORMAT).toDate());
  const [minTime, setMinTime] = useState(validation.minTime);
  const [maxTime, setMaxTime] = useState(validation.maxTime);
  const displayFormat = `${dateFormat} ${timeFormat}`;
  const [displayTimezone, setDisplayTimezone] = useState(
    isTimezoneEnabled ? properties.displayTimezone : moment.tz.guess()
  );
  const [storeTimezone, setStoreTimezone] = useState(isTimezoneEnabled ? properties.storeTimezone : moment.tz.guess());
  const [unixTimestamp, setUnixTimestamp] = useState(defaultValue ? getUnixTime(defaultValue, displayFormat) : null);
  const [selectedTimestamp, setSelectedTimestamp] = useState(
    defaultValue ? getSelectedTimestampFromUnixTimestamp(unixTimestamp, displayTimezone, isTimezoneEnabled) : null
  );
  const [showValidationError, setShowValidationError] = useState(false);
  const [validationStatus, setValidationStatus] = useState({ isValid: true, validationError: '' });
  const { isValid, validationError } = validationStatus;
  const [displayTimestamp, setDisplayTimestamp] = useState(
    selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, displayFormat) : 'Select time'
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [textInputFocus, setTextInputFocus] = useState(false);
  const [datepickerMode, setDatePickerMode] = useState('date');

  const focus = isCalendarOpen || textInputFocus;

  const setInputValue = (date) => {
    const unixTimestamp = getUnixTime(date, displayFormat);
    const selectedTimestamp = getSelectedTimestampFromUnixTimestamp(unixTimestamp, displayTimezone, isTimezoneEnabled);
    setUnixTimestamp(unixTimestamp);
    setSelectedTimestamp(selectedTimestamp);
    setExposedDateVariables(unixTimestamp, selectedTimestamp);
    fireEvent('onSelect');
  };

  const onDateSelect = (date) => {
    const selectedTime = getUnixTime(date, displayFormat);
    setSelectedTimestamp(selectedTime);
    const unixTimestamp = getUnixTimestampFromSelectedTimestamp(selectedTime, displayTimezone, isTimezoneEnabled);
    setUnixTimestamp(unixTimestamp);
    setExposedDateVariables(unixTimestamp, selectedTime);
    fireEvent('onSelect');
  };

  const onTimeChange = (time, type) => {
    const updatedSelectedTimestamp = moment(selectedTimestamp);
    updatedSelectedTimestamp.set(type, time);
    const updatedUnixTimestamp = getUnixTimestampFromSelectedTimestamp(
      updatedSelectedTimestamp.valueOf(),
      displayTimezone,
      isTimezoneEnabled
    );
    setUnixTimestamp(updatedUnixTimestamp);
    setSelectedTimestamp(updatedSelectedTimestamp.valueOf());
    setExposedDateVariables(updatedUnixTimestamp, updatedSelectedTimestamp.valueOf());
    fireEvent('onSelect');
  };

  const setExposedDateVariables = (unixTimestamp, selectedTimestamp) => {
    const selectedTime = getFormattedSelectTimestamp(selectedTimestamp, timeFormat);
    const selectedDate = getFormattedSelectTimestamp(selectedTimestamp, dateFormat);
    const displayValue = getFormattedSelectTimestamp(selectedTimestamp, displayFormat);
    const value = convertToIsoWithTimezoneOffset(unixTimestamp, storeTimezone);
    setExposedVariables({
      selectedTime: selectedTime,
      selectedDate: selectedDate,
      unixTimestamp: unixTimestamp,
      displayValue: displayValue,
      value: value,
    });
  };

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', properties.visibility);
    setVisibility(properties.visibility);
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', properties.loadingState);
    setLoading(properties.loadingState);
  }, [properties.loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', properties.disabledState);
    setDisable(properties.disabledState);
  }, [properties.disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
  }, [label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('dateFormat', dateFormat);
  }, [dateFormat]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('timeFormat', timeFormat);
  }, [timeFormat]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const val = isTimezoneEnabled ? properties.displayTimezone : moment.tz.guess();
    setDisplayTimezone(val);
    setExposedVariable('displayTimezone', val);
  }, [properties.displayTimezone, isTimezoneEnabled]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const val = isTimezoneEnabled ? properties.storeTimezone : moment.tz.guess();
    setStoreTimezone(val);
    setExposedVariable('storeTimezone', val);
  }, [properties.storeTimezone, isTimezoneEnabled]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setInputValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (isInitialRender.current || textInputFocus) return;
    setDisplayTimestamp(
      selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, displayFormat) : 'Select time'
    );
  }, [selectedTimestamp, displayFormat, textInputFocus]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const selectedTimestamp = getSelectedTimestampFromUnixTimestamp(unixTimestamp, displayTimezone, isTimezoneEnabled);
    const selectedTime = getFormattedSelectTimestamp(selectedTimestamp, timeFormat);
    const selectedDate = getFormattedSelectTimestamp(selectedTimestamp, dateFormat);
    const displayValue = getFormattedSelectTimestamp(selectedTimestamp, displayFormat);
    setSelectedTimestamp(selectedTimestamp);
    setExposedVariables({
      selectedTime,
      selectedDate,
      displayValue,
    });
  }, [isTimezoneEnabled, displayTimezone]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const value = convertToIsoWithTimezoneOffset(unixTimestamp, storeTimezone);
    setExposedVariable('value', value);
  }, [isTimezoneEnabled, storeTimezone]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const momentDate = moment(validation.minDate, DISABLED_DATE_FORMAT);
    if (momentDate.isValid()) {
      setMinDate(momentDate.toDate());
      setExposedVariable('minDate', validation.minDate);
    } else {
      setMinDate(null);
      setExposedVariable('minDate', null);
    }
  }, [validation.minDate]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const momentDate = moment(validation.maxDate, DISABLED_DATE_FORMAT);
    if (momentDate.isValid()) {
      setMaxDate(momentDate.toDate());
      setExposedVariable('maxDate', validation.maxDate);
    } else {
      setMaxDate(null);
      setExposedVariable('maxDate', null);
    }
  }, [validation.maxDate]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setMinTime(validation.minTime);
    setExposedVariable('minTime', validation.minTime);
  }, [validation.minTime]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setMaxTime(validation.maxTime);
    setExposedVariable('maxTime', validation.maxTime);
  }, [validation.maxTime]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (textInputFocus) dateInputRef?.current.focus();
    else dateInputRef?.current.blur();
  }, [textInputFocus]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (isCalendarOpen) datePickerRef?.current.setOpen(true);
    else datePickerRef?.current.setOpen(false);
  }, [isCalendarOpen]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (focus) {
      fireEvent('onFocus');
    } else {
      fireEvent('onBlur');
    }
  }, [focus]);

  useEffect(() => {
    const selectedTime = getFormattedSelectTimestamp(selectedTimestamp, timeFormat);
    const selectedDate = getFormattedSelectTimestamp(selectedTimestamp, dateFormat);
    const displayValue = getFormattedSelectTimestamp(selectedTimestamp, displayFormat);
    const value = convertToIsoWithTimezoneOffset(unixTimestamp, storeTimezone);
    const exposedVariables = {
      value: value,
      label: label,
      selectedTime: selectedTime,
      selectedDate: selectedDate,
      unixTimestamp: unixTimestamp,
      displayValue: displayValue,
      dateFormat: dateFormat,
      timeFormat: timeFormat,
      isVisible: properties.visibility,
      isLoading: properties.loadingState,
      isDisabled: properties.disabledState,
      isMandatory: isMandatory,
      storeTimezone: isTimezoneEnabled ? storeTimezone : moment.tz.guess(),
      displayTimezone: isTimezoneEnabled ? displayTimezone : moment.tz.guess(),
      minDate: validation.minDate,
      maxDate: validation.maxDate,
      minTime: validation.minTime,
      maxTime: validation.maxTime,
      setDisabledDates: (dates) => {
        setExcludedDates(dates);
      },
      clearDisabledDates: () => {
        setExcludedDates([]);
      },
      setMinDate: (date) => {
        const momentDate = moment(date, DISABLED_DATE_FORMAT);
        if (momentDate.isValid()) {
          setMinDate(momentDate.toDate());
          setExposedVariable('minDate', date);
        }
      },
      setMaxDate: (date) => {
        const momentDate = moment(date, DISABLED_DATE_FORMAT);
        if (momentDate.isValid()) {
          setMaxDate(momentDate.toDate());
          setExposedVariable('maxDate', date);
        }
      },
      setMinTime: (time) => {
        setMinTime(time);
        setExposedVariable('minTime', time);
      },
      setMaxTime: (time) => {
        setMaxTime(time);
        setExposedVariable('maxTime', time);
      },
      setVisibility: (visibility) => {
        setExposedVariable('isVisible', visibility);
        setVisibility(visibility);
      },
      setLoading: (loading) => {
        setExposedVariable('isLoading', loading);
        setLoading(loading);
      },
      setDisable: (disable) => {
        setExposedVariable('isDisabled', disable);
        setDisable(disable);
      },
      setFocus: () => {
        setIsCalendarOpen(true);
        setTextInputFocus(false);
      },
      setBlur: () => {
        setIsCalendarOpen(false);
        setTextInputFocus(false);
      },
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  useEffect(() => {
    setExposedVariables({
      setValue: (value) => {
        setInputValue(value);
      },
      clearValue: () => {
        setInputValue(null);
      },
      setValueInTimestamp: (timeStamp) => {
        setInputValue(timeStamp);
      },
      setDate: (date) => {
        const [day, month, year] = date.split('/');
        const updatedSelectedTimestamp = moment(selectedTimestamp);
        updatedSelectedTimestamp.set('year', year);
        updatedSelectedTimestamp.set('month', month - 1);
        updatedSelectedTimestamp.set('date', day);
        const unixTimestamp = getUnixTimestampFromSelectedTimestamp(
          updatedSelectedTimestamp.valueOf(),
          displayTimezone,
          isTimezoneEnabled
        );
        setUnixTimestamp(unixTimestamp);
        setSelectedTimestamp(updatedSelectedTimestamp.valueOf());
        setExposedDateVariables(unixTimestamp, updatedSelectedTimestamp.valueOf());
        fireEvent('onSelect');
      },
      setTime: (time) => {
        const [hour, minute] = time.split(':');
        const updatedSelectedTimestamp = moment(selectedTimestamp);
        updatedSelectedTimestamp.set('hour', hour);
        updatedSelectedTimestamp.set('minute', minute);
        const updatedUnixTimestamp = getUnixTimestampFromSelectedTimestamp(
          updatedSelectedTimestamp.valueOf(),
          displayTimezone,
          isTimezoneEnabled
        );
        setUnixTimestamp(updatedUnixTimestamp);
        setSelectedTimestamp(updatedSelectedTimestamp.valueOf());
        setExposedDateVariables(updatedUnixTimestamp, updatedSelectedTimestamp.valueOf());
        fireEvent('onSelect');
      },
    });
  }, [selectedTimestamp, unixTimestamp, displayTimezone, isTimezoneEnabled, displayFormat]);

  useEffect(() => {
    setExposedVariables({
      setDisplayTimezone: (timezone) => {
        const value = TIMEZONE_OPTIONS_MAP[timezone];
        if (value) {
          const val = isTimezoneEnabled ? value : moment.tz.guess();
          setDisplayTimezone(val);
          setExposedVariable('displayTimezone', val);
        }
      },
      setStoreTimezone: (timezone) => {
        const value = TIMEZONE_OPTIONS_MAP[timezone];
        if (value) {
          const val = isTimezoneEnabled ? value : moment.tz.guess();
          setStoreTimezone(val);
          setExposedVariable('storeTimezone', val);
        }
      },
    });
  }, [isTimezoneEnabled]);

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
    setValidationStatus(
      isDateValid(selectedTimestamp, { minDate, maxDate, minTime, maxTime, customRule, isMandatory, excludedDates })
    );
  }, [minTime, maxTime, minDate, maxDate, customRule, isMandatory, selectedTimestamp, excludedDates]);

  const computedStyles = {
    height: height == 36 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
    width: '100%',
    borderColor: focus
      ? accentColor != '4368E3'
        ? accentColor
        : 'var(--primary-accent-strong)'
      : fieldBorderColor != '#CCD1D5'
      ? fieldBorderColor
      : disable || loading
      ? '1px solid var(--borders-disabled-on-white)'
      : 'var(--borders-default)',
    '--tblr-input-border-color-darker': tinycolor(fieldBorderColor).darken(24).toString(),
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

  const isTwentyFourHourMode = is24HourFormat(displayFormat);

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
            'react-datepicker-month-component': datepickerMode === 'month',
            'react-datepicker-year-component': datepickerMode === 'year',
          })}
          onSelect={(date, event) => {
            let updatedDate = date;
            if (event.target.classList.contains('react-datepicker__year-text')) {
              const modifiedDate = moment(selectedTimestamp).year(date.getFullYear());
              updatedDate = modifiedDate.toDate();
            } else if (event.target.classList.contains('react-datepicker__month-text')) {
              const modifiedDate = moment(selectedTimestamp).month(date.getMonth());
              updatedDate = modifiedDate.toDate();
            }
            onDateSelect(updatedDate);
            setDatePickerMode('date');
          }}
          selected={selectedTimestamp}
          value={displayTimestamp}
          dateFormat={dateFormat}
          displayFormat={displayFormat}
          ref={datePickerRef}
          customInput={
            <DatepickerInput
              dateInputRef={dateInputRef}
              IconElement={IconElement}
              iconStyles={iconStyles}
              inputStyles={computedStyles}
              loaderStyles={loaderStyles}
              loading={loading}
              disable={disable}
              onInputChange={onDateSelect}
              displayFormat={displayFormat}
              setDisplayTimestamp={setDisplayTimestamp}
              setTextInputFocus={setTextInputFocus}
              setShowValidationError={setShowValidationError}
              showValidationError={showValidationError}
              isValid={isValid}
              validationError={validationError}
              visibility={visibility}
              errTextColor={errTextColor}
              direction={direction}
            />
          }
          showTimeInput={datepickerMode === 'date'}
          showMonthYearPicker={datepickerMode === 'month'}
          showYearPicker={datepickerMode === 'year'}
          customTimeInput={
            <TimepickerInput
              isTwentyFourHourMode={isTwentyFourHourMode}
              currentTimestamp={selectedTimestamp}
              darkMode={darkMode}
              onTimeChange={onTimeChange}
              minTime={minTime}
              maxTime={maxTime}
            />
          }
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          excludeDates={excludedDates}
          showPopperArrow={false}
          renderCustomHeader={(headerProps) => (
            <CustomDatePickerHeader
              datepickerMode={datepickerMode}
              setDatePickerMode={setDatePickerMode}
              {...headerProps}
            />
          )}
          shouldCloseOnSelect={false}
          popperPlacement="bottom-start"
          popperModifiers={[
            {
              name: 'flip',
              enabled: false,
            },
          ]}
          timeFormat={timeFormat}
          minDate={moment(minDate).isValid() ? minDate : null}
          maxDate={moment(maxDate).isValid() ? maxDate : null}
          onCalendarClose={() => {
            setDatePickerMode('date');
            setIsCalendarOpen(false);
          }}
          onCalendarOpen={() => {
            setIsCalendarOpen(true);
          }}
          portalId="component-portal"
        />
      </div>
    </div>
  );
};
