import React from 'react';

export const TextInput = function TextInput({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
}) {
  console.log('currentState', currentState);

  const placeholder = component.definition.properties.placeholder.value;

  return (
    <input
      onClick={() => onComponentClick(id, component)}
      onChange={(e) => onComponentOptionChanged(component, 'value', e.target.value)}
      type="text"
      class="form-control"
      placeholder={placeholder}
      style={{ width, height }}
    />
  );
};
