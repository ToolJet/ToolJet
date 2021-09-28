import React, { useEffect, useState } from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

export const NumberInput = function NumberInput({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
}) {
  const value = component.definition.properties.value ? component.definition.properties.value.value : '';
  const [number, setNumber] = useState(value);

  const numberInputProperty = component.definition.properties.value;
  let newNumber = value;
  if (numberInputProperty && currentState) {
    newNumber = resolveReferences(numberInputProperty.value, currentState, '');
  }

  useEffect(() => {
    setNumber(parseInt(newNumber));
    onComponentOptionChanged(component, 'value', parseInt(newNumber));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newNumber]);

  const placeholder = component.definition.properties?.placeholder?.value ?? 0;
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
    <input
      disabled={parsedDisabledState}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component);
      }}
      onChange={(e) => {
        setNumber(parseInt(e.target.value));
        onComponentOptionChanged(component, 'value', parseInt(e.target.value));
      }}
      type="number"
      className="form-control"
      placeholder={placeholder}
      style={{ width, height, display: parsedWidgetVisibility ? '' : 'none' }}
      value={number}
    />
  );
};
