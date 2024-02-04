import React, { useRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import { CustomInputComponent } from './CustomInput';
import { CustomDatePickerHeader } from './RenderCustomHeader';
import './datepicker.scss';

export const DatePickerUI = ({
  value,
  onChange,
  calendarIcon = true,
  popperClassname = '',
  showMonthDropdown = true,
  showYearDropdown = true,
  datepickerinputStyles = {},
  ...restProps
}) => {
  const datePickerRef = useRef(null);
  return (
    <ReactDatePicker
      value={value}
      onChange={(date) => onChange(date)}
      calendarIcon={calendarIcon}
      popperClassName={popperClassname}
      showMonthDropdown={showMonthDropdown}
      showYearDropdown={showYearDropdown}
      {...restProps}
      customInput={<CustomInputComponent ref={datePickerRef} styles={datepickerinputStyles} />}
      renderCustomHeader={(headerProps) => <CustomDatePickerHeader {...headerProps} />}
    />
  );
};
