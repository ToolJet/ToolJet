import React from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import { resolveReferences, getParsedValue } from '@/_helpers/utils';

export const Datepicker = function Datepicker({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged
}) {
  console.log('currentState', currentState);

  const formatProp = component.definition.properties.format;
  const enableTimeProp = component.definition.properties.enableTime;
  const enableDateProp = component.definition.properties.enableDate;
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disableState = component.definition.styles?.disableState?.value ?? false;

  const parsedDisableState = typeof disableState !== 'boolean' ? getParsedValue(resolveReferences, disableState, currentState) : disableState;

  let parsedWidgetVisibility = widgetVisibility;
  
  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) { console.log(err); }


  const enableTime = resolveReferences(enableTimeProp.value, currentState, false);

  let enableDate = true;
  if (enableDateProp) {
    enableDate = resolveReferences(enableDateProp.value, currentState, true);
  }
  
  let dateFormat = formatProp
  try {
    dateFormat = resolveReferences(formatProp, currentState);
  } catch (err) { console.log(err); }
  
  function onDateChange(event) {
    onComponentOptionChanged(component, 'value', event.format(dateFormat.value));
  }

  return (
    <div disabled={parsedDisableState}  style={{ width, height, display:parsedWidgetVisibility ? '' : 'none'}} onClick={event => {event.stopPropagation(); onComponentClick(id, component)}}>
      <Datetime onChange={onDateChange} timeFormat={enableTime} dateFormat={dateFormat.value} />
    </div>
  );
};
