import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';
import useStore from '@/AppBuilder/_stores/store';
import { getUsableDateBounds } from '../utils';

// Invalid Min/Max bounds are configuration problems: they are IGNORED by the
// calendar and validation (never surfaced on the widget), reported to the
// debugger, and the exposed minDate/maxDate keep whatever the user wrote — or
// the resolved dynamic value — even when it is unparseable.
const logIgnoredBounds = ({ componentName, componentId, message, values }) => {
  useStore.getState().debugger.log({
    page: useStore.getState().getCurrentPageId('canvas'),
    type: 'component',
    kind: 'component',
    key: componentName,
    componentId,
    strace: 'page_level',
    message,
    status: true,
    error: values,
    errorTarget: 'Component Property',
    logLevel: 'error',
    timestamp: moment().toISOString(),
  });
};

const useDateInput = ({ validation = {}, dateFormat, setExposedVariable, setExposedVariables, componentName, id }) => {
  const isInitialRender = useRef(true);
  const { disabledDates } = validation;
  const [excludedDates, setExcludedDates] = useState([]);
  const initialBounds = getUsableDateBounds(validation.minDate, validation.maxDate, dateFormat);
  const [minDate, setMinDate] = useState(initialBounds.minDate);
  const [maxDate, setMaxDate] = useState(initialBounds.maxDate);

  useEffect(() => {
    const bounds = getUsableDateBounds(validation.minDate, validation.maxDate, dateFormat);
    setMinDate(bounds.minDate);
    setMaxDate(bounds.maxDate);
    // Expose the values as written/resolved, even when invalid (the mount
    // effect below owns the initial exposure).
    if (!isInitialRender.current) {
      setExposedVariables({ minDate: validation.minDate ?? null, maxDate: validation.maxDate ?? null });
    }
    // Ignored bounds are reported on mount as well — a saved app with a bad
    // bound must say so in the debugger without requiring an edit first.
    if (bounds.conflict || bounds.invalidMin || bounds.invalidMax) {
      const problems = [];
      if (bounds.invalidMin) problems.push(`Min date '${validation.minDate}' does not match the format`);
      if (bounds.invalidMax) problems.push(`Max date '${validation.maxDate}' does not match the format`);
      if (bounds.conflict)
        problems.push(`Min date '${validation.minDate}' is after max date '${validation.maxDate}' — both ignored`);
      logIgnoredBounds({
        componentName,
        componentId: id,
        message: `${problems.join('. ')}. The bound(s) are ignored for validation and the calendar.`,
        values: { minDate: validation.minDate, maxDate: validation.maxDate },
      });
    }
  }, [validation.minDate, validation.maxDate, dateFormat]);

  useEffect(() => {
    const exposedVariables = {
      minDate: validation.minDate,
      maxDate: validation.maxDate,
      setMinDate: (date) => {
        const momentDate = moment(date, dateFormat);
        if (momentDate.isValid()) {
          setMinDate(momentDate.toDate());
          setExposedVariable('minDate', date);
        }
      },
      setMaxDate: (date) => {
        const momentDate = moment(date, dateFormat);
        if (momentDate.isValid()) {
          setMaxDate(momentDate.toDate());
          setExposedVariable('maxDate', date);
        }
      },
      setDisabledDates: (dates) => {
        if (Array.isArray(dates)) {
          const _exluded = [];
          dates.forEach((date) => {
            if (moment(date, dateFormat).isValid()) {
              _exluded.push(moment(date, dateFormat).toDate());
            }
          });
          setExcludedDates(_exluded);
        } else {
          setExcludedDates([]);
        }
      },
      clearDisabledDates: () => {
        setExcludedDates([]);
      },
    };
    setExposedVariables(exposedVariables);

    isInitialRender.current = false;
  }, [dateFormat]);

  useEffect(() => {
    if (Array.isArray(disabledDates) && disabledDates.length > 0) {
      const _exluded = [];
      disabledDates?.map((item) => {
        if (moment(item, dateFormat).isValid()) {
          _exluded.push(moment(item, dateFormat).toDate());
        }
      });

      setExcludedDates(_exluded);
    } else {
      setExcludedDates([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledDates, dateFormat]);

  return { minDate, maxDate, excludedDates };
};

export default useDateInput;
