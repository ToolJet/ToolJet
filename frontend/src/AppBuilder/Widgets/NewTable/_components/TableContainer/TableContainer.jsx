import React, { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import useTableStore from '../../_stores/tableStore';
import TableExposedVariables from '../TableExposedVariables';
import Header from '../Header';
import Footer from '../Footer';
import { buildTableColumn } from '../../_utils/buildTableColumn';
import { useTable } from '../../_hooks/useTable';
import { shallow } from 'zustand/shallow';
import TableData from '../TableData';

export const TableContainer = ({
  id,
  data,
  width,
  height,
  darkMode,
  componentName,
  fireEvent,
  setExposedVariables,
}) => {
  const { getColumnProperties, getEditedRowFromIndex, getEditedFieldsOnIndex, updateEditedRowsAndFields } =
    useTableStore();

  const columnProperties = getColumnProperties(id);
  // Table properties
  const showBulkSelector = useTableStore((state) => state.getTableProperties(id)?.showBulkSelector, shallow);
  const enableSorting = useTableStore((state) => state.getTableProperties(id)?.enabledSort, shallow);
  const columnSizes = useTableStore((state) => state.getTableProperties(id)?.columnSizes, shallow);

  // Server side properties
  const serverSidePagination = useTableStore((state) => state.getTableProperties(id)?.serverSidePagination, shallow);
  const serverSideSort = useTableStore((state) => state.getTableProperties(id)?.serverSideSort, shallow);
  const serverSideFilter = useTableStore((state) => state.getTableProperties(id)?.serverSideFilter, shallow);
  const serverSideSearch = useTableStore((state) => state.getTableProperties(id)?.serverSideSearch, shallow);
  const rowsPerPage = useTableStore((state) => state.getTableProperties(id)?.rowsPerPage, shallow);
  const clearEditedRows = useTableStore((state) => state.clearEditedRows, shallow);

  const actions = useTableStore((state) => state.getActions(id), shallow);

  const [globalFilter, setGlobalFilter] = useState('');
  const lastClickedRowRef = useRef([]);
  const tableBodyRef = useRef(null);

  const handleCellValueChange = useCallback(
    (index, name, value, row) => {
      const rowDetails = getEditedRowFromIndex(id, index) ?? row;
      const editedFields = getEditedFieldsOnIndex(id, index) ?? {};
      updateEditedRowsAndFields(id, index, { ...rowDetails, [name]: value }, { ...editedFields, [name]: value });
    },
    [getEditedRowFromIndex, id, getEditedFieldsOnIndex, updateEditedRowsAndFields]
  );

  const columns = useMemo(() => {
    return buildTableColumn(
      showBulkSelector,
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
      serverSideSearch,
      tableBodyRef
    );
  }, [
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
  ]);

  const { table, pagination, setPagination, columnVisibility, setColumnFilters, columnOrder, setColumnOrder } =
    useTable({
      data,
      columns,
      enableSorting,
      showBulkSelector,
      serverSidePagination,
      serverSideSort,
      serverSideFilter,
      rowsPerPage,
      globalFilter,
      setGlobalFilter,
    });

  // Memoizing allColumns to avoid re-rendering on every render
  // New reference for columnOrder is created on every render, so stringifying it
  const allColumns = useMemo(() => {
    return table.getAllLeafColumns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(table.getState().columnOrder), table]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageSize: rowsPerPage,
    }));
  }, [rowsPerPage, setPagination]);

  useEffect(() => {
    setColumnOrder(columns.map((column) => column.id));
  }, [columns, setColumnOrder]);

  const handleFilterChange = useCallback(
    (filters) => {
      setColumnFilters(filters);
    },
    [setColumnFilters]
  );

  const clearChangeSet = useCallback(() => {
    setExposedVariables({ dataUpdates: [], changeSet: {} });
    clearEditedRows(id);
  }, [setExposedVariables, clearEditedRows, id]);

  const handleChangesDiscarded = useCallback(() => {
    clearChangeSet();
    fireEvent('onCancelChanges');
  }, [clearChangeSet, fireEvent]);

  return (
    <>
      <TableExposedVariables
        id={id}
        data={data}
        setExposedVariables={setExposedVariables}
        fireEvent={fireEvent}
        table={table}
        componentName={componentName}
        pageIndex={pagination.pageIndex + 1}
        lastClickedRow={lastClickedRowRef.current}
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
      <TableData
        id={id}
        data={data}
        tableBodyRef={tableBodyRef}
        darkMode={darkMode}
        table={table}
        columnOrder={columnOrder}
        setColumnOrder={setColumnOrder}
        setExposedVariables={setExposedVariables}
        fireEvent={fireEvent}
        lastClickedRowRef={lastClickedRowRef}
      />
      <Footer
        id={id}
        darkMode={darkMode}
        width={width}
        height={height}
        allColumns={allColumns}
        table={table}
        pageIndex={pagination.pageIndex + 1}
        componentName={componentName}
        handleChangesSaved={clearChangeSet}
        handleChangesDiscarded={handleChangesDiscarded}
        setExposedVariables={setExposedVariables}
        fireEvent={fireEvent}
        pageCount={table.getPageCount()}
        columnVisibility={columnVisibility} // Passed to trigger a re-render when columnVisibility changes
      />
    </>
  );
};
