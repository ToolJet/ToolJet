import React, { useState, useRef, useEffect } from 'react';
import 'react-datetime/css/react-datetime.css';
import { DateRangePicker } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';
import 'react-dates/initialize';
import moment from 'moment';

export const DaterangePicker = function DaterangePicker({
  height,
  properties,
  styles,
  setExposedVariable,
  width,
  darkMode,
  fireEvent,
  dataCy,
}) {
  const { borderRadius, visibility, disabledState } = styles;
  const { defaultStartDate, defaultEndDate } = properties;
  const formatProp = typeof properties.format === 'string' ? properties.format : '';

  const [focusedInput, setFocusedInput] = useState(null);
  const [startDate, setStartDate] = useState(moment(defaultStartDate, formatProp));
  const [endDate, setEndDate] = useState(moment(defaultEndDate, formatProp));

  const dateRangeRef = useRef(null);

  useEffect(() => {
    setStartDate(moment(defaultStartDate, formatProp));
    setEndDate(moment(defaultEndDate, formatProp));
    setExposedVariable('startDate', startDate.format(formatProp));
    setExposedVariable('endDate', endDate.format(formatProp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultEndDate, defaultStartDate, formatProp]);

  useEffect(() => {
    dateRangeRef.current.container.querySelector('.DateRangePickerInput').style.borderRadius = `${Number.parseFloat(
      borderRadius
    )}px`;
    dateRangeRef.current.container.querySelector('.DateRangePickerInput').style.height = `${height}px`;
    dateRangeRef.current.container.querySelector('.DateRangePickerInput').style.width = `${width - 3}px`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRangeRef.current, borderRadius, height, width]);

  function onDateChange(dates) {
    const start = dates.startDate;
    const end = dates.endDate;

    if (start) {
      setExposedVariable('startDate', start.format(formatProp));
    }

    if (end) {
      setExposedVariable('endDate', end.format(formatProp));
    }

    setStartDate(start);
    setEndDate(end);
    fireEvent('onSelect');
  }

  function focusChanged(focus) {
    setFocusedInput(focus);
  }

  return (
    <div
      className={`daterange-picker-widget ${darkMode && 'theme-dark'} p-0`}
      style={{ height, display: visibility ? '' : 'none' }}
      data-cy={dataCy}
    >
      <DateRangePicker
        disabled={disabledState}
        startDate={startDate}
        startDateId="startDate"
        isOutsideRange={() => false}
        endDate={endDate}
        endDateId="endDate"
        onDatesChange={(dates) => onDateChange(dates)}
        onFocusChange={(focus) => focusChanged(focus)}
        focusedInput={focusedInput}
        hideKeyboardShortcutsPanel={true}
        displayFormat={formatProp}
        ref={dateRangeRef}
      />
    </div>
  );
};
