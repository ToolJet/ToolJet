import _ from 'lodash';
import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';

export const Multiselect = function Multiselect({
  id,
  component,
  height,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  fireEvent,
  onComponentClick,
  darkMode,
}) {
  const { label, value, values, display_values } = properties;
  const { borderRadius, visibility, disabledState } = styles;
  const selectRef = useRef(null);
  const [computedValues, setComputedValues] = useState();

  useEffect(() => {
    let newValues = [];

    if (_.intersection(values, value)?.length === value?.length) newValues = value;

    setExposedVariable('values', newValues);
    setCurrentValue(newValues);
    setComputedValues(computeSelectedValues(newValues));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  useEffect(() => {
    setExposedVariable('values', value);
    setComputedValues(computeSelectedValues(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  const [currentValue, setCurrentValue] = useState(() => value);
  let selectOptions = [];
  try {
    selectOptions = [
      ...values.map((value, index) => {
        return { label: display_values[index], value: value };
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
  }, []);

  const handleChange = (value) => {
    setComputedValues(value);
    setExposedVariable('values', value).then(() => fireEvent('onSelect'));
  };

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      background: darkMode ? 'rgb(31,40,55)' : 'white',
      minHeight: height,
      height: height,
      boxShadow: state.isFocused ? null : null,
      borderRadius: Number.parseFloat(borderRadius),
    }),

    valueContainer: (provided, _state) => ({
      ...provided,
      height: height,
      padding: '0 6px',
    }),

    input: (provided, _state) => ({
      ...provided,
      color: darkMode ? 'white' : 'black',
    }),
    indicatorSeparator: (_state) => ({
      display: 'none',
    }),
    indicatorsContainer: (provided, _state) => ({
      ...provided,
      height: height,
    }),
    option: (provided) => ({
      ...provided,
      height: 'auto',
      display: 'flex',
      flexDirection: 'rows',
      alignItems: 'center',
      color: darkMode ? 'white' : 'black',
      backgroundColor: darkMode ? 'rgb(31,40,55)' : 'white',
      ':hover': {
        backgroundColor: darkMode ? '#323C4B' : '#4D72FA',
        color: 'white',
      },
    }),
    menu: (provided, _state) => ({
      ...provided,
      backgroundColor: darkMode ? 'rgb(31,40,55)' : 'white',
    }),
    multiValue: (styles) => ({
      ...styles,
      height: height - 10,
      display: 'flex',
      flexDirection: 'rows',
      alignItems: 'center',
    }),
    multiValueLabel: (styles) => ({
      ...styles,
      padding: 0,
    }),
    multiValueRemove: (styles) => ({
      ...styles,
      color: 'black',
    }),
  };

  function computeSelectedValues(selectedValues) {
    const options = [];
    selectedValues.map((value) => {
      selectOptions.forEach((option) => {
        option.value === value && options.push(option);
      });
    });
    return options;
  }

  return (
    <div className="multiselect-widget row g-0" style={{ height, display: visibility ? '' : 'none' }}>
      <div className="col-auto my-auto">
        <label style={{ marginRight: label ? '1rem' : '' }} className="form-label py-1">
          {label}
        </label>
      </div>
      <div className="col px-0 h-100">
        <Select
          isDisabled={disabledState}
          options={selectOptions}
          value={computedValues}
          isSearchable={true}
          isMulti={true}
          onChange={(selectedOption, actionProps) => {
            if (actionProps.action === 'select-option' || actionProps.action === 'remove-value') {
              handleChange(selectedOption);
            }
          }}
          placeholder="Select.."
          ref={selectRef}
          closeMenuOnSelect={false}
          onFocus={(event) => {
            onComponentClick(id, component, event);
          }}
          styles={customStyles}
        />
      </div>
    </div>
  );
};
