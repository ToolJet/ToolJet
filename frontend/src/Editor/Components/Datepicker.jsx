import React, { useEffect } from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';

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
}) {
  const { format, enableTime, enableDate, defaultValue } = properties;
  const { visibility, disabledState, borderRadius } = styles;

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

  useEffect(() => {
    setExposedVariable('value', defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  const validationData = validate(exposedVariables.value);

  const { isValid, validationError } = validationData;
  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  const isDateFormat = enableDate === true ? format : enableDate;
  return (
    <div
      data-disabled={disabledState}
      className="datepicker-widget"
      style={{ height, display: visibility ? '' : 'none', borderRadius: `${borderRadius}px` }}
    >
      <Datetime
        onChange={onDateChange}
        timeFormat={enableTime}
        closeOnSelect={true}
        dateFormat={isDateFormat}
        placeholderText={defaultValue}
        inputProps={{ placeholder: defaultValue, style: { height, borderRadius: `${borderRadius}px` } }}
        onOpen={(event) => {
          onComponentClick(id, component, event);
        }}
        renderInput={(props) => {
          return (
            <input
              readOnly
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
