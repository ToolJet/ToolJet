import React, { useState, useEffect } from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

export const TextArea = function TextArea({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged
}) {
  console.log('currentState', currentState);

  const value = component.definition.properties.value ? component.definition.properties.value.value : '';
  const [text, setText] = useState(value);

  const textProperty = component.definition.properties.value;
  let newText = value;
  if (textProperty && currentState) {
    newText = resolveReferences(textProperty.value, currentState, '');
  }

  useEffect(() => {
    setText(newText);
  }, [newText]);
  
  const placeholder = component.definition.properties.placeholder.value;
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disableState = component.definition.styles?.disableState?.value ?? false;

  const parsedDisableState = typeof disableState !== 'boolean' ? resolveWidgetFieldValue(disableState, currentState) : disableState;

  let parsedWidgetVisibility = widgetVisibility;
  
  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) { console.log(err); }

  return (
    <textarea
      disabled={parsedDisableState}
      onClick={event => {event.stopPropagation(); onComponentClick(id, component)}}
      onChange={(e) => {
        setText(e.target.value);
        onComponentOptionChanged(component, 'value', e.target.value);
      }}
      type="text"
      className="form-control"
      placeholder={placeholder}
      style={{ width, height, display:parsedWidgetVisibility ? '' : 'none' }}
      value={text}
    ></textarea>
  );
};
