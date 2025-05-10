import _ from 'lodash';
import React, { useState, useEffect, useRef } from 'react';
import Select, { components } from 'react-select';
import TriangleDownArrow from '@/_ui/Icon/bulkIcons/TriangleDownArrow';
import TriangleUpArrow from '@/_ui/Icon/bulkIcons/TriangleUpArrow';

import { getModifiedColor } from './utils'

export const DropDown = function DropDown({
  height,
  validate,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  fireEvent,
  darkMode,
  onComponentClick,
  id,
  dataCy,
}) {
  const isInitialRender = useRef(true);
  let { label, value, advanced, schema, placeholder, display_values, values } = properties;
  const { selectedTextColor, borderRadius, visibility, disabledState, justifyContent, boxShadow } = styles;
  const [currentValue, setCurrentValue] = useState(() => (advanced ? findDefaultItem(schema) : value));
  const [showValidationError, setShowValidationError] = useState(false);
  const [validationStatus, setValidationStatus] = useState(validate(value));
  const { isValid, validationError } = validationStatus;
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
    const selectedOptionLabel = index === undefined ? undefined : display_values?.[index];
    setInputValue(value, selectedOptionLabel);
    if (onSelectFired) {
      fireEvent('onSelect');
    }
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
    if (isInitialRender.current) return;
    const index = values?.indexOf(currentValue);
    setExposedVariable('selectedOptionLabel', display_values?.[index]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, JSON.stringify(display_values), JSON.stringify(values)]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const validationStatus = validate(currentValue);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  }, [validate]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (advanced) {
      setExposedVariable(
        'optionLabels',
        schema?.filter((item) => item?.visible)?.map((item) => item.label)
      );
      if (hasVisibleFalse(currentValue)) {
        setInputValue(findDefaultItem(schema));
      }
    } else setExposedVariable('optionLabels', display_values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(schema), advanced, JSON.stringify(display_values), currentValue]);

  useEffect(() => {
    const index = values?.indexOf(currentValue);
    let optionLabels = display_values;
    if (advanced) {
      optionLabels = schema?.filter((item) => item?.visible)?.map((item) => item.label);
    }
    const exposedVariables = {
      selectOption: async function (value) {
        selectOption(value);
      },
      isValid: isValid,
      value: currentValue,
      selectedOptionLabel: display_values?.[index],
      label: label,
      optionLabels: optionLabels,
    };

    setExposedVariables(exposedVariables);
    isInitialRender.current = false;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const exposedVariables = {
      selectOption: async function (value) {
        selectOption(value);
      },
    };

    setExposedVariables(exposedVariables);
  }, [JSON.stringify(properties.values)]);

  useEffect(() => {
    let newValue = undefined;
    let index = null;
    if (values?.includes(value)) {
      newValue = value;
      index = values?.indexOf(value);
    }
    setExposedItem(newValue, index);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), JSON.stringify(values)]);

  useEffect(() => {
    let newValue = undefined;
    let index = null;

    if (values?.includes(currentValue)) newValue = currentValue;
    else if (values?.includes(value)) newValue = value;
    index = values?.indexOf(newValue);
    setExposedItem(newValue, index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

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

  const setInputValue = (value, label) => {
    setCurrentValue(value);
    setExposedVariables({ value, selectedOptionLabel: label });
    const validationStatus = validate(value);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  };

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      background: darkMode ? 'rgb(31,40,55)' : 'white',
      minHeight: height,
      height: height,
      boxShadow: state.isFocused ? boxShadow : boxShadow,
      borderRadius: Number.parseFloat(borderRadius),
      ':focus-within': {
        borderColor: 'var(--primary-brand)'
      }
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
       const hoverBgColorValue = getModifiedColor('var(--primary-brand)', 'hover');

      const styles = darkMode
        ? {
            color: state.isDisabled ? '#88909698' : 'white',
            backgroundColor: state.value === currentValue ? 'var(--primary-brand)' : 'rgb(31,40,55)',
            ':hover': {
              backgroundColor: state.isDisabled ? 'transparent' : state.value === currentValue ? hoverBgColorValue : '#323C4B',
            },
            maxWidth: 'auto',
            minWidth: 'max-content',
          }
        : {
            backgroundColor: state.value === currentValue ? 'var(--primary-brand)' : 'white',
            color: state.isDisabled ? '#88909694' : state.value === currentValue ? 'white' : 'black',
            ':hover': {
              backgroundColor: state.isDisabled ? 'transparent' : state.value === currentValue ? hoverBgColorValue : '#d8dce9',
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
        onClick={(event) => {
          event.stopPropagation();
          onComponentClick(id);
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
              setShowValidationError(true);
              if (actionProps.action === 'select-option') {
                setInputValue(selectedOption.value, selectedOption.label);
                fireEvent('onSelect');
              }
            }}
            options={selectOptions}
            styles={customStyles}
            isLoading={properties.loadingState}
            onInputChange={onSearchTextChange}
            onFocus={(event) => onComponentClick(id)}
            menuPortalTarget={document.body}
            placeholder={placeholder}
          />
        </div>
      </div>
      <div className={`invalid-feedback ${isValid ? '' : visibility ? 'd-flex' : 'none'}`}>
        {showValidationError && validationError}
      </div>
    </>
  );
};
