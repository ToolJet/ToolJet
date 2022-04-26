import React from 'react';
import Datetime from 'react-datetime';
import moment from 'moment';

import 'react-datetime/css/react-datetime.css';
import '@/_styles/custom.scss';

const getDate = (value, parseDateFormat, displayFormat) => {
  const dateString = value;
  const momentObj = moment(dateString, parseDateFormat);
  const momentString = momentObj.format(displayFormat);
  return momentString;
};

export const Datepicker = function Datepicker({
  value,
  onChange,
  readOnly,
  isTimeChecked,
  dateDisplayFormat, //?Display date format
  parseDateFormat, //?Parse date format
}) {
  const [date, setDate] = React.useState(() => getDate(value, parseDateFormat, dateDisplayFormat));

  const dateChange = (event) => {
    const value = event._isAMomentObject ? event.format() : event;
    let selectedDateFormat = isTimeChecked ? `${dateDisplayFormat} LT` : dateDisplayFormat;
    const dateString = moment(value).format(selectedDateFormat);
    setDate(() => dateString);
  };

  React.useEffect(() => {
    let selectedDateFormat = isTimeChecked ? `${dateDisplayFormat} LT` : dateDisplayFormat;
    const dateString = getDate(value, parseDateFormat, selectedDateFormat);
    setDate(() => dateString);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeChecked, readOnly, dateDisplayFormat]);

  const onDatepickerClose = () => {
    onChange(date);
  };

  let inputProps = {
    disabled: !readOnly,
  };

  return (
    <>
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
      />
    </>
  );
};
