import React, { useState, useEffect } from 'react';
import { resolveReferences, resolveWidgetFieldValue, validateWidget } from '@/_helpers/utils';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const DropDown = function DropDown({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
  onEvent,
}) {
  console.log('currentState', currentState);

  const label = component.definition.properties.label.value;
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

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

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

  const currentValueProperty = component.definition.properties.value;
  const value = currentValueProperty ? currentValueProperty.value : '';
  const [currentValue, setCurrentValue] = useState('');

  let newValue = value;
  if (currentValueProperty && currentState) {
    newValue = resolveReferences(currentValueProperty.value, currentState, '');
  }

  const validationData = validateWidget({
    validationObject: component.definition.validation,
    widgetValue: currentValue,
    currentState,
  });

  const { isValid, validationError } = validationData;

  const currentValidState = currentState?.components[component?.name]?.isValid;

  if (currentValidState !== isValid) {
    onComponentOptionChanged(component, 'isValid', isValid);
  }

  useEffect(() => {
    setCurrentValue(newValue);
  }, [newValue]);

  useEffect(() => {
    onComponentOptionChanged(component, 'value', currentValue).then(() => onEvent('onSelect', { component }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  return (
    <div
      className="dropdown-widget row g-0"
      style={{ width, height, display: parsedWidgetVisibility ? '' : 'none' }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component);
      }}
    >
      <div className="col-auto">
        <label style={{ marginRight: label !== '' ? '1rem' : '0.001rem' }} className="form-label py-1">
          {label}
        </label>
      </div>
      <div className="col px-0 h-100">
        <SelectSearch
          disabled={parsedDisabledState}
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
      <div className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}>{validationError}</div>
    </div>
  );
};
