import React, { useState, useEffect } from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';
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
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disableState = component.definition.styles?.disableState?.value ?? false;

  const parsedDisableState = typeof disableState !== 'boolean' ? resolveWidgetFieldValue(disableState, currentState) : disableState;

  let parsedValues = values;

  try {
    parsedValues = resolveReferences(values, currentState, []);
  } catch (err) { console.log(err); }

  let parsedDisplayValues = displayValues;

  try {
    parsedDisplayValues = resolveReferences(displayValues, currentState, []);
  } catch (err) { console.log(err); }
  
  let parsedWidgetVisibility = widgetVisibility;
  
  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
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
  const [currentValue, setCurrentValue] = useState('');

  let newValue = value;
  if (currentValueProperty && currentState) {
    newValue = resolveReferences(currentValueProperty.value, currentState, '');
  }

  useEffect(() => {
    setCurrentValue(newValue);
  }, [newValue]);

  useEffect(() => {
    onComponentOptionChanged(component, 'value', currentValue);
  }, [currentValue]);

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
          onChange={(newVal) => {
            setCurrentValue(newVal);
          }}
          filterOptions={fuzzySearch}
          placeholder="Select.."
        />
      </div>
    </div>
  );
};
