import React from 'react';
import { Inbox } from 'lucide-react';
import { Checkbox, Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { cellStyleFor, readCell } from './tableModel';
import { CellBoundary, CellEditor, MUTED, ROW_BORDER, renderCell } from './TableCells';

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
}) => {
  const cellStyle = (column, row, value) => {
    const color = column.textColor ? resolve(column.textColor, row, value) : undefined;
    const background = column.cellBackgroundColor ? resolve(column.cellBackgroundColor, row, value) : undefined;
    return {
      ...(isSet(color) ? { color } : {}),
      ...(isSet(background) ? { background } : {}),
      ...(column.fontWeight ? { fontWeight: column.fontWeight } : {}),
      ...cellStyleFor(column, row),
      ...(virtual ? { height: rowHeight } : {}),
    };
  };

  return (
    <tbody className="text-[color:var(--lk-fg,var(--sc-foreground))]">
      {isLoading && !wantsSkeleton(properties) ? (
        <tr>
          <td colSpan={colCount} style={{ padding: 0 }}>
            <LoadingBox height={rowHeight * Math.min(5, Number(properties.rowsPerPage) || 5)} />
          </td>
        </tr>
      ) : isLoading ? (
        Array.from({ length: Math.min(5, Number(properties.rowsPerPage) || 5) }, (_, i) => (
          <tr key={i} className={cn('border-b', ROW_BORDER)}>
            {Array.from({ length: colCount }, (__, j) => (
              <td key={j} className="px-3" style={{ height: rowHeight }}>
                <Skeleton className="h-4 w-full max-w-[160px]" />
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
            const showSelected = isSelected && (bulk || properties.highlightSelectedRow !== false);
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
                  'border-b transition-colors last:border-b-0',
                  ROW_BORDER,
                  allowSelection && 'cursor-pointer',
                  'hover:bg-[color:var(--lk-hover,color-mix(in_srgb,var(--sc-muted)_50%,transparent))]',
                  striped &&
                    position % 2 === 1 &&
                    'bg-[color:var(--lk-striped,color-mix(in_srgb,var(--sc-muted)_35%,transparent))]',
                  'data-[state=selected]:bg-[color:var(--lk-selected,var(--sc-muted))]'
                )}
              >
                {bulk ? (
                  <td className="w-10 px-3" onClick={(e) => e.stopPropagation()}>
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
                  const isEditing = editing?.key === entry.key && editing?.column === column.id;
                  const edited = edits.get(entry.key)?.[column.key] !== undefined;
                  return (
                    <td
                      key={column.id}
                      onClick={
                        column.editable && !isDisabled
                          ? (e) => {
                              e.stopPropagation();
                              setEditing({ key: entry.key, column: column.id });
                            }
                          : undefined
                      }
                      className={cn(
                        'px-3 align-middle',
                        column.wrap ? 'whitespace-normal' : 'max-w-[360px] truncate whitespace-nowrap',
                        column.align === 'right' && 'text-right tabular-nums',
                        column.align === 'center' && 'text-center',
                        column.editable && 'cursor-text',
                        edited && 'bg-[color:color-mix(in_srgb,var(--sc-warning,#f59e0b)_10%,transparent)]',
                        bordered && cn('border-r last:border-r-0', ROW_BORDER)
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
          <td colSpan={colCount} className="px-3 py-10 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <Inbox className={cn('h-6 w-6', MUTED)} />
              <p className="text-sm font-medium">
                {searchText || filters.length ? 'No matching rows.' : String(properties.emptyText || 'No results.')}
              </p>
              {properties.emptyDescription && !searchText && !filters.length ? (
                <p className={cn('text-xs', MUTED)}>{String(properties.emptyDescription)}</p>
              ) : null}
            </div>
          </td>
        </tr>
      )}
    </tbody>
  );
};
