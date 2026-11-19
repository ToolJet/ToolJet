import React, { useState } from 'react';
import DropDownSelect from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import { FIELD_LOOK } from '../TableDrawer/RelationDefaultPicker';
import type { GridColumn } from '../../Table/Grid/useTableGrid';
import type { RowFormKind } from './rowRules';
import type { RowForeignKey } from './RowField';

// The legacy picker infers its props from usage; these are the ones used here.
const Picker = DropDownSelect as unknown as React.ComponentType<Record<string, unknown>>;

type RowForeignKeyPickerProps = {
  column: GridColumn;
  kind: RowFormKind;
  value: string;
  foreignKey: RowForeignKey;
  onChange: (value: string) => void;
};

// A foreign key column takes one of the values already in the referenced column. The legacy picker loads those values
// itself and hands them back through `setReferencedColumnDetails`; it is restyled from outside to the Rocket field look.
export function RowForeignKeyPicker({ column, kind, value, foreignKey, onChange }: RowForeignKeyPickerProps) {
  const [referenced, setReferenced] = useState<Record<string, unknown>[]>([]);
  const options = referenced.map((item) => {
    const first = Object.values(item)[0];
    const label = first === null ? 'Null' : String(first);
    return { label, value: label };
  });

  return (
    <div className={FIELD_LOOK} data-cy={`${column.accessor.toLowerCase().replace(/\s+/g, '-')}-input-field`}>
      <Picker
        buttonClasses="tjdb-default-field"
        foreignKeyAccessInRowForm
        showPlaceHolder
        options={options}
        darkMode={localStorage.getItem('darkMode') === 'true'}
        emptyError={<div className="m-2">No data found</div>}
        isLoading
        value={{ value, label: value }}
        topPlaceHolder="Select a value"
        onChange={(next: { value: string }) => onChange(next.value)}
        onAdd
        addBtnLabel="Open referenced table"
        foreignKeys={[foreignKey]}
        setReferencedColumnDetails={setReferenced}
        scrollEventForColumnValues
        cellColumnName={column.accessor}
        columnDataType={column.dataType}
        isCreateRow={kind === 'create'}
        isEditRow={kind === 'edit'}
      />
    </div>
  );
}
