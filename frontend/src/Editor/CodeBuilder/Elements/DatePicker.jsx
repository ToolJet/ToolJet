import React from 'react';
import { DatePickerUI } from '@/_ui/TJDatepicker/DatePicker';
import moment from 'moment';
export const DatePicker = ({ value, onChange, meta }) => {
  const showDate = ['Minimum date', 'Maximum date'].includes(meta.displayName);
  const showTimeSelect = ['Minimum time', 'Maximum time'].includes(meta.displayName);
  const dateFormat = showTimeSelect ? 'h:mm aa' : 'DD/MM/YYYY';
  const darkMode = localStorage.getItem('darkMode');
  const computeDateString = (date) => {
    date = date ? date : new Date();
    if (showDate) {
      return moment(date).format(dateFormat);
    }

    if (showTimeSelect) {
      return moment(date).format('HH:mm');
    }
  };

  const handleChange = (value) => {
    onChange(value);
  };

  return (
    <DatePickerUI
      value={computeDateString(value)}
      onChange={(date) => handleChange(date)}
      showTimeSelectOnly={showTimeSelect}
      dateFormat={dateFormat}
      showTimeSelect={showTimeSelect}
      className={`input-field form-control tj-text-input-widget   validation-without-icon px-2 ${
        darkMode ? 'bg-dark color-white' : 'bg-light'
      }`}
      popperClassName="tj-datepicker-widget"
    />
  );
};
