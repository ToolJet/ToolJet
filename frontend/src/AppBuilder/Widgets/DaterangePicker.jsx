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
  setExposedVariables,
  width,
  darkMode,
  fireEvent,
  dataCy,
  id,
  formId,
}) {
  const isInitialRender = useRef(true);
  const { borderRadius, visibility, disabledState, boxShadow } = styles;
  const { defaultStartDate, defaultEndDate } = properties;
  const formatProp = typeof properties.format === 'string' ? properties.format : '';

  const [focusedInput, setFocusedInput] = useState(null);
  const [startDate, setStartDate] = useState(moment(defaultStartDate, formatProp));
  const [endDate, setEndDate] = useState(moment(defaultEndDate, formatProp));

  const dateRangeRef = useRef(null);

  useEffect(() => {
    if (isInitialRender.current) return;
    setStartDate(moment(defaultStartDate, formatProp));
    setExposedVariable('startDate', moment(defaultStartDate, formatProp).format(formatProp));
  }, [defaultStartDate, formatProp]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setEndDate(moment(defaultEndDate, formatProp));
    setExposedVariable('endDate', moment(defaultEndDate, formatProp).format(formatProp));
  }, [defaultEndDate, formatProp]);

  useEffect(() => {
    const exposedVariables = {
      startDate: moment(defaultStartDate, formatProp).format(formatProp),
      endDate: moment(defaultEndDate, formatProp).format(formatProp),
    };
    setExposedVariables(exposedVariables);
    setStartDate(moment(defaultStartDate, formatProp));
    setEndDate(moment(defaultEndDate, formatProp));
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dateRangeRef.current.container.querySelector('.DateRangePickerInput').style.borderRadius = `${Number.parseFloat(
      borderRadius
    )}px`;
    dateRangeRef.current.container.querySelector('.DateRangePickerInput').style.height = `${height}px`;
    dateRangeRef.current.container.querySelector('.DateRangePickerInput').style.width = `${width - 3}px`;
    dateRangeRef.current.container.querySelector('.DateRangePickerInput').style.boxShadow = boxShadow;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRangeRef.current, borderRadius, height, width, boxShadow]);

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
    const currentComponent = document.querySelector(`.ele-${id}`);
    if (currentComponent) {
      currentComponent.style.zIndex = focus ? 3 : '';
    }

    const formComponent = formId && document.querySelector(`.form-${formId}`);
    if (formComponent) {
      formComponent.style.zIndex = focus ? 4 : '';
    }
  }

  return (
    <div
      className={`daterange-picker-widget ${darkMode && 'theme-dark'} p-0`}
      style={{ height, display: visibility ? '' : 'none', borderRadius, background: 'transparent' }}
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
