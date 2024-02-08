import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import React, { useState, useEffect, useMemo } from 'react';
import Select, { components } from 'react-select';
import * as Icons from '@tabler/icons-react';
import CheckMark from '@/_ui/Icon/solidIcons/CheckMark';
import { CustomMenuList } from './Table/SelectComponent';
import { Spinner } from 'react-bootstrap';
import { useEditorStore } from '@/_stores/editorStore';

const { ValueContainer, SingleValue, Placeholder, DropdownIndicator } = components;
const INDICATOR_CONTAINER_WIDTH = 60;
const ICON_WIDTH = 18; // includes flex gap 2px

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
            color: selectProps?.iconColor,
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
  // Hack around https://github.com/JedWatson/react-select/pull/3705
  const firstOption = props.options[0];
  const isFirstOption = props.label === firstOption.label;
  return (
    <components.Option {...props}>
      <div className="d-flex justify-content-between">
        <span className="text-truncate" style={{ color: props.isDisabled ? '#889096' : 'unset' }}>
          {props.label}
        </span>
        {props.isSelected && (
          <span style={{ maxHeight: '20px' }}>
            <CheckMark
              width={'20'}
              fill={isFirstOption && props.isFocused ? '#3E63DD' : props.isFocused ? '#FFFFFF' : '#3E63DD'}
            />
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
  adjustHeightBasedOnAlignment,
  currentLayout,
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
    iconColor,
    padding,
  } = styles;
  const [currentValue, setCurrentValue] = useState(() => (advanced ? findDefaultItem(schema) : value));
  const { value: exposedValue } = exposedVariables;
  const currentState = useCurrentState();
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState);
  const validationData = validate(currentValue);
  const { isValid, validationError } = validationData;
  const ref = React.useRef(null);
  const selectref = React.useRef(null);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isDropdownLoading, setIsDropdownLoading] = useState(dropdownLoadingState);
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(disabledState);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  // We are substracting 4px because of 2px padding each in top bottom
  const _height = padding === 'default' ? `${height - 4}px` : `${height}px`;

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
              if (optionVisibility[index] !== false) {
                return { label: display_values[index], value: value, isDisabled: optionDisable[index] };
              }
            })
            .filter((option) => option),
        ];

    return _selectOptions;
  }, [advanced, schema, display_values, values, optionDisable, optionVisibility]);

  function selectOption(value) {
    const val = selectOptions.filter((option) => !option.isDisabled)?.find((option) => option.value === value);
    if (val) {
      setCurrentValue(value);
      fireEvent('onSelect');
    }
  }

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
      setInputValue(searchText);
      fireEvent('onSearchTextChanged');
    }
  };

  const handleOutsideClick = (e) => {
    let menu = ref.current.querySelector('.select__menu');
    if (!ref.current.contains(e.target) || !menu || !menu.contains(e.target)) {
      setIsFocused(false);
      setInputValue('');
    }
  };

  useEffect(() => {
    if (advanced) {
      setCurrentValue(findDefaultItem(schema));
    } else setCurrentValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, value, JSON.stringify(schema)]);

  useEffect(() => {
    if (alignment == 'top' && label) adjustHeightBasedOnAlignment(true);
    else adjustHeightBasedOnAlignment(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alignment, label, currentLayout]);

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Exposed variables UseEffect's
  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isDropdownLoading !== dropdownLoadingState) setIsDropdownLoading(dropdownLoadingState);
    if (isDropdownDisabled !== disabledState) setIsDropdownDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, dropdownLoadingState, disabledState]);

  useEffect(() => {
    setExposedVariable('selectOption', async function (value) {
      selectOption(value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selectOptions)]);

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  useEffect(() => {
    if (exposedValue !== currentValue) {
      setExposedVariable('value', currentValue);
    }
    const _selectedOptionLabel = selectOptions.find((option) => option.value === currentValue)?.label;
    setExposedVariable('selectedOptionLabel', _selectedOptionLabel);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, JSON.stringify(display_values), JSON.stringify(values), JSON.stringify(selectOptions)]);

  useEffect(() => {
    setExposedVariable('label', label);
    setExposedVariable('searchText', inputValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label, inputValue]);

  useEffect(() => {
    if (advanced) {
      setExposedVariable(
        'optionLabels',
        schema?.filter((item) => item?.visible)?.map((item) => item.label)
      );
    } else setExposedVariable('optionLabels', display_values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(schema), advanced, JSON.stringify(display_values), currentValue]);

  useEffect(() => {
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
    setExposedVariable('setDisable', async function (value) {
      setIsDropdownDisabled(value);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, dropdownLoadingState, disabledState, isMandatory]);

  useEffect(() => {
    const _options = selectOptions?.map((selectOption) => ({ label: selectOption?.label, value: selectOption?.value }));
    setExposedVariable('options', _options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selectOptions)]);

  const customStyles = {
    container: (base) => ({
      ...base,
      width: '100%',
    }),
    control: (provided, state) => {
      return {
        ...provided,
        minHeight: _height,
        height: _height,
        boxShadow: state.isFocused ? boxShadow : boxShadow,
        borderRadius: Number.parseFloat(fieldBorderRadius),
        borderColor: !isValid
          ? 'var(--tj-text-input-widget-error)'
          : state.isFocused
          ? '#3E63DD'
          : ['#D7DBDF'].includes(fieldBorderColor)
          ? darkMode
            ? '#4C5155'
            : '#D7DBDF'
          : fieldBorderColor,
        backgroundColor:
          darkMode && ['#fff'].includes(fieldBackgroundColor)
            ? '#313538'
            : state.isDisabled
            ? '#F1F3F5'
            : fieldBackgroundColor,
        '&:hover': {
          borderColor: '#6A727C',
        },
      };
    },
    valueContainer: (provided, _state) => ({
      ...provided,
      height: _height,
      padding: '0 6px',
      justifyContent,
      display: 'flex',
      gap: '0.13rem',
    }),

    singleValue: (provided, _state) => ({
      ...provided,
      color: darkMode && selectedTextColor === '#11181C' ? '#ECEDEE' : selectedTextColor,
      maxWidth:
        ref?.current?.offsetWidth -
        (iconVisibility ? INDICATOR_CONTAINER_WIDTH + ICON_WIDTH : INDICATOR_CONTAINER_WIDTH),
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
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
      height: _height,
    }),
    clearIndicator: (provided, _state) => ({
      ...provided,
      padding: '0px',
    }),
    dropdownIndicator: (provided, _state) => ({
      ...provided,
      padding: '0px',
    }),
    option: (provided) => ({
      ...provided,
      backgroundColor: darkMode && ['#fff'].includes(fieldBackgroundColor) ? '#313538' : fieldBackgroundColor,
      color: darkMode && ['#11181C'].includes(selectedTextColor) ? '#ECEDEE' : selectedTextColor,
      '&:hover': {
        backgroundColor: '#ACB2B9',
        color: 'white',
      },
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '2px',
      // this is needed otherwise :active state doesn't look nice, gap is required
      display: 'flex',
      flexDirection: 'column',
      gap: '4px !important',
      overflowY: 'auto',
    }),
    menu: (provided) => ({
      ...provided,
      marginTop: '5px',
      backgroundColor: darkMode && ['#fff'].includes(fieldBackgroundColor) ? '#313538' : fieldBackgroundColor,
    }),
  };

  const labelStyles = {
    [direction === 'alignRight' ? 'marginLeft' : 'marginRight']: label ? '1rem' : '0.001rem',
    color: darkMode && labelColor === '#11181C' ? '#ECEDEE' : labelColor,
    justifyContent: direction === 'alignRight' ? 'flex-end' : 'flex-start',
  };

  return (
    <>
      <div
        className="dropdown-widget g-0"
        style={{
          // height: _height,
          display: visibility ? 'flex' : 'none',
          flexDirection: alignment === 'top' ? 'column' : direction === 'alignRight' ? 'row-reverse' : 'row',
          // Below the top-bottom padding is 1px instead of 2px because 1px is already applied in Box, same case for left and right
          padding: padding === 'default' ? '1px 3px' : '',
        }}
        onMouseDown={(event) => {
          onComponentClick(id, component, event);
          // This following line is needed because sometimes after clicking on canvas then also dropdown remains selected
          useEditorStore.getState().actions.setHoveredComponent('');
        }}
        data-cy={dataCy}
      >
        <div
          className={`my-auto text-truncate`}
          style={{
            alignSelf: direction === 'alignRight' ? 'flex-end' : 'flex-start',
            width: alignment === 'top' || labelAutoWidth ? 'auto' : `${labelWidth}%`,
            maxWidth: alignment === 'top' || labelAutoWidth ? '100%' : `${labelWidth}%`,
          }}
        >
          <label style={labelStyles} className="font-size-12 font-weight-500 py-0 my-0 d-flex">
            <span
              style={{
                overflow: label?.length > 18 && 'hidden', // Hide any content that overflows the box
                textOverflow: 'ellipsis', // Display ellipsis for overflowed content
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {label}
            </span>
            <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
          </label>
        </div>
        <div className="w-100 px-0 h-100" ref={ref}>
          <Select
            ref={selectref}
            isDisabled={isDropdownDisabled}
            value={selectOptions.filter((option) => option.value === currentValue)[0] ?? null}
            onChange={(selectedOption, actionProps) => {
              if (actionProps.action === 'clear') {
                setCurrentValue(null);
              }
              if (actionProps.action === 'select-option') {
                setCurrentValue(selectedOption.value);
                fireEvent('onSelect');
              }
              setIsFocused(false);
            }}
            options={selectOptions}
            styles={customStyles}
            isLoading={isDropdownLoading}
            onInputChange={onSearchTextChange}
            onFocus={() => {
              fireEvent('onFocus');
            }}
            onMenuInputFocus={() => setIsFocused(true)}
            onBlur={() => {
              fireEvent('onBlur');
            }}
            menuPortalTarget={document.body}
            placeholder={placeholder}
            components={{
              MenuList: CustomMenuList,
              ValueContainer: CustomValueContainer,
              Option,
              LoadingIndicator: () => (
                <Spinner style={{ width: '16px', height: '16px', color: 'var(--indigo9)', marginRight: '5px' }} />
              ),
              DropdownIndicator: isDropdownLoading ? () => null : DropdownIndicator,
            }}
            isClearable
            icon={icon}
            doShowIcon={iconVisibility}
            iconColor={iconColor}
            isSearchable={false}
            isDarkMode={darkMode}
            {...{
              menuIsOpen: isFocused || undefined,
              isFocused: isFocused || undefined,
            }}
            inputValue={inputValue}
            optionLoadingState={properties.loadingState}
            setInputValue={setInputValue}
          />
        </div>
      </div>
      <div
        className={`invalid-feedback ${isValid ? '' : visibility ? 'd-flex' : 'none'}`}
        style={{
          color: errTextColor,
          justifyContent: direction === 'alignRight' ? 'flex-start' : 'flex-end',
          marginTop: alignment === 'top' ? '1.25rem' : '0.25rem',
        }}
      >
        {!isValid && validationError}
      </div>
    </>
  );
};
