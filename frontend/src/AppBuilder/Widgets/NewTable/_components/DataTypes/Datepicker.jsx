import React, { useState, useCallback, useEffect, useRef, forwardRef } from 'react';
import DatePickerComponent from 'react-datepicker';
import moment from 'moment-timezone';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import CustomDatePickerHeader from './_components/CustomDatePickerHeader';
import 'react-datepicker/dist/react-datepicker.css';
import useTextColor from '../DataTypes/_hooks/useTextColor';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

const DISABLED_DATE_FORMAT = 'MM/DD/YYYY';

const DatepickerInput = forwardRef(({ value, onClick, styles, readOnly, onInputChange, onInputFocus }, ref) => (
  <div className="table-column-datepicker-input-container">
    {readOnly ? (
      <div className="h-100 w-100 overflow-hidden" style={{ color: styles?.color }}>
        {value}
      </div>
    ) : (
      <>
        <input
          className={cx('table-column-datepicker-input text-truncate', {
            'pointer-events-none': readOnly,
          })}
          value={value}
          onClick={onClick}
          ref={ref}
          style={styles}
          onChange={onInputChange}
          onFocus={onInputFocus}
        />
        {!readOnly && (
          <span className="cell-icon-display">
            <SolidIcon
              width="16"
              fill="var(--borders-strong)"
              name="calender"
              className="table-column-datepicker-input-icon"
            />
          </span>
        )}
      </>
    )}
  </div>
));

const getDateTimeFormat = (dateDisplayFormat, isTimeChecked, isTwentyFourHrFormatEnabled, isDateSelectionEnabled) => {
  const timeFormat = isTwentyFourHrFormatEnabled ? 'HH:mm' : 'LT';
  if (isTimeChecked && !isDateSelectionEnabled) return timeFormat;
  return isTimeChecked ? `${dateDisplayFormat} ${timeFormat}` : dateDisplayFormat;
};

const parseDate = ({
  value,
  parseDateFormat,
  timeZoneValue,
  timeZoneDisplay,
  unixTimestamp,
  parseInUnixTimestamp,
  isTimeChecked,
}) => {
  if (!value) return null;

  let momentObj;
  if (parseInUnixTimestamp && unixTimestamp) {
    momentObj = unixTimestamp === 'seconds' ? moment.unix(value) : moment(parseInt(value));
  } else if (isTimeChecked && timeZoneValue && timeZoneDisplay) {
    momentObj = moment.tz(value, parseDateFormat, timeZoneValue).tz(timeZoneDisplay);
  } else {
    momentObj = moment(value, parseDateFormat);
  }

  return momentObj?.isValid() ? momentObj.toDate() : null;
};

export const DatepickerColumn = ({
  value,
  onChange,
  readOnly,
  isTimeChecked,
  isEditable,
  dateDisplayFormat,
  parseDateFormat,
  timeZoneValue,
  timeZoneDisplay,
  isDateSelectionEnabled,
  isTwentyFourHrFormatEnabled,
  disabledDates,
  unixTimestamp = 'seconds',
  parseInUnixTimestamp,
  column,
  darkMode,
  textColor,
  id,
  containerWidth,
}) => {
  const [date, setDate] = useState(null);
  const [excludedDates, setExcludedDates] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [hovered, setHovered] = useState(false);
  const dateInputRef = useRef(null);
  const ref = useRef(null);
  const textRef = useRef(null);
  const cellTextColor = useTextColor(id, textColor);

  const validateDates = useStore((state) => state.validateDates, shallow);
  const { isValid, validationError } = validateDates({
    validationObject: {
      minDate: {
        value: column.minDate,
      },
      maxDate: {
        value: column.maxDate,
      },
      minTime: {
        value: column.minTime,
      },
      maxTime: {
        value: column.maxTime,
      },
      parseDateFormat: {
        value: column.parseDateFormat,
      },
      customRule: {
        value: column.customRule,
      },
    },
    widgetValue: value,
    customResolveObjects: { cellValue: value },
  });

  const computeDateString = useCallback(
    (date) => {
      if (date === null && !value) return '';
      if (!isDateSelectionEnabled && !isTimeChecked) return '';
      if (date === null) return 'Invalid date';

      const timeFormat = isTwentyFourHrFormatEnabled ? 'HH:mm' : 'LT';
      const selectedDateFormat = isTimeChecked ? `${dateDisplayFormat} ${timeFormat}` : dateDisplayFormat;

      if (isDateSelectionEnabled) {
        if (isTimeChecked && parseInUnixTimestamp && unixTimestamp) {
          return timeZoneDisplay
            ? moment(date).tz(timeZoneDisplay).format(selectedDateFormat)
            : moment(date).format(selectedDateFormat);
        }
        if (isTimeChecked && timeZoneValue && timeZoneDisplay) {
          return moment.tz(date, parseDateFormat, timeZoneValue).tz(timeZoneDisplay).format(selectedDateFormat);
        }
        return moment(date).format(selectedDateFormat);
      }

      if (!isDateSelectionEnabled && isTimeChecked) {
        return moment(date).format(timeFormat);
      }
    },
    [
      value,
      isDateSelectionEnabled,
      isTimeChecked,
      isTwentyFourHrFormatEnabled,
      dateDisplayFormat,
      parseInUnixTimestamp,
      unixTimestamp,
      timeZoneDisplay,
      timeZoneValue,
      parseDateFormat,
    ]
  );

  const handleDateChange = useCallback(
    (newDate) => {
      let processedValue = newDate;
      if (parseInUnixTimestamp && unixTimestamp) {
        processedValue = moment(newDate).unix();
      }

      const parsedDate = parseDate({
        value: processedValue,
        parseDateFormat: getDateTimeFormat(
          parseDateFormat,
          isTimeChecked,
          isTwentyFourHrFormatEnabled,
          isDateSelectionEnabled
        ),
        timeZoneValue,
        timeZoneDisplay,
        unixTimestamp,
        parseInUnixTimestamp,
        isTimeChecked,
      });

      setDate(parsedDate);
      if (parseInUnixTimestamp && unixTimestamp) {
        onChange(moment(parsedDate).unix());
      } else {
        onChange(computeDateString(parsedDate));
      }
    },
    [
      parseInUnixTimestamp,
      unixTimestamp,
      parseDateFormat,
      isTimeChecked,
      isTwentyFourHrFormatEnabled,
      isDateSelectionEnabled,
      timeZoneValue,
      timeZoneDisplay,
      onChange,
      computeDateString,
    ]
  );

  const handleInputDateChange = useCallback(
    (value) => {
      const inputDate = moment(value, parseDateFormat).toDate();
      handleDateChange(inputDate);
    },
    [parseDateFormat, handleDateChange]
  );

  // Initialize date from value
  useEffect(() => {
    const parsedDate = parseDate({
      value,
      parseDateFormat: getDateTimeFormat(
        parseDateFormat,
        isTimeChecked,
        isTwentyFourHrFormatEnabled,
        isDateSelectionEnabled
      ),
      timeZoneValue,
      timeZoneDisplay,
      unixTimestamp,
      parseInUnixTimestamp,
      isTimeChecked,
    });
    setDate(parsedDate);
  }, [
    value,
    parseDateFormat,
    isTimeChecked,
    isTwentyFourHrFormatEnabled,
    isDateSelectionEnabled,
    timeZoneValue,
    timeZoneDisplay,
    unixTimestamp,
    parseInUnixTimestamp,
  ]);

  // Handle disabled dates
  useEffect(() => {
    if (Array.isArray(disabledDates) && disabledDates.length > 0) {
      const excludedDates = disabledDates
        .filter((date) => moment(date, DISABLED_DATE_FORMAT).isValid())
        .map((date) => moment(date, DISABLED_DATE_FORMAT).toDate());
      setExcludedDates(excludedDates);
    }
  }, [disabledDates]);
  useEffect(() => {
    setShowOverlay(hovered);
  }, [hovered]);

  const getOverlay = () => (
    <div
      className={`overlay-cell-table ${darkMode ? 'dark-theme' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ color: 'var(--text-primary)' }}
    >
      <span style={{ width: `${containerWidth}px` }}>{computeDateString(date)}</span>
    </div>
  );

  const _showOverlay =
    ref?.current &&
    textRef?.current &&
    (ref.current.clientWidth < textRef.current.offsetWidth ||
      ref.current.clientHeight < textRef.current.offsetHeight);

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={_showOverlay ? getOverlay() : <div />}
      trigger={_showOverlay && ['hover', 'focus']}
      rootClose={true}
      show={_showOverlay && showOverlay && !isInputFocused}
    >
      <div
        className={`h-100 d-flex align-items-center flex-column justify-content-center ${!isValid ? 'is-invalid' : ''}`}
        onMouseMove={() => !hovered && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        ref={ref}
      >
        {/* Hidden span to measure text width */}
        <span
          ref={textRef}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'nowrap',
            fontSize: 'inherit',
            fontFamily: 'inherit',
          }}
        >
          {computeDateString(date)}
        </span>
        <DatePickerComponent
          className="input-field form-control validation-without-icon px-2"
          popperClassName={cx('tj-table-datepicker', {
            'tj-timepicker-widget': !isDateSelectionEnabled && isTimeChecked,
            'tj-datepicker-widget': isDateSelectionEnabled,
            'theme-dark dark-theme': darkMode,
          })}
          selected={date}
          onChange={(date) => {
            setIsInputFocused(false);
            handleDateChange(date);
          }}
          value={isInputFocused ? inputValue : computeDateString(date)}
          dateFormat={!isDateSelectionEnabled && isTimeChecked ? 'HH:mm' : dateDisplayFormat}
          customInput={
            <DatepickerInput
              ref={dateInputRef}
              readOnly={readOnly}
              styles={{ color: cellTextColor }}
              onInputChange={(e) => {
                setIsInputFocused(true);
                setInputValue(e.target.value);
              }}
              onInputFocus={() => setInputValue(computeDateString(date))}
            />
          }
          showTimeSelect={isTimeChecked}
          showTimeSelectOnly={!isDateSelectionEnabled && isTimeChecked}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          excludeDates={excludedDates}
          showPopperArrow={false}
          renderCustomHeader={(headerProps) => <CustomDatePickerHeader {...headerProps} />}
          shouldCloseOnSelect
          readOnly={readOnly}
          popperProps={{ strategy: 'fixed' }}
          timeIntervals={15}
          timeFormat={isTwentyFourHrFormatEnabled ? 'HH:mm' : 'h:mm aa'}
          onCalendarClose={() => {
            if (isInputFocused) {
              handleInputDateChange(inputValue);
            }
            setIsInputFocused(false);
          }}
        />
        {isEditable && !isValid && <div className="invalid-feedback-date text-truncate">{validationError}</div>}
      </div>
    </OverlayTrigger>
  );
};
