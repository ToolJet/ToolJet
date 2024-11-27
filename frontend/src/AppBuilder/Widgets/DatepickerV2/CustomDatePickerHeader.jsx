import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import moment from 'moment';
import { range } from 'lodash';

const CustomDatePickerHeader = ({
  date,
  decreaseMonth,
  increaseMonth,
  decreaseYear,
  increaseYear,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
  prevYearButtonDisabled,
  nextYearButtonDisabled,
  datepickerMode,
  setDatePickerMode,
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

  const years = range(1900, 2101);

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
            if (datepickerMode === 'date') decreaseMonth();
            else decreaseYear();
          }}
          disabled={datepickerMode === 'date' ? prevMonthButtonDisabled : prevYearButtonDisabled}
        >
          <SolidIcon name="cheveronleft" width="12" />
        </button>
        <div style={{ marginRight: '8px' }}>
          <div className="d-flex gap-2">
            {!(datepickerMode === 'month') && (
              <span className={'tj-datepicker-widget-month-selector'} onClick={() => setDatePickerMode('month')}>
                {months[moment(date).month()]}
              </span>
            )}
            {!(datepickerMode === 'year') && (
              <span className={'tj-datepicker-widget-year-selector'} onClick={() => setDatePickerMode('year')}>
                {moment(date).year()}
              </span>
            )}
          </div>
        </div>

        <button
          className="tj-datepicker-widget-arrows tj-datepicker-widget-right "
          onClick={(e) => {
            e.stopPropagation();
            if (datepickerMode === 'date') increaseMonth();
            else increaseYear();
          }}
          disabled={datepickerMode === 'date' ? nextMonthButtonDisabled : nextYearButtonDisabled}
        >
          <SolidIcon name="cheveronright" width="12" />
        </button>
      </div>
    </>
  );
};

export default CustomDatePickerHeader;
