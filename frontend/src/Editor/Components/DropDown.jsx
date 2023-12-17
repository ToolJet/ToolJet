import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import _ from 'lodash';
import React, { useState, useEffect, useMemo } from 'react';
import Select, { components } from 'react-select';
import { CustomMenuList } from './Table/SelectComponent';
import * as Icons from '@tabler/icons-react';
import CheckMark from '@/_ui/Icon/solidIcons/CheckMark';
const { ValueContainer, SingleValue, Placeholder } = components;

const CustomValueContainer = ({ children, ...props }) => {
  const selectProps = props.selectProps;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[selectProps?.icon] == undefined ? Icons['IconHome2'] : Icons[selectProps?.icon];
  return (
    <ValueContainer {...props}>
      {selectProps?.doShowIcon && (
        <IconElement
          style={{
            width: '16px',
            height: '16px',
            fill: 'var(--slate8)',
          }}
        />
      )}
      <span className="d-flex" {...props}>
        {React.Children.map(children, (child) => {
          return child ? (
            child
          ) : props.hasValue ? (
            <SingleValue {...props} {...selectProps}>
              {selectProps?.getOptionLabel(props?.getValue()[0])}
            </SingleValue>
          ) : (
            <Placeholder {...props} key="placeholder" {...selectProps} data={props.getValue()}>
              {selectProps.placeholder}
            </Placeholder>
          );
        })}
      </span>
    </ValueContainer>
  );
};

const Option = (props) => {
  return (
    <components.Option {...props}>
      <div className="d-flex justify-content-between">
        <span>{props.label}</span>
        {props.isSelected && (
          <span>
            <CheckMark width={'20'} fill={props.isFocused ? '#FFFFFF' : '#3E63DD'} />
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
    disabledState,
    optionVisibility,
    optionDisable,
  } = properties;
  const {
    selectedTextColor,
    fieldBorderRadius,
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
    errTextColor,
    labelAutoWidth,
  } = styles;
  const [currentValue, setCurrentValue] = useState(() => (advanced ? findDefaultItem(schema) : value));
  const { value: exposedValue } = exposedVariables;
  const currentState = useCurrentState();
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState);
  const validationData = validate(currentValue);
  const { isValid, validationError } = validationData;
  const ref = React.useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isDropdownLoading, setIsDropdownLoading] = useState(dropdownLoadingState);
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(disabledState);

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isDropdownLoading !== dropdownLoadingState) setIsDropdownLoading(dropdownLoadingState);
    if (isDropdownDisabled !== disabledState) setIsDropdownDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, dropdownLoadingState, disabledState]);

  function findDefaultItem(schema) {
    const foundItem = schema?.find((item) => item?.default === true);
    return !hasVisibleFalse(foundItem?.value) ? foundItem?.value : undefined;
  }

  const selectOptions = useMemo(() => {
    let _selectOptions = advanced
      ? [
          ...schema
            .filter((data) => data.visible)
            .map((value) => ({
              ...value,
              isDisabled: value.disable,
            })),
        ]
      : [
          ...values
            .map((value, index) => {
              if (optionVisibility[index]) {
                return { label: display_values[index], value: value, isDisabled: optionDisable[index] };
              }
            })
            .filter((option) => option),
        ];

    return _selectOptions;
  }, [advanced, schema, display_values, values, optionDisable, optionVisibility]);

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

  useEffect(() => {
    setExposedVariable('options', selectOptions);
    setExposedVariable('isVisible', properties.visibility);
    setExposedVariable('isLoading', dropdownLoadingState);
    setExposedVariable('isDisabled', disabledState);
    setExposedVariable('isMandatory', isMandatory);

    setExposedVariable('clear', async function () {
      setCurrentValue(null);
    });
    setExposedVariable('setVisibility', async function (value) {
      setVisibility(value);
    });
    setExposedVariable('setLoading', async function (value) {
      setIsDropdownLoading(value);
    });
    setExposedVariable('setDisabled', async function (value) {
      setIsDropdownDisabled(value);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, dropdownLoadingState, disabledState, isMandatory]);

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
        borderColor: !isValid ? 'var(--tj-text-input-widget-error)' : fieldBorderColor,
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
    clearIndicator: (provided, _state) => ({
      ...provided,
      padding: '0px',
    }),
    dropdownIndicator: (provided, _state) => ({
      ...provided,
      padding: '0px',
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
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const labelStyles = {
    marginRight: label !== '' ? '1rem' : '0.001rem',
    color: labelColor,
    alignSelf: direction === 'alignRight' ? 'flex-end' : 'flex-start',
  };

  if (isDropdownLoading) {
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
          className="my-auto"
          style={{
            alignSelf: direction === 'alignRight' ? 'flex-end' : 'flex-start',
            width: alignment === 'side' || labelAutoWidth ? 'auto' : `${labelWidth}%`,
            maxWidth: alignment === 'side' || labelAutoWidth ? '100%' : `${labelWidth}%`,
          }}
        >
          <label style={labelStyles} className="form-label py-0 my-0">
            {label}
            <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
          </label>
        </div>
        <div className="w-100 px-0 h-100" ref={ref}>
          <Select
            isDisabled={isDropdownDisabled}
            value={selectOptions.filter((option) => option.value === currentValue)[0] ?? null}
            onChange={(selectedOption, actionProps) => {
              if (actionProps.action === 'clear') {
                setCurrentValue(null);
              }
              if (actionProps.action === 'select-option') {
                setCurrentValue(selectedOption.value);
                setExposedVariable('value', selectedOption.value);
                fireEvent('onSelect');
                setExposedVariable('selectedOptionLabel', selectedOption.label);
              }
              setDropdownOpen(false);
            }}
            options={selectOptions}
            styles={customStyles}
            // Only show loading when dynamic options are enabled
            isLoading={advanced && properties.loadingState}
            onInputChange={onSearchTextChange}
            onFocus={(event) => {
              fireEvent('onFocus');
              onComponentClick(event, component, id);
            }}
            menuIsOpen={dropdownOpen}
            onBlur={() => {
              setDropdownOpen(false);
              fireEvent('onBlur');
            }}
            menuPortalTarget={document.body}
            placeholder={placeholder}
            components={{
              MenuList: CustomMenuList,
              ValueContainer: CustomValueContainer,
              Option,
              Input: () => null,
            }}
            isClearable
            icon={icon}
            doShowIcon={iconVisibility}
            onMenuOpen={() => setDropdownOpen(true)}
          />
        </div>
      </div>
      <div
        className={`invalid-feedback ${isValid ? '' : visibility ? 'd-flex' : 'none'}`}
        style={{
          color: errTextColor,
          justifyContent: direction === 'alignRight' ? 'flex-end' : 'flex-start',
          marginTop: alignment === 'top' ? '1.25rem' : '0.25rem',
        }}
      >
        {!isValid && validationError}
      </div>
    </>
  );
};
