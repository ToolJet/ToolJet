import React from 'react';
import Datetime from 'react-datetime';
import moment from 'moment';

import 'react-datetime/css/react-datetime.css';
import '@/_styles/custom.scss';

const getDate = (value, parseDateFormat, displayFormat) => {
  const dateString = value;
  const momentObj = moment(dateString, parseDateFormat);
  console.log('parsedDateObj', momentObj);
  const momentString = momentObj.format(displayFormat);
  return momentString;
};

export const Datepicker = function Datepicker({
  value,
  onChange,
  readOnly,
  isTimeChecked,
  dateFormat, //?Display date format
  parseDateFormat, //?Parse date format
}) {
  const [date, setDate] = React.useState(() => getDate(value, parseDateFormat, dateFormat));

  const dateChange = (event) => {
    const value = event._isAMomentObject ? event.format() : event;
    let selectedDateFormat = isTimeChecked ? `${dateFormat} LT` : dateFormat;
    const dateString = moment(value).format(selectedDateFormat);
    setDate(() => dateString);
  };

  // React.useEffect(() => {
  //   // const dateString = getDate(value, parseDateFormat, dateFormat);
  //   console.log('__value__', value);
  //   // setDate(() => dateString);
  // }, [value]);

  React.useEffect(() => {
    let selectedDateFormat = isTimeChecked ? `${dateFormat} LT` : dateFormat;
    console.log('__value__', selectedDateFormat);
    // const dateString = moment(value).format(selectedDateFormat);
    const dateString = getDate(value, parseDateFormat, selectedDateFormat);
    setDate(() => dateString);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeChecked, readOnly, dateFormat]);

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
        dateFormat={dateFormat}
        value={date}
        onChange={dateChange}
        closeOnSelect={true}
        onClose={onDatepickerClose}
      />
    </>
  );
};
