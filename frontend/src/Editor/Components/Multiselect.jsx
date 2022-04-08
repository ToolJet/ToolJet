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
}) {
  const { label, value, values, display_values, showAllOption } = properties;
  const { borderRadius, visibility, disabledState } = styles;
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
  }, [JSON.stringify(values)]);

  useEffect(() => {
    setExposedVariable('values', value);
    setSelected(selectOptions.filter((option) => value.includes(option.value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

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

  return (
    <div
      className="multiselect-widget row g-0"
      style={{ height, display: visibility ? '' : 'none' }}
      onFocus={() => {
        onComponentClick(this, id, component);
      }}
    >
      <div className="col-auto my-auto d-flex align-items-center">
        <label style={{ marginRight: label ? '1rem' : '', marginBottom: 0 }} className="form-label py-1">
          {label}
        </label>
      </div>
      <div className="col px-0 h-100" style={{ borderRadius: parseInt(borderRadius) }}>
        <MultiSelect
          hasSelectAll={showAllOption ?? false}
          options={selectOptions}
          value={selected}
          onChange={onChangeHandler}
          labelledBy={'Select'}
          disabled={disabledState}
          className={`multiselect-box${darkMode ? ' dark' : ''}`}
          ItemRenderer={ItemRenderer}
        />
      </div>
    </div>
  );
};
