/* eslint-disable prettier/prettier */
import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import { TextField, MenuItem, CircularProgress } from '@mui/material';

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
  registerAction,
  dataCy,
}) {
  let { label, value, advanced, schema, placeholder, display_values, values } = properties;
  const { selectedTextColor, borderRadius, visibility, disabledState, justifyContent, boxShadow } = styles;
  const [currentValue, setCurrentValue] = useState(() => (advanced ? findDefaultItem(schema) : value));
  const { value: exposedValue } = exposedVariables;

  function findDefaultItem(schema) {
    const foundItem = schema?.find((item) => item?.default === true);
    return !hasVisibleFalse(foundItem?.value) ? foundItem?.value : undefined;
  }

  if (advanced) {
    values = schema?.map((item) => item?.value);
    display_values = schema?.map((item) => item?.label);
    value = findDefaultItem(schema);
  } else if (!_.isArray(values)) {
    values = [];
  }

  let selectOptions = [];

  try {
    selectOptions = advanced
      ? [
          ...schema
            .filter((data) => data.visible)
            .map((value) => ({
              ...value,
              isDisabled: value.disable,
            })),
        ]
      : [
          ...values.map((value, index) => {
            return { label: display_values[index], value: value };
          }),
        ];
  } catch (err) {
    console.log(err);
  }

  const setExposedItem = (value, index, onSelectFired = false) => {
    setCurrentValue(value);
    onSelectFired ? setExposedVariable('value', value).then(fireEvent('onSelect')) : setExposedVariable('value', value);
    setExposedVariable('selectedOptionLabel', index === undefined ? undefined : display_values?.[index]);
  };

  function selectOption(value) {
    let index = null;
    index = values?.indexOf(value);

    if (values?.includes(value)) {
      setExposedItem(value, index, true);
    } else {
      setExposedItem(undefined, undefined, true);
    }
  }

  registerAction(
    'selectOption',
    async function (value) {
      selectOption(value);
    },
    [JSON.stringify(values), setCurrentValue, JSON.stringify(display_values)]
  );

  const validationData = validate(value);
  const { isValid, validationError } = validationData;

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  useEffect(() => {
    let newValue = undefined;
    let index = null;
    if (values?.includes(value)) {
      newValue = value;
      index = values?.indexOf(value);
    }
    setExposedItem(newValue, index);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, JSON.stringify(values)]);

  useEffect(() => {
    let index = null;
    if (exposedValue !== currentValue) {
      setExposedVariable('value', currentValue);
    }
    index = values?.indexOf(currentValue);
    setExposedVariable('selectedOptionLabel', display_values?.[index]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, JSON.stringify(display_values), JSON.stringify(values)]);

  useEffect(() => {
    let newValue = undefined;
    let index = null;

    if (values?.includes(currentValue)) newValue = currentValue;
    else if (values?.includes(value)) newValue = value;
    index = values?.indexOf(newValue);
    setExposedItem(newValue, index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  useEffect(() => {
    setExposedVariable('label', label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    if (advanced) {
      setExposedVariable(
        'optionLabels',
        schema?.filter((item) => item?.visible)?.map((item) => item.label)
      );
      if (hasVisibleFalse(currentValue)) {
        setCurrentValue(findDefaultItem(schema));
      }
    } else setExposedVariable('optionLabels', display_values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(schema), advanced, JSON.stringify(display_values), currentValue]);

  function hasVisibleFalse(value) {
    for (let i = 0; i < schema?.length; i++) {
      if (schema[i].value === value && schema[i].visible === false) {
        return true;
      }
    }
    return false;
  }

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
      boxShadow: state.isFocused ? boxShadow : boxShadow,
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
            color: state.isDisabled ? '#88909698' : 'white',
            backgroundColor: state.value === currentValue ? '#3650AF' : 'rgb(31,40,55)',
            ':hover': {
              backgroundColor: state.isDisabled ? 'transparent' : state.value === currentValue ? '#1F2E64' : '#323C4B',
            },
            maxWidth: 'auto',
            minWidth: 'max-content',
          }
        : {
            backgroundColor: state.value === currentValue ? '#7A95FB' : 'white',
            color: state.isDisabled ? '#88909694' : state.value === currentValue ? 'white' : 'black',
            ':hover': {
              backgroundColor: state.isDisabled ? 'transparent' : state.value === currentValue ? '#3650AF' : '#d8dce9',
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
    <div
      className="dropdown-widget row g-0"
      style={{ height, display: visibility ? '' : 'none' }}
      data-cy={dataCy}
    >
      <TextField
        select
        label={label}
        defaultValue={value}
        disabled={disabledState}
        placeholder={placeholder}
        value={currentValue ? `${currentValue}` : ''}
        onChange={(event) => {
          const { value } = event.target;
          setCurrentValue(value);
          setExposedVariable('value', value).then(() => fireEvent('onSelect'));
          setExposedVariable('selectedOptionLabel', selectOptions.find((option) => option.value === value)?.label);
        }}
        style={customStyles.control({}, {})}
        sx={{ '& .MuiOutlinedInput-root': { height } }}
      >
        {properties.loadingState && (
          <CircularProgress
            size={20}
            sx={{ display: 'flex', justifySelf: 'center' }}
          />
        )}
        {!properties.loadingState &&
          selectOptions.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
            >
              <span>{option.label}</span>
            </MenuItem>
          ))}
      </TextField>
    </div>
  );
};
