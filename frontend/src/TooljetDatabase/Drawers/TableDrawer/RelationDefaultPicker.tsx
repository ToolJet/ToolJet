import React, { useState } from 'react';
import DropDownSelect from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import type { DraftColumn, DraftRelation } from './types';

// The legacy picker infers its props from usage; these are the ones used here.
const Picker = DropDownSelect as unknown as React.ComponentType<Record<string, unknown>>;

type RelationDefaultPickerProps = {
  column: DraftColumn;
  relations: DraftRelation[];
  onChange: (value: string | null) => void;
  /** Edit table loads the referenced values differently from create. */
  isEditTable?: boolean;
};

// The default of a column that has a relation is one of the values already in the referenced column. The picker loads
// those values itself and hands them back through `setReferencedColumnDetails`.
export function RelationDefaultPicker({
  column,
  relations,
  onChange,
  isEditTable = false,
}: RelationDefaultPickerProps) {
  const [referenced, setReferenced] = useState<Record<string, unknown>[]>([]);

  const options = referenced.map((item) => {
    const first = Object.values(item)[0];
    const label = first === null ? 'Null' : String(first);
    return { label, value: label };
  });
  const current = column.column_default ?? '';

  return (
    <Picker
      buttonClasses="border border-end-1 foreignKeyAcces-container"
      showPlaceHolder
      options={options}
      darkMode={localStorage.getItem('darkMode') === 'true'}
      emptyError={<div className="m-2">No data found</div>}
      isLoading
      value={{ value: current, label: current }}
      topPlaceHolder="Null"
      onChange={(next: { value: string }) => onChange(next.value === 'Null' ? null : next.value)}
      onAdd
      addBtnLabel="Open referenced table"
      foreignKeys={relations}
      setReferencedColumnDetails={setReferenced}
      scrollEventForColumnValues
      cellColumnName={column.column_name}
      columnDataType={column.data_type}
      isEditTable={isEditTable}
      isCreateTable={!isEditTable}
    />
  );
}
