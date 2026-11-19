import React, { useEffect, useReducer, useRef, useState } from 'react';
import type { Table } from '@tanstack/react-table';
import { toast } from 'react-hot-toast';
import { Check, Plus, X } from 'lucide-react';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { cn } from '@/lib/utils';
import { useTjdbStore } from '../../_stores/tjdbStore';
import { useReportUnsaved } from '../../_stores/unsavedChanges';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { isNumericType } from './cells/dataTypes';
import { CELL_RING } from './cells/CellEditorShell';
import {
  buildRowPayload,
  IDLE_DRAFT,
  inlineDraftReducer,
  mapRowError,
  unsetLabel,
  type InlineDraft,
} from './inlineDraft';
import {
  ADD_COLUMN_WIDTH,
  ROW_HEIGHT,
  SELECT_COLUMN_ID,
  type GridColumn,
  type GridColumnMeta,
  type GridRow,
} from './useTableGrid';

type InlineAddRowsProps = {
  table: Table<GridRow>;
  showTrailingCell: boolean;
};

const FIELD =
  'tw-h-full tw-w-full tw-min-w-0 tw-border-0 tw-bg-transparent tw-px-3 tw-font-body-large tw-text-text-default tw-outline-none placeholder:tw-text-text-placeholder';

const FOCUSED_CELL =
  'focus-within:tw-bg-background-surface-layer-01 focus-within:tw-shadow-[inset_0_0_0_2px_var(--interactive-focus-outline)]';

type FieldProps = {
  column: GridColumn;
  draft: InlineDraft;
  register: (element: HTMLInputElement | HTMLSelectElement | null) => void;
  onChange: (value: string) => void;
};

// A serial column is generated, so it only says so. A boolean is a choice of three (the empty one is "untouched");
// everything else is typed text, which the server casts.
function Field({ column, draft, register, onChange }: FieldProps) {
  const value = draft.values[column.accessor] ?? '';
  const placeholder = unsetLabel(column);
  const readOnly = draft.status === 'saving';
  const invalid = !!draft.errors[column.accessor];

  if (column.dataType === 'serial') {
    return <span className="tw-px-3 tw-font-body-large tw-text-text-placeholder">{placeholder}</span>;
  }
  if (column.dataType === 'boolean') {
    return (
      <select
        ref={register}
        aria-label={column.Header}
        aria-invalid={invalid}
        value={value}
        disabled={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className={cn(FIELD, 'tw-cursor-pointer', value === '' && 'tw-text-text-placeholder')}
      >
        <option value="">{placeholder}</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }
  return (
    <input
      ref={register}
      aria-label={column.Header}
      aria-invalid={invalid}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      autoComplete="off"
      onChange={(event) => onChange(event.target.value)}
      className={cn(FIELD, isNumericType(column.dataType) && 'tw-text-right')}
    />
  );
}

// The add row at the foot of the grid, outside the virtualiser: a footer with "Add row" that turns into a sticky row
// of fields (so it stays in view however far the page is scrolled) with save and cancel icons at its end.
// Enter or Save sends it; the rows refetch, so the new row lands where the current sort puts it, and a fresh row opens.
export function InlineAddRows({ table, showTrailingCell }: InlineAddRowsProps) {
  const { selectedTable, handleRefetchQuery } = useTooljetDatabaseContext();
  const environmentId = useTjdbStore(
    (state: { selectedEnvironment: { id: string } | null }) => state.selectedEnvironment?.id ?? null
  );
  const [draft, dispatch] = useReducer(inlineDraftReducer, IDLE_DRAFT);
  const [draftEnvironment, setDraftEnvironment] = useState(environmentId);
  // A draft belongs to the environment it was started in: the columns are reloaded on a switch.
  if (draftEnvironment !== environmentId) {
    setDraftEnvironment(environmentId);
    dispatch({ type: 'reset' });
  }
  // Unsaved: a cell has a value (a cleared cell has no entry in `values`), or the row is on its way to the server.
  useReportUnsaved(
    'inlineAddRow',
    draft.status === 'saving' || (draft.status === 'drafting' && Object.keys(draft.values).length > 0)
  );

  const fields = useRef(new Map<string, HTMLInputElement | HTMLSelectElement>());
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  const columns = table
    .getVisibleLeafColumns()
    .filter((column) => column.id !== SELECT_COLUMN_ID)
    .map((column) => (column.columnDef.meta as GridColumnMeta).column);
  const firstField = columns.find((column) => column.dataType !== 'serial');

  // A fresh draft starts in its first field.
  useEffect(() => {
    if (draft.round > 0 && draft.status === 'drafting' && firstField) {
      fields.current.get(firstField.accessor)?.focus();
    }
    // Only a new round (start, or a saved row) moves the focus; typing must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.round]);

  // A refusal takes the user to the cell it names.
  useEffect(() => {
    if (draft.status !== 'drafting') return;
    const failed = columns.find((column) => draft.errors[column.accessor]);
    if (failed) fields.current.get(failed.accessor)?.focus();
    // Only the way back from saving carries new errors; clearing one while typing must not move the focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.status]);

  useEffect(() => {
    if (draft.status === 'idle' && restoreFocus.current) {
      restoreFocus.current = false;
      addButtonRef.current?.focus();
    }
  }, [draft.status]);

  const cancel = () => {
    restoreFocus.current = true;
    dispatch({ type: 'cancel' });
  };

  const save = async () => {
    if (draft.status !== 'drafting' || !selectedTable.id) return;
    const { values } = draft;
    dispatch({ type: 'save' });
    const refused = (error: { code?: string; message?: string }) => {
      const result = mapRowError(error, columns, values);
      // The create row drawer toasts every refusal; one that no cell owns (a plan limit) has nowhere else to show.
      if (result.rowError) toast.error(result.rowError);
      dispatch({ type: 'saveErr', ...result });
    };
    try {
      const { error } = await tooljetDatabaseService.createRow(selectedTable.id, buildRowPayload(columns, values));
      if (error) return refused(error);
    } catch (error) {
      return refused(error as { message?: string });
    }
    toast.success('Row created successfully');
    handleRefetchQuery();
    dispatch({ type: 'saveOk' });
  };

  const footerClass =
    'tw-sticky tw-bottom-0 tw-z-10 tw-h-10 tw-w-full tw-shrink-0 tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-bg-page-weak';

  if (draft.status === 'idle') {
    return (
      <div className={footerClass}>
        <div className="tw-sticky tw-left-0 tw-flex tw-h-full tw-w-fit tw-items-center tw-pl-3">
          {/* Figma Add row: a custom button, not the Rocket Button (14px regular, text/medium, 8px inset). */}
          <button
            ref={addButtonRef}
            type="button"
            onClick={() => dispatch({ type: 'start' })}
            data-cy="add-row-button"
            className="tw-inline-flex tw-h-8 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-font-body-large tw-text-text-medium hover:tw-bg-interactive-hover focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline"
          >
            <Plus aria-hidden className="tw-size-4 tw-shrink-0 tw-text-icon-default" />
            Add row
          </button>
        </div>
      </div>
    );
  }

  const saving = draft.status === 'saving';

  return (
    <div
      role="row"
      aria-label="New row"
      aria-busy={saving}
      data-cy="inline-add-row"
      className="tw-sticky tw-bottom-0 tw-z-10 tw-flex tw-w-full tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-bg-background-accent-weak"
      style={{ height: ROW_HEIGHT }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
          event.preventDefault();
          save();
        } else if (event.key === 'Escape' && draft.status === 'drafting') {
          event.stopPropagation();
          cancel();
        }
      }}
    >
      {table.getVisibleLeafColumns().map((leaf) => {
        const meta = leaf.columnDef.meta as GridColumnMeta | undefined;
        const pinned = leaf.getIsPinned() === 'left';
        const error = meta && draft.errors[meta.column.accessor];
        return (
          <div
            key={leaf.id}
            role="gridcell"
            className={cn(
              'tw-relative tw-flex tw-shrink-0 tw-items-center tw-border-0 tw-border-solid tw-border-border-weak',
              // The cell being typed in lifts onto the surface with the focus ring.
              meta && FOCUSED_CELL,
              pinned && 'tw-sticky tw-z-10 tw-bg-background-accent-weak',
              leaf.getIsLastColumn('left') && 'tw-border-r',
              error && CELL_RING
            )}
            style={{ width: leaf.getSize(), height: ROW_HEIGHT, left: pinned ? leaf.getStart('left') : undefined }}
          >
            {meta ? (
              <Field
                column={meta.column}
                draft={draft}
                register={(element) => {
                  if (element) fields.current.set(meta.column.accessor, element);
                  else fields.current.delete(meta.column.accessor);
                }}
                onChange={(value) => dispatch({ type: 'edit', column: meta.column.accessor, value })}
              />
            ) : (
              <Plus aria-hidden className="tw-ml-4 tw-size-4 tw-text-icon-default" />
            )}
            {error && (
              <span
                role="alert"
                className="tw-absolute tw-bottom-full tw-left-0 tw-z-20 tw-whitespace-nowrap tw-rounded-sm tw-bg-background-surface-layer-01 tw-px-2 tw-py-0.5 tw-font-body-default tw-text-text-danger tw-shadow-elevation-200"
              >
                {error}
              </span>
            )}
          </div>
        );
      })}
      <div className="tw-min-w-0 tw-flex-1" />
      <div
        className="tw-sticky tw-right-0 tw-z-10 tw-flex tw-shrink-0 tw-items-center tw-gap-1 tw-border-0 tw-border-l tw-border-solid tw-border-border-weak tw-bg-background-accent-weak tw-px-2"
        style={{ minWidth: showTrailingCell ? ADD_COLUMN_WIDTH : undefined }}
      >
        {draft.rowError && (
          <span
            role="alert"
            className="tw-absolute tw-bottom-full tw-right-0 tw-z-20 tw-whitespace-nowrap tw-rounded-sm tw-bg-background-surface-layer-01 tw-px-2 tw-py-0.5 tw-font-body-default tw-text-text-danger tw-shadow-elevation-200"
          >
            {draft.rowError}
          </span>
        )}
        <Button
          variant="ghost"
          size="medium"
          iconOnly
          aria-label="Save row"
          title="Save row"
          loading={saving}
          onClick={save}
          data-cy="save-new-row-button"
        >
          <Check />
        </Button>
        <Button
          variant="ghost"
          size="medium"
          iconOnly
          aria-label="Cancel"
          title="Cancel"
          disabled={saving}
          onClick={cancel}
          data-cy="cancel-new-row-button"
        >
          <X />
        </Button>
      </div>
    </div>
  );
}
