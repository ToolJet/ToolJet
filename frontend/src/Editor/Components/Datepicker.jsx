import React from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';

export const Datepicker = function Datepicker({
  height,
  component,
  currentState,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  validate,
}) {
  const { format, enableTime, enableDate, defaultValue } = properties;
  const { visibility, disabledState } = styles;

  const onDateChange = (event) => {
    if (enableDate) {
      const selectedDateFormat = enableTime ? `${format} LT` : format;
      const dateString = event.format(selectedDateFormat);
      setExposedVariable('value', dateString);
    }

    if (!enableDate && enableTime) {
      setExposedVariable('value', event.format('LT'));
    }
  };

  const validationData = validate(exposedVariables.value);

  const { isValid, validationError } = validationData;

  const currentValidState = currentState?.components[component?.name]?.isValid;

  if (currentValidState !== isValid) {
    setExposedVariable('isValid', isValid);
  }

  const isDateFormat = enableDate ? format : false;

  return (
    <div
      data-disabled={disabledState}
      className="datepicker-widget"
      style={{ height, display: visibility ? '' : 'none' }}
    >
      <Datetime
        onChange={onDateChange}
        timeFormat={enableTime}
        closeOnSelect={true}
        dateFormat={isDateFormat}
        placeholderText={defaultValue}
        inputProps={{ placeholder: defaultValue }}
        renderInput={(props) => {
          return (
            <input
              {...props}
              value={exposedVariables.value}
              className={`input-field form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon px-2`}
            />
          );
        }}
      />
      <div className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}>{validationError}</div>
    </div>
  );
};
