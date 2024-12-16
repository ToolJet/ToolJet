import { useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';
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
  }, [validation.minTime]);

  useEffect(() => {
    if (isInitialRender.current) return;
    validationSetter(validation.maxTime, 'maxTime', setMaxTime);
  }, [validation.maxTime]);

  useEffect(() => {
    const exposedVariables = {
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
      },
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  return { minTime, maxTime };
};

export default useTimeInput;
