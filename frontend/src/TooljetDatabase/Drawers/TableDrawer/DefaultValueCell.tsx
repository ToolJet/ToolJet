import React, { memo } from 'react';
import { Input } from '@/components/ui/Rocket/Input/Input';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { resolveReferences } from '@/AppBuilder/CodeEditor/utils';
import DateTimePicker from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/DateTimePicker';
import { getLocalTimeZone } from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/util';
import { RelationDefaultPicker } from './RelationDefaultPicker';
import type { DraftColumn, DraftRelation } from './types';

// The legacy JS components infer their props from usage; these are the ones used here.
const Hinter = CodeHinter as unknown as React.ComponentType<Record<string, unknown>>;
const Picker = DateTimePicker as unknown as React.ComponentType<Record<string, unknown>>;

type DefaultValueCellProps = {
  column: DraftColumn;
  /** The table's relations: a column with one picks its default from the referenced values. */
  relations: DraftRelation[];
  onChange: (value: string | null) => void;
  /** Reports whether the jsonb editor currently holds invalid JSON. */
  onInvalid: (invalid: boolean) => void;
  className?: string;
  /** Shown while the row is being edited; otherwise an empty default reads as a dash. */
  editing?: boolean;
};

type JsonDefaultProps = {
  columnName: string;
  initialValue: unknown;
  onChange: (value: string | null) => void;
  onInvalid: (invalid: boolean) => void;
};

// The editor reads its starting value once, and holds its own text from then on. Re-rendering it from `column_default`
// would reset the cursor on every keystroke, so it is memoised on the column name only.
const JsonDefault = memo(
  ({ columnName, initialValue, onChange, onInvalid }: JsonDefaultProps) => (
    <Hinter
      type="tjdbHinter"
      inEditor={false}
      initialValue={initialValue ? JSON.stringify(initialValue) : ''}
      lang="javascript"
      onChange={(value: string) => {
        const resolved = (resolveReferences(`{{${value}}}`) as unknown[])[2];
        onChange(resolved as string | null);
      }}
      componentName={`{} ${columnName}`}
      errorCallback={onInvalid}
      lineNumbers={false}
      placeholder="{}"
      height="36"
      columnName={columnName}
    />
  ),
  (previous, next) => previous.columnName === next.columnName
);
JsonDefault.displayName = 'JsonDefault';

// The default value editor for one column, by type. Plain text for most, a date picker for timestamps, a JSON editor
// for jsonb, and a read-only note for serial.
export function DefaultValueCell({
  column,
  relations,
  onChange,
  onInvalid,
  className,
  editing,
}: DefaultValueCellProps) {
  const { data_type: type, column_default: value } = column;

  if (relations.some((relation) => relation.column_names.includes(column.column_name))) {
    return <RelationDefaultPicker column={column} relations={relations} onChange={onChange} />;
  }

  if (type === 'serial') {
    return (
      <Input
        value="Auto-generated"
        disabled
        readOnly
        className={className}
        aria-label="Default value"
        data-cy="default-input-field"
      />
    );
  }

  if (type === 'timestamp with time zone') {
    return (
      <div data-cy="column-default-input-field" className="tw-w-full">
        <Picker
          timestamp={value}
          timezone={(column.configurations?.timezone as string | undefined) || getLocalTimeZone()}
          setTimestamp={(next: string | null) => onChange(next)}
          isClearable
          isPlaceholderEnabled
        />
      </div>
    );
  }

  if (type === 'jsonb') {
    return (
      <div
        className="tjdb-codehinter-wrapper-drawer-tableSchema tw-w-full"
        data-cy="column-default-input-field"
        onKeyDown={(event) => event.stopPropagation()}
      >
        <JsonDefault columnName={column.column_name} initialValue={value} onChange={onChange} onInvalid={onInvalid} />
      </div>
    );
  }

  return (
    <Input
      value={value ?? ''}
      placeholder={editing ? 'Enter value' : '—'}
      className={className}
      aria-label="Default value"
      onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
      data-cy="default-input-field"
    />
  );
}
