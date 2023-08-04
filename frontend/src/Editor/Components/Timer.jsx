import React, { useEffect, useMemo, useState } from 'react';

export const Timer = function Timer({ height, properties = {}, styles, setExposedVariable, fireEvent, dataCy }) {
  const getTimeObj = ({ HH, MM, SS, MS }) => {
    return {
      hour: isNaN(HH) ? 0 : parseInt(HH, 10),
      minute: !isNaN(MM) && MM <= 59 ? parseInt(MM, 10) : 0,
      second: !isNaN(SS) && SS <= 59 ? parseInt(SS, 10) : 0,
      mSecond: !isNaN(MS) && MS <= 999 ? parseInt(MS, 10) : 0,
    };
  };
  const getDefaultValue = useMemo(() => {
    const [HH, MM, SS, MS] = (properties.value && properties.value.split(':')) || [];
    return { HH, MM, SS, MS };
  }, [properties.value]);

  const [time, setTime] = useState(getTimeObj(getDefaultValue));
  const [state, setState] = useState('initial');
  const [intervalId, setIntervalId] = useState(0);

  const TimerType = {
    COUNTDOWN: 'countDown',
    COUNTUP: 'countUp',
  };

  useEffect(() => {
    if (
      properties.type === TimerType.COUNTDOWN &&
      time.mSecond === 0 &&
      time.second === 0 &&
      time.minute === 0 &&
      time.hour === 0
    ) {
      intervalId && clearInterval(intervalId);
      setState('initial');
      fireEvent('onCountDownFinish');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time]);

  useEffect(() => {
    intervalId && clearInterval(intervalId);
    setState('initial');
    setTime(getTimeObj(getDefaultValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.type, getDefaultValue]);

  useEffect(() => {
    return () => {
      intervalId && clearInterval(intervalId);
    };
  }, [intervalId]);

  const onReset = () => {
    intervalId && clearInterval(intervalId);
    setTime(getTimeObj(getDefaultValue));
    setExposedVariable('value', getTimeObj(getDefaultValue));
    fireEvent('onReset');
    setState('initial');
  };

  const onStart = (isResume) => {
    setIntervalId(
      setInterval(() => {
        setTime((previousTime) => {
          let HH = previousTime.hour,
            MM = previousTime.minute,
            SS = previousTime.second,
            MS = previousTime.mSecond;

          if (properties.type === TimerType.COUNTUP) {
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
          } else if (properties.type === TimerType.COUNTDOWN) {
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
          return getTimeObj({ HH, MM, SS, MS });
        });
      }, 15)
    );
    setExposedVariable('value', time);
    setState('running');
    fireEvent(isResume ? 'onResume' : 'onStart');
  };

  const onPause = () => {
    intervalId && clearInterval(intervalId);
    setExposedVariable('value', time);
    setState('paused');
    fireEvent('onPause');
  };

  const onResume = () => {
    onStart(true);
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

  const isCountDownFinished = () => {
    return time.hour === 0 && time.minute === 0 && time.second === 0 && time.mSecond === 0;
  };

  const isStartDisabled = () => {
    return properties.type === TimerType.COUNTDOWN && isCountDownFinished();
  };

  return (
    <div
      className="card"
      style={{ height, display: styles.visibility ? '' : 'none', boxShadow: styles.boxShadow }}
      data-cy={dataCy}
    >
      <div className="timer-wrapper">
        <div className="counter-container">
          {`${prependZero(time.hour)}:${prependZero(time.minute)}:${prependZero(time.second)}:${prependZero(
            time.mSecond,
            2
          )}`}
        </div>
        <div className="btn-list justify-content-end">
          {state === 'initial' && (
            <a
              className={`btn btn-primary${styles.disabledState || isStartDisabled() ? ' disabled' : ''}`}
              onClick={() => onStart()}
            >
              Start
            </a>
          )}
          {state === 'running' && (
            <a
              className={`btn btn-outline-primary${styles.disabledState ? ' disabled' : ''}`}
              onClick={onPause}
            >
              Pause
            </a>
          )}
          {state === 'paused' && (
            <a
              className={`btn btn-outline-primary${styles.disabledState ? ' disabled' : ''}`}
              onClick={onResume}
            >
              Resume
            </a>
          )}
          <a
            className={`btn${styles.disabledState ? ' disabled' : ''}`}
            onClick={onReset}
          >
            Reset
          </a>
        </div>
      </div>
    </div>
  );
};
