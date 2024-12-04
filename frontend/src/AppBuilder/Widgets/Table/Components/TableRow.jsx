import React from 'react';
import cx from 'classnames';
import GenerateEachCellValue from '../GenerateEachCellValue';
import { get, isEqual } from 'lodash';
import { textWrapActions } from '../tableUtils';

export const TableRow = React.memo(
  ({
    row,
    index,
    prepareRow,
    getResolvedValue,
    contentWrapProperty,
    maxRowHeight,
    cellSize,
    changeSet,
    currentState,
    validateWidget,
    validateDates,
    actions,
    toggleRowSelected,
    setExposedVariables,
    fireEvent,
    rowDetails,
    setRowDetails,
    hoverRef,
    allowSelection,
    highlightSelectedRow,
    showBulkSelector,
    tableDetails,
    mergeToTableDetails,
    darkMode,
    state,
    hoverAdded,
    columnData,
    tableData,
    isRowInValid,
    autoHeight,
    maxRowHeightValue,
    selectRowOnCellEdit,
    resizingColumnId,
  }) => {
    const textWrapActions = (id) => {
      //should we remove this
      let wrapOption = tableDetails.columnProperties?.find((item) => {
        return item?.id == id;
      });
      return wrapOption?.textWrap;
    };

    prepareRow(row);
    let rowProps = { ...row.getRowProps() };
    const contentWrap = getResolvedValue(contentWrapProperty);
    const isMaxRowHeightAuto = maxRowHeight === 'auto';
    rowProps.style.minHeight = cellSize === 'condensed' ? '39px' : '45px'; // 1px is removed to accomodate 1px border-bottom
    let cellMaxHeight;
    let cellHeight;
    if (contentWrap) {
      cellMaxHeight = isMaxRowHeightAuto ? 'fit-content' : getResolvedValue(maxRowHeightValue) + 'px';
      rowProps.style.maxHeight = cellMaxHeight;
    } else {
      cellMaxHeight = cellSize === 'condensed' ? 40 : 46;
      cellHeight = cellSize === 'condensed' ? 40 : 46;
      rowProps.style.maxHeight = cellMaxHeight + 'px';
      rowProps.style.height = cellHeight + 'px';
    }
    const showInvalidError = row.cells.some((cell) =>
      isRowInValid(cell, currentState, changeSet, validateWidget, validateDates)
    );
    if (showInvalidError) {
      rowProps.style.maxHeight = 'fit-content';
      rowProps.style.height = '';
    }
    return (
      <tr
        key={index}
        className={`table-row table-editor-component-row ${
          allowSelection &&
          highlightSelectedRow &&
          ((row.isSelected && row.id === tableDetails.selectedRowId) ||
            (showBulkSelector &&
              row.isSelected &&
              tableDetails?.selectedRowsDetails?.some((singleRow) => singleRow.selectedRowId === row.id)))
            ? 'selected'
            : ''
        }`}
        {...rowProps}
        onClickCapture={() => {
          // toggleRowSelected will triggered useRededcuer function in useTable and in result will get the selectedFlatRows consisting row which are selected
          const selectedRow = row.original;
          const selectedRowId = row.id;
          setExposedVariables({ selectedRow, selectedRowId });
          fireEvent('onRowClicked');
        }}
        onClick={async () => {
          if (allowSelection) {
            await toggleRowSelected(row.id);
          }
          const selectedRow = row.original;
          const selectedRowId = row.id;
          mergeToTableDetails({ selectedRow, selectedRowId });
        }}
        onMouseOver={() => {
          if (hoverAdded) {
            const hoveredRowDetails = { hoveredRowId: row.id, hoveredRow: row.original };
            setRowDetails(hoveredRowDetails);
            hoverRef.current = rowDetails?.hoveredRowId;
          }
        }}
        onMouseLeave={() => {
          hoverAdded && setRowDetails({ hoveredRowId: '', hoveredRow: '' });
        }}
      >
        {row.cells.map((cell, index) => {
          let cellProps = cell.getCellProps();
          cellProps.style.textAlign = cell.column?.horizontalAlignment;
          if (tableDetails.changeSet) {
            if (tableDetails.changeSet[cell.row.index]) {
              const currentColumn = columnData.find((column) => column.id === cell.column.id);
              if (get(tableDetails.changeSet[cell.row.index], currentColumn?.accessor, undefined) !== undefined) {
                cellProps.style.backgroundColor = 'var(--orange3)';
                cellProps.style['--tblr-table-accent-bg'] = 'var(--orange3)';
              }
            }
          }
          if (cell.column.columnType === 'selector') {
            cellProps.style.width = 40;
            cellProps.style.padding = 0;
          }
          if (cell.column.Header === 'Actions') {
            cellProps.style.width = 'fit-content';
            cellProps.style.maxWidth = 'fit-content';
          }
          if (row.cells?.[row.cells?.length - 1]?.column.Header === 'Actions' && index === row?.cells?.length - 2) {
            cellProps.style.flex = '1 1 auto';
          }
          //should we remove this
          const wrapAction = textWrapActions(cell.column.id);
          const rowChangeSet = changeSet ? changeSet[cell.row.index] : null;
          const cellValue = rowChangeSet ? rowChangeSet[cell.column.name] || cell.value : cell.value;
          const rowData = tableData[cell.row.index];
          const cellBackgroundColor = ![
            'dropdown',
            'badge',
            'badges',
            'tags',
            'radio',
            'link',
            'multiselect',
            'toggle',
          ].includes(cell?.column?.columnType)
            ? getResolvedValue(cell.column?.cellBackgroundColor, {
                cellValue,
                rowData,
              })
            : '';
          const cellTextColor = getResolvedValue(cell.column?.textColor, {
            cellValue,
            rowData,
          });
          const actionButtonsArray = actions.map((action) => {
            return {
              ...action,
              isDisabled: getResolvedValue(action?.disableActionButton ?? false, {
                cellValue,
                rowData,
              }),
            };
          });
          const isEditable = getResolvedValue(cell.column?.isEditable ?? false, {
            cellValue,
            rowData,
          });
          const horizontalAlignment = cell.column?.horizontalAlignment;
          return (
            // Does not require key as its already being passed by react-table via cellProps
            // eslint-disable-next-line react/jsx-key
            <td
              data-cy={`${cell.column.columnType ?? ''}${String(
                cell.column.id === 'rightActions' || cell.column.id === 'leftActions' ? cell.column.id : ''
              )}${String(cellValue ?? '').toLocaleLowerCase()}-cell-${index}`}
              className={cx(
                `table-text-align-${cell.column.horizontalAlignment}  
                ${cell?.column?.Header !== 'Actions' && (contentWrap ? 'wrap-wrapper' : '')}
                td`,
                {
                  'has-actions': cell.column.id === 'rightActions' || cell.column.id === 'leftActions',
                  'has-left-actions': cell.column.id === 'leftActions',
                  'has-right-actions': cell.column.id === 'rightActions',
                  'has-text': cell.column.columnType === 'text' || isEditable,
                  'has-number': cell.column.columnType === 'number',
                  'has-dropdown': cell.column.columnType === 'dropdown',
                  'has-multiselect': cell.column.columnType === 'multiselect',
                  'has-datepicker': cell.column.columnType === 'datepicker',
                  'align-items-center flex-column': cell.column.columnType === 'selector',
                  'has-badge': ['badge', 'badges'].includes(cell.column.columnType),
                  [cellSize]: true,
                  'overflow-hidden':
                    ['text', 'string', undefined, 'number'].includes(cell.column.columnType) && !contentWrap,
                  'selector-column': cell.column.columnType === 'selector' && cell.column.id === 'selection',
                  'resizing-column': cell.column.isResizing || cell.column.id === resizingColumnId,
                  'has-select': ['select', 'newMultiSelect'].includes(cell.column.columnType),
                  'has-tags': cell.column.columnType === 'tags',
                  'has-link': cell.column.columnType === 'link',
                  'has-radio': cell.column.columnType === 'radio',
                  'has-toggle': cell.column.columnType === 'toggle',
                  'has-textarea': ['string', 'text'].includes(cell.column.columnType),
                  isEditable: isEditable,
                }
              )}
              {...cellProps}
              style={{ ...cellProps.style, backgroundColor: cellBackgroundColor ?? 'inherit' }}
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
                    columnName: cell.column.exportValue,
                    columnKey: cell.column.key,
                    value: cellValue,
                  },
                });
              }}
            >
              <div
                className={`td-container ${cell.column.columnType === 'image' && 'jet-table-image-column h-100'} ${
                  cell.column.columnType !== 'image' && `w-100 h-100`
                }`}
              >
                <GenerateEachCellValue
                  cellValue={cellValue}
                  globalFilter={state.globalFilter}
                  cellRender={cell.render('Cell', {
                    cell,
                    actionButtonsArray,
                    isEditable,
                    horizontalAlignment,
                    cellTextColor,
                    contentWrap,
                    autoHeight,
                    isMaxRowHeightAuto,
                  })}
                  rowChangeSet={rowChangeSet}
                  isEditable={isEditable}
                  columnType={cell.column.columnType}
                  isColumnTypeAction={['rightActions', 'leftActions'].includes(cell.column.id)}
                  cellTextColor={cellTextColor}
                  cell={cell}
                  currentState={currentState}
                  cellWidth={cell.column.width}
                  darkMode={darkMode}
                />
              </div>
            </td>
          );
        })}
      </tr>
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps)
);
