import React from 'react';
import ReactDatePicker from 'react-datepicker';
import CustomDatePickerHeader from './CustomDatePickerHeader';
import cx from 'classnames';
import moment from 'moment';
import { getDate } from './utils';

export const Datepicker = ({ value, onChange, meta }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <div
      data-cy={meta.dataCy}
      className={cx('field flex-fill custom-inspector-validation-date-picker')}
      key={meta.property}
    >
      <label className="form-label">{meta.label}</label>
      <ReactDatePicker
<<<<<<< HEAD
        selected={getDate(value, 'MM/DD/YYYY')}
        onChange={(date) => {
          const val = moment(date).format('MM/DD/YYYY');
          onChange(val === 'Invalid date' ? '' : val);
        }}
=======
        selected={getDate(value, 'DD/MM/YYYY')}
        onChange={(date) => {
          const val = moment(date).format('DD/MM/YYYY');
          onChange(val === 'Invalid date' ? '' : val);
        }}
        dateFormat="dd/MM/yyyy"
>>>>>>> main
        showTimeSelectOnly={meta.showOnlyTime}
        className={cx({ 'theme-dark dark-theme': darkMode })}
        placeholderText={meta?.placeholder ?? ''}
        renderCustomHeader={(headerProps) => <CustomDatePickerHeader {...headerProps} />}
        popperClassName={cx('tj-table-datepicker', {
          'theme-dark dark-theme': darkMode,
        })}
        popperModifiers={[
          {
            name: 'flip',
            enabled: false,
          },
        ]}
        popperPlacement="bottom-start"
      />
    </div>
  );
};
