import React from 'react';
import Datetime from 'react-datetime';
import moment from 'moment';

import 'react-datetime/css/react-datetime.css';
import '@/_styles/custom.scss';

const getDate = (value, displayFormat) => {
  const dateString = value;
  const momentObj = moment(dateString, [
    'MM-DD-YYYY',
    moment.ISO_8601,
    moment(dateString).creationData().format,
    'MM/DD/YYYY',
  ]);
  const momentString = momentObj.format(displayFormat);
  return momentString;
};

export const Datepicker = function Datepicker({ value, onChange, readOnly, isTimeChecked, dateFormat }) {
  const [date, setDate] = React.useState(() => (value._isAMomentObject ? getDate(value, dateFormat) : value));

  const dateChange = (event) => {
    const value = event._isAMomentObject ? event.format() : event;

    setDate(value);
    onChange(value);
  };

  React.useEffect(() => {
    if (!isTimeChecked) {
      let momentString = getDate(value, dateFormat);
      setDate(momentString);
    }

    if (isTimeChecked) {
      let momentString = getDate(value, `${dateFormat} LT`);
      setDate(momentString);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeChecked, readOnly, dateFormat]);

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
        closeOnSelect={!isTimeChecked}
      />
    </>
  );
};
