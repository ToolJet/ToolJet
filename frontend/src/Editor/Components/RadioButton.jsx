import React, { useEffect } from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

export const RadioButton = function RadioButton({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
  onEvent,
}) {
  const label = component.definition.properties.label.value;
  const textColorProperty = component.definition.styles.textColor;
  const textColor = textColorProperty ? textColorProperty.value : '#000';

  const defaultValue = component.definition.properties.value.value;
  const values = component.definition.properties.values.value;
  const displayValues = component.definition.properties.display_values.value;
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  let parsedValues = values;

  try {
    parsedValues = resolveReferences(values, currentState, []);
  } catch (err) {
    console.log(err);
  }

  let parsedDisplayValues = displayValues;

  try {
    parsedDisplayValues = resolveReferences(displayValues, currentState, []);
  } catch (err) {
    console.log(err);
  }

  let parsedDefaultValue = defaultValue;

  try {
    parsedDefaultValue = resolveReferences(defaultValue, currentState, []);
  } catch (err) {
    console.log(err);
  }

  const value = currentState?.components[component?.name]?.value ?? parsedDefaultValue;

  let selectOptions = [];

  try {
    selectOptions = [
      ...parsedValues.map((value, index) => {
        return { name: parsedDisplayValues[index], value: value };
      }),
    ];
  } catch (err) {
    console.log(err);
  }

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

  function onSelect(selection) {
    onComponentOptionChanged(component, 'value', selection);
    if (selection) {
      onEvent('onSelectionChange', { component });
    }
  }

  useEffect(() => {
    onComponentOptionChanged(component, 'value', parsedDefaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedDefaultValue]);

  return (
    <div
      data-disabled={parsedDisabledState}
      className="row"
      style={{ width, height, display: parsedWidgetVisibility ? '' : 'none' }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component);
      }}
    >
      <span className="form-check-label form-check-label col-auto py-1" style={{ color: textColor }}>
        {label}
      </span>
      <div className="col py-1">
        {selectOptions.map((option, index) => (
          <label key={index} className="form-check form-check-inline">
            <input
              className="form-check-input"
              checked={value === option.value}
              type="radio"
              value={option.value}
              name={`${id}-radio-options`}
              onChange={() => onSelect(option.value)}
            />
            <span className="form-check-label" style={{ color: textColor }}>
              {option.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
