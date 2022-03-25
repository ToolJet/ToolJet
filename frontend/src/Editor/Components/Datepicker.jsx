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
  const { format, enableTime, enableDate, defaultValue } = properties;
  const { visibility, disabledState, borderRadius } = styles;

  const [date, setDate] = useState(new Date());
  const selectedDateFormat = enableTime ? `${format} LT` : format;

  const onDateChange = (date) => {
    if (enableDate) {
      const dateString = moment(date).format(selectedDateFormat);
      setDate(date);
      setExposedVariable('value', dateString);
    }

    if (!enableDate && enableTime) {
      setExposedVariable('value', moment(date).format('LT'));
    }
  };

  useEffect(() => {
    const dateMomentInstance = moment(defaultValue, selectedDateFormat);
    setDate(dateMomentInstance.toDate());
    setExposedVariable('value', defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  const validationData = validate(exposedVariables.value);

  const { isValid, validationError } = validationData;
  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  const ExampleCustomInput = (props) => {
    return (
      <input
        readOnly
        {...props}
        value={exposedVariables.value}
        className={`input-field form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon px-2 ${
          darkMode ? 'bg-dark color-white' : 'bg-light'
        }`}
        style={{ height, borderRadius: `${borderRadius}px` }}
      />
    );
  };

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
        showYearDropdown
        showMonthDropdown
        customInput={<ExampleCustomInput />}
      />

      <div className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}>{validationError}</div>
    </div>
  );
};
