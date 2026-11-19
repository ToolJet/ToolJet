import React from 'react';
import { getLocalTimeZone } from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/util';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import type { GridColumn, GridRow } from '../../Table/Grid/useTableGrid';
import { isLocked, type RowFieldState, type RowFormKind } from './rowRules';
import { RowField, type RowForeignKey } from './RowField';

type RowFieldsProps = {
  columns: GridColumn[];
  kind: RowFormKind;
  states: Record<string, RowFieldState>;
  errors: Record<string, string>;
  /** Edit: the row as stored. */
  row?: GridRow;
  setField: (accessor: string, state: RowFieldState) => void;
  setInvalid: (accessor: string, invalid: boolean) => void;
};

// The fields of a row drawer, in order. The first one the user can edit takes the focus.
export function RowFields({ columns, kind, states, errors, row, setField, setInvalid }: RowFieldsProps) {
  const { foreignKeys, getConfigurationProperty } = useTooljetDatabaseContext() as {
    foreignKeys: RowForeignKey[];
    getConfigurationProperty: (column: string, property: string, fallback: unknown) => string;
  };
  const firstEditable = columns.find((column) => !isLocked(column, kind))?.accessor;

  return (
    <>
      {columns.map((column) => (
        <RowField
          key={column.accessor}
          column={column}
          kind={kind}
          state={states[column.accessor]}
          stored={row?.[column.accessor]}
          error={errors[column.accessor]}
          foreignKey={
            Array.isArray(foreignKeys) ? foreignKeys.find((fk) => fk.column_names[0] === column.accessor) : undefined
          }
          timezone={getConfigurationProperty(column.accessor, 'timezone', getLocalTimeZone())}
          onChange={(state) => setField(column.accessor, state)}
          onInvalid={(invalid) => setInvalid(column.accessor, invalid)}
          autoFocus={column.accessor === firstEditable}
        />
      ))}
    </>
  );
}
