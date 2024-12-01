import { useEffect, useRef, useState } from 'react';

const useTimeInput = ({ validation, setExposedVariable, setExposedVariables }) => {
  const isInitialRender = useRef(true);
  const [minTime, setMinTime] = useState(validation.minTime);
  const [maxTime, setMaxTime] = useState(validation.maxTime);

  useEffect(() => {
    if (isInitialRender.current) return;
    setMinTime(validation.minTime);
    setExposedVariable('minTime', validation.minTime);
  }, [validation.minTime]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setMaxTime(validation.maxTime);
    setExposedVariable('maxTime', validation.maxTime);
  }, [validation.maxTime]);

  useEffect(() => {
    const exposedVariables = {
      minTime: validation.minTime,
      maxTime: validation.maxTime,
      setMinTime: (time) => {
        setMinTime(time);
        setExposedVariable('minTime', time);
      },
      setMaxTime: (time) => {
        setMaxTime(time);
        setExposedVariable('maxTime', time);
      },
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  return { minTime, maxTime };
};

export default useTimeInput;
