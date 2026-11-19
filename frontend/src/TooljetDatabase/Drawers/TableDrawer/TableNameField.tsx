import React from 'react';
import { NameField } from './NameField';
import { getTableNameError, NAME_EMPTY_ERROR, TABLE_NAME_HINT } from './tableNameRules';

type TableNameFieldProps = {
  value: string;
  onChange: (name: string) => void;
  autoFocus?: boolean;
  /** Tables already in the workspace. */
  existingNames?: string[];
};

// 400px wide, as in the design.
export function TableNameField({ value, onChange, autoFocus, existingNames }: TableNameFieldProps) {
  return (
    <NameField
      id="table-name"
      label="Table name"
      placeholder="Enter table name"
      value={value}
      onChange={onChange}
      autoFocus={autoFocus}
      getError={(name) => getTableNameError(name, existingNames)}
      emptyError={NAME_EMPTY_ERROR}
      hint={TABLE_NAME_HINT}
      className="tw-w-[400px] tw-max-w-full"
      data-cy="table-name-input-field"
      labelDataCy="table-name-label"
    />
  );
}
