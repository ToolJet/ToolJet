import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import moment from 'moment-timezone';

// Canonical list lives in ./utils; re-exported here because this module is its
// historical import path (the inspector keeps its own copy).
export { TIMEZONE_OPTIONS } from './utils';
import {
  TIMEZONE_OPTIONS,
  resolveTimezone,
  convertToIsoWithTimezoneOffset,
  getFormattedSelectTimestamp,
  getSelectedTimestampFromUnixTimestampV2,
  getUnixTime,
  getUnixTimestampFromSelectedTimestamp,
  getUnixTimeFromParsedDate,
  is24HourFormat,
  isDateValid,
  getTimeSelectionBase,
  isUsableDateFormat,
  isUsableTimeFormat,
} from './utils';

export const TIMEZONE_OPTIONS_MAP = TIMEZONE_OPTIONS.reduce((acc, curr) => {
  acc[curr.name] = curr.value;
  return acc;
}, {});

import { BaseDateComponent } from './BaseDateComponent';
import { useDateInput, useTimeInput, useDatetimeInput } from './hooks';
import { useShowValidationOnFormSubmit, useFormClear } from '@/AppBuilder/Widgets/Form/FormSignalContext';

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
  resetComponent,
}) => {
  const isInitialRender = useRef(true);
  const dateInputRef = useRef(null);
  const datePickerRef = useRef(null);
  const {
    label,
    defaultValue,
    dateFormat: dateFormatProp,
    timeFormat: timeFormatProp,
    placeholder: placeholderProp,
    isTimezoneEnabled,
    showClearBtn,
  } = properties;
  const placeholder = placeholderProp ?? 'Select date and time';
  // Tokenless formats (e.g. {{42}}) → config error + shipped default fallback.
  const hasUsableDateFormat = isUsableDateFormat(dateFormatProp);
  const hasUsableTimeFormat = isUsableTimeFormat(timeFormatProp);
  const dateFormat = hasUsableDateFormat ? dateFormatProp : 'DD/MM/YYYY';
  const timeFormat = hasUsableTimeFormat ? timeFormatProp : 'HH:mm';
  const dateFormatConfigError = Boolean(dateFormatProp) && !hasUsableDateFormat;
  const timeFormatConfigError = Boolean(timeFormatProp) && !hasUsableTimeFormat;
  const formatConfigError = dateFormatConfigError || timeFormatConfigError;
  const formatConfigErrorMessage = dateFormatConfigError ? 'Invalid date format' : 'Invalid time format';
  const inputProps = {
    properties,
    setExposedVariable,
    setExposedVariables,
    validation,
    fireEvent,
    dateInputRef,
    datePickerRef,
    timeFormat,
    dateFormat,
  };
  const dateTimeLogic = useDatetimeInput(inputProps);
  const dateLogic = useDateInput(inputProps);
  const timeLogic = useTimeInput(inputProps);

  const { disable, loading, focus, visibility, isMandatory, textInputFocus, setTextInputFocus, setIsCalendarOpen } =
    dateTimeLogic;
  const { minDate, maxDate, excludedDates } = dateLogic;
  const { minTime, maxTime } = timeLogic;

  const { customRule } = validation;

  const displayFormat = `${dateFormat} ${timeFormat}`;

  // Display Timezone
  const [displayTimezone, setDisplayTimezone] = useState(
    isTimezoneEnabled ? properties.displayTimezone : moment.tz.guess()
  );

  // Parsing Timezone
  const [storeTimezone, setStoreTimezone] = useState(isTimezoneEnabled ? properties.storeTimezone : moment.tz.guess());

  // Unix Timestamp single source of truth
  const isISOString = defaultValue.includes('T');
  const [unixTimestamp, setUnixTimestamp] = useState(
    defaultValue
      ? isISOString
        ? moment(defaultValue).valueOf()
        : getUnixTimeFromParsedDate(defaultValue, storeTimezone, displayFormat)
      : null
  );

  // Selected Date = unixTimestamp + displayTimezone offset
  // But moment(selectedDate) = SelectedTimestamp + local timezone offset
  // SelectedTimestamp + local timezone offset = unixTimestamp + displayTimezone offset
  // SelectedTimestamp = unixTimestamp + displayTimezone offset - local timezone offset

  const [selectedTimestamp, setSelectedTimestamp] = useState(
    defaultValue ? getSelectedTimestampFromUnixTimestampV2(unixTimestamp, displayTimezone) : null
  );

  const [showValidationError, setShowValidationError] = useState(false);
  useShowValidationOnFormSubmit(setShowValidationError);
  // Unparseable typed text — kept on screen with an error instead of reverting.
  const [textParseError, setTextParseError] = useState(false);
  const [validationStatus, setValidationStatus] = useState({ isValid: true, validationError: '' });
  const { isValid, validationError } = validationStatus;
  const [displayTimestamp, setDisplayTimestamp] = useState(
    selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, displayFormat) : ''
  );
  const [datepickerMode, setDatePickerMode] = useState('date');

  const setInputValue = (date, format, propStoreTimezone, skipFireEvent = false) => {
    const isISOString = typeof date === 'string' && date.includes('T');
    const unixTimestamp = isISOString
      ? moment(date).valueOf()
      : getUnixTimeFromParsedDate(
          date,
          propStoreTimezone ? propStoreTimezone : storeTimezone,
          format ? format : displayFormat
        );
    const selectedTimestamp = getSelectedTimestampFromUnixTimestampV2(unixTimestamp, displayTimezone);
    setUnixTimestamp(unixTimestamp);
    setSelectedTimestamp(selectedTimestamp);
    setExposedDateVariables(unixTimestamp, selectedTimestamp);
    if (skipFireEvent) return;
    fireEvent('onSelect');
  };

  const handleClear = () => {
    setInputValue(null, null, null, true);
    setDisplayTimestamp('');
  };

  const onDateSelect = (date) => {
    const selectedTime = getUnixTime(date, displayFormat);
    setSelectedTimestamp(selectedTime);
    const unixTimestamp = getUnixTimestampFromSelectedTimestamp(selectedTime, displayTimezone);
    setUnixTimestamp(unixTimestamp);
    setExposedDateVariables(unixTimestamp, selectedTime);
    fireEvent('onSelect');
  };

  const onTimeChange = (time, type) => {
    // Empty widget: base time edits on today's midnight so unpicked units stay
    // 00 — see getTimeSelectionBase.
    const updatedSelectedTimestamp = getTimeSelectionBase(selectedTimestamp);
    updatedSelectedTimestamp.set(type, time);
    const updatedUnixTimestamp = getUnixTimestampFromSelectedTimestamp(
      updatedSelectedTimestamp.valueOf(),
      displayTimezone
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
    resetComponent();
  }, [isTimezoneEnabled]);

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
    setInputValue(defaultValue, displayFormat, isTimezoneEnabled ? properties.storeTimezone : moment.tz.guess(), true);
  }, [defaultValue, displayFormat, properties.storeTimezone]);

  useEffect(() => {
    if (isInitialRender.current || textInputFocus || textParseError) return;
    setDisplayTimestamp(selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, displayFormat) : '');
  }, [selectedTimestamp, displayFormat, textInputFocus, textParseError]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const selectedTimestamp = getSelectedTimestampFromUnixTimestampV2(unixTimestamp, displayTimezone);
    const selectedTime = getFormattedSelectTimestamp(selectedTimestamp, timeFormat);
    const selectedDate = getFormattedSelectTimestamp(selectedTimestamp, dateFormat);
    const displayValue = getFormattedSelectTimestamp(selectedTimestamp, displayFormat);
    setSelectedTimestamp(selectedTimestamp);
    setExposedVariables({
      selectedTime,
      selectedDate,
      displayValue,
    });
  }, [isTimezoneEnabled, displayTimezone, displayFormat]);

  useEffect(() => {
    const unixTimestamp = getUnixTimestampFromSelectedTimestamp(selectedTimestamp, displayTimezone);
    setUnixTimestamp(unixTimestamp);
  }, [storeTimezone]);

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
    // CSAs and clear update state and exposed variables silently — only real user selection fires
    // onSelect (same contract as DaterangePicker). This also prevents event→action→event loops
    // when an onSelect handler programmatically sets the value back on this widget.
    setExposedVariables({
      setValue: (value, format) => {
        setInputValue(value, format, null, true);
      },
      clearValue: () => {
        setInputValue(null, null, null, true);
      },
      setValueInTimestamp: (timeStamp) => {
        setInputValue(timeStamp, null, null, true);
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
        const selectedTimestamp = getSelectedTimestampFromUnixTimestampV2(
          updatedUnixTimestamp.valueOf(),
          displayTimezone
        );
        setUnixTimestamp(updatedUnixTimestamp.valueOf());
        setSelectedTimestamp(selectedTimestamp);
        setExposedDateVariables(updatedUnixTimestamp.valueOf(), selectedTimestamp);
      },
      setTime: (time, format) => {
        const momentObj = moment(time, [format ? format : timeFormat, displayFormat]);
        let updatedUnixTimestamp = moment(unixTimestamp);
        if (!updatedUnixTimestamp.isValid()) {
          updatedUnixTimestamp = moment();
        }
        updatedUnixTimestamp.set('hour', momentObj.hour());
        updatedUnixTimestamp.set('minute', momentObj.minute());
        const selectedTimestamp = getSelectedTimestampFromUnixTimestampV2(
          updatedUnixTimestamp.valueOf(),
          displayTimezone
        );
        setUnixTimestamp(updatedUnixTimestamp.valueOf());
        setSelectedTimestamp(selectedTimestamp);
        setExposedDateVariables(updatedUnixTimestamp.valueOf(), selectedTimestamp);
      },
    });
  }, [
    selectedTimestamp,
    unixTimestamp,
    displayTimezone,
    isTimezoneEnabled,
    dateFormat,
    timeFormat,
    displayFormat,
    unixTimestamp,
  ]);

  useEffect(() => {
    setExposedVariables({
      // Both CSAs accept the inspector offset label ('+05:30') or an
      // option-list IANA id ('Etc/UTC') — see resolveTimezone. Unknown input
      // is a no-op.
      setDisplayTimezone: (timezone) => {
        const value = resolveTimezone(timezone);
        if (value) {
          const val = isTimezoneEnabled ? value : moment.tz.guess();
          setDisplayTimezone(val);
          setExposedVariable('displayTimezone', val);
        }
      },
      setStoreTimezone: (timezone) => {
        const value = resolveTimezone(timezone);
        if (value) {
          const val = isTimezoneEnabled ? value : moment.tz.guess();
          setStoreTimezone(val);
          setExposedVariable('storeTimezone', val);
          // Parity with editing the Store timezone property (user-approved
          // 2026-10-05): re-interpret the default value in the new zone so the
          // instant, exposed value and displayed time all move — previously
          // only the exposed variable changed and users saw "nothing happen".
          setInputValue(defaultValue, displayFormat, val, true);
        }
      },
    });
    // setInputValue reads displayTimezone and (via setExposedDateVariables)
    // storeTimezone and the formats — re-register so the closures stay fresh.
  }, [isTimezoneEnabled, defaultValue, displayFormat, displayTimezone, storeTimezone]);

  useEffect(() => {
    if (formatConfigError) {
      setValidationStatus({ isValid: false, validationError: formatConfigErrorMessage, isConfigError: true });
      return;
    }
    if (textParseError) {
      setValidationStatus({ isValid: false, validationError: 'Invalid date' });
      return;
    }
    setValidationStatus(
      isDateValid(selectedTimestamp, {
        minDate,
        maxDate,
        minTime,
        maxTime,
        customRule,
        isMandatory,
        excludedDates,
        timeFormat,
        dateFormat,
      })
    );
  }, [
    minTime,
    maxTime,
    minDate,
    maxDate,
    customRule,
    isMandatory,
    selectedTimestamp,
    excludedDates,
    timeFormat,
    dateFormat,
    formatConfigError,
    formatConfigErrorMessage,
    textParseError,
  ]);

  useFormClear(() => setInputValue(null, null, null, true));

  const isTwentyFourHourMode = is24HourFormat(displayFormat);

  const componentProps = {
    popperClassName: cx('tj-table-datepicker tj-datepicker-widget datetimepicker-widget !tw-mt-0', {
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
    // Day-level exclusions must not disable whole year/month cells in year/month picker modes
    excludeDates: datepickerMode === 'date' ? excludedDates : undefined,
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
    timeFormat,
  };

  const customDateInputProps = {
    dateInputRef,
    onInputChange: onDateSelect,
    displayFormat,
    setDisplayTimestamp,
    setTextInputFocus,
    setShowValidationError,
    onTextParse: (parsed) => setTextParseError(parsed.hasError),
    // Config contradictions (min>max date or time) display immediately; input
    // errors keep the blur/submit gate.
    showValidationError: showValidationError || !!validationStatus.isConfigError,
    isValid,
    validationError,
    showClearBtn,
    onClear: handleClear,
    inputPlaceholder: placeholder,
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
      id={id}
      showClearBtn={showClearBtn}
      dataCy={dataCy}
    />
  );
};
