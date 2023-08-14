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
  dataCy,
}) {
  let { label, value, advanced, schema, placeholder, display_values, values } = properties;
  const { selectedTextColor, borderRadius, visibility, disabledState, justifyContent, boxShadow } = styles;
  const [currentValue, setCurrentValue] = useState(() => (advanced ? findDefaultItem(schema) : value));
  const { value: exposedValue } = exposedVariables;

  const validationData = validate(value);
  const { isValid, validationError } = validationData;

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

  useEffect(() => {
    setExposedVariable('selectOption', async function (value) {
      selectOption(value);
    });

    setExposedVariable('isValid', isValid);
    setExposedVariable('label', label);

    if (advanced) {
      const visibleSchemaItems = schema?.filter((item) => item?.visible);
      setExposedVariable(
        'optionLabels',
        visibleSchemaItems?.map((item) => item.label)
      );

      if (hasVisibleFalse(currentValue)) {
        setCurrentValue(findDefaultItem(schema));
      }
    } else {
      setExposedVariable('optionLabels', display_values);
    }

    const index = values?.indexOf(currentValue);

    if (exposedValue !== currentValue) {
      setExposedVariable('value', currentValue);
    }

    setExposedVariable('selectedOptionLabel', display_values?.[index]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, currentValue, display_values, exposedValue, isValid, label, schema, selectOption, values]);

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
    <>
      <div
        className="dropdown-widget row g-0"
        style={{ height, display: visibility ? '' : 'none' }}
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
