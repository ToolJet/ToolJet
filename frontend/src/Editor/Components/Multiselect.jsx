import React, { useState, useEffect } from 'react';
import { resolveReferences, getParsedValue } from '@/_helpers/utils';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const Multiselect = function Multiselect({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged
}) {
  console.log('currentState', currentState);

  const label = component.definition.properties.label.value;
  const values = component.definition.properties.option_values.value;
  const displayValues = component.definition.properties.display_values.value;
  const widgetVisibility = component.definition.styles?.visibility?.value || true;
  const disableState = component.definition.properties?.disableState?.value || false;

  const parsedDisableState = typeof disableState !== 'boolean' ? getParsedValue(resolveReferences, disableState, currentState) : disableState;

  const parsedValues = JSON.parse(values);
  const parsedDisplayValues = JSON.parse(displayValues);

  const selectOptions = [
    ...parsedValues.map((value, index) => {
      return { name: parsedDisplayValues[index], value: value };
    })
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
  } catch (err) { console.log(err); }

  useEffect(() => {
    setCurrentValue(newValue);
  }, [newValue]);

  return (
    <div className="row g-0" style={{ width, height, display:parsedWidgetVisibility ? '' : 'none' }} onClick={event => {event.stopPropagation(); onComponentClick(id, component)}}>
      <div className="col-auto">
        <label style={{marginRight: '1rem'}} className="form-label py-2">{label}</label>
      </div>
      <div className="col px-0">
        <SelectSearch
          disabled={parsedDisableState}
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
