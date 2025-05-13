import React, { useEffect, useRef, useState } from 'react';
import DatePickerComponent from 'react-datepicker';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker.scss';
import cx from 'classnames';

export const Datepicker = function Datepicker({
  height,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  validate,
  onComponentClick,
  id,
  darkMode,
  fireEvent,
  dataCy,
}) {
  const isInitialRender = useRef(true);
  const { enableTime, enableDate, defaultValue, disabledDates } = properties;
  const format = typeof properties.format === 'string' ? properties.format : '';
  const { visibility, disabledState, borderRadius, boxShadow } = styles;

  const [date, setDate] = useState(defaultValue);
  const [excludedDates, setExcludedDates] = useState([]);
  const [showValidationError, setShowValidationError] = useState(false);

  const selectedDateFormat = enableTime ? `${format} LT` : format;

  const computeDateString = (date) => {
    if (enableDate) {
      return moment(date).format(selectedDateFormat);
    }

    if (!enableDate && enableTime) {
      return moment(date).format('LT');
    }
  };

  const [validationStatus, setValidationStatus] = useState(validate(computeDateString(date)));
  const { isValid, validationError } = validationStatus;

  const onDateChange = (date) => {
    setShowValidationError(true);
    setInputValue(date);
    fireEvent('onSelect');
  };

  useEffect(() => {
    if (isInitialRender.current) return;
    const dateMomentInstance = defaultValue && moment(defaultValue, selectedDateFormat);
    if (dateMomentInstance && dateMomentInstance.isValid()) {
      setInputValue(dateMomentInstance.toDate());
    } else {
      setInputValue(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  useEffect(() => {
    if (Array.isArray(disabledDates) && disabledDates.length > 0) {
      const _exluded = [];
      disabledDates?.map((item) => {
        if (moment(item, format).isValid()) {
          _exluded.push(moment(item, format).toDate());
        }
      });
      setExcludedDates(_exluded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledDates, format]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const validationStatus = validate(computeDateString(date));
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  }, [validate]);

  useEffect(() => {
    const dateMomentInstance = defaultValue && moment(defaultValue, selectedDateFormat);
    setInputValue(dateMomentInstance && dateMomentInstance.isValid() ? dateMomentInstance.toDate() : null);
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setInputValue = (value) => {
    setDate(value);
    setExposedVariable('value', value ? computeDateString(value) : undefined);
    const validationStatus = validate(computeDateString(value));
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  };

  return (
    <div
      data-disabled={disabledState}
      className={`legacy-datepicker-widget datepicker-widget ${darkMode && 'theme-dark'}`}
      data-cy={dataCy}
      style={{
        height,
        display: visibility ? '' : 'none',
        background: 'none',
      }}
    >
      <DatePickerComponent
        // portalId="real-canvas"
        className={`input-field form-control ${
          !isValid && showValidationError ? 'is-invalid' : ''
        } validation-without-icon px-2 ${darkMode ? 'bg-dark color-white' : 'bg-light'}`}
        popperClassName={cx('tj-datepicker-widget', { 'dark-theme': darkMode })}
        selected={date}
        value={date !== null ? computeDateString(date) : 'select date'}
        onChange={(date) => onDateChange(date)}
        showTimeInput={enableTime ? true : false}
        showTimeSelectOnly={enableDate ? false : true}
        onFocus={(event) => {
          onComponentClick(id);
        }}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        excludeDates={excludedDates}
        customInput={<input style={{ borderRadius: `${borderRadius}px`, boxShadow, height }} />}
        timeInputLabel={<div className={`${darkMode && 'theme-dark'}`}>Time</div>}
        onCalendarOpen={() =>
          document.querySelector(`.ele-${id}`) ? (document.querySelector(`.ele-${id}`).style.zIndex = 3) : null
        }
        onCalendarClose={() =>
          document.querySelector(`.ele-${id}`) ? (document.querySelector(`.ele-${id}`).style.zIndex = '') : null
        }
      />

      <div data-cy="date-picker-invalid-feedback" className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}>
        {showValidationError && validationError}
      </div>
    </div>
  );
};
