import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import Select, { components } from 'react-select';
import { CustomMenuList } from './Table/SelectComponent';
import * as Icons from '@tabler/icons-react';
import Check from '@/_ui/Icon/solidIcons/Check';

const ValueContainer = ({ children, doShowIcon = false, icon, ...props }) => {
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[icon] == undefined ? Icons['IconHome2'] : Icons[icon];
  return (
    <components.ValueContainer {...props}>
      {doShowIcon && (
        <IconElement
          style={{
            width: '16px',
            height: '16px',
            fill: 'var(--slate8)',
          }}
        />
      )}
      <span className="d-flex" {...props}>
        {children}
      </span>
    </components.ValueContainer>
  );
};

const Option = (props) => {
  return (
    <components.Option {...props}>
      <div className="d-flex justify-content-between">
        <span>{props.label}</span>
        {props.isSelected && (
          <span>
            <Check width={'20'} fill={'#3E63DD'} />
          </span>
        )}
      </div>
    </components.Option>
  );
};

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
  let {
    label,
    value,
    advanced,
    schema,
    placeholder,
    display_values,
    values,
    dropdownLoadingState,
    visibility,
    mandatory,
  } = properties;
  const {
    selectedTextColor,
    fieldBorderRadius,
    disabledState,
    justifyContent,
    boxShadow,
    labelColor,
    alignment,
    direction,
    fieldBorderColor,
    fieldBackgroundColor,
    labelWidth,
    icon,
    iconVisibility,
  } = styles;
  const [currentValue, setCurrentValue] = useState(() => (advanced ? findDefaultItem(schema) : value));
  const { value: exposedValue } = exposedVariables;
  const [showValidationError, setShowValidationError] = useState(false);
  const currentState = useCurrentState();
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values), setCurrentValue, JSON.stringify(display_values)]);

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
    control: (provided, state) => {
      return {
        ...provided,
        minHeight: height,
        height: height,
        boxShadow: state.isFocused ? boxShadow : boxShadow,
        borderRadius: Number.parseFloat(fieldBorderRadius),
        borderColor: fieldBorderColor,
        backgroundColor: fieldBackgroundColor,
        '&:hover': {
          backgroundColor: '#f1f3f5',
          borderColor: '#3E63DD',
        },
      };
    },

    valueContainer: (provided, _state) => ({
      ...provided,
      height: height,
      padding: '0 6px',
      justifyContent,
      display: 'flex',
      gap: '0.13rem',
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
    option: (provided, state) => ({
      ...provided,
      backgroundColor: 'white',
      color: '#11181C',
      '&:hover': {
        backgroundColor: '#3E63DD',
        color: 'white',
      },
    }),
    // menu: (provided, _state) => ({
    //   ...provided,
    //   backgroundColor: darkMode ? 'rgb(31,40,55)' : 'white',
    // }),
  };

  const labelStyles = {
    marginRight: label !== '' ? '1rem' : '0.001rem',
    color: labelColor,
    alignSelf: direction === 'alignRight' ? 'flex-end' : 'flex-start',
  };

  if (dropdownLoadingState) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ width: '100%', height }}>
        <center>
          <div className="spinner-border" role="status"></div>
        </center>
      </div>
    );
  }
  return (
    <>
      <div
        className="dropdown-widget g-0"
        style={{
          height,
          display: visibility ? 'flex' : 'none',
          flexDirection: alignment === 'top' ? 'column' : direction === 'alignRight' ? 'row-reverse' : 'row',
        }}
        onMouseDown={(event) => {
          onComponentClick(id, component, event);
        }}
        data-cy={dataCy}
      >
        <div
          className="col-auto my-auto"
          style={{ alignSelf: direction === 'alignRight' ? 'flex-end' : 'flex-start', width: labelWidth }}
        >
          <label style={labelStyles} className="form-label py-0 my-0">
            {label}
            <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
          </label>
        </div>
        <div className="col px-0 h-100">
          <Select
            isDisabled={disabledState}
            value={selectOptions.filter((option) => option.value === currentValue)[0] ?? null}
            onChange={(selectedOption, actionProps) => {
              console.log(selectedOption, 'selectedOption', actionProps);
              setShowValidationError(true);
              if (actionProps.action === 'clear') {
                setCurrentValue(null);
              }
              if (actionProps.action === 'select-option') {
                setCurrentValue(selectedOption.value);
                setExposedVariable('value', selectedOption.value);
                fireEvent('onSelect');
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
            components={{
              MenuList: CustomMenuList,
              ValueContainer: (props) => <ValueContainer {...props} icon={icon} doShowIcon={iconVisibility} />,
              Option,
            }}
            isClearable
          />
        </div>
      </div>
      <div className={`invalid-feedback ${isValid ? '' : visibility ? 'd-flex' : 'none'}`}>
        {showValidationError && validationError}
      </div>
    </>
  );
};
