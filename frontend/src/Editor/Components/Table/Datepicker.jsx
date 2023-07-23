import React from 'react';
import Datetime from 'react-datetime';
import moment from 'moment-timezone';
import 'react-datetime/css/react-datetime.css';
import '@/_styles/custom.scss';

const getDate = (value, parseDateFormat, displayFormat, timeZoneValue, timeZoneDisplay) => {
  if (value) {
    const dateString = value;
    if (timeZoneValue && timeZoneDisplay) {
      let momentString = moment
        .tz(dateString, parseDateFormat, timeZoneValue)
        .tz(timeZoneDisplay)
        .format(displayFormat);
      return momentString;
    } else {
      const momentObj = moment(dateString, parseDateFormat);
      const momentString = momentObj.format(displayFormat);
      return momentString;
    }
  }
  return '';
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
}) {
  const [date, setDate] = React.useState(() =>
    getDate(value, parseDateFormat, dateDisplayFormat, timeZoneValue, timeZoneDisplay)
  );
  const pickerRef = React.useRef();

  const dateChange = (event) => {
    const value = event._isAMomentObject ? event.format() : event;
    let selectedDateFormat = isTimeChecked ? `${dateDisplayFormat} LT` : dateDisplayFormat;
    const dateString = moment(value).format(selectedDateFormat);
    setDate(() => dateString);
  };

  React.useEffect(() => {
    let selectedDateFormat = isTimeChecked ? `${dateDisplayFormat} LT` : dateDisplayFormat;
    const dateString = getDate(value, parseDateFormat, selectedDateFormat, timeZoneValue, timeZoneDisplay);
    setDate(() => dateString);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeChecked, readOnly, dateDisplayFormat]);

  const onDatepickerClose = () => {
    onChange(date);
  };

  let inputProps = {
    disabled: !readOnly,
  };

  const calculatePosition = () => {
    const dropdown = pickerRef.current && pickerRef.current.querySelectorAll('.rdtPicker')[0];
    if (dropdown && tableRef.current) {
      const tablePos = tableRef.current.getBoundingClientRect();
      const dropDownPos = pickerRef.current.getBoundingClientRect();
      const left = dropDownPos.left - tablePos.left;
      const top = dropDownPos.bottom - tablePos.top;
      dropdown.style.left = `${left}px`;
      dropdown.style.top = `${top}px`;
    }
  };

  return (
    <div ref={pickerRef}>
      <Datetime
        inputProps={inputProps}
        timeFormat={isTimeChecked}
        className="cell-type-datepicker"
        dateFormat={dateDisplayFormat}
        value={date}
        onChange={dateChange}
        closeOnSelect={true}
        onClose={onDatepickerClose}
        disabled={readOnly}
        renderView={(viewMode, renderDefault) => {
          calculatePosition();
          return renderDefault();
        }}
        closeOnTab={false}
      />
    </div>
  );
};
