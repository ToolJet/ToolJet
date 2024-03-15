import React, { forwardRef, useEffect, useRef } from 'react';
import moment from 'moment-timezone';
import DatePickerComponent from 'react-datepicker';
import CustomDatePickerHeader from './CustomDatePickerHeader';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker.scss';
import classNames from 'classnames';

const DISABLED_DATE_FORMAT = 'MM/DD/YYYY';

const TjDatepicker = forwardRef(({ value, onClick, styles, dateInputRef, readOnly }, ref) => {
  return (
    <input
      onBlur={(e) => {
        e.stopPropagation();
      }}
      className={classNames('table-column-datepicker-input', {
        'pointer-events-none': readOnly,
      })}
      value={value}
      onClick={onClick}
      ref={dateInputRef}
      style={styles}
    ></input>
  );
});

export const getDateTimeFormat = (dateDisplayFormat, isTimeChecked, isTwentyFourHrFormatEnabled) => {
  const timeFormat = isTwentyFourHrFormatEnabled ? 'HH:mm' : 'LT';
  return isTimeChecked ? `${dateDisplayFormat} ${timeFormat}` : dateDisplayFormat;
};

const getDate = ({
  value,
  parseDateFormat,
  timeZoneValue,
  timeZoneDisplay,
  unixTimestamp,
  parseInUnixTimestamp,
  isTimeChecked,
}) => {
  let momentObj = null;
  if (value) {
    if (parseInUnixTimestamp && unixTimestamp) {
      momentObj = moment.tz(value, unixTimestamp);
    } else if (isTimeChecked && timeZoneValue && timeZoneDisplay) {
      momentObj = moment.tz(value, parseDateFormat, timeZoneValue).tz(timeZoneDisplay);
    } else {
      momentObj = moment(value, parseDateFormat);
    }
  }
  return momentObj?.isValid() ? momentObj.toDate() : null;
};

export const Datepicker = function Datepicker({
  value,
  onChange,
  readOnly,
  isTimeChecked,
  tableRef,
  dateDisplayFormat, //?Display date format
  parseDateFormat, //?Parse date format
  timeZoneValue,
  timeZoneDisplay,
  isDateSelectionEnabled,
  isTwentyFourHrFormatEnabled,
  disabledDates,
  unixTimestamp,
  parseInUnixTimestamp,
  cellStyles,
}) {
  const [date, setDate] = React.useState(null);
  const [excludedDates, setExcludedDates] = React.useState([]);
  const pickerRef = React.useRef();

  const handleDateChange = (date) => {
    setDate(
      getDate({
        value: date,
        parseDateFormat: getDateTimeFormat(parseDateFormat, isTimeChecked, isTwentyFourHrFormatEnabled),
      })
    );
    onChange(computeDateString(date));
  };

  useEffect(() => {
    const date = getDate({
      value,
      parseDateFormat: getDateTimeFormat(parseDateFormat, isTimeChecked, isTwentyFourHrFormatEnabled),
      dateDisplayFormat,
      timeZoneValue,
      timeZoneDisplay,
      unixTimestamp,
      parseInUnixTimestamp,
    });
    setDate(date);
  }, [
    JSON.stringify(
      value,
      parseDateFormat,
      dateDisplayFormat,
      timeZoneValue,
      timeZoneDisplay,
      unixTimestamp,
      isTimeChecked,
      isTwentyFourHrFormatEnabled
    ),
  ]);

  const dateInputRef = useRef(null); // Create a ref
  const computeDateString = (date) => {
    const _date = getDate({
      value: date,
      parseDateFormat,
      dateDisplayFormat,
      timeZoneValue,
      timeZoneDisplay,
      unixTimestamp,
      parseInUnixTimestamp,
    });
    const timeFormat = isTwentyFourHrFormatEnabled ? 'HH:mm' : 'LT';
    const selectedDateFormat = isTimeChecked ? `${dateDisplayFormat} ${timeFormat}` : dateDisplayFormat;
    if (isDateSelectionEnabled) {
      return moment(_date).format(selectedDateFormat);
    }

    if (!isDateSelectionEnabled && isTimeChecked) {
      return moment(_date).format(timeFormat);
    }
  };

  useEffect(() => {
    if (Array.isArray(disabledDates) && disabledDates.length > 0) {
      const _exluded = [];
      disabledDates?.map((item) => {
        if (moment(item, DISABLED_DATE_FORMAT).isValid()) {
          _exluded.push(moment(item, DISABLED_DATE_FORMAT).toDate());
        }
      });
      setExcludedDates(_exluded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledDates]);

  return (
    <div ref={pickerRef}>
      <DatePickerComponent
        className={`input-field form-control tj-text-input-widget validation-without-icon px-2`}
        popperClassName={`tj-datepicker-widget`}
        selected={date}
        onChange={(date) => handleDateChange(date)}
        value={date !== null ? computeDateString(date) : 'Invalid date'}
        dateFormat={dateDisplayFormat}
        customInput={
          <TjDatepicker dateInputRef={dateInputRef} readOnly={readOnly} styles={{ color: cellStyles.color }} />
        }
        timeFormat={'HH:mm'}
        showTimeSelect={isTimeChecked}
        showTimeSelectOnly={!isDateSelectionEnabled && isTimeChecked}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        excludeDates={excludedDates}
        showPopperArrow={false}
        renderCustomHeader={(headerProps) => <CustomDatePickerHeader {...headerProps} />}
        shouldCloseOnSelect
        readOnly={readOnly}
        popperProps={{ strategy: 'fixed' }}
      />
    </div>
  );
};
