import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import { MultiSelect } from 'react-multi-select-component';

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
  registerAction,
  dataCy,
}) {
  const { label, value, values, display_values, showAllOption } = properties;
  const { borderRadius, visibility, disabledState, boxShadow } = styles;
  const [selected, setSelected] = useState([]);
  const [searched, setSearched] = useState('');

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

  const onChangeHandler = (items) => {
    setSelected(items);
    setExposedVariable(
      'values',
      items.map((item) => item.value)
    ).then(() => fireEvent('onSelect'));
  };

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
      <div className="col px-0 h-100" style={{ borderRadius: parseInt(borderRadius), boxShadow }}>
        <MultiSelect
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
        />
      </div>
    </div>
  );
};
