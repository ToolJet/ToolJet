import React, { useEffect, useState } from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import { resolveReferences, resolveWidgetFieldValue, validateWidget } from '@/_helpers/utils';

export const Datepicker = function Datepicker({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
}) {
  console.log('currentState', currentState);

  const formatProp = component.definition.properties.format;
  const enableTimeProp = component.definition.properties.enableTime;
  const enableDateProp = component.definition.properties.enableDate;
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;
  const defaultValue = component.definition.properties?.defaultValue?.value ?? '';

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

  const enableTime = resolveReferences(enableTimeProp.value, currentState, false);

  let enableDate = true;
  if (enableDateProp) {
    // eslint-disable-next-line no-unused-vars
    enableDate = resolveReferences(enableDateProp.value, currentState, true);
  }

  let dateFormat = formatProp;
  try {
    dateFormat = resolveReferences(formatProp, currentState);
  } catch (err) {
    console.log(err);
  }

  function onDateChange(event) {
    const selectedDateFormat = enableTime ? `${dateFormat.value} LT` : dateFormat.value;
    const value = event._isAMomentObject ? event.format(selectedDateFormat) : event;

    setDateText(value);
    onComponentOptionChanged(component, 'value', value);
  }

  let value = defaultValue;
  if (value && currentState) value = resolveReferences(value, currentState, '');

  const [dateText, setDateText] = useState(value);

  useEffect(() => {
    setDateText(value);
    onComponentOptionChanged(component, 'value', value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const validationData = validateWidget({
    validationObject: component.definition.validation,
    widgetValue: value,
    currentState,
  });

  const { isValid, validationError } = validationData;

  const currentValidState = currentState?.components[component?.name]?.isValid;

  if (currentValidState !== isValid) {
    onComponentOptionChanged(component, 'isValid', isValid);
  }

  return (
    <div
      data-disabled={parsedDisabledState}
      className="datepicker-widget"
      style={{ width, height, display: parsedWidgetVisibility ? '' : 'none' }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component, event);
      }}
    >
      <Datetime
        onChange={onDateChange}
        timeFormat={enableTime}
        closeOnSelect={true}
        dateFormat={dateFormat.value}
        value={dateText}
        renderInput={(props) => {
          return (
            <input
              {...props}
              value={dateText}
              className={`input-field form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon px-2`}
            />
          );
        }}
      />
      <div className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}>{validationError}</div>
    </div>
  );
};
