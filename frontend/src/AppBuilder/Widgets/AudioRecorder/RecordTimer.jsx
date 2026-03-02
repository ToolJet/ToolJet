import React, { useState, useEffect, memo } from 'react';
import { formatSecondsToHHMMSS } from '@/AppBuilder/_stores/utils';

function RecordTimer({ isRunning }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  return formatSecondsToHHMMSS(seconds);
}

export default memo(RecordTimer);
