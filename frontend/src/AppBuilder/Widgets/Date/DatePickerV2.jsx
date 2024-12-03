import React, { useEffect, useRef, useState } from 'react';
import { useDateInput, useDatetimeInput } from './hooks';
import {
  convertToIsoWithTimezoneOffset,
  getFormattedSelectTimestamp,
  getSelectedTimestampFromUnixTimestamp,
  getUnixTime,
  getUnixTimestampFromSelectedTimestamp,
  isDateValid,
} from './utils';
import { BaseDateComponent } from './BaseDateComponent';
import moment from 'moment-timezone';
import cx from 'classnames';

export const DatePickerV2 = ({
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
  const { label, defaultValue, dateFormat } = properties;
  const { customRule } = validation;

  const { disable, loading, focus, visibility, isMandatory, textInputFocus, setTextInputFocus, setIsCalendarOpen } =
    dateTimeLogic;
  const { minDate, maxDate, excludedDates } = dateLogic;
  const [unixTimestamp, setUnixTimestamp] = useState(defaultValue ? getUnixTime(defaultValue, dateFormat) : null);
  const [selectedTimestamp, setSelectedTimestamp] = useState(
    defaultValue ? getSelectedTimestampFromUnixTimestamp(unixTimestamp) : null
  );
  const [showValidationError, setShowValidationError] = useState(false);
  const [validationStatus, setValidationStatus] = useState({ isValid: true, validationError: '' });
  const { isValid, validationError } = validationStatus;
  const [displayTimestamp, setDisplayTimestamp] = useState(
    selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, dateFormat) : 'Select time'
  );
  const [datepickerMode, setDatePickerMode] = useState('date');

  const setInputValue = (date, format) => {
    const unixTimestamp = getUnixTime(date, format ? format : dateFormat);
    const selectedTimestamp = getSelectedTimestampFromUnixTimestamp(unixTimestamp);
    setUnixTimestamp(unixTimestamp);
    setSelectedTimestamp(selectedTimestamp);
    setExposedDateVariables(unixTimestamp, selectedTimestamp);
    fireEvent('onSelect');
  };

  const onDateSelect = (date) => {
    const selectedTime = getUnixTime(date, dateFormat);
    setSelectedTimestamp(selectedTime);
    const unixTimestamp = getUnixTimestampFromSelectedTimestamp(selectedTime);
    setUnixTimestamp(unixTimestamp);
    setExposedDateVariables(unixTimestamp, selectedTime);
    fireEvent('onSelect');
  };

  const setExposedDateVariables = (unixTimestamp, selectedTimestamp) => {
    const selectedDate = getFormattedSelectTimestamp(selectedTimestamp, dateFormat);
    const displayValue = getFormattedSelectTimestamp(selectedTimestamp, dateFormat);
    const value = convertToIsoWithTimezoneOffset(unixTimestamp, moment.tz.guess());
    setExposedVariables({
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
    setInputValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (isInitialRender.current || textInputFocus) return;
    setDisplayTimestamp(selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, dateFormat) : 'Select time');
  }, [selectedTimestamp, dateFormat, textInputFocus]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isValid', isValid);
  }, [isValid]);

  useEffect(() => {
    const selectedDate = getFormattedSelectTimestamp(selectedTimestamp, dateFormat);
    const displayValue = getFormattedSelectTimestamp(selectedTimestamp, dateFormat);
    const value = convertToIsoWithTimezoneOffset(unixTimestamp, moment.tz.guess());
    const exposedVariables = {
      value: value,
      selectedDate: selectedDate,
      unixTimestamp: unixTimestamp,
      displayValue: displayValue,
      dateFormat: dateFormat,
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
        let momentObj = moment(date, [format ? format : dateFormat]);
        if (!momentObj.isValid()) momentObj = moment();
        const updatedUnixTimestamp = moment(unixTimestamp);
        updatedUnixTimestamp.set('year', momentObj.year());
        updatedUnixTimestamp.set('month', momentObj.month());
        updatedUnixTimestamp.set('date', momentObj.date());
        const selectedTimestamp = getSelectedTimestampFromUnixTimestamp(updatedUnixTimestamp.valueOf());
        setUnixTimestamp(updatedUnixTimestamp.valueOf());
        setSelectedTimestamp(selectedTimestamp);
        setExposedDateVariables(updatedUnixTimestamp.valueOf(), selectedTimestamp);
        fireEvent('onSelect');
      },
    });
  }, [selectedTimestamp, unixTimestamp, dateFormat]);

  useEffect(() => {
    setValidationStatus(isDateValid(selectedTimestamp, { minDate, maxDate, customRule, isMandatory, excludedDates }));
  }, [minDate, maxDate, customRule, isMandatory, selectedTimestamp, excludedDates]);

  const componentProps = {
    className: 'input-field form-control validation-without-icon px-2',
    popperClassName: cx('tj-table-datepicker tj-datepicker-widget datepicker-component', {
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
    displayFormat: dateFormat,
    excludeDates: excludedDates,
    showMonthYearPicker: datepickerMode === 'month',
    showYearPicker: datepickerMode === 'year',
    value: displayTimestamp,
    showTimeInput: false,
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

  const customDateInputProps = {
    dateInputRef,
    onInputChange: onDateSelect,
    displayFormat: dateFormat,
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
      customDateInputProps={customDateInputProps}
    />
  );
};
