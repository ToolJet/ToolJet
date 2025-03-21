import React, { useEffect, useRef, useState } from 'react';
import { useDateInput, useDatetimeInput } from './hooks';
import { BaseDateComponent } from './BaseDateComponent';
import moment from 'moment-timezone';
import cx from 'classnames';
import { isDateRangeValid, isDateValid } from './utils';

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
  const [datepickerMode, setDatePickerMode] = useState('date');
  const { defaultStartDate, defaultEndDate, format, label } = properties;
  const inputProps = {
    properties,
    setExposedVariable,
    setExposedVariables,
    validation,
    fireEvent,
    dateInputRef,
    datePickerRef,
    dateFormat: format,
  };
  const dateTimeLogic = useDatetimeInput(inputProps);
  const dateLogic = useDateInput(inputProps);

  const { disable, loading, focus, visibility, isMandatory, textInputFocus, setTextInputFocus, setIsCalendarOpen } =
    dateTimeLogic;
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

  const getDisplayRange = (startDate, endDate) => {
    const isValidStartDate = startDate && moment(startDate).isValid();
    const isValidEndDate = endDate && moment(endDate).isValid();
    if (!isValidStartDate && !isValidEndDate) {
      return 'Select Date Range';
    } else if (isValidStartDate && !isValidEndDate) {
      return `${moment(startDate).format(format)} → `;
    } else if (!isValidStartDate && isValidEndDate) {
      return ` → ${moment(endDate).format(format)}`;
    }
    return `${moment(startDate).format(format)} → ${moment(endDate).format(format)}`;
  };
  const [displayRange, setDisplayRange] = useState(getDisplayRange(startDate, endDate));

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
    fireEvent('onSelect');
  };

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('dateFormat', format);
  }, [format]);

  useEffect(() => {
    if (isInitialRender.current) return;
    let startDate = moment(defaultStartDate, format);
    startDate = startDate.isValid() ? startDate.toDate() : null;

    let endDate = moment(defaultEndDate, format);
    endDate = endDate.isValid() ? endDate.toDate() : null;

    if (startDate && endDate) {
      if (moment(startDate).isSameOrBefore(endDate)) {
        onChange([startDate, endDate]);
      } else {
        onChange([startDate, null]);
      }
    }
  }, [defaultStartDate, defaultEndDate, format]);

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
    if (isInitialRender.current || textInputFocus) return;
    setDisplayRange(getDisplayRange(startDate, endDate));
  }, [startDate, endDate, format, textInputFocus]);

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
    let validationStatus = isDateValid(startDate, {
      minDate,
      maxDate,
      customRule,
      isMandatory,
      dateFormat: format,
    });
    if (!validationStatus.isValid) {
      setValidationStatus(validationStatus);
      return;
    }
    validationStatus = isDateValid(endDate, {
      minDate,
      maxDate,
      customRule,
      isMandatory,
      dateFormat: format,
    });
    if (!validationStatus.isValid) {
      setValidationStatus(validationStatus);
      return;
    }
    validationStatus = isDateRangeValid(startDate, endDate, excludedDates, format);
    console.log('validationStatus', validationStatus);
    setValidationStatus(validationStatus);
  }, [minDate, maxDate, customRule, isMandatory, startDate, endDate, excludedDates, format]);

  useEffect(() => {
    const transformedFormat = format.toLowerCase();
    if (transformedFormat.includes('y') && !transformedFormat.includes('m') && !transformedFormat.includes('d')) {
      setDatePickerMode('year');
    } else if (transformedFormat.includes('m') && !transformedFormat.includes('d')) {
      setDatePickerMode('month');
    } else {
      setDatePickerMode('date');
    }
  }, [format]);

  const componentProps = {
    className: 'input-field form-control validation-without-icon px-2',
    popperClassName: cx('tj-daterange-widget', {
      'theme-dark dark-theme': darkMode,
      'react-datepicker-month-component': datepickerMode === 'month',
      'react-datepicker-year-component': datepickerMode === 'year',
    }),
    onChange,
    onSelect: (start) => {
      if (!startDate && endDate) {
        if (moment(start).isSameOrBefore(endDate)) {
          onChange([start, endDate]);
        } else {
          onChange([start, null]);
        }
      }
    },
    selected: startDate,
    value: displayRange,
    startDate: startDate,
    endDate: endDate,
    selectsRange: true,
    monthsShown: 2,
    excludeDates: excludedDates,
    showMonthDropdown: datepickerMode === 'date',
    showYearDropdown: datepickerMode === 'date',
    showMonthYearPicker: datepickerMode === 'month',
    showYearPicker: datepickerMode === 'year',
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
    onInputChange: onChange,
    datepickerSelectionType: 'range',
    datepickerMode,
    setDisplayTimestamp: setDisplayRange,
    displayFormat: format,
    setTextInputFocus,
    setShowValidationError,
    showValidationError,
    isValid,
    validationError,
  };

  const customHeaderProps = {
    datepickerSelectionType: 'range',
    datepickerMode,
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
