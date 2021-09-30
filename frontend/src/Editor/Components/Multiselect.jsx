import React, { useState, useEffect } from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const Multiselect = function Multiselect({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
}) {
  console.log('currentState', currentState);

  const label = component.definition.properties.label.value;
  const values = component.definition.properties.option_values.value;
  const displayValues = component.definition.properties.display_values.value;
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  const parsedValues = JSON.parse(values);
  const parsedDisplayValues = JSON.parse(displayValues);

  const selectOptions = [
    ...parsedValues.map((value, index) => {
      return { name: parsedDisplayValues[index], value: value };
    }),
  ];

  const currentValueProperty = component.definition.properties.values;
  const value = currentValueProperty ? currentValueProperty.value : '';
  const [currentValue, setCurrentValue] = useState(value);

  let newValue = value;
  if (currentValueProperty && currentState) {
    newValue = resolveReferences(currentValueProperty.value, currentState, '');
  }

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

  useEffect(() => {
    setCurrentValue(newValue);
  }, [newValue]);

  return (
    <div
      className="multiselect-widget row g-0 p-1"
      style={{ width, height, display: parsedWidgetVisibility ? '' : 'none' }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component);
      }}
    >
      <div className="col-auto">
        <label style={{ marginRight: '1rem' }} className="form-label py-1">
          {label}
        </label>
      </div>
      <div className="col px-0">
        <SelectSearch
          disabled={parsedDisabledState}
          options={selectOptions}
          value={currentValue}
          search={true}
          multiple={true}
          printOptions="on-focus"
          onChange={(newValues) => {
            onComponentOptionChanged(component, 'values', newValues);
          }}
          filterOptions={fuzzySearch}
          placeholder="Select.."
        />
      </div>
    </div>
  );
};
