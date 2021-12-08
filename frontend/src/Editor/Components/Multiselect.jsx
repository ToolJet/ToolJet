import React, { useState, useEffect } from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const Multiselect = function Multiselect({
  height,

  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  fireEvent,
}) {
  const { label, values, display_values } = properties;
  const { visibility, disabledState } = styles;

  const [currentValue, setCurrentValue] = useState(() => properties.value);
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

  useEffect(() => {
    if (properties.value && !currentValue) {
      setCurrentValue(properties.value);
    }

    if (JSON.stringify(exposedVariables.values) === '{}') {
      setCurrentValue(properties.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  const handleChange = (value) => {
    setCurrentValue(value);
    setExposedVariable('values', value).then(() => fireEvent('onSelect'));
  };

  return (
    <div className="multiselect-widget row g-0" style={{ height, display: visibility ? '' : 'none' }}>
      <div className="col-auto my-auto">
        <label style={{ marginRight: '1rem' }} className="form-label py-1">
          {label}
        </label>
      </div>
      <div className="col px-0 h-100">
        <SelectSearch
          disabled={disabledState}
          options={selectOptions}
          value={currentValue}
          search={true}
          multiple={true}
          printOptions="on-focus"
          onChange={(newValues) => {
            handleChange(newValues);
          }}
          filterOptions={fuzzySearch}
          placeholder="Select.."
        />
      </div>
    </div>
  );
};
