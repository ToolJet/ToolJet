import React from 'react';
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
    enableDate = resolveReferences(enableDateProp.value, currentState, true); //check: enableDate is never used
  }

  let dateFormat = formatProp;
  try {
    dateFormat = resolveReferences(formatProp, currentState);
  } catch (err) {
    console.log(err);
  }

  function onDateChange(event) {
    onComponentOptionChanged(component, 'value', event.format(dateFormat.value));
  }

  const value = currentState?.components[component?.name]?.value;

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
      style={{ width, height, display: parsedWidgetVisibility ? '' : 'none' }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component);
      }}
    >
      <Datetime onChange={onDateChange} timeFormat={enableTime} closeOnSelect={true} dateFormat={dateFormat.value} />
      <div className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}>{validationError}</div>
    </div>
  );
};
