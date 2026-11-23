import React, { memo } from 'react';
import type { Column, ColumnSizingState, Row } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/Rocket/Checkbox/Checkbox';
import { cn } from '@/lib/utils';
import { cellDomId } from './cellNavigation';
import { CellContent } from './cells/CellContent';
import { CELL_RING } from './cells/CellEditorShell';
import type { CellPayload } from './cells/cellDraft';
import { CellEditor } from './cells/CellEditor';
import { ExpandRowButton } from './cells/ExpandRowButton';
import { isNumericType } from './cells/dataTypes';
import {
  ADD_COLUMN_WIDTH,
  ROW_HEIGHT,
  SELECT_COLUMN_ID,
  type GridColumnMeta,
  type GridRow as GridRowData,
} from './useTableGrid';

type GridRowProps = {
  row: Row<GridRowData>;
  /** Pixels from the top of the body. */
  start: number;
  /** Not read: a new object on every resize is what re-renders this memoised row at the new widths. */
  columnSizing: ColumnSizingState;
  /** Not read either: the row object outlives a column change (metadata arriving after the rows), so this is what
   * re-renders a mounted row with the new columns. */
  columns: Column<GridRowData>[];
  showTrailingCell: boolean;
  /** Props, not read from the row: the row object outlives a selection change, so this is what re-renders it. */
  isSelected: boolean;
  canSelect: boolean;
  /** Column of the focused cell when it is in this row, so only the affected rows re-render. */
  focusedColumnId: string | null;
  /** The focused cell of this row is being edited. */
  isEditing: boolean;
  /** Stable callbacks: this row is memoised. */
  onFocusCell: (rowIndex: number, columnId: string) => void;
  onEditCell: (rowIndex: number, columnId: string) => void;
  onSaveCell: (rowId: string, columnId: string, payload: CellPayload) => Promise<boolean>;
  onStopEditing: () => void;
  /** Opens the row in the edit drawer (the id cell's expand button). */
  onOpenRow: (rowId: string) => void;
  /** Why this row cannot be opened, or undefined. A string, so the memoised row re-renders when it changes. */
  openBlockedReason?: string;
};

// The Cypress hook the previous grid had: id-<row id>-column-<column>-table-cell, lower-cased.
const cellDataCy = (row: Row<GridRowData>, columnId: string) =>
  `id-${row.original.id}-column-${columnId}-table-cell`.toLowerCase().replace(/\s+/g, '-');

// The token is translucent, so it is laid over the opaque cell colour: pinned cells stay solid while scrolling.
const SELECTED_OVERLAY = 'tw-bg-gradient-to-r tw-from-interactive-selected tw-to-interactive-selected';
// Row hover washes the data cells only: the checkbox and id cells stay as they are (Figma "Row hover"). Not on a selected
// row, whose overlay wins.
const HOVER_OVERLAY =
  'group-hover/row:tw-bg-gradient-to-r group-hover/row:tw-from-interactive-hover group-hover/row:tw-to-interactive-hover';

function GridRowComponent({
  row,
  start,
  showTrailingCell,
  isSelected,
  canSelect,
  focusedColumnId,
  isEditing,
  onFocusCell,
  onEditCell,
  onSaveCell,
  onStopEditing,
  onOpenRow,
  openBlockedReason,
}: GridRowProps) {
  return (
    <div
      role="row"
      aria-selected={isSelected}
      data-testid={`grid-row-${row.id}`}
      className="tw-group/row tw-absolute tw-left-0 tw-top-0 tw-flex tw-w-full"
      style={{ height: ROW_HEIGHT, transform: `translateY(${start}px)` }}
    >
      {row.getVisibleCells().map((cell, columnIndex) => {
        const { column } = cell;
        const pinned = column.getIsPinned() === 'left';
        const meta = column.columnDef.meta as GridColumnMeta | undefined;
        const isSelect = column.id === SELECT_COLUMN_ID;
        const isFocused = column.id === focusedColumnId;
        const isEditingCell = isFocused && isEditing;
        // The pinned key cell is the id cell: its value on the left, the expand button on the right.
        const isIdCell = pinned && !isSelect && !!meta;
        return (
          <div
            key={cell.id}
            id={cellDomId(row.index, columnIndex)}
            role="gridcell"
            data-cy={cellDataCy(row, column.id)}
            className={cn(
              'tw-flex tw-shrink-0 tw-items-center tw-overflow-hidden tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-bg-page-weak',
              'tw-font-body-large',
              isSelect ? 'tw-pl-4' : isEditingCell ? 'tw-p-0' : 'tw-px-3',
              pinned && 'tw-sticky tw-z-10',
              column.getIsLastColumn('left') && 'tw-border-r',
              isSelected && SELECTED_OVERLAY,
              !isSelected && !pinned && !isSelect && HOVER_OVERLAY,
              isFocused && CELL_RING,
              isIdCell && 'tw-justify-between tw-gap-1',
              !isIdCell && meta && isNumericType(meta.column.dataType) && 'tw-justify-end'
            )}
            style={{ width: column.getSize(), height: ROW_HEIGHT, left: pinned ? column.getStart('left') : undefined }}
            // Not while editing: the editor sits inside this cell (its popover too, by way of the React tree), so
            // every click in it would land here and take the focus back from its field.
            onClick={isSelect || isEditingCell ? undefined : () => onFocusCell(row.index, column.id)}
            onDoubleClick={isSelect || isEditingCell ? undefined : () => onEditCell(row.index, column.id)}
          >
            {isSelect ? (
              <Checkbox
                aria-label="Select row"
                checked={isSelected}
                disabled={!canSelect}
                onCheckedChange={(checked) => row.toggleSelected(checked === true)}
              />
            ) : (
              meta &&
              (isEditingCell ? (
                <CellEditor
                  value={cell.getValue()}
                  column={meta.column}
                  foreignKey={meta.foreignKey}
                  onSave={(payload) => onSaveCell(row.id, column.id, payload)}
                  onCancel={onStopEditing}
                />
              ) : (
                <>
                  <CellContent
                    value={cell.getValue()}
                    isPrimaryKey={meta.isPrimaryKey}
                    formatValue={meta.column.formatValue}
                    isFocused={isFocused}
                  />
                  {isIdCell && canSelect && (
                    <ExpandRowButton
                      visible={isFocused}
                      blockedReason={openBlockedReason}
                      onOpen={() => onOpenRow(row.id)}
                    />
                  )}
                </>
              ))
            )}
          </div>
        );
      })}
      <div
        className={cn(
          'tw-h-10 tw-min-w-0 tw-flex-1 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak',
          isSelected ? SELECTED_OVERLAY : HOVER_OVERLAY
        )}
      />
      {showTrailingCell && (
        <div
          className={cn(
            'tw-sticky tw-right-0 tw-z-10 tw-h-10 tw-shrink-0 tw-border-0 tw-border-b tw-border-l tw-border-solid tw-border-border-weak tw-bg-page-weak',
            isSelected && SELECTED_OVERLAY
          )}
          style={{ width: ADD_COLUMN_WIDTH }}
        />
      )}
    </div>
  );
}

export const GridRow = memo(GridRowComponent);
