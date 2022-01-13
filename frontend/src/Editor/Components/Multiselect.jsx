import _ from 'lodash';
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
  const { label, value, values, display_values } = properties;
  const { visibility, disabledState } = styles;

  useEffect(() => {
    let newValues = [];

    if (_.intersection(values, value)?.length === value?.length) newValues = value;

    setExposedVariable('values', newValues);
    setCurrentValue(newValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  useEffect(() => {
    setExposedVariable('values', value);
    setCurrentValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

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

  useEffect(() => {
    if (value && !currentValue) {
      setCurrentValue(properties.value);
    }

    if (JSON.stringify(exposedVariables.values) === '{}') {
      setCurrentValue(properties.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (value) => {
    setCurrentValue(value);
    setExposedVariable('values', value).then(() => fireEvent('onSelect'));
  };

  return (
    <div className="multiselect-widget row g-0" style={{ height, display: visibility ? '' : 'none' }}>
      <div className="col-auto my-auto">
        <label style={{ marginRight: label? '1rem' :''}} className="form-label py-1">
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
