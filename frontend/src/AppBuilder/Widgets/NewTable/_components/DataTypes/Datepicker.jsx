import React from 'react';
import moment from 'moment';

export const DatepickerColumn = ({
  timeZoneValue,
  timeZoneDisplay,
  dateDisplayFormat,
  isTimeChecked,
  value,
  readOnly,
  parseDateFormat,
  onChange,
  tableRef,
  isDateSelectionEnabled,
  isTwentyFourHrFormatEnabled,
}) => {
  const handleDateChange = (date) => {
    if (!readOnly && onChange) {
      onChange(date ? moment(date).format(parseDateFormat) : null);
    }
  };

  return (
    <div className="h-100 d-flex align-items-center">
      <input
        type="datetime-local"
        className="form-control"
        value={value ? moment(value).format('YYYY-MM-DDTHH:mm') : ''}
        onChange={(e) => handleDateChange(e.target.value)}
        disabled={readOnly || !isDateSelectionEnabled}
      />
    </div>
  );
};
