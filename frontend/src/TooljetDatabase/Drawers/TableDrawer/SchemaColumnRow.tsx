import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, KeyRound, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Checkbox } from '@/components/ui/Rocket/Checkbox/Checkbox';
import { Input } from '@/components/ui/Rocket/Input/Input';
import { ColumnOptionsPopover, hasColumnOptions } from './ColumnOptionsPopover';
import { DefaultValueCell } from './DefaultValueCell';
import { TypeSelect } from './TypeSelect';
import { canBePrimaryKey, canBeUnique, isPinnedPrimaryKey, isPrimaryKeyLocked } from './columnRules';
import type { DraftColumn } from './types';
import type { useTableDraft } from './useTableDraft';

// Grip 24 | name flex | type 148 | default 140 | primary, not null, unique 64 each | actions 64 (Figma: Schema column row).
export const SCHEMA_GRID = 'tw-grid tw-grid-cols-[24px_minmax(0,1fr)_148px_140px_64px_64px_64px_64px] tw-items-center';

// A field in a row. At rest it reads as plain text; hovering the row or editing it shows the field border.
const fieldClass = (editing: boolean) =>
  [
    // The Rocket Input drops to 11px on wide screens; the design's fields are 12px.
    'tw-px-2 !tw-shadow-none md:tw-text-base',
    editing
      ? 'tw-border-border-default tw-bg-background-surface-layer-01'
      : 'tw-border-transparent tw-bg-transparent group-hover:tw-border-border-default group-hover:tw-bg-background-surface-layer-01',
  ].join(' ');

// Read-only text keeps its look when disabled.
const READ_ONLY =
  'disabled:tw-opacity-100 disabled:tw-border-transparent disabled:tw-bg-transparent disabled:tw-text-text-placeholder';

// A type that cannot change reads as text: no field border on hover, no chevron.
const LOCKED_TYPE =
  'disabled:tw-opacity-100 disabled:tw-border-transparent disabled:tw-bg-transparent disabled:tw-text-text-medium [&>svg:last-child]:tw-hidden';

type SchemaColumnRowProps = {
  column: DraftColumn;
  columns: DraftColumn[];
  draft: ReturnType<typeof useTableDraft>;
  /** Rows can be dragged to reorder (a new table). A stored table's column order cannot change. */
  reorderable?: boolean;
};

const typeLockedReason = (column: DraftColumn): string =>
  column.constraints_type.is_primary_key
    ? 'Primary key data type cannot be modified'
    : 'Data type can be changed only from the column’s edit option';

const primaryKeyReason = (column: DraftColumn, pinned: boolean): string | undefined => {
  if (pinned) return 'There must be at least one primary key';
  if (!canBePrimaryKey(column.data_type)) return 'This column type cannot be a primary key';
  return undefined;
};

const uniqueReason = (column: DraftColumn): string | undefined => {
  if (column.constraints_type.is_primary_key) return 'Primary key values must be unique';
  if (!canBeUnique(column.data_type)) return 'This column type cannot be unique';
  return undefined;
};

export function SchemaColumnRow({ column, columns, draft, reorderable = true }: SchemaColumnRowProps) {
  // Editing starts when focus enters the row (a click on any field) and ends when it leaves, the open menus included.
  const [editing, setEditing] = useState(false);
  const pinned = isPinnedPrimaryKey(column, columns);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    disabled: pinned || !reorderable,
  });
  const { is_primary_key: isPrimaryKey, is_not_null: isNotNull, is_unique: isUnique } = column.constraints_type;
  const nameError = draft.columnNameErrors[column.id];
  const typeLocked = !!column.existing;
  const notNullFixed = isPrimaryKey || column.data_type === 'serial';
  const uniqueFixed = isPrimaryKey || !canBeUnique(column.data_type);
  const primaryKeyCount = columns.filter((item) => item.constraints_type.is_primary_key).length;
  const field = fieldClass(editing);
  const showOnHover = editing
    ? 'tw-opacity-100'
    : 'tw-opacity-0 group-hover:tw-opacity-100 focus-visible:tw-opacity-100';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-cy={`schema-row-${column.column_name}`}
      onFocus={() => setEditing(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setEditing(false);
      }}
      className={`${SCHEMA_GRID} tw-group tw-relative tw-h-12 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak ${
        isDragging
          ? 'tw-z-10 tw-bg-background-surface-layer-02 tw-shadow-elevation-200'
          : editing
            ? 'tw-bg-interactive-default'
            : ''
      }`}
    >
      {reorderable ? (
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Reorder ${column.column_name || 'column'}`}
          disabled={pinned}
          className={`tw-flex tw-size-6 tw-cursor-grab tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-default disabled:tw-invisible ${showOnHover}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="tw-size-4" />
        </button>
      ) : (
        <div />
      )}
      <div className="tw-pr-2">
        <Input
          value={column.column_name}
          placeholder="column_name"
          aria-label="Column name"
          aria-invalid={nameError ? true : undefined}
          // The message is listed under the rows (SchemaTable), so the row keeps its height; the red border stays while focused.
          className={`${field} focus-visible:tw-border-2 focus-visible:tw-border-interactive-focus-outline focus-visible:tw-ring-0 aria-[invalid=true]:focus-visible:!tw-border-border-danger-strong`}
          onChange={(event) => draft.updateColumn(column.id, { column_name: event.target.value })}
          data-cy="column-name-input-field"
        />
      </div>
      <div className="tw-pr-2" title={typeLocked ? typeLockedReason(column) : undefined}>
        <TypeSelect
          value={column.data_type}
          onChange={(type) => draft.changeType(column.id, type)}
          disabled={typeLocked}
          icon={isPrimaryKey ? <KeyRound className="tw-size-4 tw-shrink-0 tw-text-icon-strong" /> : undefined}
          className={`${field} tw-gap-1.5 ${
            typeLocked
              ? LOCKED_TYPE
              : editing
                ? '[&>svg:last-child]:tw-opacity-100'
                : '[&>svg:last-child]:tw-opacity-0 group-hover:[&>svg:last-child]:tw-opacity-100'
          }`}
        />
      </div>
      <div className="tw-pr-2">
        <DefaultValueCell
          column={column}
          relations={draft.relations}
          editing={editing}
          className={`${field} ${READ_ONLY}`}
          onChange={(value) => draft.updateColumn(column.id, { column_default: value })}
          onInvalid={(invalid) => draft.setDefaultInvalid(column.id, invalid)}
        />
      </div>
      <div className="tw-flex tw-justify-center" title={primaryKeyReason(column, pinned)}>
        <Checkbox
          aria-label="Primary key"
          checked={isPrimaryKey}
          disabled={isPrimaryKeyLocked(column, columns)}
          onCheckedChange={(checked) => draft.togglePrimaryKey(column.id, checked === true)}
        />
      </div>
      <div className="tw-flex tw-justify-center" title={notNullFixed ? 'Always required for this column' : undefined}>
        <Checkbox
          aria-label="Not null"
          checked={isNotNull}
          disabled={notNullFixed}
          onCheckedChange={(checked) => draft.toggleNotNull(column.id, checked === true)}
          data-cy={isNotNull ? 'not-null-checkbox' : 'null-checkbox'}
        />
      </div>
      <div className="tw-flex tw-justify-center" title={uniqueReason(column)}>
        <Checkbox
          aria-label="Unique"
          checked={isUnique || isPrimaryKey}
          disabled={uniqueFixed}
          onCheckedChange={(checked) => draft.toggleUnique(column.id, checked === true)}
        />
      </div>
      <div className="tw-flex tw-items-center tw-justify-center">
        {hasColumnOptions(column, primaryKeyCount) && (
          <ColumnOptionsPopover
            column={column}
            primaryKeyCount={primaryKeyCount}
            onTimezoneChange={(timezone) =>
              draft.updateColumn(column.id, { configurations: { ...column.configurations, timezone } })
            }
          />
        )}
        <Button
          variant="ghost"
          iconOnly
          size="medium"
          danger
          aria-label={`Delete ${column.column_name || 'column'}`}
          disabled={pinned}
          className={`disabled:tw-invisible ${showOnHover}`}
          onClick={() => draft.removeColumn(column.id)}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
