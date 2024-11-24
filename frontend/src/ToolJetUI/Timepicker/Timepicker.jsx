import React from 'react';
// eslint-disable-next-line import/no-unresolved
import DatePickerComponent from 'react-datepicker';
import './timepicker.scss';
import cx from 'classnames';

const Timepicker = ({
  timeFormat,
  onChange,
  selected,
  maxTime,
  minTime,
  darkMode,
  isInspectorField = false,
  ...props
}) => {
  return (
    <div className="tj-timepicker">
      <DatePickerComponent
        {...props}
        selected={selected}
        onChange={onChange}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={15}
        timeCaption="Time"
        dateFormat={timeFormat}
        maxTime={maxTime}
        timeFormat={timeFormat}
        minTime={minTime}
        timeInputLabel=""
        popperClassName={cx('tj-timepicker-popper', {
          'theme-dark dark-theme': darkMode,
          'tj-table-datepicker': !isInspectorField,
          'tj-inspector-timepicker': isInspectorField,
        })}
      />
    </div>
  );
};

export default Timepicker;
