import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';

const useDateInput = ({ validation = {}, dateFormat, setExposedVariable, setExposedVariables }) => {
  const isInitialRender = useRef(true);
  const { disabledDates } = validation;
  const [excludedDates, setExcludedDates] = useState([]);
  const [minDate, setMinDate] = useState(moment(validation.minDate, dateFormat).toDate());
  const [maxDate, setMaxDate] = useState(moment(validation.maxDate, dateFormat).toDate());
  console.log('This is the excludedDates ', excludedDates);
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
