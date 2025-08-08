import React, { useEffect, useRef, useState } from 'react';
import { useDatetimeInput, useTimeInput } from './hooks';
import cx from 'classnames';
import moment from 'moment';
import { getFormattedSelectTimestamp, getUnixTime, is24HourFormat, isDateValid } from './utils';
import { BaseDateComponent } from './BaseDateComponent';
import './styles.scss';

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
  const { label, defaultValue, timeFormat } = properties;
  const inputProps = {
    properties,
    setExposedVariable,
    setExposedVariables,
    validation,
    fireEvent,
    dateInputRef,
    datePickerRef,
    timeFormat,
  };
  const dateTimeLogic = useDatetimeInput(inputProps);
  const timeLogic = useTimeInput(inputProps);

  const { disable, loading, focus, visibility, isMandatory, textInputFocus, setTextInputFocus, setIsCalendarOpen } =
    dateTimeLogic;
  const { minTime, maxTime } = timeLogic;
  const { customRule } = validation;

  const [selectedTimestamp, setSelectedTimestamp] = useState(
    defaultValue ? getUnixTime(defaultValue, timeFormat) : null
  );

  const [showValidationError, setShowValidationError] = useState(false);
  const [validationStatus, setValidationStatus] = useState({ isValid: true, validationError: '' });
  const { isValid, validationError } = validationStatus;
  const [displayTimestamp, setDisplayTimestamp] = useState(
    selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, timeFormat) : 'Select time'
  );

  const setInputValue = (date, format) => {
    const timestamp = getUnixTime(date, format ? format : timeFormat);
    setSelectedTimestamp(timestamp);
    setExposedVariables({
      value: timestamp ? getFormattedSelectTimestamp(timestamp, timeFormat) : null,
    });
    fireEvent('onSelect');
  };

  const onDateSelect = (date) => {
    const timestamp = getUnixTime(date, timeFormat);
    setSelectedTimestamp(timestamp);
    setExposedVariables({
      value: timestamp ? getFormattedSelectTimestamp(timestamp, timeFormat) : null,
    });
    fireEvent('onSelect');
  };

  const onTimeChange = (time, type) => {
    const updatedSelectedTimestamp = selectedTimestamp ? moment(selectedTimestamp) : moment();
    updatedSelectedTimestamp.set(type, time);
    const updatedTimestamp = updatedSelectedTimestamp.valueOf();
    setSelectedTimestamp(updatedTimestamp);
    setExposedVariables({
      value: getFormattedSelectTimestamp(updatedTimestamp, timeFormat),
    });
    fireEvent('onSelect');
  };

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('timeFormat', timeFormat);
  }, [timeFormat]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setInputValue(defaultValue);
  }, [defaultValue, timeFormat]);

  useEffect(() => {
    if (isInitialRender.current || textInputFocus) return;
    setDisplayTimestamp(selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, timeFormat) : 'Select time');
  }, [selectedTimestamp, timeFormat, textInputFocus]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isValid', isValid);
  }, [isValid]);

  useEffect(() => {
    const exposedVariables = {
      value: selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, timeFormat) : null,
      timeFormat: timeFormat,
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
    });
  }, [selectedTimestamp, timeFormat]);

  useEffect(() => {
    setValidationStatus(isDateValid(selectedTimestamp, { minTime, maxTime, customRule, isMandatory, timeFormat }));
  }, [minTime, maxTime, customRule, isMandatory, selectedTimestamp, timeFormat]);

  const isTwentyFourHourMode = is24HourFormat(timeFormat);
  console.log('isTwentyFourHourMode', isTwentyFourHourMode);

  const componentProps = {
    popperClassName: cx(
      'cc-timepicker-widget tj-table-datepicker tj-datepicker-widget react-datepicker-time-component',
      {
        'theme-dark dark-theme': darkMode,
      }
    ),

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
      customTimeInputProps={customTimeInputProps}
      customDateInputProps={customDateInputProps}
    />
  );
};
