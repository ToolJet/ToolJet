import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import moment from 'moment';
import { range } from 'lodash';

const CustomDatePickerHeader = (props) => {
  const {
    date,
    decreaseMonth,
    increaseMonth,
    decreaseYear,
    increaseYear,
    changeYear,
    changeMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
    prevYearButtonDisabled,
    nextYearButtonDisabled,
    datepickerMode,
    monthDate,
    customHeaderCount,
    setDatePickerMode,
  } = props;
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
        {!(datepickerMode === 'range' && customHeaderCount === 1) && (
          <button
            className="tj-datepicker-widget-arrows tj-datepicker-widget-left"
            onClick={(e) => {
              e.stopPropagation();
              if (['range', 'date'].includes(datepickerMode)) decreaseMonth();
              else decreaseYear();
            }}
            disabled={datepickerMode === 'date' ? prevMonthButtonDisabled : prevYearButtonDisabled}
          >
            <SolidIcon name="cheveronleft" width="12" />
          </button>
        )}
        <div style={{ marginRight: '8px' }}>
          {datepickerMode != 'range' && (
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
          )}
          {datepickerMode === 'range' && (
            <>
              <select
                value={months[moment(monthDate).month()]}
                onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
                className="tj-daterangepicker-widget-month-selector"
              >
                {months.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={moment(monthDate).year()}
                onChange={({ target: { value } }) => changeYear(value)}
                className="tj-daterangepicker-widget-year-selector"
              >
                {years.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        {!(datepickerMode === 'range' && customHeaderCount === 0) && (
          <button
            className="tj-datepicker-widget-arrows tj-datepicker-widget-right "
            onClick={(e) => {
              e.stopPropagation();
              if (['range', 'date'].includes(datepickerMode)) increaseMonth();
              else increaseYear();
            }}
            disabled={datepickerMode === 'date' ? nextMonthButtonDisabled : nextYearButtonDisabled}
          >
            <SolidIcon name="cheveronright" width="12" />
          </button>
        )}
      </div>
    </>
  );
};

export default CustomDatePickerHeader;
