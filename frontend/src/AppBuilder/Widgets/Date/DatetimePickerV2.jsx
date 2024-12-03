import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import moment from 'moment-timezone';
import { TIMEZONE_OPTIONS_MAP } from '@/AppBuilder/RightSideBar/Inspector/Components/DatetimePickerV2';

import {
  convertToIsoWithTimezoneOffset,
  getFormattedSelectTimestamp,
  getSelectedTimestampFromUnixTimestamp,
  getUnixTime,
  getUnixTimestampFromSelectedTimestamp,
  is24HourFormat,
  isDateValid,
} from './utils';

import { BaseDateComponent } from './BaseDateComponent';
import { useDateInput, useTimeInput, useDatetimeInput } from './hooks';

export const DatetimePickerV2 = ({
  height,
  properties,
  validation = {},
  styles,
  setExposedVariable,
  setExposedVariables,
  componentName,
  id,
  darkMode,
  fireEvent,
  dataCy,
}) => {
  const isInitialRender = useRef(true);
  const dateInputRef = useRef(null);
  const datePickerRef = useRef(null);

  const inputProps = {
    properties,
    setExposedVariable,
    setExposedVariables,
    validation,
    fireEvent,
    dateInputRef,
    datePickerRef,
  };
  const dateTimeLogic = useDatetimeInput(inputProps);
  const dateLogic = useDateInput(inputProps);
  const timeLogic = useTimeInput(inputProps);

  const { disable, loading, focus, visibility, isMandatory, textInputFocus, setTextInputFocus, setIsCalendarOpen } =
    dateTimeLogic;
  const { minDate, maxDate, excludedDates } = dateLogic;
  const { minTime, maxTime } = timeLogic;
  const { label, defaultValue, dateFormat, timeFormat, isTimezoneEnabled } = properties;
  const { customRule } = validation;

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
  const [datepickerMode, setDatePickerMode] = useState('date');

  const setInputValue = (date, format) => {
    const unixTimestamp = getUnixTime(date, format ? format : displayFormat);
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
    let updatedSelectedTimestamp = moment(selectedTimestamp);
    if (!updatedSelectedTimestamp.isValid()) {
      updatedSelectedTimestamp = moment();
    }
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
    setExposedVariable('isValid', isValid);
  }, [isValid]);

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
    const selectedTime = getFormattedSelectTimestamp(selectedTimestamp, timeFormat);
    const selectedDate = getFormattedSelectTimestamp(selectedTimestamp, dateFormat);
    const displayValue = getFormattedSelectTimestamp(selectedTimestamp, displayFormat);
    const value = convertToIsoWithTimezoneOffset(unixTimestamp, storeTimezone);
    const exposedVariables = {
      value: value,
      selectedTime: selectedTime,
      selectedDate: selectedDate,
      unixTimestamp: unixTimestamp,
      displayValue: displayValue,
      dateFormat: dateFormat,
      timeFormat: timeFormat,
      storeTimezone: isTimezoneEnabled ? storeTimezone : moment.tz.guess(),
      displayTimezone: isTimezoneEnabled ? displayTimezone : moment.tz.guess(),
      isValid: isValid,
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  useEffect(() => {
    setExposedVariables({
      setValue: (value, format) => {
        setInputValue(value, format);
      },
      clearValue: () => {
        setInputValue(null);
      },
      setValueInTimestamp: (timeStamp) => {
        setInputValue(timeStamp);
      },
      setDate: (date, format) => {
        const momentObj = moment(date, [format ? format : dateFormat, displayFormat]);
        let updatedUnixTimestamp = moment(unixTimestamp);
        if (!updatedUnixTimestamp.isValid()) {
          updatedUnixTimestamp = moment();
        }
        updatedUnixTimestamp.set('year', momentObj.year());
        updatedUnixTimestamp.set('month', momentObj.month());
        updatedUnixTimestamp.set('date', momentObj.date());
        const selectedTimestamp = getSelectedTimestampFromUnixTimestamp(
          updatedUnixTimestamp.valueOf(),
          displayTimezone,
          isTimezoneEnabled
        );
        setUnixTimestamp(updatedUnixTimestamp.valueOf());
        setSelectedTimestamp(selectedTimestamp);
        setExposedDateVariables(updatedUnixTimestamp.valueOf(), selectedTimestamp);
        fireEvent('onSelect');
      },
      setTime: (time, format) => {
        const momentObj = moment(time, [format ? format : timeFormat, displayFormat]);
        let updatedUnixTimestamp = moment(unixTimestamp);
        if (!updatedUnixTimestamp.isValid()) {
          updatedUnixTimestamp = moment();
        }
        updatedUnixTimestamp.set('hour', momentObj.hour());
        updatedUnixTimestamp.set('minute', momentObj.minute());
        const selectedTimestamp = getSelectedTimestampFromUnixTimestamp(
          updatedUnixTimestamp.valueOf(),
          displayTimezone,
          isTimezoneEnabled
        );
        setUnixTimestamp(updatedUnixTimestamp.valueOf());
        setSelectedTimestamp(selectedTimestamp);
        setExposedDateVariables(updatedUnixTimestamp.valueOf(), selectedTimestamp);
        fireEvent('onSelect');
      },
    });
  }, [selectedTimestamp, unixTimestamp, displayTimezone, isTimezoneEnabled, dateFormat, timeFormat, displayFormat]);

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
    setValidationStatus(
      isDateValid(selectedTimestamp, { minDate, maxDate, minTime, maxTime, customRule, isMandatory, excludedDates })
    );
  }, [minTime, maxTime, minDate, maxDate, customRule, isMandatory, selectedTimestamp, excludedDates]);

  const isTwentyFourHourMode = is24HourFormat(displayFormat);

  const componentProps = {
    popperClassName: cx('tj-table-datepicker tj-datepicker-widget', {
      'theme-dark dark-theme': darkMode,
      'react-datepicker-month-component': datepickerMode === 'month',
      'react-datepicker-year-component': datepickerMode === 'year',
    }),
    onSelect: (date, event) => {
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
    },

    selected: selectedTimestamp ? moment(selectedTimestamp).toDate() : null,
    value: displayTimestamp,
    dateFormat,
    displayFormat,
    timeFormat,
    excludeDates: excludedDates,
    showTimeInput: datepickerMode === 'date',
    showMonthYearPicker: datepickerMode === 'month',
    showYearPicker: datepickerMode === 'year',
    minDate: moment(minDate).isValid() ? minDate : null,
    maxDate: moment(maxDate).isValid() ? maxDate : null,
    onCalendarClose: () => {
      setDatePickerMode('date');
      setIsCalendarOpen(false);
    },
    onCalendarOpen: () => {
      setIsCalendarOpen(true);
    },
  };

  const customHeaderProps = {
    datepickerMode,
    setDatePickerMode,
  };

  const customTimeInputProps = {
    isTwentyFourHourMode,
    currentTimestamp: selectedTimestamp,
    onTimeChange,
    minTime,
    maxTime,
  };

  const customDateInputProps = {
    dateInputRef,
    onInputChange: onDateSelect,
    displayFormat,
    setDisplayTimestamp,
    setTextInputFocus,
    setShowValidationError,
    showValidationError,
    isValid,
    validationError,
  };

  return (
    <BaseDateComponent
      styles={styles}
      height={height}
      disable={disable}
      loading={loading}
      darkMode={darkMode}
      label={label}
      focus={focus}
      visibility={visibility}
      isMandatory={isMandatory}
      componentName={componentName}
      datePickerRef={datePickerRef}
      componentProps={componentProps}
      customHeaderProps={customHeaderProps}
      customTimeInputProps={customTimeInputProps}
      customDateInputProps={customDateInputProps}
    />
  );
};
