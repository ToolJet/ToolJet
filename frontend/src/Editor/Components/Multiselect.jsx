import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import Select, { components } from 'react-select';
import * as Icons from '@tabler/icons-react';
import { CustomMenuList } from './Table/SelectComponent';
import { Checkbox } from '@/_ui/CheckBox';
import { FormCheck } from 'react-bootstrap';
import { useMeasure } from 'react-use';
const { ValueContainer, SingleValue, Placeholder, MultiValue } = components;

const CustomValueContainer = ({ children, ...props }) => {
  const selectProps = props.selectProps;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[selectProps?.icon] == undefined ? Icons['IconHome2'] : Icons[selectProps?.icon];
  console.log(selectProps?.visibleValues, 'selectProps', props.hasValue);
  return (
    <ValueContainer {...props}>
      <span ref={selectProps.containerRef} className="w-full">
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
          {/* <MultiValue {...props} {...selectProps}> */}
          {selectProps?.visibleValues.map((element, index) => (
            <div key={index}>{element.label}</div>
          ))}
          {/* </MultiValue> */}

          {/* </MultiValue> */}

          {/* {props.hasValue && selectProps?.visibleValues.length ? (
            <MultiValue {...props} {...selectProps}>
              {/* {selectProps?.getOptionLabel(selectProps?.visibleValues[0])} */}
          {/* {selectProps?.visibleValues.map((element, index) => (
                <div key={index}>{element.label}</div>
              ))}
            </MultiValue> */}
          {/* ) : ( */}
          {/* <Placeholder {...props} key="placeholder" {...selectProps} data={selectProps?.visibleValues}>
              {selectProps.placeholder}
            </Placeholder> */}
          {/* )} */}
          {/* {React.Children.map(children, (child) => {
            console.log(child, 'child');
            return child ? (
              child
            ) : props.hasValue ? (
              <MultiValue {...props} {...selectProps}>
                {selectProps?.getOptionLabel(selectProps?.visibleValues[0])}
              </MultiValue>
            ) : (
              <Placeholder {...props} key="placeholder" {...selectProps} data={selectProps?.visibleValues}>
                {selectProps.placeholder}
              </Placeholder>
            );
          })} */}
        </span>
      </span>
    </ValueContainer>
  );
};

const Option = (props) => {
  return (
    <components.Option {...props}>
      <div className="d-flex">
        <FormCheck checked={props.isSelected} />
        <span style={{ marginLeft: '4px' }}>{props.label}</span>
      </div>
    </components.Option>
  );
};

const ItemRenderer = ({ checked, option, onClick, disabled }) => (
  <div className={`item-renderer ${disabled && 'disabled'}`}>
    <input type="checkbox" onClick={onClick} checked={checked} tabIndex={-1} disabled={disabled} />
    <span>{option.label}</span>
  </div>
);

export const Multiselect = function Multiselect({
  id,
  component,
  height,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  onComponentClick,
  darkMode,
  fireEvent,
  dataCy,
  validate,
  width,
}) {
  let {
    label,
    value,
    values,
    display_values,
    showAllOption,
    visibility,
    disabledState,
    advanced,
    schema,
    placeholder,
    dropdownLoadingState,
  } = properties;
  const {
    selectedTextColor,
    borderRadius,
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
  } = styles;
  const [selected, setSelected] = useState([]);
  const [searched, setSearched] = useState('');
  const currentState = useCurrentState();
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState);
  const ref1 = React.useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const validationData = validate(selected);
  const { isValid, validationError } = validationData;
  const ref = React.useRef(null);
  // const [ref, { x, y, width, top, right, bottom, left }] = useMeasure();
  const [visibleElements, setVisibleElements] = useState([]);
  const [showMore, setShowMore] = useState(false);
  // console.log(width, 'width');
  useEffect(() => {
    console.log('I render');
    const updateVisibleElements = () => {
      const containerWidth = ref.current.clientWidth;
      const elementWidth = 54;
      const maxVisibleElements = Math.floor(containerWidth / elementWidth);
      console.log(containerWidth, 'containerWidth', maxVisibleElements);
      setVisibleElements(selected.slice(0, maxVisibleElements));
      setShowMore(selected.length > maxVisibleElements);
    };
    // window.addEventListener('resize', updateVisibleElements);
    updateVisibleElements();

    return () => {
      // window.removeEventListener('resize', updateVisibleElements);
    };
  }, [selected, width]);

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

  function findDefaultItem(value, isAdvanced) {
    if (isAdvanced) {
      const foundItem = schema?.filter((item) => item?.default);
      return !hasVisibleFalse(foundItem?.length) ? foundItem : undefined;
    }
    return selectOptions.filter((item) => value.find((val) => val.value === item.value));
  }

  function hasVisibleFalse(value) {
    for (let i = 0; i < schema?.length; i++) {
      if (schema[i].value === value && schema[i].visible === false) {
        return true;
      }
    }
    return false;
  }

  useEffect(() => {
    // let foundItem = findDefaultItem(advanced ? schema : value, advanced);
    // console.log(foundItem, 'foundItem');
  }, [advanced]);

  useEffect(() => {
    let newValues = [];

    if (_.intersection(values, value)?.length === value?.length) newValues = value;

    setExposedVariable('values', newValues);
    setSelected(selectOptions.filter((option) => newValues.includes(option.value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values), JSON.stringify(display_values)]);

  useEffect(() => {
    setExposedVariable('values', value);
    setSelected(selectOptions.filter((option) => value.includes(option.value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), JSON.stringify(display_values)]);

  useEffect(() => {
    if (value && !selected) {
      setSelected(selectOptions.filter((option) => properties.value.includes(option.value)));
    }

    if (JSON.stringify(exposedVariables.values) === '{}') {
      setSelected(selectOptions.filter((option) => properties.value.includes(option.value)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeHandler = (items) => {
    setSelected(items);
    setExposedVariable(
      'values',
      items.map((item) => item.value)
    );
    fireEvent('onSelect');
  };

  useEffect(() => {
    setExposedVariable('selectOption', async function (value) {
      if (
        selectOptions.some((option) => option.value === value) &&
        !selected.some((option) => option.value === value)
      ) {
        const newSelected = [
          ...selected,
          ...selectOptions.filter(
            (option) =>
              option.value === value && !selected.map((selectedOption) => selectedOption.value).includes(value)
          ),
        ];
        setSelected(newSelected);
        setExposedVariable(
          'values',
          newSelected.map((item) => item.value)
        );
        fireEvent('onSelect');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, setSelected]);

  useEffect(() => {
    setExposedVariable('deselectOption', async function (value) {
      if (selectOptions.some((option) => option.value === value) && selected.some((option) => option.value === value)) {
        const newSelected = [
          ...selected.filter(function (item) {
            return item.value !== value;
          }),
        ];
        setSelected(newSelected);
        setExposedVariable(
          'values',
          newSelected.map((item) => item.value)
        );
        fireEvent('onSelect');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, setSelected]);

  useEffect(() => {
    setExposedVariable('clearSelections', async function () {
      if (selected.length >= 1) {
        setSelected([]);
        setExposedVariable('values', []);
        fireEvent('onSelect');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, setSelected]);

  const filterOptions = (options, filter) => {
    setSearched(filter);

    if (searched !== filter) {
      setExposedVariable('searchText', filter);
      fireEvent('onSearchTextChanged');
    }
    if (!filter) return options;

    return options.filter(
      ({ label, value }) => label != null && value != null && label.toLowerCase().includes(filter.toLowerCase())
    );
  };

  const onSearchTextChange = (searchText, actionProps) => {
    if (actionProps.action === 'input-change') {
      setExposedVariable('searchText', searchText);
      fireEvent('onSearchTextChanged');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref1.current && !ref1.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const customStyles = {
    control: (provided, state) => {
      return {
        ...provided,
        minHeight: height,
        height: height,
        boxShadow: state.isFocused ? boxShadow : boxShadow,
        borderRadius: Number.parseFloat(borderRadius),
        borderColor: !isValid ? 'var(--tj-text-input-widget-error)' : fieldBorderColor,
        backgroundColor: fieldBackgroundColor,
        '&:hover': {
          backgroundColor: fieldBackgroundColor,
          borderColor: '#3E63DD',
        },
      };
    },

    valueContainer: (provided, _state) => ({
      ...provided,
      height: height,
      padding: '0 6px',
      display: 'flex',
      gap: '0.13rem',
    }),

    multiValue: (provided, _state) => ({
      ...provided,
      borderRadius: '100px',
    }),
    multiValueLabel: (provided, _state) => ({
      ...provided,
      color: disabledState ? 'grey' : selectedTextColor ? selectedTextColor : darkMode ? 'white' : 'black',
    }),
    multiValueRemove: (provided, _state) => ({
      ...provided,
      borderRadius: '100px',
      backgroundColor: '#C2C8CD',
      margin: '4px',
      padding: '2px',
      '&:hover': {
        backgroundColor: '#C2C8CD',
        color: 'unset',
      },
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
        className="multiselect-widget g-0"
        data-cy={dataCy}
        style={{
          height,
          display: visibility ? 'flex' : 'none',
          flexDirection: alignment === 'top' ? 'column' : direction === 'alignRight' ? 'row-reverse' : 'row',
        }}
        onFocus={() => {
          onComponentClick(this, id, component);
        }}
      >
        <div className="col-auto my-auto" style={{ alignSelf: direction === 'alignRight' ? 'flex-end' : 'flex-start' }}>
          <label
            style={labelStyles}
            className="form-label py-0 my-0"
            data-cy={`multiselect-label-${component.name.toLowerCase()}`}
          >
            {label}
            <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
          </label>
        </div>
        <div className="col px-0 h-100" ref={ref1}>
          {/* <MultiSelect
          hasSelectAll={showAllOption ?? false}
          options={selectOptions}
          value={selected}
          onChange={onChangeHandler}
          labelledBy={'Select'}
          disabled={disabledState}
          className={`multiselect-box${darkMode ? ' dark dark-multiselectinput' : ''}`}
          ItemRenderer={ItemRenderer}
          filterOptions={filterOptions}
          debounceDuration={0}
        /> */}
          <Select
            isDisabled={disabledState}
            value={selected}
            onChange={onChangeHandler}
            // value={selectOptions.filter((option) => option.value === currentValue)[0] ?? null}
            // onChange={(selectedOption, actionProps) => {
            //   if (actionProps.action === 'clear') {
            //     setCurrentValue(null);
            //   }
            //   if (actionProps.action === 'select-option') {
            //     setCurrentValue(selectedOption);
            //     console.log(selectedOption, 'value');
            //     // setExposedVariable('value', selectedOption.value);
            //     // fireEvent('onSelect');
            //     // setExposedVariable('selectedOptionLabel', selectedOption.label);
            //   }
            //   // setDropdownOpen(false);
            // }}
            options={selectOptions}
            styles={customStyles}
            // Only show loading when dynamic options are enabled
            // isLoading={advanced && properties.loadingState}
            onInputChange={onSearchTextChange}
            onFocus={(event) => {
              onComponentClick(event, component, id);
            }}
            menuIsOpen={dropdownOpen}
            onBlur={() => setDropdownOpen(false)}
            menuPortalTarget={document.body}
            placeholder={placeholder}
            components={{
              MenuList: CustomMenuList,
              ValueContainer: CustomValueContainer,
              Option,
              Input: () => null,
            }}
            isClearable
            isMulti
            hideSelectedOptions={false}
            closeMenuOnSelect={false}
            icon={icon}
            doShowIcon={iconVisibility}
            onMenuOpen={() => setDropdownOpen(true)}
            containerRef={ref}
            visibleValues={visibleElements}
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
