import React, { useState, useEffect } from 'react';
import { resolveReferences } from '@/_helpers/utils';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const DropDown = function DropDown({
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
  const values = component.definition.properties.values.value;
  const displayValues = component.definition.properties.display_values.value;

  let parsedValues = values;

  try {
    parsedValues = resolveReferences(values, currentState, []);
  } catch (err) { console.log(err); }

  let parsedDisplayValues = displayValues;

  try {
    parsedDisplayValues = resolveReferences(displayValues, currentState, []);
  } catch (err) { console.log(err); }

  let selectOptions = [];

  try {
    selectOptions = [
      ...parsedValues.map((value, index) => {
        return { name: parsedDisplayValues[index], value: value };
      })
    ];
  } catch (err) { console.log(err); }

  const currentValueProperty = component.definition.properties.value;
  const value = currentValueProperty ? currentValueProperty.value : '';
  const [currentValue, setCurrentValue] = useState(value);

  let newValue = value;
  if (currentValueProperty && currentState) {
    newValue = resolveReferences(currentValueProperty.value, currentState, '');
  }

  useEffect(() => {
    setCurrentValue(newValue);
  }, [newValue]);

  return (
    <div className="row" style={{ width, height }} onClick={() => onComponentClick(id, component)}>
      <div className="col-auto">
        <label className="form-label p-2">{label}</label>
      </div>
      <div className="col">
        <SelectSearch
          options={selectOptions}
          value={currentValue}
          search={true}
          onChange={(newVal) => {
            onComponentOptionChanged(component, 'value', newVal);
          }}
          filterOptions={fuzzySearch}
          placeholder="Select.."
        />
      </div>
    </div>
  );
};
