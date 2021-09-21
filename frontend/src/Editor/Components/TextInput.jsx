import React, { useEffect, useState } from 'react';
import { resolveReferences, resolveWidgetFieldValue, validateWidget } from '@/_helpers/utils';

export const TextInput = function TextInput({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
}) {
  const placeholder = component.definition.properties.placeholder.value;
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  let parsedWidgetVisibility = widgetVisibility;
  const value = currentState?.components[component?.name]?.value;
  const currentValidState = currentState?.components[component?.name]?.isValid;

  const [text, setText] = useState(value);

  const textProperty = component.definition.properties.value;
  let newText = value;
  if (textProperty && currentState) {
    newText = resolveReferences(textProperty.value, currentState, '');
  }

  useEffect(() => {
    setText(newText);
    onComponentOptionChanged(component, 'value', newText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newText]);

  const validationData = validateWidget({
    validationObject: component.definition.validation,
    widgetValue: value,
    currentState,
  });

  const { isValid, validationError } = validationData;

  if (currentValidState !== isValid) {
    onComponentOptionChanged(component, 'isValid', isValid);
  }

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

  return (
    <div>
      <input
        disabled={parsedDisabledState}
        onClick={(event) => {
          event.stopPropagation();
          onComponentClick(id, component);
        }}
        onChange={(e) => {
          setText(e.target.value);
          onComponentOptionChanged(component, 'value', e.target.value);
        }}
        type="text"
        className={`form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon`}
        placeholder={placeholder}
        style={{ width, height, display: parsedWidgetVisibility ? '' : 'none' }}
        value={text}
      />
      <div className="invalid-feedback">{validationError}</div>
    </div>
  );
};
