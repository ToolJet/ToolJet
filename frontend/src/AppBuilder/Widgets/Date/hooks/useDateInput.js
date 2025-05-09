import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';
<<<<<<< HEAD
import { DISABLED_DATE_FORMAT } from '../constants';

const useDateInput = ({ validation = {}, setExposedVariable, setExposedVariables }) => {
  const isInitialRender = useRef(true);
  const [excludedDates, setExcludedDates] = useState([]);

  const [minDate, setMinDate] = useState(
    (() => {
      const momentDate = moment(validation.minDate, DISABLED_DATE_FORMAT);
      const isDateValid = momentDate.isValid();
      return isDateValid ? momentDate.toDate() : null;
    })()
  );
  const [maxDate, setMaxDate] = useState(
    (() => {
      const momentDate = moment(validation.maxDate, DISABLED_DATE_FORMAT);
      const isDateValid = momentDate.isValid();
      return isDateValid ? momentDate.toDate() : null;
    })()
  );
  const [disabledDates, setDisabledDates] = useState(validation.disabledDates ?? []);

  const validationSetter = (date, type, setter) => {
    const momentDate = moment(date, DISABLED_DATE_FORMAT);
    const isDateValid = momentDate.isValid();
    setter(isDateValid ? momentDate.toDate() : null);
    setExposedVariable(type, isDateValid ? date : null);
  };

  useEffect(() => {
    if (isInitialRender.current) return;
    validationSetter(validation.minDate, 'minDate', setMinDate);
  }, [validation.minDate]);

  useEffect(() => {
    if (isInitialRender.current) return;
    validationSetter(validation.maxDate, 'maxDate', setMaxDate);
  }, [validation.maxDate]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setDisabledDates(validation.disabledDates);
  }, [validation.disabledDates]);

  useEffect(() => {
    const exposedVariables = {
      maxDate: (() => {
        const momentDate = moment(validation.maxDate, DISABLED_DATE_FORMAT);
        const isDateValid = momentDate.isValid();
        return isDateValid ? validation.maxDate : null;
      })(),
      minDate: (() => {
        const momentDate = moment(validation.minDate, DISABLED_DATE_FORMAT);
        const isDateValid = momentDate.isValid();
        return isDateValid ? validation.minDate : null;
      })(),
      setMinDate: (date) => {
        validationSetter(date, 'minDate', setMinDate);
      },
      setMaxDate: (date) => {
        validationSetter(date, 'maxDate', setMaxDate);
      },
      setDisabledDates: (dates) => {
        Array.isArray(dates) && setDisabledDates(dates);
      },
      clearDisabledDates: () => {
        setDisabledDates([]);
=======

const useDateInput = ({ validation = {}, dateFormat, setExposedVariable, setExposedVariables }) => {
  const isInitialRender = useRef(true);
  const { disabledDates } = validation;
  const [excludedDates, setExcludedDates] = useState([]);
  const [minDate, setMinDate] = useState(moment(validation.minDate, dateFormat).toDate());
  const [maxDate, setMaxDate] = useState(moment(validation.maxDate, dateFormat).toDate());

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
        setExcludedDates(dates);
      },
      clearDisabledDates: () => {
        setExcludedDates([]);
>>>>>>> main
      },
    };
    setExposedVariables(exposedVariables);

    isInitialRender.current = false;
<<<<<<< HEAD
  }, []);

  useEffect(() => {
    const _exluded = [];
    const excludedDateFormatted = [];
    Array.isArray(disabledDates) &&
      disabledDates?.map((item) => {
        if (moment(item, DISABLED_DATE_FORMAT).isValid()) {
          _exluded.push(moment(item, DISABLED_DATE_FORMAT).toDate());
          excludedDateFormatted.push(item);
        }
      });

    setExcludedDates(_exluded);
    setExposedVariable('disabledDates', excludedDateFormatted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledDates]);
=======
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledDates, dateFormat]);
>>>>>>> main

  return { minDate, maxDate, excludedDates };
};

export default useDateInput;
