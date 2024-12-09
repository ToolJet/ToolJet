import React, { useEffect, useRef, useState } from 'react';
import { useDateInput, useDatetimeInput } from './hooks';
import { BaseDateComponent } from './BaseDateComponent';
import moment from 'moment-timezone';
import cx from 'classnames';
import { isDateValid } from './utils';

export const DaterangePicker = ({
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

  const { defaultStartDate, defaultEndDate, format, label } = properties;
  const { disable, loading, focus, visibility, isMandatory, setTextInputFocus, setIsCalendarOpen } = dateTimeLogic;
  const { minDate, maxDate, excludedDates } = dateLogic;
  const { customRule } = validation;

  const [startDate, setStartDate] = useState(
    (() => {
      const date = moment(defaultStartDate, format);
      return date.isValid() ? date.toDate() : null;
    })()
  );

  const [endDate, setEndDate] = useState(
    (() => {
      const date = moment(defaultEndDate, format);
      return date.isValid() ? date.toDate() : null;
    })()
  );

  const [showValidationError, setShowValidationError] = useState(false);
  const [validationStatus, setValidationStatus] = useState({ isValid: true, validationError: '' });
  const { isValid, validationError } = validationStatus;

  const onChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    setExposedVariables({
      startDate: moment(start).format(format),
      startDateInUnix: moment(start).valueOf(),
      endDate: moment(end).format(format),
      endDateInUnix: moment(end).valueOf(),
      selectedDateRange: `${moment(start).format(format)} - ${moment(end).format(format)}`,
    });
  };

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('dateFormat', format);
  }, [format]);

  useEffect(() => {
    const exposedVariables = {
      clearDateRange: () => {
        setStartDate(null);
        setEndDate(null);
        setExposedVariables({
          startDate: null,
          startDateInUnix: null,
          endDate: null,
          endDateInUnix: null,
          selectedDateRange: null,
        });
      },
      setDateRange: (startDate, endDate, customFormat) => {
        const startDateObj = moment(startDate, customFormat || format);
        const endDateObj = moment(endDate, customFormat || format);
        setStartDate(startDateObj.isValid() ? startDateObj.toDate() : null);
        setEndDate(endDateObj.isValid() ? endDateObj.toDate() : null);
        setExposedVariables({
          startDate: startDateObj.isValid() ? startDateObj.format(format) : null,
          startDateInUnix: startDateObj.isValid() ? startDateObj.valueOf() : null,
          endDate: endDateObj.isValid() ? endDateObj.format(format) : null,
          endDateInUnix: endDateObj.isValid() ? endDateObj.valueOf() : null,
          selectedDateRange: `${startDateObj.format(format)} - ${endDateObj.format(format)}`,
        });
      },
      clearStartDate: () => {
        setStartDate(null);
        setExposedVariables({
          startDate: null,
          startDateInUnix: null,
          selectedDateRange: null,
        });
      },
      clearEndDate: () => {
        setEndDate(null);
        setExposedVariables({
          endDate: null,
          endDateInUnix: null,
          selectedDateRange: null,
        });
      },
      startDate: moment(startDate).format(format),
      endDate: moment(endDate).format(format),
      selectedDateRange: `${moment(startDate).format(format)} - ${moment(endDate).format(format)}`,
      startDateInUnix: startDate ? moment(startDate).valueOf() : null,
      endDateInUnix: endDate ? moment(endDate).valueOf() : null,
      dateFormat: format,
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  useEffect(() => {
    setExposedVariable('setEndDate', (end, customFormat) => {
      const date = moment(end, customFormat || format);
      const endDate = date.isValid() ? date.toDate() : null;
      setEndDate(endDate);
      setExposedVariables({
        endDate: moment(endDate).format(format),
        selectedDateRange: `${moment(startDate).format(format)} - ${moment(endDate).format(format)}`,
      });
    });
  }, [startDate, format]);

  useEffect(() => {
    setExposedVariable('setStartDate', (start, customFormat) => {
      const date = moment(start, customFormat || format);
      const startDate = date.isValid() ? date.toDate() : null;
      setStartDate(startDate);
      setExposedVariables({
        startDate: moment(startDate).format(format),
        selectedDateRange: `${moment(startDate).format(format)} - ${moment(endDate).format(format)}`,
      });
    });
  }, [endDate, format]);

  useEffect(() => {
    let validationStatus = isDateValid(startDate, { minDate, maxDate, customRule, isMandatory, excludedDates });
    if (!validationStatus.isValid) {
      setValidationStatus(validationStatus);
      return;
    }
    validationStatus = isDateValid(endDate, { minDate, maxDate, customRule, isMandatory, excludedDates });
    setValidationStatus(validationStatus);
  }, [minDate, maxDate, customRule, isMandatory, startDate, endDate, excludedDates]);

  const componentProps = {
    className: 'input-field form-control validation-without-icon px-2',
    popperClassName: cx('tj-daterange-widget', {
      'theme-dark dark-theme': darkMode,
    }),
    onChange,
    selected: startDate,
    startDate: startDate,
    endDate: endDate,
    selectsRange: true,
    monthsShown: 2,
    showMonthDropdown: true,
    showYearDropdown: true,
    minDate: moment(minDate).isValid() ? minDate : null,
    maxDate: moment(maxDate).isValid() ? maxDate : null,
    onCalendarClose: () => {
      setIsCalendarOpen(false);
    },
    onCalendarOpen: () => {
      setIsCalendarOpen(true);
    },
  };

  const customDateInputProps = {
    dateInputRef,
    onInputChange: () => {},
    displayFormat: format,
    setTextInputFocus,
    setShowValidationError,
    showValidationError,
    isValid,
    validationError,
  };

  const customHeaderProps = {
    datepickerMode: 'range',
    setDatePickerMode: () => {},
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
