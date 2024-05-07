import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { getMonth, getYear } from 'date-fns';
import { range } from 'lodash';

const CustomDatePickerHeader = ({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const years = range(1990, getYear(new Date()) + 1, 1);

  return (
    <>
      <div
        style={{
          marginBottom: 10,
          marginTop: 10,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          className="tj-datepicker-widget-arrows tj-datepicker-widget-left"
          onClick={(e) => {
            e.stopPropagation();
            decreaseMonth();
          }}
          disabled={prevMonthButtonDisabled}
        >
          <SolidIcon name="cheveronleft" width="12" />
        </button>
        <div style={{ marginRight: '8px' }}>
          <select
            value={months[getMonth(date)]}
            onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
            className="tj-datepicker-widget-month-selector"
          >
            {months.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={getYear(date)}
            onChange={({ target: { value } }) => changeYear(value)}
            className="tj-datepicker-widget-year-selector"
            style={{ padding: '4px 6px' }}
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <button
          className="tj-datepicker-widget-arrows tj-datepicker-widget-right "
          onClick={(e) => {
            e.stopPropagation();
            increaseMonth();
          }}
          disabled={nextMonthButtonDisabled}
        >
          <SolidIcon name="cheveronright" width="12" />
        </button>
      </div>
    </>
  );
};

export default CustomDatePickerHeader;
