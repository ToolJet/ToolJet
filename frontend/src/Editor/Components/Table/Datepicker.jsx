import React from 'react';
import Datetime from 'react-datetime';
import moment from 'moment';

import 'react-datetime/css/react-datetime.css';
import '@/_styles/custom.scss';

export const Datepicker = function Datepicker({ value, onChange, readOnly, isTimeChecked, dateFormat }) {
  const [date, setDate] = React.useState(value);

  const dateChange = (e) => {
    if (isTimeChecked) {
      setDate(e.format(`${dateFormat} LT`));
    } else {
      setDate(e.format(dateFormat));
    }
  };

  React.useEffect(() => {
    if (!isTimeChecked) {
      setDate(moment(value, 'DD-MM-YYYY').format(dateFormat));
    }

    if (isTimeChecked) {
      setDate(moment(value, 'DD-MM-YYYY LT').format(`${dateFormat} LT`));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeChecked, readOnly, dateFormat]);

  let inputProps = {
    disabled: !readOnly,
  };

  const onDatepickerClose = () => {
    onChange(date);
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
        onClose={onDatepickerClose}
      />
    </>
  );
};
