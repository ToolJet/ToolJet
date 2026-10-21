import React from 'react';
import type { CSSProperties, Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { VirtualItem } from '@tanstack/react-virtual';
import { Inbox } from 'lucide-react';
import { Checkbox, Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { cellStyleFor, readCell } from './tableModel';
import type { Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { CellBoundary, CellEditor, MUTED, ROW_BORDER, renderCell } from './TableCells';
import type { UncheckedPatterns } from './tableRegex';
import type { Editing, Edits, Entry, OnAction, Resolve, Row, TableColumn, TableFilter, WithEdits } from './types';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/values';

interface TableBodyProps {
  properties: Resolved;
  isLoading: boolean;
  isDisabled: boolean;
  colCount: number;
  rowHeight: number;
  rendered: Entry[];
  virtual: boolean;
  virtualItems: VirtualItem[];
  padTop: number;
  padBottom: number;
  shownColumns: TableColumn[];
  withEdits: WithEdits;
  selected: Set<string>;
  bulk: boolean;
  allowSelection: boolean;
  striped: boolean;
  bordered: boolean;
  clickRow: (entry: Entry, options?: { keep?: boolean }) => void;
  hoverRow: (entry: Entry) => void;
  hoveredRef: MutableRefObject<string | null>;
  toggleBulk: (entry: Entry) => void;
  editing: Editing | null;
  setEditing: Dispatch<SetStateAction<Editing | null>>;
  edits: Edits;
  commitEdit: (entry: Entry, column: TableColumn, value: unknown) => void;
  resolve: Resolve;
  onAction: OnAction;
  searchText: string;
  filters: TableFilter[];
  /** The regex rule patterns this data could not be checked on (screenRegexRules): they hold for no row. */
  unchecked: UncheckedPatterns;
}

export const TableBody = ({
  properties,
  isLoading,
  isDisabled,
  colCount,
  rowHeight,
  rendered,
  virtual,
  virtualItems,
  padTop,
  padBottom,
  shownColumns,
  withEdits,
  selected,
  bulk,
  allowSelection,
  striped,
  bordered,
  clickRow,
  hoverRow,
  hoveredRef,
  toggleBulk,
  editing,
  setEditing,
  edits,
  commitEdit,
  resolve,
  onAction,
  searchText,
  filters,
  unchecked,
}: TableBodyProps) => {
  const cellStyle = (column: TableColumn, row: Row, value: unknown): CSSProperties => {
    const color = column.textColor ? resolve(column.textColor, row, value) : undefined;
    const background = column.cellBackgroundColor ? resolve(column.cellBackgroundColor, row, value) : undefined;
    return {
      ...(isSet(color) ? { color: color as CSSProperties['color'] } : {}),
      ...(isSet(background) ? { background: background as CSSProperties['background'] } : {}),
      ...(column.fontWeight ? { fontWeight: column.fontWeight } : {}),
      ...cellStyleFor(column, row, unchecked),
      ...(virtual ? { height: rowHeight } : {}),
    };
  };

  return (
    <tbody className="tw-text-[color:var(--lk-fg,var(--sc-foreground))]">
      {isLoading && !wantsSkeleton(properties) ? (
        <tr>
          <td colSpan={colCount} style={{ padding: 0 }}>
            <LoadingBox height={rowHeight * Math.min(5, Number(properties.rowsPerPage) || 5)} />
          </td>
        </tr>
      ) : isLoading ? (
        Array.from({ length: Math.min(5, Number(properties.rowsPerPage) || 5) }, (_, i) => (
          <tr key={i} className={cn('tw-border-b', ROW_BORDER)}>
            {Array.from({ length: colCount }, (__, j) => (
              <td key={j} className="tw-px-3" style={{ height: rowHeight }}>
                <Skeleton className="tw-h-4 tw-w-full tw-max-w-[160px]" />
              </td>
            ))}
          </tr>
        ))
      ) : rendered.length ? (
        <>
          {padTop > 0 ? (
            <tr aria-hidden="true">
              <td colSpan={colCount} style={{ height: padTop, padding: 0, border: 0 }} />
            </tr>
          ) : null}
          {rendered.map((entry, i) => {
            const row = withEdits(entry);
            const isSelected = selected.has(entry.key);
            // As on the native Table, only a selectable table marks rows (a row the selectRow action picked included).
            const showSelected = allowSelection && isSelected && (bulk || properties.highlightSelectedRow !== false);
            const position = virtual ? virtualItems[i]?.index ?? i : i;
            return (
              <tr
                key={entry.key}
                data-state={showSelected ? 'selected' : undefined}
                onClick={() => clickRow(entry)}
                onMouseEnter={() => hoverRow(entry)}
                onMouseLeave={() => {
                  hoveredRef.current = null;
                }}
                className={cn(
                  'tw-border-b tw-transition-colors last:tw-border-b-0',
                  ROW_BORDER,
                  allowSelection && 'tw-cursor-pointer',
                  'hover:tw-bg-[color:var(--lk-hover,color-mix(in_srgb,var(--sc-muted)_50%,transparent))]',
                  striped &&
                    position % 2 === 1 &&
                    'tw-bg-[color:var(--lk-striped,color-mix(in_srgb,var(--sc-muted)_35%,transparent))]',
                  'data-[state=selected]:tw-bg-[color:var(--lk-selected,var(--sc-accent-soft))]'
                )}
              >
                {bulk ? (
                  <td className="tw-w-10 tw-px-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      aria-label="Select row"
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => toggleBulk(entry)}
                    />
                  </td>
                ) : null}
                {shownColumns.map((column) => {
                  const value = readCell(row, column.key);
                  const isEditing =
                    editing?.key === entry.key && editing?.column === column.id && column.editable && !isDisabled;
                  const edited = edits.get(entry.key)?.[column.key] !== undefined;
                  return (
                    <td
                      key={column.id}
                      onClick={
                        column.editable && !isDisabled
                          ? (e) => {
                              e.stopPropagation();
                              // A click on the cell whose editor is open (around the input) is not another row click.
                              if (isEditing) return;
                              // The click opening the editor is a row click too, as on the native Table: the row
                              // selects (never deselects) and onRowClicked fires. Clicks in the editor stop at it.
                              clickRow(entry, { keep: true });
                              setEditing({ key: entry.key, column: column.id });
                            }
                          : undefined
                      }
                      className={cn(
                        'tw-px-3 tw-align-middle',
                        column.wrap ? 'tw-whitespace-normal' : 'tw-max-w-[360px] tw-truncate tw-whitespace-nowrap',
                        column.align === 'right' && 'tw-text-right tw-tabular-nums',
                        column.align === 'center' && 'tw-text-center',
                        column.editable && 'tw-cursor-text',
                        edited && 'tw-bg-[color:color-mix(in_srgb,var(--sc-warning,#f59e0b)_10%,transparent)]',
                        bordered && cn('tw-border-r last:tw-border-r-0', ROW_BORDER)
                      )}
                      style={{ height: rowHeight, ...cellStyle(column, row, value) }}
                    >
                      {isEditing ? (
                        <CellEditor
                          column={column}
                          value={value}
                          onCommit={(next) => commitEdit(entry, column, next)}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <CellBoundary resetKey={value}>
                          {renderCell({
                            value,
                            row,
                            column,
                            properties,
                            resolve,
                            onAction,
                            rowIndex: entry.index,
                            unchecked,
                          })}
                        </CellBoundary>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {padBottom > 0 ? (
            <tr aria-hidden="true">
              <td colSpan={colCount} style={{ height: padBottom, padding: 0, border: 0 }} />
            </tr>
          ) : null}
        </>
      ) : (
        <tr>
          {/* The empty state fills the body (shadcn.scss .sc-table-empty): in a short table the icon goes, then the
              description, and the message stays; it sat at the foot of a 40px-padded row with only the icon's top
              showing. */}
          <td colSpan={colCount} className="tw-h-full tw-p-0 tw-text-center">
            <div className="sc-table-empty">
              <Inbox className={cn('sc-table-empty-icon tw-h-6 tw-w-6 tw-shrink-0', MUTED)} />
              <p className="tw-m-0 tw-text-ui2-sm tw-font-medium">
                {searchText || filters.length ? 'No matching rows.' : String(properties.emptyText || 'No results.')}
              </p>
              {properties.emptyDescription && !searchText && !filters.length ? (
                <p className={cn('sc-table-empty-note tw-m-0 tw-text-xs', MUTED)}>
                  {String(properties.emptyDescription)}
                </p>
              ) : null}
            </div>
          </td>
        </tr>
      )}
    </tbody>
  );
};
