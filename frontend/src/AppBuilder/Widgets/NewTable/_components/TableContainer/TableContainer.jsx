import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import useTableStore from '../../_stores/tableStore';
import LoadingState from '../LoadingState';
import EmptyState from '../EmptyState';
import TableHeader from '../TableHeader';
import ExposedVariables from '../ExposedVariables';
import Header from '../Header';
import Footer from '../Footer';
import generateColumnsData from '../../_utils/generateColumnsData';
import cx from 'classnames';
import { determineJustifyContentValue } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import { generateActionColumns } from '../../_utils/generateActionColumns';
import { filterFunctions } from '../Filter/filterUtils';

import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import IndeterminateCheckbox from '../IndeterminateCheckbox';
// eslint-disable-next-line import/no-unresolved
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTableExposed } from '../../_hooks/useTableExposed';
let count = 0;
export const TableContainer = React.memo(
  ({ id, data, width, height, darkMode, componentName, fireEvent, setExposedVariables }) => {
    const {
      getLoadingState,
      getColumnProperties,
      getTableProperties,
      getActions,
      getEnablePagination,
      getRowsPerPage,
      getMaxRowHeightValue,
      getSelectRowOnCellEdit,
      getHasHoveredEvent,
      getEditedRowFromIndex,
      getEditedFieldsOnIndex,
      updateEditedRowsAndFields,
      // getResizingColumnId,
      // setExposedVariables,
      // fireEvent,
    } = useTableStore();

    console.log('rendering--- ', ++count);

    const getResolvedValue = useStore.getState().getResolvedValue;
    const loadingState = getLoadingState(id);
    const columnProperties = getColumnProperties(id);
    const { allowSelection, highlightSelectedRow, showBulkSelector, contentWrapProperty, maxRowHeight, cellSize } =
      getTableProperties(id);
    const maxRowHeightValue = getMaxRowHeightValue(id);
    const selectRowOnCellEdit = getSelectRowOnCellEdit(id);
    const resizingColumnId = '';
    const actions = getActions(id);
    const pageSize = getRowsPerPage(id);
    const hasHoveredEvent = getHasHoveredEvent(id);
    // Pagination state
    const [pagination, setPagination] = useState({
      pageIndex: 0,
      pageSize: pageSize,
    });

    const [columnVisibility, setColumnVisibility] = useState({});
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState([]);
    const lastClickedRowRef = useRef([]);

    const handleCellValueChange = useCallback(
      (index, name, value, row) => {
        const rowDetails = getEditedRowFromIndex(id, index) ?? row;
        const editedFields = getEditedFieldsOnIndex(id, index) ?? {};
        updateEditedRowsAndFields(id, index, { ...rowDetails, [name]: value }, { ...editedFields, [name]: value });
      },
      [getEditedRowFromIndex, id, getEditedFieldsOnIndex, updateEditedRowsAndFields]
    );

    const columns = useMemo(
      () =>
        [
          {
            id: 'selection',
            accessorKey: 'selection',
            meta: { columnType: 'selector', skipExport: true, skipFilter: true, skipAddNewRow: true },
            size: 40,
            header: ({ table }) =>
              showBulkSelector ? (
                <IndeterminateCheckbox
                  {...{
                    checked: table.getIsAllPageRowsSelected(),
                    indeterminate: table.getIsSomePageRowsSelected(),
                    onChange: table.getToggleAllPageRowsSelectedHandler(),
                  }}
                />
              ) : null,
            cell: ({ row }) => (
              <IndeterminateCheckbox
                {...{
                  checked: row.getIsSelected(),
                  indeterminate: row.getIsSomeSelected(),
                  onChange: row.getToggleSelectedHandler(),
                }}
                isCell={true}
              />
            ),
          },
          ...generateActionColumns({
            actions: actions.filter((action) => action.position === 'left'),
            fireEvent,
            setExposedVariables,
            id,
          }),
          ...generateColumnsData({
            columnProperties,
            columnSizes: {},
            defaultColumn: { width: 150 },
            tableData: data,
            id,
            darkMode,
            fireEvent,
            tableRef: tableBodyRef,
            handleCellValueChange,
            searchText: globalFilter,
          }).filter(Boolean),

          ...generateActionColumns({
            actions: actions.filter((action) => action.position === 'right'),
            fireEvent,
            setExposedVariables,
            id,
          }),
        ].filter(Boolean),
      [
        actions,
        fireEvent,
        setExposedVariables,
        id,
        columnProperties,
        data,
        darkMode,
        handleCellValueChange,
        globalFilter,
        showBulkSelector,
      ]
    );

    const [columnOrder, setColumnOrder] = useState(columns.map((column) => column.id));

    console.log('here--- columns--- ', columns);

    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      enableColumnResizing: true,
      columnResizeMode: 'onChange',
      getRowId: (row) => row.uuid,
      enableRowSelection: true,
      enableMultiRowSelection: showBulkSelector,
      state: {
        pagination,
        columnVisibility,
        columnOrder,
        globalFilter,
        columnFilters,
      },
      onPaginationChange: setPagination,
      onColumnVisibilityChange: setColumnVisibility,
      onColumnOrderChange: setColumnOrder,
      onGlobalFilterChange: setGlobalFilter,
      onColumnFiltersChange: setColumnFilters,
      filterFns: filterFunctions,
      globalFilterFn: (row, columnId, filterValue) => {
        const value = String(row.getValue(columnId) || '').toLowerCase();
        return value.includes(String(filterValue).toLowerCase());
      },
      manualPagination: false,
      pageCount: Math.ceil(data.length / pagination.pageSize),
    });

    const { handleChangesSaved, handleChangesDiscarded } = useTableExposed(
      id,
      componentName,
      table,
      pagination.pageIndex,
      fireEvent,
      setExposedVariables,
      lastClickedRowRef.current,
      data
    );

    const allColumns = table.getAllLeafColumns();

    // Create ref for table body
    const tableBodyRef = React.useRef(null);

    // Setup virtualizer
    const rowVirtualizer = useVirtualizer({
      count: table.getRowModel().rows.length,
      getScrollElement: () => tableBodyRef.current,
      estimateSize: () => (cellSize === 'condensed' ? 40 : 46),
      overscan: 5,
      scrollMargin: 0,
    });

    useEffect(() => {
      setPagination((prev) => ({
        ...prev,
        pageSize: pageSize,
      }));
    }, [pageSize]);

    useEffect(() => {
      setColumnOrder(columns.map((column) => column.id));
    }, [columns]);

    // Handles row click for row selection
    const handleRowClick = (row) => {
      if (!allowSelection) return;
      lastClickedRowRef.current = row.original;

      // Update row selection
      row.toggleSelected();
    };

    const renderRow = (row) => {
      if (!row) return null;

      // Get row styles
      const rowStyles = {
        minHeight: cellSize === 'condensed' ? '39px' : '45px',
        display: 'flex',
      };

      const contentWrap = getResolvedValue(contentWrapProperty);
      const isMaxRowHeightAuto = maxRowHeight === 'auto';

      let cellMaxHeight;
      let cellHeight;
      if (contentWrap) {
        cellMaxHeight = isMaxRowHeightAuto ? 'fit-content' : getResolvedValue(maxRowHeightValue) + 'px';
        rowStyles.maxHeight = cellMaxHeight;
      } else {
        cellMaxHeight = cellSize === 'condensed' ? 40 : 46;
        cellHeight = cellSize === 'condensed' ? 40 : 46;
        rowStyles.maxHeight = `${cellMaxHeight}px`;
        rowStyles.height = `${cellHeight}px`;
      }

      return (
        <tr
          key={row.id}
          style={rowStyles}
          className={cx('table-row table-editor-component-row', {
            'row-selected': allowSelection && highlightSelectedRow && row.getIsSelected(),
            'table-row-condensed': cellSize === 'condensed',
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
              height: '100%',
              backgroundColor: getResolvedValue(cell.column.columnDef?.meta?.cellBackgroundColor) ?? 'inherit',
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
                className={cx('table-cell td condensed', {
                  'has-text': cell.column.columnDef?.meta?.columnType === 'text' || isEditable,
                  'has-number': cell.column.columnDef?.meta?.columnType === 'number',
                  'has-badge': ['badge', 'badges'].includes(cell.column.columnDef?.meta?.columnType),
                  [cellSize]: true,
                  'overflow-hidden':
                    ['text', 'string', undefined, 'number'].includes(cell.column.columnDef?.meta?.columnType) &&
                    !contentWrap,
                  'selector-column': cell.column.columnDef?.meta?.columnType === 'selector',
                  'resizing-column':
                    cell.column.columnDef?.isResizing || cell.column.columnDef?.id === resizingColumnId,
                  'has-select': ['select', 'newMultiSelect'].includes(cell.column.columnDef?.meta?.columnType),
                  'has-tags': cell.column.columnDef?.meta?.columnType === 'tags',
                  'has-link': cell.column.columnDef?.meta?.columnType === 'link',
                  'has-radio': cell.column.columnDef?.meta?.columnType === 'radio',
                  'has-toggle': cell.column.columnDef?.meta?.columnType === 'toggle',
                  'has-textarea': ['string', 'text'].includes(cell.column.columnDef?.meta?.columnType),
                  isEditable: isEditable,
                })}
                onClick={(e) => {
                  console.log(
                    'here--- cell.column.id--- ',
                    cell.column,
                    isEditable,
                    allowSelection,
                    !selectRowOnCellEdit
                  );
                  if (
                    (isEditable || ['rightActions', 'leftActions'].includes(cell.column.id)) &&
                    allowSelection &&
                    !selectRowOnCellEdit
                  ) {
                    // to avoid on click event getting propagating to row when td is editable or has action button and allowSelection is true and selectRowOnCellEdit is false
                    e.stopPropagation();
                  }
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

    const renderTable = () => {
      if (loadingState) {
        return (
          <div className={'table-responsive jet-data-table overflow-hidden'}>
            <LoadingState />
          </div>
        );
      } else if (data.length === 0) {
        return (
          <div className={'table-responsive jet-data-table overflow-hidden position-relative'}>
            <EmptyState />
          </div>
        );
      }
      return (
        <div
          className={`table-responsive jet-data-table`}
          style={{ maxHeight: '100%', overflow: 'auto' }}
          ref={tableBodyRef}
        >
          <table className="table">
            <TableHeader
              id={id}
              table={table}
              darkMode={darkMode}
              columnOrder={columnOrder}
              setColumnOrder={setColumnOrder}
            />
            <tbody
              style={{
                position: 'relative',
                height: `${rowVirtualizer.getTotalSize()}px`,
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = table.getRowModel().rows[virtualRow.index];
                return (
                  <tr
                    key={row.id}
                    data-index={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {renderRow(row)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    };

    const handleFilterChange = (filters) => {
      setColumnFilters(filters);
    };

    return (
      <>
        <ExposedVariables id={id} data={data} setExposedVariables={setExposedVariables} fireEvent={fireEvent} />
        <Header
          id={id}
          darkMode={darkMode}
          fireEvent={() => {}}
          setExposedVariables={() => {}}
          setGlobalFilter={setGlobalFilter}
          globalFilter={globalFilter}
          table={table}
          setFilters={handleFilterChange}
        />
        {renderTable()}
        <Footer
          id={id}
          darkMode={darkMode}
          width={width}
          height={height}
          allColumns={allColumns}
          table={table}
          pageIndex={pagination.pageIndex + 1}
          pageSize={pagination.pageSize}
          pageCount={table.getPageCount()}
          totalRecords={data.length}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onPageChange={table.setPageIndex}
          onPageSizeChange={table.setPageSize}
          componentName={componentName}
          handleChangesSaved={handleChangesSaved}
          handleChangesDiscarded={handleChangesDiscarded}
          fireEvent={fireEvent}
        />
      </>
    );
  }
);
