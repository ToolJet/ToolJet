import { useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';
<<<<<<< HEAD
import { DISABLED_TIME_FORMAT } from '../constants';

const useTimeInput = ({ validation = {}, setExposedVariable, setExposedVariables }) => {
  const isInitialRender = useRef(true);
  const [minTime, setMinTime] = useState(
    (() => {
      const momentTime = moment(validation.minTime, DISABLED_TIME_FORMAT);
      const isTimeValid = momentTime.isValid();
      return isTimeValid ? momentTime.toDate() : null;
    })()
  );
  const [maxTime, setMaxTime] = useState(
    (() => {
      const momentTime = moment(validation.maxTime, DISABLED_TIME_FORMAT);
      const isTimeValid = momentTime.isValid();
      return isTimeValid ? momentTime.toDate() : null;
    })()
  );
  const validationSetter = (date, type, setter) => {
    const momentTime = moment(date, DISABLED_TIME_FORMAT);
    const isTimeValid = momentTime.isValid();
    setter(isTimeValid ? momentTime.toDate() : null);
    setExposedVariable(type, isTimeValid ? date : null);
  };
  useEffect(() => {
    if (isInitialRender.current) return;
    validationSetter(validation.minTime, 'minTime', setMinTime);
=======

const useTimeInput = ({ validation = {}, timeFormat, setExposedVariable, setExposedVariables }) => {
  const isInitialRender = useRef(true);
  const [minTime, setMinTime] = useState(validation.minTime);
  const [maxTime, setMaxTime] = useState(validation.maxTime);

  useEffect(() => {
    if (isInitialRender.current) return;
    setMinTime(validation.minTime);
    setExposedVariable('minTime', validation.minTime);
>>>>>>> main
  }, [validation.minTime]);

  useEffect(() => {
    if (isInitialRender.current) return;
<<<<<<< HEAD
    validationSetter(validation.maxTime, 'maxTime', setMaxTime);
=======
    setMaxTime(validation.maxTime);
    setExposedVariable('maxTime', validation.maxTime);
>>>>>>> main
  }, [validation.maxTime]);

  useEffect(() => {
    const exposedVariables = {
<<<<<<< HEAD
      minTime: (() => {
        const momentTime = moment(validation.minTime, DISABLED_TIME_FORMAT);
        const isTimeValid = momentTime.isValid();
        return isTimeValid ? validation.minTime : null;
      })(),
      maxTime: (() => {
        const momentTime = moment(validation.maxTime, DISABLED_TIME_FORMAT);
        const isTimeValid = momentTime.isValid();
        return isTimeValid ? validation.maxTime : null;
      })(),
      setMinTime: (time) => {
        validationSetter(time, 'minTime', setMinTime);
      },
      setMaxTime: (time) => {
        validationSetter(time, 'maxTime', setMaxTime);
=======
      minTime: validation.minTime,
      maxTime: validation.maxTime,
      setMinTime: (time) => {
        const momentTime = moment(time, timeFormat);
        if (momentTime.isValid()) {
          setMinTime(time);
          setExposedVariable('minTime', time);
        }
      },
      setMaxTime: (time) => {
        const momentTime = moment(time, timeFormat);
        if (momentTime.isValid()) {
          setMaxTime(time);
          setExposedVariable('maxTime', time);
        }
>>>>>>> main
      },
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
<<<<<<< HEAD
  }, []);
=======
  }, [timeFormat]);
>>>>>>> main

  return { minTime, maxTime };
};

export default useTimeInput;
