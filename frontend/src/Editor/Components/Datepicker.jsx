import React, { useEffect, useState } from 'react';
import DatePickerComponent from 'react-datepicker';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';

export const Datepicker = function Datepicker({
  height,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  validate,
  onComponentClick,
  component,
  id,
  darkMode,
}) {
  const { format, enableTime, enableDate, defaultValue, disabledDates } = properties;
  const { visibility, disabledState, borderRadius } = styles;

  const [date, setDate] = useState(new Date());
  const [excludedDates, setExcludedDates] = useState([]);

  const selectedDateFormat = enableTime ? `${format} LT` : format;

  const computeDateString = (date) => {
    if (enableDate) {
      return moment(date).format(selectedDateFormat);
    }

    if (!enableDate && enableTime) {
      return moment(date).format('LT');
    }
  };

  const onDateChange = (date) => {
    setDate(date);
    const dateString = computeDateString(date);
    setExposedVariable('value', dateString);
  };

  useEffect(() => {
    const dateMomentInstance = moment(defaultValue, selectedDateFormat);
    if (dateMomentInstance.isValid()) {
      setDate(dateMomentInstance.toDate());
      setExposedVariable('value', defaultValue);
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

  const validationData = validate(exposedVariables.value);
  const { isValid, validationError } = validationData;

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  const CustomInputBox = React.forwardRef((props, ref) => {
    return (
      <input
        readOnly
        {...props}
        value={computeDateString(date)}
        className={`input-field form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon px-2 ${
          darkMode ? 'bg-dark color-white' : 'bg-light'
        }`}
        style={{ height, borderRadius: `${borderRadius}px` }}
        ref={ref}
      />
    );
  });

  return (
    <div
      data-disabled={disabledState}
      className="datepicker-widget"
      style={{
        height,
        display: visibility ? '' : 'none',
        borderRadius: `${borderRadius}px`,
      }}
    >
      <DatePickerComponent
        selected={date}
        onChange={(date) => onDateChange(date)}
        showTimeInput={enableTime ? true : false}
        showTimeSelectOnly={enableDate ? false : true}
        onFocus={(event) => {
          onComponentClick(id, component, event);
        }}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        customInput={<CustomInputBox />}
        excludeDates={excludedDates}
      />

      <div className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}>{validationError}</div>
    </div>
  );
};
