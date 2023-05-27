import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import Select, { components } from 'react-select';

const Option = (props) => {
  return (
    <div className={`item-renderer ${props.disabled && 'disabled'}`}>
      <components.Option {...props}>
        <input type="checkbox" checked={props.isSelected} onChange={() => null} />{' '}
        <label style={{ marginLeft: '5px', cursor: 'pointer' }}>{props.label}</label>
      </components.Option>
    </div>
  );
};

const MenuList = (props) => {
  const { clearValue, setValue, options, selectProps, theme, isRtl, isMulti, hasValue, getStyles, children } = props;
  const isFiltered = !!selectProps.inputValue;
  const SELECT_ALL_LABEL = 'Select All';

  const filteredValues = Array.isArray(children) ? children?.map((item) => item.props?.data?.value) : [];

  const filteredOptions = options.filter((option) => filteredValues.includes(option.value));
  const isFilteredAllSelected = Array.isArray(children) && !children?.some((item) => item.props?.isSelected === false);

  const onChangeHandler = () => {
    if (isFiltered) {
      isFilteredAllSelected
        ? setValue(
            selectProps.value.filter((item) => !filteredValues.includes(item.value)),
            'deselect-option'
          )
        : setValue(_.uniqWith([...filteredOptions, ...selectProps.value], _.isEqual), 'select-option');
      return;
    }

    options.length === selectProps.value.length ? clearValue() : setValue(options, 'select-option');
  };

  const customProps = {
    children: SELECT_ALL_LABEL,
    clearValue: () => null,
    cx: () => null,
    data: { value: '<SELECT_ALL>', label: SELECT_ALL_LABEL },
    getClassNames: () => null,
    getStyles: () => getStyles('option', props),
    getValue: () => null,
    hasValue: hasValue,
    value: '<SELECT_ALL>',
    innerProps: {
      tabIndex: -1,
      id: 'react-select-option-all',
      onClick: onChangeHandler,
      onMouseMove: () => null,
      onMouseOver: () => null,
    },
    innerRef: null,
    isDisabled: false,
    isFocused: false,
    isMulti: isMulti,
    isRtl: isRtl,
    isSelected: isFiltered ? isFilteredAllSelected : options.length === selectProps.value.length,
    label: SELECT_ALL_LABEL,
    options: options,
    selectOption: () => null,
    selectProps: selectProps,
    theme: theme,
    type: 'option',
  };

  return (
    <components.MenuList {...props}>
      {options.length > 0 && selectProps.selectAllEnabled && filteredOptions.length > 0 && (
        <components.Option {...customProps}>
          <input type="checkbox" checked={customProps.isSelected} onChange={onChangeHandler} />{' '}
          <label style={{ marginLeft: '5px', cursor: 'pointer' }}>
            {`${SELECT_ALL_LABEL} ${filteredOptions.length !== options.length ? '(Filtered)' : ''}`}
          </label>
        </components.Option>
      )}
      {children}
    </components.MenuList>
  );
};

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
  registerAction,
  dataCy,
}) {
  const { label, value, values, display_values, showAllOption } = properties;
  const { borderRadius, visibility, disabledState, justifyContent, selectedTextColor } = styles;

  const [selected, setSelected] = useState([]);

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

  registerAction(
    'selectOption',
    async function (value) {
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
        ).then(() => fireEvent('onSelect'));
      }
    },
    [selected, setSelected]
  );
  registerAction(
    'deselectOption',
    async function (value) {
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
        ).then(() => fireEvent('onSelect'));
      }
    },
    [selected, setSelected]
  );
  registerAction(
    'clearSelections',
    async function () {
      if (selected.length >= 1) {
        setSelected([]);
        setExposedVariable('values', []).then(() => fireEvent('onSelect'));
      }
    },
    [selected, setSelected]
  );

  const onChangeHandler = (selectedOption, actionProps) => {
    if (
      actionProps.action === 'select-option' ||
      actionProps.action === 'deselect-option' ||
      actionProps.action === 'clear'
    ) {
      setSelected(selectedOption);
      setExposedVariable(
        'values',
        selectedOption.map((item) => item.value)
      ).then(() => fireEvent('onSelect'));
    }
  };

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

    valueContainer: (provided, props) => ({
      ...provided,
      height: height,
      padding: '0 6px',
      justifyContent,
      flexWrap: 'nowrap',
      '::before': {
        content:
          !props.selectProps.menuIsOpen && selectOptions.length > 0 && selected.length === selectOptions.length
            ? '"All items are selected."'
            : '""',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    }),

    multiValue: (_state, props) => {
      return {
        backgroundColor: 'transparent',
        background: 'none',
        display: selected.length === selectOptions.length || props.selectProps.menuIsOpen ? 'none' : 'block',
      };
    },

    multiValueLabel: (base) => {
      return {
        ...base,
        paddingLeft: 0,
        padding: '0 3px 0 0',
        fontSize: 'inherit',
        color: disabledState ? 'grey' : selectedTextColor ? selectedTextColor : darkMode ? 'white' : 'black',
        '::after': {
          content: selected.length > 1 ? '", "' : '""',
        },
      };
    },
    multiValueRemove: (_state) => ({
      display: 'none',
    }),

    input: (provided, _state) => ({
      ...provided,
      color: darkMode ? 'white' : 'black',
      margin: '0px',
    }),
    indicatorSeparator: (base) => ({
      ...base,
      display: selected.length > 0 ? 'inline' : 'none',
    }),
    indicatorsContainer: (provided, _state) => ({
      ...provided,
      height: height,
    }),

    option: (provided, state) => {
      const isOptionSelected = selected.map((option) => option.value).includes(state.value);
      const styles = darkMode
        ? {
            color: 'white',
            backgroundColor: isOptionSelected ? '#3650AF' : 'rgb(31,40,55)',
            ':hover': {
              backgroundColor: isOptionSelected ? '#1F2E64' : '#323C4B',
              transition: '0.2s ease-in-out',
            },
          }
        : {
            color: isOptionSelected ? 'white' : 'black',
            backgroundColor: isOptionSelected ? '#7A95FB' : 'white',
            ':hover': {
              backgroundColor: isOptionSelected ? '#3650AF' : '#d8dce9',
              transition: '0.2s ease-in-out',
            },
          };
      return {
        ...provided,
        justifyContent,
        height: 'auto',
        display: 'flex',
        flexDirection: 'rows',
        alignItems: 'center',
        cursor: 'pointer',
        maxWidth: 'auto',
        minWidth: 'max-content',
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
      className="multiselect-widget row g-0"
      data-cy={dataCy}
      style={{ height, display: visibility ? '' : 'none' }}
      onFocus={() => {
        onComponentClick(this, id, component);
      }}
    >
      <div className="col-auto my-auto d-flex align-items-center">
        <label
          style={{ marginRight: label ? '1rem' : '', marginBottom: 0 }}
          className={`form-label py-1 ${darkMode ? 'text-light' : 'text-secondary'}`}
          data-cy={`multiselect-label-${component.name.toLowerCase()}`}
        >
          {label}
        </label>
      </div>
      <div className="col px-0 h-100" style={{ borderRadius: parseInt(borderRadius) }}>
        <Select
          isDisabled={disabledState}
          value={selected}
          onChange={onChangeHandler}
          onInputChange={onSearchTextChange}
          options={selectOptions}
          styles={customStyles}
          isMulti={true}
          isSearchable={true}
          components={{
            Option,
            MenuList,
          }}
          closeMenuOnSelect={false}
          isClearable={selected.length > 0}
          hideSelectedOptions={false}
          selectAllEnabled={showAllOption}
        />
      </div>
    </div>
  );
};
