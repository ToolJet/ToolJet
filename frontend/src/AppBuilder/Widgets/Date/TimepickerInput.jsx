import React, { useEffect } from 'react';
import moment from 'moment-timezone';
import cx from 'classnames';

const TimepickerInput = ({ currentTimestamp, isTwentyFourHourMode, darkMode, onTimeChange, minTime, maxTime }) => {
  const [headers, setHeaders] = React.useState(['Hours', 'Minutes']);
  useEffect(() => {
    if (!isTwentyFourHourMode) {
      setHeaders(['Hours', 'Minutes', 'am/pm']);
    }
  }, [isTwentyFourHourMode]);

  const momentObj = currentTimestamp ? moment(currentTimestamp) : null;
  const selectedHour = momentObj?.hour() || 0;
  const selectedMinute = momentObj?.minute() || 0;
  const selectedAmPm = selectedHour >= 12 ? 'PM' : 'AM';

  const [minHour, minMinute] = minTime && typeof minTime === 'string' ? minTime.split(':') : [0, 0];
  const [maxHour, maxMinute] = maxTime && typeof maxTime === 'string' ? maxTime.split(':') : [23, 59];

  const addHours = (time) => {
    if (!isTwentyFourHourMode && selectedAmPm === 'PM') {
      return time + 12;
    }
    return time;
  };

  return (
    <div className={cx('custom-time-input ', { 'dark-time-input': darkMode })}>
      <div className={cx('d-flex')}>
        {headers.map((header) => (
          <span key={header} className={cx('time-header')}>
            {header}
          </span>
        ))}
      </div>
      <div className={cx('d-block')}>
        <div className={cx('d-flex time-input-body')}>
          <div className={cx('time-col')}>
            {[...Array(isTwentyFourHourMode ? 24 : 12).keys()].map((hour) => (
              <div
                key={hour}
                className={cx('time-item', {
                  'selected-time': selectedHour == hour || (!isTwentyFourHourMode && selectedHour - 12 == hour),
                  'disabled-time': addHours(hour) < minHour || addHours(hour) > maxHour,
                })}
                onClick={() => {
                  onTimeChange(addHours(hour), 'hours');
                }}
              >
                {String(hour).padStart(2, '0')}
              </div>
            ))}
          </div>
          <div className={cx('time-col')}>
            {[...Array(60).keys()].map((minute) => (
              <div
                key={minute}
                className={cx('time-item', {
                  'selected-time': selectedMinute === minute,
                  'disabled-time':
                    selectedHour < minHour ||
                    selectedHour > maxHour ||
                    (selectedHour == minHour && minute < minMinute) ||
                    (selectedHour == maxHour && minute > maxMinute),
                })}
                onClick={() => onTimeChange(minute, 'minutes')}
              >
                {String(minute).padStart(2, '0')}
              </div>
            ))}
          </div>
          {!isTwentyFourHourMode && (
            <div className={cx('time-col')}>
              <div
                className={cx('time-item', {
                  'selected-time': selectedAmPm === 'AM',
                  'disabled-time': minHour > 11,
                })}
                onClick={() => {
                  const newHour = selectedHour >= 12 ? selectedHour - 12 : selectedHour;
                  onTimeChange(newHour, 'hours');
                }}
              >
                AM
              </div>
              <div
                className={cx('time-item', {
                  'selected-time': selectedAmPm === 'PM',
                  'disabled-time': maxHour < 12,
                })}
                onClick={() => {
                  const newHour = selectedHour < 12 ? selectedHour + 12 : selectedHour;
                  onTimeChange(newHour, 'hours');
                }}
              >
                PM
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimepickerInput;
