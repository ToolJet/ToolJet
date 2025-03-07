import React from 'react';
import cx from 'classnames';
import { flexRender } from '@tanstack/react-table';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import { determineJustifyContentValue } from '@/_helpers/utils';

export const TableRow = ({
  id,
  row,
  virtualRow,
  cellHeight,
  getResolvedValue,
  handleRowClick,
  allowSelection,
  contentWrap,
  highlightSelectedRow,
  setExposedVariables,
  fireEvent,
  rowStyles,
  measureElement,
}) => {
  const selectRowOnCellEdit = useTableStore((state) => state.getTableProperties(id)?.selectRowOnCellEdit, shallow);
  const hasHoveredEvent = useTableStore((state) => state.getHasHoveredEvent(id), shallow);

  if (!row) return null;

  return (
    <tr
      key={row.id}
      ref={measureElement}
      data-index={virtualRow.index}
      style={{
        position: 'absolute',
        top: `${virtualRow.start}px`,
        left: 0,
        width: '100%',
        ...rowStyles,
      }}
      className={cx('table-row table-editor-component-row', {
        selected: allowSelection && highlightSelectedRow && row.getIsSelected(),
        'table-row-condensed': cellHeight === 'condensed',
      })}
      onClick={() => {
        handleRowClick(row);
      }}
      onMouseEnter={() => {
        if (hasHoveredEvent) {
          const hoveredRowDetails = { hoveredRowId: row.id, hoveredRow: row.original };
          setExposedVariables(hoveredRowDetails);
          fireEvent('onRowHovered');
        }
      }}
      onMouseLeave={() => {
        hasHoveredEvent && setExposedVariables({ hoveredRowId: '', hoveredRow: '' });
      }}
    >
      {row.getVisibleCells().map((cell) => {
        const cellStyles = {
          width: cell.column.getSize(),
          backgroundColor: getResolvedValue(cell.column.columnDef?.meta?.cellBackgroundColor ?? 'inherit', {
            rowData: row.original,
            cellValue: cell.getValue(),
          }),
          justifyContent: determineJustifyContentValue(cell.column.columnDef?.meta?.horizontalAlignment),
          display: 'flex',
          alignItems: 'center',
        };

        const isEditable = getResolvedValue(cell.column.columnDef?.meta?.isEditable ?? false, {
          rowData: row.original,
          cellValue: cell.getValue(),
        });

        return (
          <td
            key={cell.id}
            style={cellStyles}
            className={cx('table-cell table-text-align-left td', {
              'wrap-wrapper': contentWrap,
              'has-text': cell.column.columnDef?.meta?.columnType === 'text' || isEditable,
              'has-number': cell.column.columnDef?.meta?.columnType === 'number',
              'has-badge': ['badge', 'badges'].includes(cell.column.columnDef?.meta?.columnType),
              [cellHeight]: true,
              'overflow-hidden':
                ['text', 'string', undefined, 'number'].includes(cell.column.columnDef?.meta?.columnType) &&
                !contentWrap,
              'selector-column': cell.column.columnDef?.meta?.columnType === 'selector',
              'has-select': ['select', 'newMultiSelect'].includes(cell.column.columnDef?.meta?.columnType),
              'has-tags': cell.column.columnDef?.meta?.columnType === 'tags',
              'has-link': cell.column.columnDef?.meta?.columnType === 'link',
              'has-radio': cell.column.columnDef?.meta?.columnType === 'radio',
              'has-toggle': cell.column.columnDef?.meta?.columnType === 'toggle',
              'has-textarea': ['string', 'text'].includes(cell.column.columnDef?.meta?.columnType),
              isEditable: isEditable,
            })}
            onClick={(e) => {
              if (
                (isEditable || ['rightActions', 'leftActions'].includes(cell.column.id)) &&
                allowSelection &&
                !selectRowOnCellEdit
              ) {
                // to avoid on click event getting propagating to row when td is editable or has action button and allowSelection is true and selectRowOnCellEdit is false
                e.stopPropagation();
              }
              setExposedVariables({
                selectedCell: {
                  columnName: cell.column.columnDef?.header,
                  columnKey: cell.column.columnDef?.accessorKey,
                  value: cell.getValue(),
                },
              });
            }}
          >
            <div
              className={`td-container ${
                cell.column.columnDef?.meta?.columnType === 'image' && 'jet-table-image-column h-100'
              } ${cell.column.columnDef?.meta?.columnType !== 'image' && `w-100 h-100`}`}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {flexRender(cell.column?.columnDef?.cell, cell.getContext())}
            </div>
          </td>
        );
      })}
    </tr>
  );
};
