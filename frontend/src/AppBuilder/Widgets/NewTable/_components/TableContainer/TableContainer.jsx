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
import { shallow } from 'zustand/shallow';

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
    const { showBulkSelector } = getTableProperties(id);

    // Table properties
    const allowSelection = useTableStore((state) => state.getTableProperties(id)?.allowSelection, shallow);
    const enableSorting = useTableStore((state) => state.getTableProperties(id)?.enabledSort, shallow);
    const highlightSelectedRow = useTableStore((state) => state.getTableProperties(id)?.highlightSelectedRow, shallow);
    const columnSizes = useTableStore((state) => state.getTableProperties(id)?.columnSizes, shallow);

    // Server side properties
    const serverSidePagination = useTableStore((state) => state.getTableProperties(id)?.serverSidePagination, shallow);
    const serverSideSort = useTableStore((state) => state.getTableProperties(id)?.serverSideSort, shallow);
    const serverSideFilter = useTableStore((state) => state.getTableProperties(id)?.serverSideFilter, shallow);
    const serverSideSearch = useTableStore((state) => state.getTableProperties(id)?.serverSideSearch, shallow);

    // Table styles
    const isMaxRowHeightAuto = useTableStore((state) => state.getTableStyles(id)?.isMaxRowHeightAuto, shallow);
    const maxRowHeightValue = useTableStore((state) => state.getTableStyles(id)?.maxRowHeightValue, shallow);
    const cellHeight = useTableStore((state) => state.getTableStyles(id)?.cellHeight, shallow);
    const contentWrapProperty = useTableStore((state) => state.getTableStyles(id)?.contentWrap, shallow);
    const rowStyle = useTableStore((state) => state.getTableStyles(id)?.rowStyle, shallow);

    const selectRowOnCellEdit = getSelectRowOnCellEdit(id);
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
            columnSizes,
            defaultColumn: { width: 150 },
            tableData: data,
            id,
            darkMode,
            fireEvent,
            tableRef: tableBodyRef,
            handleCellValueChange,
            searchText: serverSideSearch ? '' : globalFilter,
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
        columnSizes,
        data,
        darkMode,
        handleCellValueChange,
        globalFilter,
        showBulkSelector,
        serverSideSearch,
      ]
    );

    const [columnOrder, setColumnOrder] = useState(columns.map((column) => column.id));

    const table = useReactTable({
      data,
      columns,
      enableSorting,
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
      manualPagination: serverSidePagination,
      manualSorting: serverSideSort,
      manualFiltering: serverSideFilter,
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

    // Memoizing allColumns to avoid re-rendering on every render
    // New reference for columnOrder is created on every render, so stringifying it
    const allColumns = useMemo(() => {
      return table.getAllLeafColumns();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(table.getState().columnOrder), table]);

    useEffect(() => {
      if (allowSelection) {
        if (highlightSelectedRow) {
          table.getColumn('selection')?.toggleVisibility(false);
        } else {
          table.getColumn('selection')?.toggleVisibility(true);
        }
      } else {
        table.getColumn('selection')?.toggleVisibility(false);
      }
    }, [allowSelection, highlightSelectedRow, table]);

    // Create ref for table body
    const tableBodyRef = React.useRef(null);

    // Setup virtualizer
    const rowVirtualizer = useVirtualizer({
      count: table.getRowModel().rows.length,
      getScrollElement: () => tableBodyRef.current,
      estimateSize: () => (cellHeight === 'condensed' ? 40 : 46),
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

    const renderRow = (row, virtualRow) => {
      if (!row) return null;

      // Get row styles
      const rowStyles = {
        minHeight: cellHeight === 'condensed' ? '39px' : '45px',
        display: 'flex',
      };

      const contentWrap = getResolvedValue(contentWrapProperty);

      let cellMaxHeight;
      let calculatedCellHeight;
      if (contentWrap) {
        cellMaxHeight = isMaxRowHeightAuto ? 'fit-content' : getResolvedValue(maxRowHeightValue) + 'px';
        rowStyles.maxHeight = cellMaxHeight;
      } else {
        calculatedCellHeight = cellHeight === 'condensed' ? 40 : 46;
        calculatedCellHeight = cellHeight === 'condensed' ? 40 : 46;
        rowStyles.maxHeight = `${calculatedCellHeight}px`;
        rowStyles.height = `${calculatedCellHeight}px`;
      }

      return (
        <tr
          key={row.id}
          data-index={virtualRow.index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
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
          <table className={`table ${rowStyle} ${darkMode && 'table-dark'}`}>
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
                // {table.getRowModel().rows.map((row) => {
                const row = table.getRowModel().rows[virtualRow.index];
                return (
                  // <tr
                  //   key={row.id}
                  //   data-index={virtualRow.index}
                  //   style={{
                  //     position: 'absolute',
                  //     top: 0,
                  //     left: 0,
                  //     width: '100%',
                  //     height: `${virtualRow.size}px`,
                  //     transform: `translateY(${virtualRow.start}px)`,
                  //   }}
                  // >
                  renderRow(row, virtualRow)
                  // </tr>
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
        <ExposedVariables
          id={id}
          data={data}
          setExposedVariables={setExposedVariables}
          fireEvent={fireEvent}
          table={table}
        />
        <Header
          id={id}
          darkMode={darkMode}
          fireEvent={fireEvent}
          setExposedVariables={setExposedVariables}
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
          componentName={componentName}
          handleChangesSaved={handleChangesSaved}
          handleChangesDiscarded={handleChangesDiscarded}
          fireEvent={fireEvent}
          columnVisibility={columnVisibility} // Passed to trigger a re-render when columnVisibility changes
        />
      </>
    );
  }
);
