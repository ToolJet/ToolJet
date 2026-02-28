import React, { useEffect, useRef, useState } from 'react';
import DatePickerComponent from 'react-datepicker';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker.scss';
import cx from 'classnames';
import { IconX } from '@tabler/icons-react';

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
  const { enableTime, enableDate, defaultValue, disabledDates, placeholder: placeholderProp, showClearBtn } = properties;
  const placeholder = placeholderProp || 'Select date';
  const format = typeof properties.format === 'string' ? properties.format : '';
  const { visibility, disabledState, borderRadius, boxShadow } = styles;

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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
  const hasValue = date !== null && date !== undefined && date !== '';
  const shouldShowClearBtn = showClearBtn && hasValue && !disabledState;

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
    //get element whose id is component-${id}
    const datepickerInput = document.querySelector(`[id='component-${id}']`);
    if (datepickerInput) {
      datepickerInput.setAttribute('aria-label', 'Datepicker');
    }
  }, []);

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

  const clearButton = shouldShowClearBtn ? (
    <button
      data-cy={`${dataCy}-clear-button`}
      type="button"
      className="tj-input-clear-btn datepicker-clear-btn"
      aria-label="Clear"
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        setInputValue(null);
      }}
      style={{
        position: 'absolute',
        right: '11px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 3,
      }}
    >
      <IconX size={16} color="var(--borders-strong)" className="cursor-pointer clear-indicator" />
    </button>
  ) : null;

  return (
    <div
      data-disabled={disabledState}
      className={`legacy-datepicker-widget datepicker-widget ${darkMode && 'theme-dark'}`}
      style={{
        height,
        display: visibility ? '' : 'none',
        background: 'none',
      }}
      aria-hidden={!visibility}
      aria-disabled={disabledState}
      aria-invalid={!isValid && showValidationError}
    >
      <DatePickerComponent
        open={isCalendarOpen}
        className={`input-field form-control ${!isValid && showValidationError ? 'is-invalid' : ''
          } validation-without-icon px-2 ${darkMode ? 'bg-dark color-white' : 'bg-light'} ${shouldShowClearBtn ? 'has-clear-btn' : ''
          }`}
        popperClassName={cx('legacy-datepicker-poppper tj-datepicker-widget', { 'dark-theme': darkMode })}
        selected={date}
        value={date !== null ? computeDateString(date) : ''}
        placeholderText={placeholder}
        onChange={(date) => onDateChange(date)}
        showTimeInput={enableTime ? true : false}
        showTimeSelectOnly={enableDate ? false : true}
        onInputClick={() => {
          onComponentClick(id);
          setIsCalendarOpen(true);
        }}
        id={`component-${id}`}
        ariaLabelledBy={''}
        showMonthDropdown
        showYearDropdown
        portalId="component-portal"
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
        onSelect={() => setIsCalendarOpen(false)}
        onClickOutside={() => setIsCalendarOpen(false)}
      />
      {clearButton}

      <div data-cy="date-picker-invalid-feedback" className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}>
        {showValidationError && validationError}
      </div>
    </div>
  );
};
