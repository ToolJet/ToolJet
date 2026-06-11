import React from 'react';
import { getDate } from './utils';
import moment from 'moment';
import ReactDatePicker from 'react-datepicker';
import cx from 'classnames';

export const TimePicker = ({ value, onChange, meta }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const headers = ['Hours', 'Minutes'];

  const onTimeChange = (time, type) => {
    let date = moment(value, 'HH:mm');
    if (!date.isValid()) {
      date = moment('00:00', 'HH:mm');
    }
    if (type === 'hours') {
      date.hours(time);
    } else {
      date.minutes(time);
    }
    onChange(date.format('HH:mm'));
  };

  const selectedTime = moment(value, 'HH:mm');
  const selectedHour = selectedTime.hours();
  const selectedMinute = selectedTime.minutes();

  return (
    <div className="field flex-fill custom-inspector-validation-time-picker" key={meta.property}>
      <label className="form-label">{meta.label}</label>
      <ReactDatePicker
        selected={getDate(value, 'HH:mm')}
        onChange={(date) => {
          const time = moment(date).format('HH:mm');
          if (time === 'Invalid date') {
            onChange(date);
          } else {
            onChange(time);
          }
        }}
        dateFormat="HH:mm"
        showTimeInput={true}
        showTimeSelectOnly={true}
        className={cx({ '.react-datepicker-time-component theme-dark dark-theme': darkMode })}
        placeholderText={meta?.placeholder ?? ''}
        popperClassName={cx('tj-table-datepicker custom-inspector-validation-time-picker-popper', {
          'theme-dark dark-theme': darkMode,
        })}
        popperModifiers={[
          {
            name: 'flip',
            enabled: false,
          },
        ]}
        customTimeInput={
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
                  {[...Array(24).keys()].map((hour) => (
                    <div
                      key={hour}
                      className={cx('time-item', {
                        'selected-time': selectedHour === hour,
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
                      className={cx('time-item', {
                        'selected-time': selectedMinute === minute,
                      })}
                      onClick={() => onTimeChange(minute, 'minutes')}
                    >
                      {String(minute).padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        }
        popperPlacement="bottom-start"
      />
    </div>
  );
};
