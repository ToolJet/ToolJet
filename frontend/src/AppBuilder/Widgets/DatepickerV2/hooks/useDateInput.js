import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';
import { DISABLED_DATE_FORMAT } from '../constants';

const useDateInput = ({ validation, setExposedVariable, setExposedVariables }) => {
  const isInitialRender = useRef(true);

  const [minDate, setMinDate] = useState(moment(validation.minDate, DISABLED_DATE_FORMAT).toDate());
  const [maxDate, setMaxDate] = useState(moment(validation.maxDate, DISABLED_DATE_FORMAT).toDate());

  useEffect(() => {
    if (isInitialRender.current) return;
    const momentDate = moment(validation.minDate, DISABLED_DATE_FORMAT);
    if (momentDate.isValid()) {
      setMinDate(momentDate.toDate());
      setExposedVariable('minDate', validation.minDate);
    } else {
      setMinDate(null);
      setExposedVariable('minDate', null);
    }
  }, [validation.minDate]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const momentDate = moment(validation.maxDate, DISABLED_DATE_FORMAT);
    if (momentDate.isValid()) {
      setMaxDate(momentDate.toDate());
      setExposedVariable('maxDate', validation.maxDate);
    } else {
      setMaxDate(null);
      setExposedVariable('maxDate', null);
    }
  }, [validation.maxDate]);

  useEffect(() => {
    const exposedVariables = {
      minDate: validation.minDate,
      maxDate: validation.maxDate,
      setMinDate: (date) => {
        const momentDate = moment(date, DISABLED_DATE_FORMAT);
        if (momentDate.isValid()) {
          setMinDate(momentDate.toDate());
          setExposedVariable('minDate', date);
        }
      },
      setMaxDate: (date) => {
        const momentDate = moment(date, DISABLED_DATE_FORMAT);
        if (momentDate.isValid()) {
          setMaxDate(momentDate.toDate());
          setExposedVariable('maxDate', date);
        }
      },
    };
    setExposedVariables(exposedVariables);

    isInitialRender.current = false;
  }, []);
  return { minDate, maxDate };
};

export default useDateInput;
