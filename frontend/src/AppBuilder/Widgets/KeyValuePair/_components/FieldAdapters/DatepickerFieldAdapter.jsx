import React, { useState, useCallback, useEffect } from 'react';
import DatePickerComponent from 'react-datepicker';
import moment from 'moment-timezone';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * DatepickerFieldAdapter - KeyValuePair adapter for Date display/editing
 *
 * Displays date values with optional editing via react-datepicker.
 */
export const DatepickerField = ({
  value,
  onChange,
  isEditable = false,
  dateFormat = 'MM/DD/YYYY',
  showTimeSelect = false,
  timeFormat = 'HH:mm',
  darkMode = false,
  horizontalAlignment = 'left',
}) => {
  const [date, setDate] = useState(null);

  // Parse value to date
  useEffect(() => {
    if (!value) {
      setDate(null);
      return;
    }

    const parsed = moment(value, dateFormat);
    setDate(parsed.isValid() ? parsed.toDate() : null);
  }, [value, dateFormat]);

  const handleChange = useCallback(
    (newDate) => {
      setDate(newDate);
      if (onChange) {
        const formatted = moment(newDate).format(dateFormat);
        onChange(formatted);
      }
    },
    [onChange, dateFormat]
  );

  const displayValue = date ? moment(date).format(showTimeSelect ? `${dateFormat} ${timeFormat}` : dateFormat) : '';

  if (!isEditable) {
    return (
      <div
        style={{
          textAlign: horizontalAlignment,
          color: darkMode ? 'var(--text-primary)' : 'inherit',
        }}
      >
        {displayValue || '-'}
      </div>
    );
  }

  return (
    <div
      className="key-value-datepicker"
      style={{
        textAlign: horizontalAlignment,
      }}
    >
      <DatePickerComponent
        selected={date}
        onChange={handleChange}
        dateFormat={dateFormat}
        showTimeSelect={showTimeSelect}
        timeFormat={timeFormat}
        className="form-control form-control-sm"
        popperProps={{ strategy: 'fixed' }}
      />
    </div>
  );
};

export default DatepickerField;
