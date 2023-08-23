/* eslint-disable import/no-unresolved */
import React from 'react';
import PropTypes from 'prop-types';
import './styles.scss';

import { DateRangePicker } from '@wojtekmaj/react-daterange-picker';
import { DateTimeRangePicker } from '@wojtekmaj/react-datetimerange-picker';
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css';

import '@wojtekmaj/react-datetimerange-picker/dist/DateTimeRangePicker.css';
import 'react-clock/dist/Clock.css';
import moment from 'moment';

const Type = Object.freeze({
  DATE: 'date',
  DATETIME: 'datetime',
});

const DateRangePickerComponent = ({
  dateRange = [],
  onChange,
  showCalenderIcon = false,
  showClearIcon = null,
  autoFocus = false,
  classNames,
  rangeDivider = '>',
  disableCalendar = false,
  required = false,
  dataCy = '',
  maxDate = null,
  minDate = null,
  type = 'date',
  customLabel = null,
  format = null,
}) => {
  const RenderCalendarIcon = () => {
    if (!showCalenderIcon) return null;
    return (
      <svg
        width="12"
        height="14"
        viewBox="0 0 12 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M3.83333 0.813959C3.83333 0.547798 3.60948 0.332031 3.33333 0.332031C3.05719 0.332031 2.83333 0.547798 2.83333 0.813959V1.77781H2.66667C1.19391 1.77781 0 2.92857 0 4.3481V4.83002H12V4.3481C12 2.92857 10.8061 1.77781 9.33333 1.77781H9.16667V0.813959C9.16667 0.547798 8.94281 0.332031 8.66667 0.332031C8.39052 0.332031 8.16667 0.547798 8.16667 0.813959V1.77781H3.83333V0.813959ZM0 5.79388H12V11.0951C12 12.5146 10.8061 13.6654 9.33333 13.6654H2.66667C1.19391 13.6654 0 12.5146 0 11.0951V5.79388Z"
          fill="#C1C8CD"
        />
      </svg>
    );
  };

  const ElementToRender = type === Type.DATE ? DateRangePicker : DateTimeRangePicker;
  const defaultFormat = type === Type.DATE ? 'dd/MM/yyyy' : 'dd/MM/yyyy hh:mm a';

  return (
    <>
      <div className="mb-1">
        {!customLabel ? <span>{type === Type.DATE ? 'Date' : 'Date & Time'} Range Picker</span> : <>{customLabel}</>}
      </div>
      <ElementToRender
        data-testid={dataCy}
        openCalendarOnFocus={true}
        value={dateRange}
        onChange={onChange}
        calendarIcon={RenderCalendarIcon}
        clearIcon={showClearIcon ? 'x' : null}
        autoFocus={autoFocus}
        className={classNames}
        rangeDivider={rangeDivider}
        disableCalendar={disableCalendar}
        required={required}
        maxDate={maxDate}
        minDate={minDate}
        disableClock={true}
        shouldCloseCalendar={({ reason }) => reason === 'outsideAction'}
        format={format || defaultFormat}
      />
    </>
  );
};

const setMaxDate = (date, range, timeUnit) => moment(date).add(range, timeUnit).toDate();
const setMinDate = (date, range, timeUnit) => moment(date).subtract(range, timeUnit).toDate();

DateRangePickerComponent.setMaxDate = setMaxDate; // Static method to set max date
DateRangePickerComponent.setMinDate = setMinDate; // Static method to set min date

DateRangePickerComponent.propTypes = {
  dateRange: PropTypes.arrayOf(PropTypes.instanceOf(Date)), // Array of Date instances
  onChange: PropTypes.func.isRequired, // Required function prop
  showCalenderIcon: PropTypes.bool,
  showClearIcon: PropTypes.bool,
  autoFocus: PropTypes.bool,
  classNames: PropTypes.string,
  rangeDivider: PropTypes.string,
  disableCalendar: PropTypes.bool,
  required: PropTypes.bool,
  dataCy: PropTypes.string,
  maxDate: PropTypes.instanceOf(Date), // Date instance
  minDate: PropTypes.instanceOf(Date), // Date instance
  type: PropTypes.oneOf(['date', 'dateTime']), // One of the specified values
  CustomLabel: PropTypes.element,
  format: PropTypes.string,
};

export default DateRangePickerComponent;
