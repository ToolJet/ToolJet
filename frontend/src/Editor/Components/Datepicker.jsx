import React from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import { resolve_references } from '@/_helpers/utils';

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

  const enableTime = resolve_references(enableTimeProp.value, currentState, false);

  let enableDate = true;
  if (enableDateProp) {
    enableDate = resolve_references(enableDateProp.value, currentState, true);
  }

  function onDateChange(event) {
    onComponentOptionChanged(component, 'value', event.format(formatProp.value));
  }

  return (
    <div style={{ width, height }} onClick={() => onComponentClick(id, component)}>
      <Datetime onChange={onDateChange} timeFormat={enableTime} dateFormat={enableDate} />
    </div>
  );
};
