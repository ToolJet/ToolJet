import React, { forwardRef, useEffect, useRef } from 'react';
import moment from 'moment-timezone';
import DatePickerComponent from 'react-datepicker';
// import '@/_styles/custom.scss';
import * as Icons from '@tabler/icons-react';
import CustomDatePickerHeader from './CustomDatePickerHeader';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker.scss';
import classNames from 'classnames';

const TjDatepicker = forwardRef(
  ({ value, onClick, styles, dateInputRef, readOnly }, ref) => {
    return (
      <input
        onBlur={(e) => {
          e.stopPropagation();
        }}
        className={classNames("table-column-datepicker-input", {
          "pointer-events-none": readOnly
        })}
        value={value}
        onClick={onClick}
        ref={dateInputRef}
        style={styles}
      ></input>
    );
  }
);

const getDate = (value, parseDateFormat, displayFormat, timeZoneValue, timeZoneDisplay) => {
  let momentObj = null;
  // console.log(timeZoneValue, timeZoneDisplay)
  if (value) {
    if (timeZoneValue && timeZoneDisplay) {
      momentObj = moment.tz(value, parseDateFormat, timeZoneValue).tz(timeZoneDisplay);
    } else {
      momentObj = moment(value, parseDateFormat);
    }
  }
  return momentObj?.isValid() ? momentObj.toDate() : null;
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
  isDateSelectionEnabled,
  isTwentyFourHrFormatEnabled,
  isEditable
}) {
  const [date, setDate] = React.useState(null);
  const pickerRef = React.useRef();

  const handleDateChange = (date) => {
    const timeFormat = isTwentyFourHrFormatEnabled ? 'HH:mm' : 'LT';
    const selectedDateFormat = isTimeChecked ? `${dateDisplayFormat} ${timeFormat}` : dateDisplayFormat;
    setDate(getDate(date, selectedDateFormat));
    onChange(computeDateString(date));
  };

  // React.useEffect(() => {
  //   let selectedDateFormat = isTimeChecked ? `${dateDisplayFormat} LT` : dateDisplayFormat;
  //   const dateString = getDate(value, parseDateFormat, selectedDateFormat, timeZoneValue, timeZoneDisplay);
  //   setDate(() => dateString);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isTimeChecked, readOnly, dateDisplayFormat]);

  const onDatepickerClose = () => {
    onChange(date);
  };

  // let inputProps = {
  //   disabled: !readOnly,
  // };

  // const calculatePosition = () => {
  //   const dropdown = pickerRef.current && pickerRef.current.querySelectorAll('.rdtPicker')[0];
  //   if (dropdown && tableRef.current) {
  //     const tablePos = tableRef.current.getBoundingClientRect();
  //     const dropDownPos = pickerRef.current.getBoundingClientRect();
  //     const left = dropDownPos.left - tablePos.left;
  //     const top = dropDownPos.bottom - tablePos.top;
  //     dropdown.style.left = `${left}px`;
  //     dropdown.style.top = `${top}px`;
  //   }
  // };

  useEffect(() => {
    const date = getDate(value, parseDateFormat, dateDisplayFormat, timeZoneValue, timeZoneDisplay);
    setDate(date);
  }, [JSON.stringify(value, parseDateFormat, dateDisplayFormat, timeZoneValue, timeZoneDisplay)]);

  const IconElement = Icons['IconHome2'];
  // const datepickerinputStyles = {
  //   backgroundColor: darkMode && ['#fff'].includes(backgroundColor) ? '#313538' : backgroundColor,
  //   // borderColor: ['#D7DBDF'].includes(borderColor) ? (darkMode ? '#4C5155' : '#D7DBDF') : borderColor,
  //   borderColor: isFocused
  //     ? '#3E63DD'
  //     : ['#D7DBDF'].includes(borderColor)
  //       ? darkMode
  //         ? '#4C5155'
  //         : '#D7DBDF'
  //       : borderColor,
  //   color: darkMode && textColor === '#11181C' ? '#ECEDEE' : textColor,
  //   boxShadow,
  //   borderRadius: `${borderRadius}px`,
  //   height: height == 40 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
  //   paddingLeft: !component?.definition?.styles?.iconVisibility?.value ? '10px' : '29px',
  // };

  const dateInputRef = useRef(null); // Create a ref

  const computeDateString = (date) => {
    const _date = getDate(date, parseDateFormat, dateDisplayFormat, timeZoneValue, timeZoneDisplay);
    const timeFormat = isTwentyFourHrFormatEnabled ? 'HH:mm' : 'LT';
    const selectedDateFormat = isTimeChecked ? `${dateDisplayFormat} ${timeFormat}` : dateDisplayFormat;
    if (isDateSelectionEnabled) {
      return moment(_date).format(selectedDateFormat);
    }

    if (!isDateSelectionEnabled && isTimeChecked) {
      return moment(_date).format(timeFormat);
    }
  };
  // console.log(date, value, "date")
  return (
    <div ref={pickerRef}>
      {/* <Datetime
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
      /> */}
      <DatePickerComponent
        calendarIcon={<IconElement stroke={1.5} />}
        className={`input-field form-control tj-text-input-widget validation-without-icon px-2`}
        popperClassName={`tj-datepicker-widget`}
        selected={date}
        onChange={(date) => handleDateChange(date)}
        value={date !== null ? computeDateString(date) : 'select date'}
        dateFormat={dateDisplayFormat}
        customInput={
          <TjDatepicker
            dateInputRef={dateInputRef}
            readOnly={!isEditable}
          />
        }
        timeFormat={'HH:mm'}
        showTimeSelect={isTimeChecked}
        showTimeSelectOnly={!isDateSelectionEnabled && isTimeChecked}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        // excludeDates={excludedDates}
        showPopperArrow={false}
        renderCustomHeader={(headerProps) => <CustomDatePickerHeader {...headerProps} />}
        shouldCloseOnSelect
        readOnly={!isEditable}
      />
    </div>
  );
};
