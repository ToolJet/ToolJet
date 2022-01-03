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
}) {
  const { label, value, display_values, values } = properties;
  const { visibility, disabledState } = styles;
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

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      // background: '#fff',
      // borderColor: '#9e9e9e',
      minHeight: height,
      height: height,
      boxShadow: state.isFocused ? null : null,
      borderRadius: 0,
    }),

    valueContainer: (provided, state) => ({
      ...provided,
      height: height,
      padding: '0 6px',
    }),

    input: (provided, _state) => ({
      ...provided,
      margin: '0px',
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
            backgroundColor: state.value === currentValue ? '#2585FE' : 'rgb(31,40,55)',
            ':hover': {
              backgroundColor: '#2F3C4C',
            },
            ':active': {
              backgroundColor: '#2585FE',
            },
          }
        : {
            backgroundColor: state.value === currentValue ? '#2585FE' : 'white',
          };
      return {
        ...provided,
        height: height,
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
    menuPortal: (provided, _state) => ({
      ...provided,
      // backgroundColor: '#4c67b3',
    }),
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
          <Select
            disabled={disabledState}
            value={selectOptions.filter((option) => option.value === currentValue)[0]}
            onChange={(selectedOption) => {
              setCurrentValue(selectedOption.value);
              setExposedVariable('value', selectedOption.value).then(() => fireEvent('onSelect'));
            }}
            options={selectOptions}
            styles={customStyles}
          />
        </div>
      </div>
      <div className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}>{validationError}</div>
    </>
  );
};
