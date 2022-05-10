import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
export const DropDown = function DropDown({
  height,
  validate,
  properties,
  styles,
  setExposedVariable,
  fireEvent,
  darkMode,
  onComponentClick,
  id,
  component,
  exposedVariables,
}) {
  let { label, value, display_values, values } = properties;
  const { selectedTextColor, borderRadius, visibility, disabledState, justifyContent } = styles;
  const [currentValue, setCurrentValue] = useState(() => value);
  const { value: exposedValue } = exposedVariables;

  if (!_.isArray(values)) {
    values = [];
  }

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

  const validationData = validate(value);
  const { isValid, validationError } = validationData;

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  useEffect(() => {
    let newValue = undefined;
    if (values?.includes(value)) {
      newValue = value;
    }
    setExposedVariable('value', value);
    setCurrentValue(newValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (exposedValue !== currentValue) setExposedVariable('value', currentValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  useEffect(() => {
    let newValue = undefined;
    if (values?.includes(currentValue)) newValue = currentValue;
    else if (values?.includes(value)) newValue = value;

    setCurrentValue(newValue);
    setExposedVariable('value', newValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  const onSearchTextChange = (searchText, actionProps) => {
    if (actionProps.action === 'input-change') {
      setExposedVariable('searchText', searchText);
      fireEvent('onSearchTextChanged');
    }
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
      justifyContent,
    }),

    singleValue: (provided, _state) => ({
      ...provided,
      color: disabledState ? 'grey' : selectedTextColor ? selectedTextColor : darkMode ? 'white' : 'black',
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
    option: (provided, state) => {
      const styles = darkMode
        ? {
            color: 'white',
            backgroundColor: state.value === currentValue ? '#3650AF' : 'rgb(31,40,55)',
            ':hover': {
              backgroundColor: state.value === currentValue ? '#1F2E64' : '#323C4B',
            },
            maxWidth: 'auto',
            minWidth: 'max-content',
          }
        : {
            backgroundColor: state.value === currentValue ? '#7A95FB' : 'white',
            color: state.value === currentValue ? 'white' : 'black',
            ':hover': {
              backgroundColor: state.value === currentValue ? '#3650AF' : '#d8dce9',
            },
            maxWidth: 'auto',
            minWidth: 'max-content',
          };
      return {
        ...provided,
        justifyContent,
        height: 'auto',
        display: 'flex',
        flexDirection: 'rows',
        alignItems: 'center',
        ...styles,
      };
    },
    menu: (provided, _state) => ({
      ...provided,
      backgroundColor: darkMode ? 'rgb(31,40,55)' : 'white',
    }),
  };

  return (
    <>
      <div
        className="dropdown-widget row g-0"
        style={{ height, display: visibility ? '' : 'none' }}
        onMouseDown={(event) => {
          onComponentClick(id, component, event);
        }}
      >
        <div className="col-auto my-auto">
          <label style={{ marginRight: label !== '' ? '1rem' : '0.001rem' }} className="form-label py-0 my-0">
            {label}
          </label>
        </div>
        <div className="col px-0 h-100">
          <Select
            isDisabled={disabledState}
            value={
              selectOptions.filter((option) => option.value === currentValue)[0] ?? { label: '', value: undefined }
            }
            onChange={(selectedOption, actionProps) => {
              if (actionProps.action === 'select-option') {
                setCurrentValue(selectedOption.value);
                setExposedVariable('value', selectedOption.value).then(() => fireEvent('onSelect'));
              }
            }}
            options={selectOptions}
            styles={customStyles}
            isLoading={properties.loadingState}
            onInputChange={onSearchTextChange}
            onFocus={(event) => onComponentClick(event, component, id)}
          />
        </div>
      </div>
      <div className={`invalid-feedback ${isValid ? '' : visibility ? 'd-flex' : 'none'}`}>{validationError}</div>
    </>
  );
};
