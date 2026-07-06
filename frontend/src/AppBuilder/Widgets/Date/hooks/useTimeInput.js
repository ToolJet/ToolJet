import { useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import '@/AppBuilder/_engine/contractGroups/dateFamily';

const useTimeInput = ({
  id,
  componentType,
  moduleId,
  resolveIndex,
  validation = {},
  timeFormat,
  setExposedVariable,
  setExposedVariables,
}) => {
  const isInitialRender = useRef(true);
  const [minTime, setMinTime] = useState(validation.minTime);
  const [maxTime, setMaxTime] = useState(validation.maxTime);

  const { registerEffects } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
  });

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

  // Bucket C: setMinTime/setMaxTime mutate local state, mirroring old.
  useEffect(() => {
    return registerEffects({
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
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFormat]);

  useEffect(() => {
    setExposedVariables({
      minTime: validation.minTime,
      maxTime: validation.maxTime,
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFormat]);

  return { minTime, maxTime };
};

export default useTimeInput;
