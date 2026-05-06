import React from 'react';
import cx from 'classnames';
import { flexRender } from '@tanstack/react-table';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import { determineJustifyContentValue } from '@/_helpers/utils';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { getPinnedStyles } from '../pinColumnsUtils';

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
  componentName,
  table,
}) => {
  const selectRowOnCellEdit = useTableStore((state) => state.getTableProperties(id)?.selectRowOnCellEdit, shallow);
  const hasHoveredEvent = useTableStore((state) => state.getHasHoveredEvent(id), shallow);
  const editedFields = useTableStore((state) => state.getEditedFieldsOnIndex(id, row.index), shallow);

  if (!row) return null;

  return (
    <tr
      key={`${row.id}-${virtualRow.index}`} // Added virtualRow.index to make the key unique and work with useVirtualizer
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
      onClick={(e) => {
        const isCheckbox = e?.target?.classList.contains('table-selector-checkbox-icon') ?? false;
        handleRowClick(row, isCheckbox);
      }}
      onMouseEnter={() => {
        if (hasHoveredEvent) {
          const hoveredRowDetails = { hoveredRowId: row.id, hoveredRow: row.original };
          setExposedVariables(hoveredRowDetails);
          fireEvent('onRowHovered');
        }
      }}
      data-cy={`${generateCypressDataCy(componentName)}-row-${virtualRow.index}`}
    >
      {row.getVisibleCells().map((cell) => {
        const isButtonColumn = cell.column.columnDef?.meta?.columnType === 'button';
        const {
          pinnedPosition,
          isPinnedBoundary,
          style: pinnedStyles,
        } = getPinnedStyles({
          column: cell.column,
          table,
        });
        const resolvedCellBackgroundColor = getResolvedValue(cell.column.columnDef?.meta?.cellBackgroundColor, {
          rowData: row.original,
          cellValue: cell.getValue(),
        });
        const cellBackgroundColor =
          pinnedPosition && [undefined, null, '', 'inherit', 'transparent'].includes(resolvedCellBackgroundColor)
            ? 'var(--cc-table-pinned-column-bg, var(--cc-surface1-surface))'
            : resolvedCellBackgroundColor ?? 'inherit';
        const cellStyles = {
          backgroundColor: cellBackgroundColor,
          justifyContent: isButtonColumn
            ? undefined
            : determineJustifyContentValue(cell.column.columnDef?.meta?.horizontalAlignment),
          display: 'flex',
          alignItems: 'center',
          textAlign: isButtonColumn ? undefined : cell.column.columnDef?.meta?.horizontalAlignment,
          width: cell.column.getSize(),
          flex: '0 0 auto',
          ...pinnedStyles,
        };

        const isEditable = getResolvedValue(cell.column.columnDef?.meta?.isEditable ?? false, {
          rowData: row.original,
          cellValue: cell.getValue(),
        });

        const isEdited = editedFields?.[cell.column.columnDef?.accessorKey] || false;

        return (
          <td
            key={cell.id}
            data-cy={`${generateCypressDataCy(componentName)}-${generateCypressDataCy(
              typeof cell.column.columnDef?.header === 'string' ? cell.column.columnDef?.header : cell.column.id
            )}-row-${virtualRow.index}`}
            style={cellStyles}
            className={cx('table-cell td', {
              'has-actions':
                cell.column.id === 'rightActions' ||
                cell.column.id === 'leftActions' ||
                cell.column.columnDef?.meta?.columnType === 'button',
              'has-left-actions': cell.column.id === 'leftActions',
              'has-right-actions': cell.column.id === 'rightActions',
              'table-text-align-center': cell.column.columnDef?.meta?.horizontalAlignment === 'center',
              'table-text-align-right': cell.column.columnDef?.meta?.horizontalAlignment === 'right',
              'table-text-align-left': cell.column.columnDef?.meta?.horizontalAlignment === 'left',
              'wrap-wrapper': contentWrap,
              'has-text': cell.column.columnDef?.meta?.columnType === 'text' || isEditable,
              'has-datepicker': cell.column.columnDef?.meta?.columnType === 'datepicker',
              'has-number': cell.column.columnDef?.meta?.columnType === 'number',
              'has-badge': ['badge', 'badges'].includes(cell.column.columnDef?.meta?.columnType),
              [cellHeight]: true,
              'overflow-hidden':
                ['text', 'string', undefined, 'number'].includes(cell.column.columnDef?.meta?.columnType) &&
                !contentWrap,
              'selector-column': cell.column.columnDef?.meta?.columnType === 'selector',
              'has-select': ['select', 'newMultiSelect', 'tagsV2'].includes(cell.column.columnDef?.meta?.columnType),
              'has-tags': cell.column.columnDef?.meta?.columnType === 'tags',
              'has-link': cell.column.columnDef?.meta?.columnType === 'link',
              'has-radio': cell.column.columnDef?.meta?.columnType === 'radio',
              'has-toggle': cell.column.columnDef?.meta?.columnType === 'toggle',
              'has-textarea': ['string', 'text'].includes(cell.column.columnDef?.meta?.columnType),
              'has-multiselect': cell.column.columnDef?.meta?.columnType === 'multiselect',
              'has-dropdown': cell.column.columnDef?.meta?.columnType === 'dropdown',
              isEditable: isEditable,
              isEdited: isEdited,
              'pinned-column': !!pinnedPosition,
              'pinned-column-left': pinnedPosition === 'left',
              'pinned-column-right': pinnedPosition === 'right',
              'pinned-column-boundary-left': pinnedPosition === 'left' && isPinnedBoundary,
              'pinned-column-boundary-right': pinnedPosition === 'right' && isPinnedBoundary,
            })}
            onClick={(e) => {
              const columnType = cell.column.columnDef?.meta?.columnType;
              // if the cell is an action button and the row is selected, don't unselect the row and fire the onRowClicked event
              if (['rightActions', 'leftActions'].includes(cell.column.id) && allowSelection && row.getIsSelected()) {
                e.stopPropagation();
                fireEvent('onRowClicked');
              } else if (columnType === 'button' && allowSelection && row.getIsSelected()) {
                // if the cell is a button column and the row is selected, don't unselect the row and fire the onRowClicked event
                e.stopPropagation();
                fireEvent('onRowClicked');
              } else if (isEditable && allowSelection && (!selectRowOnCellEdit || row.getIsSelected())) {
                // if the cell is editable and the row is selected, don't unselect the row
                e.stopPropagation();
                fireEvent('onRowClicked');
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
            >
              {flexRender(cell.column?.columnDef?.cell, cell.getContext())}
            </div>
          </td>
        );
      })}
    </tr>
  );
};
