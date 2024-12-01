import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';
import { DISABLED_DATE_FORMAT } from '../constants';

const useDateInput = ({ validation, setExposedVariable, setExposedVariables }) => {
  const isInitialRender = useRef(true);
  const { disabledDates } = validation;
  const [excludedDates, setExcludedDates] = useState([]);
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
      setDisabledDates: (dates) => {
        setExcludedDates(dates);
      },
      clearDisabledDates: () => {
        setExcludedDates([]);
      },
    };
    setExposedVariables(exposedVariables);

    isInitialRender.current = false;
  }, []);

  useEffect(() => {
    if (Array.isArray(disabledDates) && disabledDates.length > 0) {
      const _exluded = [];
      disabledDates?.map((item) => {
        if (moment(item, DISABLED_DATE_FORMAT).isValid()) {
          _exluded.push(moment(item, DISABLED_DATE_FORMAT).toDate());
        }
      });

      setExcludedDates(_exluded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledDates]);

  return { minDate, maxDate, excludedDates };
};

export default useDateInput;
