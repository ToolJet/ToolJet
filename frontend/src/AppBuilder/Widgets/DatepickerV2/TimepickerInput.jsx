import React, { useEffect } from 'react';
import cx from 'classnames';
const TimepickerInput = ({ currentDate, isTwentyFourHourMode, darkMode }) => {
  const [headers, setHeaders] = React.useState(['Hours', 'Minutes']);
  useEffect(() => {
    if (!isTwentyFourHourMode) {
      setHeaders(['Hours', 'Minutes', 'am/pm']);
    }
  }, [isTwentyFourHourMode]);

  const selectedHour = currentDate.getHours();
  const selectedMinute = currentDate.getMinutes();
  const selectedAmPm = currentDate.getHours() >= 12 ? 'PM' : 'AM';

  return (
    <div className={cx('custom-time-input', { 'dark-time-input': darkMode })}>
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
                  'selected-time': selectedHour === hour,
                })}
              >
                {String(hour).padStart(2, '0')}
              </div>
            ))}
          </div>
          <div className={cx('time-col')}>
            {[...Array(60).keys()].map((minute) => (
              <div key={minute} className={cx('time-item', { 'selected-time': selectedMinute === minute })}>
                {String(minute).padStart(2, '0')}
              </div>
            ))}
          </div>
          {!isTwentyFourHourMode && (
            <div className={cx('time-col')}>
              <div className={cx('time-item', { 'selected-time': selectedAmPm === 'AM' })}>AM</div>
              <div className={cx('time-item', { 'selected-time': selectedAmPm === 'PM' })}>PM</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimepickerInput;
