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
    let newValue = undefined;
    if (values?.includes(value)) newValue = value;

    setCurrentValue(newValue);
    setExposedVariable('value', newValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    let newValue = undefined;
    if (values?.includes(currentValue)) newValue = currentValue;
    else if (values?.includes(value)) newValue = value;

    setCurrentValue(newValue);
    setExposedVariable('value', newValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  const onSearchTextChange = (searchText) => {
    setExposedVariable('searchText', searchText);
    fireEvent('onSearchTextChanged');
  };

  return (
    <>
      <div className="dropdown-widget row g-0" style={{ height, display: visibility ? '' : 'none' }}>
        <div className="col-auto my-auto">
          <label style={{ marginRight: label !== '' ? '1rem' : '0.001rem' }} className="form-label py-1">
            {label}
          </label>
        </div>
        <div className="col px-0 h-100">
          <SelectSearch
            disabled={disabledState}
            options={properties.loadingState ? [] : selectOptions}
            emptyMessage={properties.loadingState ? 'Loading options..' : 'There are no options'}
            placeholder={'Select..'}
            value={currentValue}
            search={true}
            onChange={(newVal) => {
              setCurrentValue(newVal);
              setExposedVariable('value', newVal).then(() => fireEvent('onSelect'));
            }}
            filterOptions={fuzzySearch}
            renderValue={(valueProps) => (
              <input
                {...valueProps}
                className="select-search__input"
                onChange={(event) => {
                  valueProps.onChange(event);
                  onSearchTextChange(event.target.value);
                }}
              />
            )}
          />
        </div>
      </div>
      <div className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}>{validationError}</div>
    </>
  );
};
