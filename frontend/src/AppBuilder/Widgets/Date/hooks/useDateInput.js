import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';
import {
  dateBoundOf,
  dateBoundsValuesOf,
  excludedDatesOf,
} from '@/AppBuilder/_engines/materialize/widgets/DatePickerV2';

const useDateInput = ({ validation = {}, dateFormat, setExposedVariable, setExposedVariables }) => {
  const isInitialRender = useRef(true);
  const { disabledDates } = validation;
  const [excludedDates, setExcludedDates] = useState([]);
  const [minDate, setMinDate] = useState(dateBoundOf(validation.minDate, dateFormat));
  const [maxDate, setMaxDate] = useState(dateBoundOf(validation.maxDate, dateFormat));

  useEffect(() => {
    if (isInitialRender.current) return;
    const momentDate = moment(validation.minDate, dateFormat);
    if (momentDate.isValid()) {
      setMinDate(momentDate.toDate());
      setExposedVariable('minDate', validation.minDate);
    } else {
      setMinDate(null);
      setExposedVariable('minDate', null);
    }
  }, [validation.minDate, dateFormat]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const momentDate = moment(validation.maxDate, dateFormat);
    if (momentDate.isValid()) {
      setMaxDate(momentDate.toDate());
      setExposedVariable('maxDate', validation.maxDate);
    } else {
      setMaxDate(null);
      setExposedVariable('maxDate', null);
    }
  }, [validation.maxDate, dateFormat]);

  useEffect(() => {
    const exposedVariables = {
      ...dateBoundsValuesOf(validation),
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
    setExcludedDates(excludedDatesOf(disabledDates, dateFormat));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledDates, dateFormat]);

  return { minDate, maxDate, excludedDates };
};

export default useDateInput;
