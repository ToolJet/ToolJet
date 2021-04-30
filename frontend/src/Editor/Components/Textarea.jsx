import React, { useState, useEffect } from 'react';
import { resolveReferences } from '@/_helpers/utils';

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

  return (
    <textarea
      onClick={() => onComponentClick(id, component)}
      onChange={(e) => {
        setText(e.target.value);
        onComponentOptionChanged(component, 'value', e.target.value);
      }}
      type="text"
      className="form-control"
      placeholder={placeholder}
      style={{ width, height }}
      value={text}
    ></textarea>
  );
};
