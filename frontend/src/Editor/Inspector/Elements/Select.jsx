import React from 'react';
import { getToolTipProps } from './utils';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const Select = ({
  param, definition, onChange, paramType, componentMeta
}) => {

  const paramMeta = componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;
  const options = paramMeta.options;
  const value = definition ? definition.value : '';

  return (
    <div className="field mb-3">
      <label {...getToolTipProps(paramMeta)} className="form-label">{displayName}</label>
      <SelectSearch
        options={options}
        value={value}
        search={true}
        onChange={(newVal) => onChange(param, 'value', newVal, paramType)}
        filterOptions={fuzzySearch}
        placeholder="Select.."
    />
    </div>
  );
};
