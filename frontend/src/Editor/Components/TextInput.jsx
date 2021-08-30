import React from 'react';
import { resolveReferences } from '@/_helpers/utils';

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
  const widgetVisibility = component.definition.styles?.visibility?.value || true;

  let parsedWidgetVisibility = widgetVisibility;
  
  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) { console.log(err); }

  return (
    <input
      onClick={event => {event.stopPropagation(); onComponentClick(id, component)}}
      onChange={(e) => onComponentOptionChanged(component, 'value', e.target.value)}
      type="text"
      className="form-control"
      placeholder={placeholder}
      style={{ width, height, display:parsedWidgetVisibility ? '' : 'none' }}
    />
  );
};
