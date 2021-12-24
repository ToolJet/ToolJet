import React, { useEffect, useState } from 'react';

export const Timer = function Timer({ height, properties = {}, styles, setExposedVariable, fireEvent }) {
  const getTimeObj = (HH, MM, SS, MS) => {
    return {
      hour: isNaN(HH) ? 0 : HH,
      minute: !isNaN(MM) && MM <= 59 ? MM : 0,
      second: !isNaN(SS) && SS <= 59 ? SS : 0,
      mSecond: !isNaN(MS) && MS <= 999 ? MS : 0,
    };
  };
  const [HH, MM, SS, MS] = (properties.value && properties.value.split(':')) || [];
  const [time, setTime] = useState(getTimeObj(HH, MM, SS, MS));
  const [state, setState] = useState('initial');
  const [intervalId, setIntervalId] = useState(0);

  useEffect(() => {
    return () => {
      intervalId && clearInterval(intervalId);
    };
  }, [intervalId]);

  useEffect(() => {
    setExposedVariable('value', time);
    if (
      properties.type === 'countDown' &&
      time.mSecond === 0 &&
      time.second === 0 &&
      time.minute === 0 &&
      time.hour === 0
    ) {
      setState('initial');
      fireEvent('onCountDownFinish');
    }
  }, [time, properties.type, fireEvent, setExposedVariable]);

  useEffect(() => {
    const [HH, MM, SS, MS] = (properties.value && properties.value.split(':')) || [];
    setTime(getTimeObj(HH, MM, SS, MS));
  }, [properties.value]);

  const onReset = () => {
    intervalId && clearInterval(intervalId);
    setTime(getTimeObj());
    fireEvent('onReset');
    setState('initial');
  };

  const onStart = () => {
    setIntervalId(
      setInterval(() => {
        setTime((previousTime) => {
          let HH = previousTime.hour,
            MM = previousTime.minute,
            SS = previousTime.second,
            MS = previousTime.mSecond;

          if (properties.type === 'countUp') {
            MS = MS + 15;
            if (MS >= 1000) {
              MS = MS - 1000;
              SS++;

              if (SS >= 60) {
                SS = SS - 60;
                MM++;

                if (MM >= 60) {
                  MM = MM - 60;
                  HH++;
                }
              }
            }
          } else if (properties.type === 'countDown') {
            MS = MS - 15;
            if (MS < 0) {
              MS = MS + 1000;
              SS--;

              if (SS < 0) {
                SS = SS + 60;
                MM--;

                if (MM < 0) {
                  MM = MM + 60;
                  HH--;

                  if (HH < 0) {
                    (MS = 0), (SS = 0), (MM = 0), (HH = 0);
                  }
                }
              }
            }
          }
          return getTimeObj(HH, MM, SS, MS);
        });
      }),
      15
    );
    setState('running');
    fireEvent('onStart');
  };

  const onPause = () => {
    intervalId && clearInterval(intervalId);
    setState('paused');
    fireEvent('onPause');
  };

  const onResume = () => {
    onStart();
    setState('running');
    fireEvent('onResume');
  };

  const prependZero = (value, count = 1) => {
    if (!value) {
      return count === 2 ? '000' : '00';
    }
    if (count === 2) {
      return `${value.toString().length === 1 ? `00${value}` : value.toString().length === 2 ? `0${value}` : value}`;
    } else {
      return `${value.toString().length === 1 ? `0${value}` : value}`;
    }
  };
  return (
    <div className="card" style={{ height, display: styles.visibility ? '' : 'none' }}>
      <div className="timer-wrapper">
        <div className="counter-container">
          {`${prependZero(time.hour)}:${prependZero(time.minute)}:${prependZero(time.second)}:${prependZero(
            time.mSecond,
            2
          )}`}
        </div>
        <div className="btn-list justify-content-end">
          {state === 'initial' && (
            <a className="btn btn-primary" onClick={onStart}>
              Start
            </a>
          )}
          {state === 'running' && (
            <a className="btn btn-outline-primary" onClick={onPause}>
              Pause
            </a>
          )}
          {state === 'paused' && (
            <a className="btn btn-outline-primary" onClick={onResume}>
              Resume
            </a>
          )}
          <a className="btn" onClick={onReset}>
            Reset
          </a>
        </div>
      </div>
    </div>
  );
};
