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
  disabled?: boolean;
  /** A drawer field (full width, Rocket field look) instead of a table cell. */
  field?: boolean;
};

// The legacy picker is built for a table cell: fixed 35px buttons and a bootstrap border. As a drawer field it is
// restyled from outside (its own `tjdb-default-field` class carries no CSS) to match the Rocket Input (32px, border/default, 6px radius).
const FIELD_LOOK = [
  'tw-h-8 tw-w-full',
  '[&_.tjdb-default-field]:!tw-m-0 [&_.tjdb-default-field]:!tw-h-8 [&_.tjdb-default-field]:!tw-w-full [&_.tjdb-default-field]:!tw-max-w-none',
  '[&_button]:!tw-h-8 [&_button]:!tw-w-full [&_button]:!tw-rounded-md [&_button]:!tw-border [&_button]:!tw-border-solid [&_button]:!tw-border-border-default [&_button]:!tw-bg-background-surface-layer-01 [&_button]:!tw-px-2',
  '[&_button:hover]:!tw-border-border-strong [&_button:disabled]:!tw-border-border-disabled [&_button:disabled]:!tw-bg-background-surface-layer-02',
  '[&_.text-truncate]:!tw-w-full [&_.text-truncate]:!tw-text-left [&_.text-truncate]:!tw-text-base [&_.text-truncate>span]:!tw-text-base [&_.text-truncate>span]:!tw-text-text-placeholder',
  '[&_.dd-select-control-chevron]:!tw-mr-0',
].join(' ');

// The default of a column that has a relation is one of the values already in the referenced column. The picker loads
// those values itself and hands them back through `setReferencedColumnDetails`.
export function RelationDefaultPicker({
  column,
  relations,
  onChange,
  isEditTable = false,
  disabled = false,
  field = false,
}: RelationDefaultPickerProps) {
  const [referenced, setReferenced] = useState<Record<string, unknown>[]>([]);

  const options = referenced.map((item) => {
    const first = Object.values(item)[0];
    const label = first === null ? 'Null' : String(first);
    return { label, value: label };
  });
  const current = column.column_default ?? '';

  const picker = (
    <Picker
      // The legacy drawer class (`foreignKeyAcces-container-drawer`) hard-codes the cell look with !important; a field avoids it.
      buttonClasses={field ? 'tjdb-default-field' : 'border border-end-1 foreignKeyAcces-container'}
      foreignKeyAccessInRowForm={field}
      showPlaceHolder
      options={options}
      darkMode={localStorage.getItem('darkMode') === 'true'}
      emptyError={<div className="m-2">No data found</div>}
      isLoading
      value={{ value: current, label: current }}
      disabled={disabled}
      topPlaceHolder={field ? 'Enter value' : 'Null'}
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
  return field ? <div className={FIELD_LOOK}>{picker}</div> : picker;
}
