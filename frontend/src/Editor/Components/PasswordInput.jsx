import React, { useState } from 'react';
import { resolveWidgetFieldValue } from '@/_helpers/utils';

export const PasswordInput = ({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
  validate,
}) => {
  const value = currentState?.components[component?.name]?.value;
  const [text, setText] = useState(() => value ?? '');

  const placeholder = component.definition.properties.placeholder.value;
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  const parsedWidgetVisibility =
    typeof widgetVisibility !== 'boolean' ? resolveWidgetFieldValue(widgetVisibility, currentState) : widgetVisibility;

  const currentValidState = currentState?.components[component?.name]?.isValid;

  const validationData = validate(value);

  const { isValid, validationError } = validationData;

  if (currentValidState !== isValid) {
    onComponentOptionChanged(component, 'isValid', isValid);
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
        type={'password'}
        className={`form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon rounded-0`}
        placeholder={placeholder}
        value={text}
        style={{ width, height, display: parsedWidgetVisibility ? '' : 'none' }}
      />

      <div className="invalid-feedback">{validationError}</div>
    </div>
  );
};
