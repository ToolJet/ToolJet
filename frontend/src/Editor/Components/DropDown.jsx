import React, { useState, useEffect } from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const DropDown = function DropDown({
  height,
  component,
  currentState,
  validate,
  properties,
  styles,
  setExposedVariable,
  fireEvent,
}) {
  console.log('currentState', currentState);

  const [currentValue, setCurrentValue] = useState(() => value);
  const { label, value, display_values, values } = properties;
  const { visibility, disabledState } = styles;

  let selectOptions = [];

  try {
    selectOptions = [
      ...values.map((value, index) => {
        return { name: display_values[index], value: value };
      }),
    ];
  } catch (err) {
    console.log(err);
  }

  const validationData = validate(value);
  const { isValid, validationError } = validationData;

  const currentValidState = currentState?.components[component?.name]?.isValid;

  if (currentValidState !== isValid) {
    setExposedVariable('isValid', isValid);
  }

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    setExposedVariable('value', currentValue).then(() => fireEvent('onSelect'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  return (
    <div className="dropdown-widget row g-0" style={{ height, display: visibility ? '' : 'none' }}>
      <div className="col-auto my-auto">
        <label style={{ marginRight: label !== '' ? '1rem' : '0.001rem' }} className="form-label py-1">
          {label}
        </label>
      </div>
      <div className="col px-0 h-100">
        <SelectSearch
          disabled={disabledState}
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
