import React, { forwardRef, useEffect, useRef } from 'react';
import moment from 'moment-timezone';
import DatePickerComponent from 'react-datepicker';
import CustomDatePickerHeader from './CustomDatePickerHeader';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker.scss';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const DISABLED_DATE_FORMAT = 'MM/DD/YYYY';

const TjDatepicker = forwardRef(
  ({ value, onClick, styles, dateInputRef, readOnly, setIsDateInputFocussed, setDateInputValue }, ref) => {
    return (
      <div className="table-column-datepicker-input-container">
        {readOnly ? (
          <div
            style={{
              height: '100%',
              width: '100%',
              overflow: 'hidden',
              color: styles?.color,
            }}
          >
            {value}
          </div>
        ) : (
          <input
            className={cx('table-column-datepicker-input text-truncate', {
              'pointer-events-none': readOnly,
            })}
            value={value}
            onClick={onClick}
            ref={dateInputRef}
            style={styles}
            onChange={(e) => {
              setIsDateInputFocussed(true);
              setDateInputValue(e.target.value);
            }}
            onFocus={() => {
              setDateInputValue(value);
            }}
          />
        )}
        {!readOnly && (
          <span className="cell-icon-display">
            <SolidIcon
              width="16"
              fill={'var(--borders-strong)'}
              name="calender"
              className="table-column-datepicker-input-icon"
            />
          </span>
        )}
      </div>
    );
  }
);

export const getDateTimeFormat = (
  dateDisplayFormat,
  isTimeChecked,
  isTwentyFourHrFormatEnabled,
  isDateSelectionEnabled
) => {
  const timeFormat = isTwentyFourHrFormatEnabled ? 'HH:mm' : 'LT';
  if (isTimeChecked && !isDateSelectionEnabled) {
    return timeFormat;
  }
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
      momentObj = unixTimestamp === 'seconds' ? moment.unix(value) : moment(parseInt(value));
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
  dateDisplayFormat, //?Display date format
  parseDateFormat, //?Parse date format
  timeZoneValue,
  timeZoneDisplay,
  isDateSelectionEnabled,
  isTwentyFourHrFormatEnabled,
  disabledDates,
  unixTimestamp = 'seconds',
  parseInUnixTimestamp,
  cellStyles,
  darkMode,
}) {
  const [date, setDate] = React.useState(null);
  const [excludedDates, setExcludedDates] = React.useState([]);
  const [isDateInputFocussed, setIsDateInputFocussed] = React.useState(false);
  const [dateInputValue, setDateInputValue] = React.useState('');
  const pickerRef = React.useRef();

  const handleDateChange = (date) => {
    let value = date;
    if (parseInUnixTimestamp && unixTimestamp) {
      value = moment(date).unix();
    }
    const _date = getDate({
      value,
      parseDateFormat: getDateTimeFormat(
        parseDateFormat,
        isTimeChecked,
        isTwentyFourHrFormatEnabled,
        isDateSelectionEnabled
      ),
      dateDisplayFormat,
      timeZoneValue,
      timeZoneDisplay,
      unixTimestamp,
      parseInUnixTimestamp,
      isTimeChecked,
    });
    setDate(_date);
    if (parseInUnixTimestamp && unixTimestamp) {
      onChange(moment(_date).unix());
    } else {
      onChange(computeDateString(_date));
    }
  };

  const handleInputDateChange = (value) => {
    const inputDate = moment(value, parseDateFormat).toDate();
    handleDateChange(inputDate);
  };

  useEffect(() => {
    const date = getDate({
      value,
      parseDateFormat: getDateTimeFormat(
        parseDateFormat,
        isTimeChecked,
        isTwentyFourHrFormatEnabled,
        isDateSelectionEnabled
      ),
      dateDisplayFormat,
      timeZoneValue,
      timeZoneDisplay,
      unixTimestamp,
      parseInUnixTimestamp,
      isTimeChecked,
    });
    setDate(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(
      value,
      parseDateFormat,
      dateDisplayFormat,
      timeZoneValue,
      timeZoneDisplay,
      unixTimestamp,
      isTimeChecked,
      isTwentyFourHrFormatEnabled,
      parseInUnixTimestamp
    ),
  ]);

  const dateInputRef = useRef(null); // Create a ref

  const computeDateString = (_date) => {
    if (_date === null && !value) return ''; // If there is no value in table data, return empty string to display
    if (!isDateSelectionEnabled && !isTimeChecked) return '';
    if (_date === null) return 'Invalid date';

    const timeFormat = isTwentyFourHrFormatEnabled ? 'HH:mm' : 'LT';
    const selectedDateFormat = isTimeChecked ? `${dateDisplayFormat} ${timeFormat}` : dateDisplayFormat;

    if (isDateSelectionEnabled) {
      if (isTimeChecked && parseInUnixTimestamp && unixTimestamp) {
        return timeZoneDisplay
          ? moment(_date).tz(timeZoneDisplay).format(selectedDateFormat)
          : moment(_date).format(selectedDateFormat);
      }
      if (isTimeChecked && timeZoneValue && timeZoneDisplay) {
        return moment.tz(_date, parseDateFormat, timeZoneValue).tz(timeZoneDisplay).format(selectedDateFormat);
      }
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
        className={`input-field form-control validation-without-icon px-2`}
        popperClassName={cx('tj-table-datepicker', {
          'tj-timepicker-widget': !isDateSelectionEnabled && isTimeChecked,
          'tj-datepicker-widget': isDateSelectionEnabled,
          'theme-dark dark-theme': darkMode,
        })}
        selected={date}
        onChange={(date) => {
          setIsDateInputFocussed(false);
          handleDateChange(date);
        }}
        value={isDateInputFocussed ? dateInputValue : computeDateString(date)}
        dateFormat={!isDateSelectionEnabled && isTimeChecked ? 'HH:mm' : dateDisplayFormat}
        customInput={
          <TjDatepicker
            dateInputRef={dateInputRef}
            readOnly={readOnly}
            styles={{ color: cellStyles.color }}
            setIsDateInputFocussed={setIsDateInputFocussed}
            setDateInputValue={setDateInputValue}
          />
        }
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
        timeIntervals={15}
        timeFormat={isTwentyFourHrFormatEnabled ? 'HH:mm' : 'h:mm aa'}
        onCalendarClose={() => {
          if (isDateInputFocussed) {
            handleInputDateChange(dateInputValue);
          }
          setIsDateInputFocussed(false);
        }}
        closeOnScroll={(e) => {
          return e.target.className === 'table-responsive jet-data-table false false';
        }}
      />
    </div>
  );
};
