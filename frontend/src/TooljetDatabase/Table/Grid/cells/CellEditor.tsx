import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useReportUnsaved } from '../../../_stores/unsavedChanges';
import type { ForeignKeyTarget, GridColumn } from '../useTableGrid';
import type { CellPayload } from './cellDraft';
import { CELL_RING, CellEditorShell, EditorFooter, useCellDraft } from './CellEditorShell';
import { isNumericType } from './dataTypes';
import { BooleanBody, JsonBody, JsonDialog, ModeNotice, TimestampBody } from './editorBodies';
import { ForeignKeyEditor } from './ForeignKeyEditor';

type CellEditorProps = {
  value: unknown;
  column: GridColumn;
  foreignKey?: ForeignKeyTarget;
  /** Resolves true once saved. A refusal has been toasted; the editor stays open with the draft. */
  onSave: (payload: CellPayload) => Promise<boolean>;
  onCancel: () => void;
};

// The cell reads as it does closed: the document on one line, without the editor's indentation.
const compactJson = (text: string): string => {
  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return text;
  }
};

const cellClasses =
  'tw-flex tw-h-full tw-w-full tw-min-w-0 tw-items-center tw-bg-background-surface-layer-01 tw-px-3 tw-font-body-large tw-text-text-default';

// Replaces the cell's text while it is edited: an input for text and numbers, a value picker for a foreign key, and a
// popover body of its own for a boolean, a timestamp and JSON. The footer (Null, Default, Cancel, Save) is shared.
export function CellEditor({ value, column, foreignKey, onSave, onCancel }: CellEditorProps) {
  const draft = useCellDraft(value, column.dataType);
  useReportUnsaved('cellEditor', draft.changed);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nullable = column.constraints_type?.is_not_null === false;
  const columnDefault = column.column_default ?? null;

  useEffect(() => inputRef.current?.focus({ preventScroll: true }), []);

  const submit = async () => {
    if (saving) return;
    if (!draft.changed) return onCancel();
    if (!draft.canSave) return;
    setSaving(true);
    // A saved cell unmounts this editor, so only a refusal has anything to reset.
    if (!(await onSave(draft.payload()))) setSaving(false);
  };

  const shell = {
    nullable,
    columnDefault,
    mode: draft.mode,
    onModeChange: (mode: 'null' | 'default') => {
      draft.toggleMode(mode);
      // Back to the field, so Enter still saves.
      inputRef.current?.focus({ preventScroll: true });
    },
    canSave: draft.canSave,
    saving,
    onSave: submit,
    onCancel,
  };

  if (foreignKey) return <ForeignKeyEditor draft={draft} column={column} foreignKey={foreignKey} shell={shell} />;

  // The date picker draws its own padding, so its notice brings the same 12px.
  const notice = (noun: string) => {
    const content = noticeFor(noun);
    return content && <div className="tw-p-3">{content}</div>;
  };
  const noticeFor = (noun: string) =>
    draft.mode !== 'value' ? <ModeNotice mode={draft.mode} columnDefault={columnDefault} noun={noun} /> : null;
  // What the cell reads while the popover is open.
  const cellText = (text: string) =>
    draft.mode === 'null' ? (
      <span className="tw-text-text-placeholder">NULL</span>
    ) : draft.mode === 'default' ? (
      <span className="tw-text-text-placeholder">DEFAULT</span>
    ) : (
      <span className="tw-truncate">{text}</span>
    );
  const staticCell = (text: string) => <div className={cn(cellClasses, CELL_RING)}>{cellText(text)}</div>;

  if (column.dataType === 'boolean') {
    return (
      <CellEditorShell {...shell} cell={staticCell(draft.text === 'true' ? 'True' : 'False')}>
        <BooleanBody text={draft.text} disabled={saving || draft.mode !== 'value'} onChange={draft.setText} />
      </CellEditorShell>
    );
  }

  if (column.dataType === 'timestamp with time zone') {
    const timezone = column.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const shown = draft.text && column.formatValue ? column.formatValue(draft.text) : draft.text;
    return (
      <CellEditorShell {...shell} widthClass="tw-w-[320px]" bareBody cell={staticCell(shown)}>
        {notice('date or time') ?? <TimestampBody text={draft.text} timezone={timezone} onChange={draft.setText} />}
      </CellEditorShell>
    );
  }

  if (column.dataType === 'jsonb') {
    const disabled = saving || draft.mode !== 'value';
    return (
      <>
        <CellEditorShell
          {...shell}
          hidden={expanded}
          widthClass="tw-w-[452px]"
          cell={staticCell(compactJson(draft.text))}
        >
          {noticeFor('JSON value') ?? (
            <JsonBody
              text={draft.text}
              columnName={column.Header}
              disabled={disabled}
              onExpand={() => setExpanded(true)}
              onChange={draft.setText}
            />
          )}
        </CellEditorShell>
        <JsonDialog
          open={expanded}
          onOpenChange={setExpanded}
          text={draft.text}
          columnName={column.Header}
          disabled={disabled}
          onChange={draft.setText}
          footer={<EditorFooter {...shell} className="tw-px-4 tw-py-3" />}
        />
      </>
    );
  }

  return (
    <CellEditorShell
      {...shell}
      cell={
        <input
          ref={inputRef}
          aria-label={column.Header}
          value={draft.mode === 'value' ? draft.text : ''}
          placeholder={
            draft.mode === 'null'
              ? 'NULL'
              : draft.mode === 'default'
                ? `The column default is used: ${columnDefault}`
                : undefined
          }
          readOnly={draft.mode !== 'value' || saving}
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
