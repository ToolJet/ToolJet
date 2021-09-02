import React from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

export const TextInput = function TextInput({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged
}) {
  console.log('currentState', currentState);

  const placeholder = component.definition.properties.placeholder.value;
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disableState = component.definition.styles?.disableState?.value ?? false;

  const parsedDisableState = typeof disableState !== 'boolean' ? resolveWidgetFieldValue(disableState, currentState) : disableState;

  let parsedWidgetVisibility = widgetVisibility;
  
  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) { console.log(err); }

  return (
    <input
      disabled={parsedDisableState}
      onClick={event => {event.stopPropagation(); onComponentClick(id, component)}}
      onChange={(e) => onComponentOptionChanged(component, 'value', e.target.value)}
      type="text"
      className="form-control"
      placeholder={placeholder}
      style={{ width, height, display:parsedWidgetVisibility ? '' : 'none' }}
    />
  );
};
