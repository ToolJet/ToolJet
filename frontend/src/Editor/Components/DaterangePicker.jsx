import React, { useState, useRef, useEffect } from 'react';
import 'react-datetime/css/react-datetime.css';
import { DateRangePicker } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';
import 'react-dates/initialize';
import { isEmpty } from 'lodash';

export const DaterangePicker = function DaterangePicker({
  height,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
}) {
  const { borderRadius, visibility, disabledState } = styles;

  const startDateProp = isEmpty(exposedVariables.startDate) ? null : exposedVariables.startDate;
  const endDateProp = isEmpty(exposedVariables.endDate) ? null : exposedVariables.endDate;
  const formatProp = properties.format;

  const [focusedInput, setFocusedInput] = useState(null);
  const [startDate, setStartDate] = useState(startDateProp);
  const [endDate, setEndDate] = useState(endDateProp);

  const dateRangeRef = useRef(null);

  useEffect(() => {
    dateRangeRef.current.container.querySelector('.DateRangePickerInput').style.borderRadius = `${Number.parseFloat(
      borderRadius
    )}px`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRangeRef.current, borderRadius]);

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
        displayFormat={formatProp}
        ref={dateRangeRef}
      />
    </div>
  );
};
