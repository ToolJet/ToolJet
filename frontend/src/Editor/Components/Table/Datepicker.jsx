import React, { forwardRef, useEffect, useRef } from 'react';
import Datetime from 'react-datetime';
import moment from 'moment-timezone';
import DatePickerComponent from 'react-datepicker';
// import 'react-datetime/css/react-datetime.css';
// import '@/_styles/custom.scss';
import * as Icons from '@tabler/icons-react';
import CustomDatePickerHeader from './CustomDatePickerHeader';
import './datePicker.scss';

const TjDatepicker = forwardRef(
  ({ value, onClick, styles, setShowValidationError, setIsFocused, fireEvent, dateInputRef }, ref) => {
    return (
      <input
        onBlur={(e) => {
          setShowValidationError(true);
          setIsFocused(false);
          fireEvent('onBlur');
          e.stopPropagation();
        }}
        onFocus={(e) => {
          setIsFocused(true);
          fireEvent('onFocus');
          e.stopPropagation();
        }}
        className="custom-input-datepicker"
        value={value}
        onClick={onClick}
        ref={dateInputRef}
        style={styles}
      ></input>
    );
  }
);

const getDate = (value, parseDateFormat, displayFormat, timeZoneValue, timeZoneDisplay) => {
  if (value) {
    const dateString = value;
    if (timeZoneValue && timeZoneDisplay) {
      let momentString = moment
        .tz(dateString, parseDateFormat, timeZoneValue)
        .tz(timeZoneDisplay)
        .format(displayFormat);
      return momentString;
    } else {
      console.log(displayFormat, "displayFormat")
      const momentObj = moment(dateString, displayFormat);
      // const momentString = momentObj.format(displayFormat);
      return momentObj.toDate();
    }
  }
  return '';
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
}) {
  const [date, setDate] = React.useState(null);
  const pickerRef = React.useRef();

  const dateChange = (event) => {
    // const _value = event._isAMomentObject ? event.format() : event;
    // let selectedDateFormat = isTimeChecked ? `${dateDisplayFormat} LT` : dateDisplayFormat;
    // const dateString = moment(_value).format(selectedDateFormat);
    // setDate(() => dateString);
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
    const date = getDate(value, parseDateFormat, dateDisplayFormat, timeZoneValue, timeZoneDisplay)
    setDate(date)
  }, [JSON.stringify(value, parseDateFormat, dateDisplayFormat, timeZoneValue, timeZoneDisplay)])

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
  console.log(date, value, "date")
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
        onChange={(date) => dateChange(date)}
        // dateFormat={dateDisplayFormat}
        // value={date}
        onFocus={(event) => {
          // onComponentClick(id, component, event);
        }}
        // customInput={
        //   <TjDatepicker
        //     // styles={datepickerinputStyles}  // See this at last
        //     // setShowValidationError={setShowValidationError}
        //     // fireEvent={fireEvent}
        //     // setIsFocused={setIsFocused}
        //     dateInputRef={dateInputRef}
        //   />
        // }
        // timeFormat={'HH:mm'}
        // showTimeSelect={true}
        // showTimeSelectOnly={enableDate ? false : true}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        // excludeDates={excludedDates}
        showPopperArrow={false}
        renderCustomHeader={(headerProps) => <CustomDatePickerHeader {...headerProps} />}
      />
    </div>
  );
};
