import React, { useState } from 'react';
import 'react-datetime/css/react-datetime.css';
import { DateRangePicker } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';
import 'react-dates/initialize';

export const DaterangePicker = function DaterangePicker({
  height,
  currentState,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
}) {
  console.log('currentState', currentState);

  const { visibility, disabledState } = styles;

  const startDateProp = exposedVariables.startDate;
  const endDateProp = exposedVariables.endDate;
  const formatProp = properties.format;

  const [focusedInput, setFocusedInput] = useState(null);
  const [startDate, setStartDate] = useState(startDateProp ?? null);
  const [endDate, setEndDate] = useState(endDateProp ?? null);

  function onDateChange(dates) {
    const start = dates.startDate;
    const end = dates.endDate;

    if (start) {
      setExposedVariable('startDate', start.format(formatProp.value));
    }

    if (end) {
      setExposedVariable('endDate', end.format(formatProp.value));
    }

    setStartDate(start);
    setEndDate(end);
  }

  function focusChanged(focus) {
    setFocusedInput(focus);
  }

  return (
    <div className="daterange-picker-widget p-0" style={{ height, display: visibility ? '' : 'none' }}>
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
      />
    </div>
  );
};
