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

  // Convert 24-hour format to 12-hour display format
  const get12HourDisplay = (hour24) => {
    if (hour24 === 0) return 12; // 0 (midnight) -> 12 AM
    if (hour24 <= 12) return hour24; // 1-12 -> 1-12
    return hour24 - 12; // 13-23 -> 1-11
  };

  // Get display hour for current selection
  const selectedHourDisplay = !isTwentyFourHourMode ? get12HourDisplay(selectedHour) : selectedHour;

  let minHour = 0;
  let minMinute = 0;
  if (minTime) {
    if (typeof minTime === 'string') {
      [minHour, minMinute] = minTime.split(':');
    } else if (typeof minTime === 'object') {
      minHour = minTime.getHours();
      minMinute = minTime.getMinutes();
    }
  }

  let maxHour = 23;
  let maxMinute = 59;
  if (maxTime) {
    if (typeof maxTime === 'string') {
      [maxHour, maxMinute] = maxTime.split(':');
    } else if (typeof maxTime === 'object') {
      maxHour = maxTime.getHours();
      maxMinute = maxTime.getMinutes();
    }
  }

  // Convert 12-hour display to 24-hour format
  const convertTo24Hour = (hour12, isPM) => {
    if (hour12 === 12) {
      return isPM ? 12 : 0; // 12 PM = 12, 12 AM = 0
    }
    return isPM ? hour12 + 12 : hour12; // 1-11 PM = 13-23, 1-11 AM = 1-11
  };

  return (
    <div className={cx('custom-time-input ')}>
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
            {isTwentyFourHourMode
              ? [...Array(24).keys()].map((hour) => (
                  <div
                    key={hour}
                    className={cx('time-item', {
                      'selected-time': selectedHour === hour,
                      'disabled-time': hour < minHour || hour > maxHour,
                    })}
                    onClick={() => {
                      onTimeChange(hour, 'hours');
                    }}
                  >
                    {String(hour).padStart(2, '0')}
                  </div>
                ))
              : [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour12) => {
                  const hour24 = convertTo24Hour(hour12, selectedAmPm === 'PM');
                  return (
                    <div
                      key={hour12}
                      className={cx('time-item', {
                        'selected-time': selectedHourDisplay === hour12,
                        'disabled-time': hour24 < minHour || hour24 > maxHour,
                      })}
                      onClick={() => {
                        onTimeChange(hour24, 'hours');
                      }}
                    >
                      {String(hour12).padStart(2, '0')}
                    </div>
                  );
                })}
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
                  // Convert current hour to AM
                  const hour12 = get12HourDisplay(selectedHour);
                  const newHour24 = convertTo24Hour(hour12, false); // false = AM
                  onTimeChange(newHour24, 'hours');
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
                  // Convert current hour to PM
                  const hour12 = get12HourDisplay(selectedHour);
                  const newHour24 = convertTo24Hour(hour12, true); // true = PM
                  onTimeChange(newHour24, 'hours');
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
