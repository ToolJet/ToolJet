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
  dataCy,
}) {
  const { label, value, values, display_values, showAllOption } = properties;
  const { borderRadius, visibility, disabledState, boxShadow } = styles;
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
  useEffect(() => {
    const selectOption = async (value) => {
      const option = selectOptions.find((option) => option.value === value);
      if (option && !selected.some((selectedOption) => selectedOption.value === value)) {
        const newSelected = [...selected, option];
        setSelected(newSelected);
        setExposedVariable(
          'values',
          newSelected.map((item) => item.value)
        );
        fireEvent('onSelect');
      }
    };

    const deselectOption = async (value) => {
      const option = selected.find((selectedOption) => selectedOption.value === value);
      if (option) {
        const newSelected = selected.filter((item) => item.value !== value);
        setSelected(newSelected);
        setExposedVariable(
          'values',
          newSelected.map((item) => item.value)
        );
        fireEvent('onSelect');
      }
    };

    const clearSelections = async () => {
      if (selected.length >= 1) {
        setSelected([]);
        setExposedVariable('values', []);
        fireEvent('onSelect');
      }
    };

    const newValues = _.intersection(values, value).length === value.length ? value : [];

    const exposedVariables = {
      values: newValues,
      selectOption,
      deselectOption,
      clearSelections,
    };

    setExposedVariable('allVariables', exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, value, selected, setSelected, selectOptions]);

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
        />
      </div>
    </div>
  );
};
