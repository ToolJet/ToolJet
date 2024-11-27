import React, { useEffect } from 'react';
import moment from 'moment-timezone';
import cx from 'classnames';

const TimepickerInput = ({ currentTimestamp, isTwentyFourHourMode, darkMode, onTimeChange }) => {
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
                  'selected-time': selectedHour === hour || (!isTwentyFourHourMode && selectedHour - 12 === hour),
                })}
                onClick={() => {
                  onTimeChange(hour, 'hours');
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
                className={cx('time-item', { 'selected-time': selectedMinute === minute })}
                onClick={() => onTimeChange(minute, 'minutes')}
              >
                {String(minute).padStart(2, '0')}
              </div>
            ))}
          </div>
          {!isTwentyFourHourMode && (
            <div className={cx('time-col')}>
              <div
                className={cx('time-item', { 'selected-time': selectedAmPm === 'AM' })}
                onClick={() => {
                  const newHour = selectedHour >= 12 ? selectedHour - 12 : selectedHour;
                  console.log('newHour', newHour);
                  onTimeChange(newHour, 'hours');
                }}
              >
                AM
              </div>
              <div
                className={cx('time-item', { 'selected-time': selectedAmPm === 'PM' })}
                onClick={() => {
                  const newHour = selectedHour < 12 ? selectedHour + 12 : selectedHour;
                  console.log('newHour', newHour);
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
