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
  const { label, value, values, display_values, showAllOption } = properties;
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
    showAllOption &&
      selectOptions.length != computedValues.length &&
      selectOptions.splice(0, 0, { label: 'All', value: 'all' });
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
    const filteredArray = value.filter((option) => {
      return option.value !== 'all';
    });
    setComputedValues(filteredArray);
    setExposedVariable(
      'values',
      filteredArray.map((option) => {
        return option.value;
      })
    ).then(() => fireEvent('onSelect'));
  };

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      background: darkMode ? 'rgb(31,40,55)' : 'white',
      minHeight: height,
      height: height,
      boxShadow: state.isFocused ? null : null,
      borderRadius: Number.parseFloat(borderRadius),
      alignItems: 'flex-start',
      overflow: 'hidden',
    }),

    valueContainer: (provided, _state) => ({
      ...provided,
      height: height,
      overflowY: 'auto',
      alignItems: 'flex-start',
      padding: '0px 5px',
    }),

    placeholder: (provided, _state) => ({
      ...provided,
      height: height,
      paddingTop: 4,
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
      height: 'auto',
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
      maxWidth: 'auto',
      minWidth: 'max-content',
    }),
    menu: (provided, _state) => ({
      ...provided,
      backgroundColor: darkMode ? 'rgb(31,40,55)' : 'white',
    }),
    multiValue: (styles) => ({
      ...styles,
      height: 20,
      display: 'flex',
      flexDirection: 'rows',
      alignItems: 'center',
      margin: 0,
      marginTop: 3,
      marginRight: 5,
      gap: 5,
      maxWidth: 'auto',
      minWidth: 'max-content',
    }),
    multiValueLabel: (styles) => ({
      ...styles,
      padding: 0,
    }),
    multiValueRemove: (styles) => ({
      ...styles,
      height: '100%',
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

  const onChange = (newValue, actionMeta) => {
    const { action, option, removedValue } = actionMeta;
    if (action === 'select-option' || action === 'remove-value') {
      if (option && option.value === 'all') {
        handleChange(selectOptions);
      } else if (action === 'remove-value' && removedValue.value === 'all') {
        handleChange([]);
      } else {
        handleChange(newValue);
      }
    } else if (action === 'clear') {
      handleChange([]);
    }
  };

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
          onChange={onChange}
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
