import React from 'react';
// eslint-disable-next-line import/no-unresolved
import DatePickerComponent from 'react-datepicker';
import './timepicker.scss';

const Timepicker = ({ timeFormat, onChange, selected, maxTime, minTime, ...props }) => {
  return (
    <div>
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
        className="tj-timepicker"
      />
    </div>
  );
};

export default Timepicker;
