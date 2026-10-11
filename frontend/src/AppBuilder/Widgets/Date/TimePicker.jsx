import React, { useEffect, useRef, useState } from 'react';
import { useDatetimeInput, useTimeInput } from './hooks';
import cx from 'classnames';
import moment from 'moment';
import {
  getFormattedSelectTimestamp,
  getUnixTime,
  is24HourFormat,
  isDateValid,
  getTimeSelectionBase,
  isUsableTimeFormat,
} from './utils';
import { BaseDateComponent } from './BaseDateComponent';
import './styles.scss';
import { useShowValidationOnFormSubmit, useFormClear } from '@/AppBuilder/Widgets/Form/FormSignalContext';

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
  const { label, defaultValue, timeFormat: timeFormatProp, placeholder: placeholderProp, showClearBtn } = properties;
  const placeholder = placeholderProp ?? 'Select time';
  // Tokenless format (e.g. {{42}}) → config error + shipped default fallback.
  const hasUsableFormat = isUsableTimeFormat(timeFormatProp);
  const timeFormat = hasUsableFormat ? timeFormatProp : 'HH:mm';
  const formatConfigError = Boolean(timeFormatProp) && !hasUsableFormat;
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
  useShowValidationOnFormSubmit(setShowValidationError);
  // Unparseable typed text — kept on screen with an error instead of reverting.
  const [textParseError, setTextParseError] = useState(false);
  const [validationStatus, setValidationStatus] = useState({ isValid: true, validationError: '' });
  const { isValid, validationError } = validationStatus;
  const [displayTimestamp, setDisplayTimestamp] = useState(
    selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, timeFormat) : ''
  );

  const setInputValue = (date, format, skipFireEvent = false) => {
    const timestamp = getUnixTime(date, format ? format : timeFormat);
    setSelectedTimestamp(timestamp);
    setExposedVariables({
      value: timestamp ? getFormattedSelectTimestamp(timestamp, timeFormat) : null,
    });
    if (skipFireEvent) return;
    fireEvent('onSelect');
  };

  const handleClear = () => {
    setInputValue(null, null, true);
    setDisplayTimestamp('');
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
    // Empty widget: base time edits on today's midnight so unpicked units stay
    // 00 — see getTimeSelectionBase.
    const updatedSelectedTimestamp = getTimeSelectionBase(selectedTimestamp);
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
    setInputValue(defaultValue, null, true);
  }, [defaultValue, timeFormat]);

  useEffect(() => {
    if (isInitialRender.current || textInputFocus || textParseError) return;
    setDisplayTimestamp(selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, timeFormat) : '');
  }, [selectedTimestamp, timeFormat, textInputFocus, textParseError]);

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
    // CSAs and clear update state and exposed variables silently — only real user selection fires
    // onSelect (same contract as DaterangePicker). This also prevents event→action→event loops
    // when an onSelect handler programmatically sets the value back on this widget.
    setExposedVariables({
      setValue: (value, format) => {
        setInputValue(value, format, true);
      },
      clearValue: () => {
        setInputValue(null, null, true);
      },
    });
  }, [selectedTimestamp, timeFormat]);

  useEffect(() => {
    if (formatConfigError) {
      setValidationStatus({ isValid: false, validationError: 'Invalid time format', isConfigError: true });
      return;
    }
    if (textParseError) {
      setValidationStatus({ isValid: false, validationError: 'Invalid time' });
      return;
    }
    setValidationStatus(isDateValid(selectedTimestamp, { minTime, maxTime, customRule, isMandatory, timeFormat }));
  }, [minTime, maxTime, customRule, isMandatory, selectedTimestamp, timeFormat, formatConfigError, textParseError]);

  useFormClear(() => setInputValue(null, null, true));

  const isTwentyFourHourMode = is24HourFormat(timeFormat);

  const componentProps = {
    popperClassName: cx(
      'cc-timepicker-widget tj-table-datepicker tj-datepicker-widget react-datepicker-time-component !tw-mt-0',
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
    timeFormat,
  };

  const customDateInputProps = {
    dateInputRef,
    onInputChange: onDateSelect,
    displayFormat: timeFormat,
    setDisplayTimestamp,
    setTextInputFocus,
    setShowValidationError,
    onTextParse: (parsed) => setTextParseError(parsed.hasError),
    // Config contradictions (min>max time) display immediately; input errors
    // keep the blur/submit gate.
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
      customTimeInputProps={customTimeInputProps}
      customDateInputProps={customDateInputProps}
      id={id}
      showClearBtn={showClearBtn}
      dataCy={dataCy}
    />
  );
};
