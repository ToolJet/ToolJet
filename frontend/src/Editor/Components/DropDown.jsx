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
  registerAction,
  dataCy,
}) {
  let { label, value, advanced, schema, placeholder, visibility } = properties;
  const { selectedTextColor, borderRadius, disabledState, justifyContent } = styles;
  const [currentValue, setCurrentValue] = useState(() => value);
  const [displayValues, setDisplayValues] = useState(advanced ? [] : properties.display_values);
  const [values, setValues] = useState(advanced ? [] : properties.values);
  const [disabledItems, setDisabledItems] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]);
  const { value: exposedValue } = exposedVariables;
  let displayValuesCopy = [];
  let valuesCopy = [];
  let disabledItemsCopy = [];
  let visibleItemCopy = [];

  useEffect(() => {
    setValues(advanced ? [] : properties.values);
    setDisplayValues(advanced ? [] : properties.display_values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, properties.values, properties.displayValues]);

  useEffect(() => {
    if (advanced) {
      schema?.length > 0 &&
        Array.isArray(schema) &&
        schema?.map((item) => {
          displayValuesCopy.push(item.label);
          valuesCopy.push(item.value);
          disabledItemsCopy.push(item.disable);
          visibleItemCopy.push(item.visible);
        });

      setDisplayValues(displayValuesCopy);
      setValues(valuesCopy);
      setDisabledItems(disabledItemsCopy);
      setVisibleItems(visibleItemCopy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema]);
  if (!_.isArray(values)) {
    setValues([]);
  }

  let selectOptions = [];

  try {
    selectOptions = [
      ...values
        .map((value, index) => {
          return !advanced
            ? {
                label: displayValues[index],
                value: value,
              }
            : visibleItems[index]
            ? {
                label: displayValues[index],
                value: value,
                isDisabled: disabledItems[index],
                visible: visibleItems[index],
              }
            : {};
        })
        .filter((element) => {
          if (Object.keys(element).length !== 0) {
            return true;
          }
          return false;
        }),
    ];
  } catch (err) {
    console.log(err);
  }

  const setExposedItem = (value, index, onSelectFired = false) => {
    setCurrentValue(value);
    onSelectFired ? setExposedVariable('value', value).then(fireEvent('onSelect')) : setExposedVariable('value', value);
    setExposedVariable('selectedOptionLabel', index === undefined ? undefined : displayValues?.[index]);
  };

  function selectOption(value) {
    let index = null;
    index = values.indexOf(value);

    if (values.includes(value)) {
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
    [
      JSON.stringify(properties.values),
      values,
      displayValues,
      setCurrentValue,
      JSON.stringify(properties.displayValues),
    ]
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
      index = values.indexOf(value);
    }
    setExposedItem(newValue, index);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, JSON.stringify(displayValues), JSON.stringify(properties.display_values)]);

  useEffect(() => {
    let index = null;
    if (exposedValue !== currentValue) {
      setExposedVariable('value', currentValue);
      index = values.indexOf(currentValue);
      setExposedVariable('selectedOptionLabel', displayValues?.[index]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  useEffect(() => {
    let newValue = undefined;
    let index = null;

    if (values?.includes(currentValue)) newValue = currentValue;
    else if (values?.includes(value)) newValue = value;
    index = values.indexOf(newValue);
    setExposedItem(newValue, index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(properties.values), JSON.stringify(values)]);

  useEffect(() => {
    setExposedVariable('label', label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    setExposedVariable('optionLabels', displayValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(properties.display_values), JSON.stringify(displayValues)]);

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
            color: state.isDisabled ? '#889096' : 'white',
            backgroundColor: state.value === currentValue ? '#3650AF' : 'rgb(31,40,55)',
            ':hover': {
              backgroundColor: state.isDisabled ? '#F1F3F5' : state.value === currentValue ? '#1F2E64' : '#323C4B',
            },
            maxWidth: 'auto',
            minWidth: 'max-content',
          }
        : {
            backgroundColor: state.value === currentValue ? '#7A95FB' : 'white',
            color: state.isDisabled ? '#889096' : state.value === currentValue ? 'white' : 'black',
            ':hover': {
              backgroundColor: state.isDisabled ? '#F1F3F5' : state.value === currentValue ? '#3650AF' : '#d8dce9',
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
        style={{ height, display: visibility && styles.visibility ? '' : 'none' }}
        onMouseDown={(event) => {
          onComponentClick(id, component, event);
        }}
        data-cy={dataCy}
      >
        <div className="col-auto my-auto">
          <label style={{ marginRight: label !== '' ? '1rem' : '0.001rem' }} className="form-label py-0 my-0">
            {label}
          </label>
        </div>
        <div className="col px-0 h-100">
          <Select
            isDisabled={disabledState}
            value={selectOptions.filter((option) => option.value === currentValue)[0] ?? null}
            onChange={(selectedOption, actionProps) => {
              if (actionProps.action === 'select-option') {
                setCurrentValue(selectedOption.value);
                setExposedVariable('value', selectedOption.value).then(() => fireEvent('onSelect'));
                setExposedVariable('selectedOptionLabel', selectedOption.label);
              }
            }}
            options={selectOptions}
            styles={customStyles}
            isLoading={properties.loadingState}
            onInputChange={onSearchTextChange}
            onFocus={(event) => onComponentClick(event, component, id)}
            menuPortalTarget={document.body}
            placeholder={placeholder}
          />
        </div>
      </div>
      <div className={`invalid-feedback ${isValid ? '' : visibility ? 'd-flex' : 'none'}`}>{validationError}</div>
    </>
  );
};
