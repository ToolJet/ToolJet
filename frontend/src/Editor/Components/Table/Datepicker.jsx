import React from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import '@/_styles/custom.scss';
import moment from 'moment';

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
    const _date = isTimeChecked ? moment(value, `${dateFormat} LT`) : moment(value, dateFormat);

    if (!isTimeChecked) {
      setDate(moment(value, 'DD-MM-YYYY').format(dateFormat));
    }

    if (isTimeChecked) {
      setDate(moment(value, 'DD-MM-YYYY LT').format(`${dateFormat} LT`));
    }
  }, [isTimeChecked, readOnly, dateFormat]);

  let inputProps = {
    disabled: !readOnly,
  };

  const [isDatepickerOpen, setIsDatepickerOpen] = React.useState(false);

  const onDatepickerClose = () => {
    onChange(date);
    setIsDatepickerOpen((prev) => !prev);
  };

  // React.useEffect(() => {
  //   const myElement = document.querySelector('.cell-type-datepicker');

  //   // myElement.parentNode.style.position = 'absolute';
  //   myElement.style.position = 'relative';
  //   myElement.style.marginTop = '2px';
  //   myElement.style.left = '50%';
  //   myElement.style.width = '250px';
  //   myElement.style.transform = 'translate(-50%, -25%)';

  //   return () => {
  //     myElement.parentNode.style.position = '';
  //     myElement.style.position = '';
  //     myElement.style.marginTop = '';
  //     myElement.style.left = '';
  //     myElement.style.width = '';
  //     myElement.style.transform = '';
  //   };
  // }, [isDatepickerOpen]);

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
