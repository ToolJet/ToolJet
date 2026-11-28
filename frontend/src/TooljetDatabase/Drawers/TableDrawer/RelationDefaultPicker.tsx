import React from 'react';
import { useTooljetDatabaseContext, type TjdbTable } from '../../TooljetDatabaseContext';
import { ForeignKeyValueCombobox } from './ForeignKeyValueCombobox';
import type { DraftColumn, DraftRelation } from './types';

type RelationDefaultPickerProps = {
  column: DraftColumn;
  relations: DraftRelation[];
  onChange: (value: string | null) => void;
  disabled?: boolean;
  /** A drawer field (32px) instead of a schema table cell (28px). */
  field?: boolean;
};

// The default of a column that has a relation is NULL or one of the values already in the referenced column.
export function RelationDefaultPicker({
  column,
  relations,
  onChange,
  disabled = false,
  field = false,
}: RelationDefaultPickerProps) {
  const { tables } = useTooljetDatabaseContext();
  const relation = relations.find((item) => item.column_names.includes(column.column_name));
  if (!relation) return null;

  const referencedColumn = relation.referenced_column_names[relation.column_names.indexOf(column.column_name)];
  const tableId =
    relation.referenced_table_id ??
    (tables as TjdbTable[]).find((table) => table.table_name === relation.referenced_table_name)?.id;

  return (
    <ForeignKeyValueCombobox
      tableId={tableId}
      tableName={relation.referenced_table_name}
      column={referencedColumn}
      isTextColumn={column.data_type === 'character varying'}
      value={column.column_default ?? null}
      onChange={onChange}
      allowNull
      placeholder={field ? 'Enter value' : 'NULL'}
      disabled={disabled}
      size={field ? 'default' : 'small'}
    />
  );
}
