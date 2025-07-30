import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import CheckMark from '@/_ui/Icon/bulkIcons/CheckMark';
import moment from 'moment';
import { range } from 'lodash';
import { getModifiedColor } from '@/Editor/Components/utils';

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
    datepickerMode = 'date',
    datepickerSelectionType = 'single',
    monthDate,
    customHeaderCount,
    setDatePickerMode,
    darkMode,
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

  const menuHoverColor = getModifiedColor('var(--cc-surface1-surface)', 'hover');
  const menuActiveColor = getModifiedColor('var(--cc-surface1-surface)', 'active');

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      border: 'none !important',
      boxShadow: 'none',
      cursor: 'default',
      backgroundColor: 'transparent !important',
      minHeight: 'auto',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'inherit',
      fontSize: 'inherit',
    }),
    dropdownIndicator: () => ({
      display: 'none',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'inherit',
      fontSize: 'inherit',
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
    }),
    menu: (provided) => ({
      ...provided,
      width: '150px',
      borderRadius: '8px',
      top: 'auto',
      backgroundColor: 'var(--cc-surface1-surface) !important',
    }),
    menuList: (provided) => ({
      ...provided,
      width: '150px',
      textAlign: 'left',
      overflowY: 'auto', // Enable scrolling if needed
      scrollbarWidth: 'none', // Hide scrollbar for Firefox
      borderRadius: '8px',
      backgroundColor: 'var(--cc-surface1-surface) !important',
    }),
    option: (provided, state) => ({
      ...provided,
      color: 'var(--cc-primary-text)', // Adjust text color for selected state
      paddingLeft: '20px',
      position: 'relative',
    }),
  };

  const CustomOption = (props) => {
    const { data, isSelected } = props;

    return (
      <components.Option {...props}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center', // Ensures vertical alignment
            gap: '10px', // Space between icon and text
          }}
        >
          {isSelected && (
            <CheckMark fill="transparent" fillIcon={'var(--cc-primary-brand)'} className="datepicker-select-check" />
          )}
          <span style={{ marginLeft: '10px', color: darkMode ? '#fff' : '#000' }}>{data.label}</span>
        </div>
      </components.Option>
    );
  };

  return (
    <>
      <div
        style={{
          marginBottom: 10,
          marginTop: 10,
          display: 'flex',
          justifyContent: 'center',
          '--cc-date-dropdown-hover': menuHoverColor,
          '--cc-date-dropdown-active': menuActiveColor,
        }}
      >
        {!(datepickerSelectionType === 'range' && customHeaderCount === 1) && (
          <button
            className="tj-datepicker-widget-arrows tj-datepicker-widget-left"
            onClick={(e) => {
              e.stopPropagation();
              if (['range', 'date'].includes(datepickerMode)) decreaseMonth();
              else decreaseYear();
            }}
            disabled={datepickerMode === 'date' ? prevMonthButtonDisabled : prevYearButtonDisabled}
          >
            <SolidIcon name="cheveronleft" width="12" fill={'var(--cc-default-icon)'} />
          </button>
        )}
        <div style={{ marginRight: '8px' }}>
          {datepickerSelectionType != 'range' && (
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
          {datepickerSelectionType === 'range' && (
            <div className="daterangepicker-header" style={{ color: 'var(--cc-primary-text)' }}>
              {!['month', 'year'].includes(datepickerMode) && (
                <Select
                  options={months.map((option) => ({ name: option, value: option }))}
                  value={months[moment(monthDate).month()]}
                  onChange={(value) => changeMonth(months.indexOf(value))}
                  width={'100%'}
                  styles={customSelectStyles}
                  useCustomStyles={true}
                  useMenuPortal={false}
                  components={{ Option: CustomOption }}
                  menuPlacement="bottom"
                  menuPosition="absolute"
                />
              )}
              {!['year'].includes(datepickerMode) && (
                <Select
                  options={years.map((option) => ({ name: option, value: option }))}
                  value={moment(monthDate).year()}
                  onChange={(value) => changeYear(value)}
                  width={'100%'}
                  styles={customSelectStyles}
                  useCustomStyles={true}
                  useMenuPortal={false}
                  components={{ Option: CustomOption }}
                  menuPlacement="bottom"
                  menuPosition="absolute"
                />
              )}
            </div>
          )}
        </div>
        {(!(datepickerSelectionType === 'range' && customHeaderCount === 0) ||
          (datepickerSelectionType === 'range' && datepickerMode === 'year')) && (
          <button
            className="tj-datepicker-widget-arrows tj-datepicker-widget-right "
            onClick={(e) => {
              e.stopPropagation();
              if (['range', 'date'].includes(datepickerMode)) increaseMonth();
              else increaseYear();
            }}
            disabled={datepickerMode === 'date' ? nextMonthButtonDisabled : nextYearButtonDisabled}
          >
            <SolidIcon name="cheveronright" width="12" fill={'var(--cc-default-icon)'} />
          </button>
        )}
      </div>
    </>
  );
};

export default CustomDatePickerHeader;
