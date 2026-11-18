import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ForeignKeyTarget, GridColumn } from '../useTableGrid';
import { CELL_RING, CellEditorShell, useCellDraft } from './CellEditorShell';
import { isNumericType } from './dataTypes';
import { ForeignKeyEditor } from './ForeignKeyEditor';

type CellEditorProps = {
  value: unknown;
  column: GridColumn;
  foreignKey?: ForeignKeyTarget;
  /** Resolves true once saved. A refusal has been toasted; the editor stays open with the draft. */
  onSave: (value: string | null) => Promise<boolean>;
  onCancel: () => void;
};

// Replaces the cell's text while it is edited: an input for text and numbers, a value picker for a foreign key.
export function CellEditor({ value, column, foreignKey, onSave, onCancel }: CellEditorProps) {
  const draft = useCellDraft(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nullable = column.constraints_type?.is_not_null === false;

  useEffect(() => inputRef.current?.focus({ preventScroll: true }), []);

  const submit = async () => {
    if (saving) return;
    if (!draft.changed) return onCancel();
    setSaving(true);
    // A saved cell unmounts this editor, so only a refusal has anything to reset.
    if (!(await onSave(draft.payload))) setSaving(false);
  };

  const shell = {
    nullable,
    isNull: draft.isNull,
    onNullChange: (isNull: boolean) => {
      draft.setIsNull(isNull);
      // Back to the field, so Enter still saves.
      inputRef.current?.focus({ preventScroll: true });
    },
    canSave: draft.changed,
    saving,
    onSave: submit,
    onCancel,
  };

  if (foreignKey) return <ForeignKeyEditor draft={draft} column={column} foreignKey={foreignKey} shell={shell} />;

  return (
    <CellEditorShell
      {...shell}
      cell={
        <input
          ref={inputRef}
          aria-label={column.Header}
          value={draft.isNull ? '' : draft.text}
          placeholder={draft.isNull ? 'NULL' : undefined}
          readOnly={draft.isNull || saving}
          autoComplete="off"
          onChange={(event) => draft.setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) submit();
          }}
          className={cn(
            'tw-h-full tw-w-full tw-min-w-0 tw-border-0 tw-bg-background-surface-layer-01 tw-px-3 tw-font-body-large tw-text-text-default tw-outline-none',
            'placeholder:tw-text-text-placeholder',
            CELL_RING,
            isNumericType(column.dataType) && 'tw-text-right'
          )}
        />
      }
    />
  );
}
