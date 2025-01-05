import React, { useEffect, useRef, useState } from 'react';
import { useDatetimeInput, useTimeInput } from './hooks';
import cx from 'classnames';
import moment from 'moment-timezone';
import {
  convertToIsoWithTimezoneOffset,
  getFormattedSelectTimestamp,
  getSelectedTimestampFromUnixTimestamp,
  getUnixTime,
  getUnixTimestampFromSelectedTimestamp,
  is24HourFormat,
  isDateValid,
} from './utils';
import { TIMEZONE_OPTIONS_MAP } from '@/AppBuilder/RightSideBar/Inspector/Components/DatetimePickerV2';
import { BaseDateComponent } from './BaseDateComponent';

export const TimePicker = ({
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
  const timeLogic = useTimeInput(inputProps);

  const { disable, loading, focus, visibility, isMandatory, textInputFocus, setTextInputFocus, setIsCalendarOpen } =
    dateTimeLogic;
  const { minTime, maxTime } = timeLogic;
  const { label, defaultValue, timeFormat, isTimezoneEnabled } = properties;
  const { customRule } = validation;

  const [displayTimezone, setDisplayTimezone] = useState(
    isTimezoneEnabled ? properties.displayTimezone : moment.tz.guess()
  );

  const [storeTimezone, setStoreTimezone] = useState(isTimezoneEnabled ? properties.storeTimezone : moment.tz.guess());
  const [unixTimestamp, setUnixTimestamp] = useState(defaultValue ? getUnixTime(defaultValue, timeFormat) : null);

  const [selectedTimestamp, setSelectedTimestamp] = useState(
    defaultValue ? getSelectedTimestampFromUnixTimestamp(unixTimestamp, displayTimezone, isTimezoneEnabled) : null
  );

  const [showValidationError, setShowValidationError] = useState(false);
  const [validationStatus, setValidationStatus] = useState({ isValid: true, validationError: '' });
  const { isValid, validationError } = validationStatus;
  const [displayTimestamp, setDisplayTimestamp] = useState(
    selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, timeFormat) : 'Select time'
  );

  const setInputValue = (date, format) => {
    const unixTimestamp = getUnixTime(date, format ? format : timeFormat);
    const selectedTimestamp = getSelectedTimestampFromUnixTimestamp(unixTimestamp, displayTimezone, isTimezoneEnabled);
    setUnixTimestamp(unixTimestamp);
    setSelectedTimestamp(selectedTimestamp);
    setExposedDateVariables(unixTimestamp, selectedTimestamp);
    fireEvent('onSelect');
  };

  const onDateSelect = (date) => {
    const selectedTime = getUnixTime(date, timeFormat);
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
    const displayValue = getFormattedSelectTimestamp(selectedTimestamp, timeFormat);
    const value = convertToIsoWithTimezoneOffset(unixTimestamp, storeTimezone);
    setExposedVariables({
      selectedTime: selectedTime,
      unixTimestamp: unixTimestamp,
      displayValue: displayValue,
      value: value,
    });
  };

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
    setDisplayTimestamp(selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, timeFormat) : 'Select time');
  }, [selectedTimestamp, timeFormat, textInputFocus]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const selectedTimestamp = getSelectedTimestampFromUnixTimestamp(unixTimestamp, displayTimezone, isTimezoneEnabled);
    const selectedTime = getFormattedSelectTimestamp(selectedTimestamp, timeFormat);
    const displayValue = getFormattedSelectTimestamp(selectedTimestamp, timeFormat);
    setSelectedTimestamp(selectedTimestamp);
    setExposedVariables({
      selectedTime,
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
    setExposedVariable('isValid', isValid);
  }, [isValid]);

  useEffect(() => {
    const selectedTime = getFormattedSelectTimestamp(selectedTimestamp, timeFormat);
    const displayValue = getFormattedSelectTimestamp(selectedTimestamp, timeFormat);
    const value = convertToIsoWithTimezoneOffset(unixTimestamp, storeTimezone);
    const exposedVariables = {
      value: value,
      selectedTime: selectedTime,
      unixTimestamp: unixTimestamp,
      displayValue: displayValue,
      timeFormat: timeFormat,
      isValid: isValid,
      storeTimezone: isTimezoneEnabled ? storeTimezone : moment.tz.guess(),
      displayTimezone: isTimezoneEnabled ? displayTimezone : moment.tz.guess(),
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
      setTime: (time, format) => {
        const momentObj = moment(time, [format ? format : timeFormat, timeFormat]);
        let updatedUnixTimestamp = moment(unixTimestamp);
        if (!momentObj.isValid()) updatedUnixTimestamp = moment();
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
  }, [selectedTimestamp, unixTimestamp, displayTimezone, isTimezoneEnabled, timeFormat]);

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
    setValidationStatus(isDateValid(selectedTimestamp, { minTime, maxTime, customRule, isMandatory }));
  }, [minTime, maxTime, customRule, isMandatory, selectedTimestamp]);

  const isTwentyFourHourMode = is24HourFormat(timeFormat);

  const componentProps = {
    popperClassName: cx('tj-table-datepicker tj-datepicker-widget react-datepicker-time-component', {
      'theme-dark dark-theme': darkMode,
    }),

    selected: selectedTimestamp ? moment(selectedTimestamp).toDate() : null,
    value: displayTimestamp,
    displayFromat: timeFormat,
    timeFormat,
    showTimeInput: true,
    showTimeSelectOnly: true,
    onCalendarClose: () => {
      setIsCalendarOpen(false);
    },
    onCalendarOpen: () => {
      setIsCalendarOpen(true);
    },
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
    displayFormat: timeFormat,
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
      //   customHeaderProps={customHeaderProps}
      customTimeInputProps={customTimeInputProps}
      customDateInputProps={customDateInputProps}
    />
  );
};
