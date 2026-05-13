import React from 'react';
import { components } from 'react-select';
import { AppsSelect } from './AppsSelect';

export function AppsMultiSelect({ value, options, inFolder, ...rest }) {
  const nonAllSelected = (value || []).filter((v) => !v.isAllField);
  const isAllSelected = (value || []).some((v) => v.isAllField);
  const count = nonAllSelected.length;

  const MultiValue = (mvProps) => {
    if (mvProps.data.isAllField) return null;

    if (isAllSelected) {
      if (mvProps.data.value !== nonAllSelected[0]?.value) return null;
      return (
        <components.MultiValue {...mvProps}>
          <div className="selected-value">All apps</div>
        </components.MultiValue>
      );
    }

    if (count === 1) {
      return (
        <components.MultiValue {...mvProps}>
          <div className="selected-value">{mvProps.data.name}</div>
        </components.MultiValue>
      );
    }

    if (mvProps.data.value !== nonAllSelected[0]?.value) return null;
    return (
      <components.MultiValue {...mvProps}>
        <div className="selected-value">{count} apps selected</div>
      </components.MultiValue>
    );
  };

  const allOption = {
    label: inFolder ? `All in this folder (${options.length})` : `All apps (${options.length})`,
    value: '*',
    isAllField: true,
  };

  return (
    <AppsSelect
      value={value}
      options={options}
      allOption={allOption}
      allowSelectAll
      customComponents={{ MultiValue }}
      {...rest}
    />
  );
}

AppsMultiSelect.defaultProps = {
  options: [],
};
