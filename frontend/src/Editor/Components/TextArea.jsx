import React from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

export const TextArea = function TextArea({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  properties,
  setProperty,
}) {
  const placeholder = properties.placeholder;
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

  return (
    <textarea
      disabled={parsedDisabledState}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component);
      }}
      onChange={(e) => {
        setProperty('value', e.target.value);
      }}
      type="text"
      className="form-control"
      placeholder={placeholder}
      style={{ width, height, display: parsedWidgetVisibility ? '' : 'none' }}
      value={properties.value}
    ></textarea>
  );
};
