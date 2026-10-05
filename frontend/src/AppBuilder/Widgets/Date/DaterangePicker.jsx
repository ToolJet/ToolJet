import React, { useEffect, useRef, useState } from 'react';
import { useDateInput, useDatetimeInput } from './hooks';
import { BaseDateComponent } from './BaseDateComponent';
import moment from 'moment-timezone';
import cx from 'classnames';
import {
  isDateRangeValid,
  isDateValid,
  formatExposedDate,
  formatExposedDateRange,
  isUsableDateFormat,
  isRangeSelectionComplete,
} from './utils';
import './styles.scss';
import { useShowValidationOnFormSubmit, useFormClear } from '@/AppBuilder/Widgets/Form/FormSignalContext';

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
  const {
    defaultStartDate,
    defaultEndDate,
    format: formatProp,
    label,
    placeholder: placeholderProp,
    showClearBtn,
  } = properties;
  const placeholder = placeholderProp ?? 'Select Date Range';
  // A format with no date tokens (e.g. a {{42}} binding) is a configuration
  // error; the widget falls back to the shipped default so the field stays
  // usable while "Invalid date format" is shown immediately.
  const hasUsableFormat = isUsableDateFormat(formatProp);
  const format = hasUsableFormat ? formatProp : 'DD/MM/YYYY';
  const formatConfigError = Boolean(formatProp) && !hasUsableFormat;
  // Opt-in legacy marker written only by the backfill migration (never part of
  // the default widget config): migrated components keep exposing the
  // historical "Invalid date" strings until the flag is cleared by explicitly
  // editing the widget's date data (Default start date, Default end date, or
  // Format) in the inspector.
  const legacyInvalidDates = !!properties.legacyInvalidDates;
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
      return '';
    } else if (isValidStartDate && !isValidEndDate) {
      return `${moment(startDate).format(format)} → `;
    } else if (!isValidStartDate && isValidEndDate) {
      return ` → ${moment(endDate).format(format)}`;
    }
    return `${moment(startDate).format(format)} → ${moment(endDate).format(format)}`;
  };
  const [displayRange, setDisplayRange] = useState(getDisplayRange(startDate, endDate));

  const [showValidationError, setShowValidationError] = useState(false);
  useShowValidationOnFormSubmit(setShowValidationError);
  // Typed text that cannot be parsed at all — kept on screen with an "Invalid
  // date" message instead of being silently reverted on blur.
  const [textParseError, setTextParseError] = useState(false);

  const clearDateRangeValue = () => {
    setStartDate(null);
    setEndDate(null);
    setExposedVariables({
      startDate: null,
      startDateInUnix: null,
      endDate: null,
      endDateInUnix: null,
      selectedDateRange: null,
    });
  };

  const [validationStatus, setValidationStatus] = useState({ isValid: true, validationError: '' });
  const { isValid, validationError } = validationStatus;

  const onChange = (dates, skipFireEvent = false) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    setExposedVariables({
      startDate: formatExposedDate(start, format, legacyInvalidDates),
      startDateInUnix: start ? moment(start).valueOf() : null,
      endDate: formatExposedDate(end, format, legacyInvalidDates),
      endDateInUnix: end ? moment(end).valueOf() : null,
      selectedDateRange: formatExposedDateRange(start, end, format, legacyInvalidDates),
    });
    if (typeof skipFireEvent === 'boolean' && skipFireEvent) return;
    // A range selection is two calendar clicks and react-datepicker reports
    // both (`[start, null]`, then `[start, end]`). onSelect fires once — on
    // the click that completes the range — not per click.
    if (!isRangeSelectionComplete(start, end)) return;
    fireEvent('onSelect');
  };

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('dateFormat', format);
  }, [format]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isValid', isValid);
  }, [isValid]);

  useEffect(() => {
    if (isInitialRender.current) return;
    let startDate = moment(defaultStartDate, format);
    startDate = startDate.isValid() ? startDate.toDate() : null;

    let endDate = moment(defaultEndDate, format);
    endDate = endDate.isValid() ? endDate.toDate() : null;

    // Both dates are kept even when the range is inverted (end before start),
    // matching the first-mount state initializers — isDateRangeValid flags the
    // order instead of the end date being silently dropped. An unparseable
    // default passes through as null.
    onChange([startDate, endDate], true);
  }, [defaultStartDate, defaultEndDate, format]);

  // A cleared legacy flag (alignment switched to 'side' in the inspector) must
  // take effect immediately: re-expose the formatted values for the dates the
  // user already has, without resetting them to the defaults.
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({
      startDate: formatExposedDate(startDate, format, legacyInvalidDates),
      endDate: formatExposedDate(endDate, format, legacyInvalidDates),
      selectedDateRange: formatExposedDateRange(startDate, endDate, format, legacyInvalidDates),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacyInvalidDates]);

  useEffect(() => {
    const exposedVariables = {
      clearDateRange: clearDateRangeValue,
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
      startDate: formatExposedDate(startDate, format, legacyInvalidDates),
      endDate: formatExposedDate(endDate, format, legacyInvalidDates),
      selectedDateRange: formatExposedDateRange(startDate, endDate, format, legacyInvalidDates),
      startDateInUnix: startDate ? moment(startDate).valueOf() : null,
      endDateInUnix: endDate ? moment(endDate).valueOf() : null,
      dateFormat: format,
      isValid: isValid,
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  // Registered in its own effect (not the mount effect) so the closure follows
  // `format` and a cleared legacy flag instead of staying stale until remount.
  useEffect(() => {
    setExposedVariable('setDateRange', (startDate, endDate, customFormat) => {
      const startDateObj = moment(startDate, customFormat || format);
      const endDateObj = moment(endDate, customFormat || format);
      setStartDate(startDateObj.isValid() ? startDateObj.toDate() : null);
      setEndDate(endDateObj.isValid() ? endDateObj.toDate() : null);
      setExposedVariables({
        startDate: startDateObj.isValid() ? startDateObj.format(format) : null,
        startDateInUnix: startDateObj.isValid() ? startDateObj.valueOf() : null,
        endDate: endDateObj.isValid() ? endDateObj.format(format) : null,
        endDateInUnix: endDateObj.isValid() ? endDateObj.valueOf() : null,
        selectedDateRange: formatExposedDateRange(startDateObj, endDateObj, format, legacyInvalidDates),
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, legacyInvalidDates]);

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    setDisplayRange('');
    setExposedVariables({
      startDate: null,
      startDateInUnix: null,
      endDate: null,
      endDateInUnix: null,
      selectedDateRange: null,
    });
    // Silent like the sibling date widgets' clear buttons: zero dates is not
    // a completed range, so no onSelect.
  };

  useEffect(() => {
    setExposedVariable('setEndDate', (end, customFormat) => {
      const date = moment(end, customFormat || format);
      const endDate = date.isValid() ? date.toDate() : null;
      setEndDate(endDate);
      setExposedVariables({
        endDate: formatExposedDate(endDate, format, legacyInvalidDates),
        selectedDateRange: formatExposedDateRange(startDate, endDate, format, legacyInvalidDates),
      });
    });
  }, [startDate, format, legacyInvalidDates]);

  useEffect(() => {
    if (isInitialRender.current || textInputFocus || textParseError) return;
    setDisplayRange(getDisplayRange(startDate, endDate));
  }, [startDate, endDate, format, textInputFocus, textParseError]);

  useEffect(() => {
    setExposedVariable('setStartDate', (start, customFormat) => {
      const date = moment(start, customFormat || format);
      const startDate = date.isValid() ? date.toDate() : null;
      setStartDate(startDate);
      setExposedVariables({
        startDate: formatExposedDate(startDate, format, legacyInvalidDates),
        selectedDateRange: formatExposedDateRange(startDate, endDate, format, legacyInvalidDates),
      });
    });
  }, [endDate, format, legacyInvalidDates]);

  useEffect(() => {
    if (formatConfigError) {
      setValidationStatus({ isValid: false, validationError: 'Invalid date format', isConfigError: true });
      return;
    }
    if (textParseError) {
      setValidationStatus({ isValid: false, validationError: 'Invalid date' });
      return;
    }
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
    setValidationStatus(validationStatus);
  }, [
    minDate,
    maxDate,
    customRule,
    isMandatory,
    startDate,
    endDate,
    excludedDates,
    format,
    formatConfigError,
    textParseError,
  ]);

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

  useFormClear(clearDateRangeValue);

  const componentProps = {
    className: 'input-field form-control validation-without-icon px-2',
    popperClassName: cx('tj-daterange-widget !tw-mt-0', {
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
    // Day-level exclusions must not disable whole year/month cells in year/month picker modes
    excludeDates: datepickerMode === 'date' ? excludedDates : undefined,
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
    shouldCloseOnSelect: true,
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
    onTextParse: (parsed) => setTextParseError(parsed.hasError),
    // Config contradictions (min>max, inverted range) display immediately;
    // input errors keep the blur/submit gate.
    showValidationError: showValidationError || !!validationStatus.isConfigError,
    isValid,
    validationError,
    showClearBtn,
    onClear: handleClear,
    inputPlaceholder: placeholder,
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
      id={id}
      showClearBtn={showClearBtn}
    />
  );
};
