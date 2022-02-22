import React from 'react';
import SelectComponent from 'react-select';
import FxButton from './FxButton';

export const Select = ({ value, onChange, forceCodeBox, meta }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const options = meta.options.map((option) => {
    return {
      value: option.value,
      label: option.name,
    };
  });

  const selectStyles = {
    container: (provided) => ({
      ...provided,
      width: 224,
      height: 32,
    }),
    control: (provided) => ({
      ...provided,
      borderColor: 'hsl(0, 0%, 80%)',
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'hsl(0, 0%, 80%)',
      },
      backgroundColor: darkMode ? '#2b3547' : '#fff',
      height: '32px!important',
      minHeight: '32px!important',
    }),
    valueContainer: (provided, _state) => ({
      ...provided,
      height: 32,
      marginBottom: '4px',
    }),
    indicatorsContainer: (provided, _state) => ({
      ...provided,
      height: 32,
    }),
    indicatorSeparator: (_state) => ({
      display: 'none',
    }),
    input: (provided) => ({
      ...provided,
      color: darkMode ? '#fff' : '#232e3c',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 2,
      backgroundColor: darkMode ? 'rgb(31,40,55)' : 'white',
    }),
    option: (provided) => ({
      ...provided,
      backgroundColor: darkMode ? '#2b3547' : '#fff',
      color: darkMode ? '#fff' : '#232e3c',
      ':hover': {
        backgroundColor: darkMode ? '#323C4B' : '#d8dce9',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: darkMode ? '#fff' : '#808080',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: darkMode ? '#fff' : '#232e3c',
    }),
  };

  return (
    <div className="row">
      <div className="col">
        <div className="field mb-3">
          <SelectComponent
            options={options}
            value={value}
            search={true}
            onChange={onChange}
            placeholder="Select.."
            styles={selectStyles}
          />
        </div>
      </div>
      <div className="col-auto pt-2">
        <FxButton active={false} onPress={forceCodeBox} />
      </div>
    </div>
  );
};
