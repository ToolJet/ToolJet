import React, { useState, useEffect } from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const DropDown = function DropDown({ height, validate, properties, styles, setExposedVariable, fireEvent }) {
  const { label, value, display_values, values } = properties;
  const { visibility, disabledState } = styles;
  const [currentValue, setCurrentValue] = useState(() => value);

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

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

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
