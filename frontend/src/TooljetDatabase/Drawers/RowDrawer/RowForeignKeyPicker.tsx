import React from 'react';
import { ForeignKeyValueCombobox } from '../TableDrawer/ForeignKeyValueCombobox';
import type { GridColumn } from '../../Table/Grid/useTableGrid';
import type { RowForeignKey } from './RowField';

type RowForeignKeyPickerProps = {
  column: GridColumn;
  value: string;
  foreignKey: RowForeignKey;
  onChange: (value: string) => void;
};

// A foreign key column takes one of the values already in the referenced column. NULL is the field's own toggle, so
// the list offers none.
export function RowForeignKeyPicker({ column, value, foreignKey, onChange }: RowForeignKeyPickerProps) {
  return (
    <ForeignKeyValueCombobox
      tableId={foreignKey.referenced_table_id}
      tableName={foreignKey.referenced_table_name}
      column={foreignKey.referenced_column_names[0]}
      isTextColumn={column.dataType === 'character varying'}
      value={value}
      onChange={(next) => onChange(next ?? '')}
      data-cy={`${column.accessor.toLowerCase().replace(/\s+/g, '-')}-input-field`}
    />
  );
}
