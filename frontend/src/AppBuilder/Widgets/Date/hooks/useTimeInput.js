import { useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';
import useStore from '@/AppBuilder/_stores/store';
import { getUsableTimeBounds } from '../utils';

const useTimeInput = ({ validation = {}, timeFormat, setExposedVariable, setExposedVariables, componentName, id }) => {
  const isInitialRender = useRef(true);
  const initialBounds = getUsableTimeBounds(validation.minTime, validation.maxTime, timeFormat);
  const [minTime, setMinTime] = useState(initialBounds.minTime);
  const [maxTime, setMaxTime] = useState(initialBounds.maxTime);

  useEffect(() => {
    const bounds = getUsableTimeBounds(validation.minTime, validation.maxTime, timeFormat);
    setMinTime(bounds.minTime);
    setMaxTime(bounds.maxTime);
    // Expose the values as written/resolved, even when invalid (the mount
    // effect below owns the initial exposure).
    if (!isInitialRender.current) {
      setExposedVariables({ minTime: validation.minTime ?? null, maxTime: validation.maxTime ?? null });
    }
    // Ignored bounds are reported on mount as well — a saved app with a bad
    // bound must say so in the debugger without requiring an edit first.
    if (bounds.conflict || bounds.invalidMin || bounds.invalidMax) {
      const problems = [];
      if (bounds.invalidMin) problems.push(`Min time '${validation.minTime}' does not match the format`);
      if (bounds.invalidMax) problems.push(`Max time '${validation.maxTime}' does not match the format`);
      if (bounds.conflict)
        problems.push(`Min time '${validation.minTime}' is after max time '${validation.maxTime}' — both ignored`);
      useStore.getState().debugger.log({
        page: useStore.getState().getCurrentPageId('canvas'),
        type: 'component',
        kind: 'component',
        key: componentName,
        componentId: id,
        strace: 'page_level',
        message: `${problems.join('. ')}. The bound(s) are ignored for validation and the time dropdown.`,
        status: true,
        error: { minTime: validation.minTime, maxTime: validation.maxTime },
        errorTarget: 'Component Property',
        logLevel: 'error',
        timestamp: moment().toISOString(),
      });
    }
  }, [validation.minTime, validation.maxTime, timeFormat]);

  useEffect(() => {
    const exposedVariables = {
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
      },
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, [timeFormat]);

  return { minTime, maxTime };
};

export default useTimeInput;
