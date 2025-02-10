import { useEffect, useCallback, useMemo, useRef } from 'react';
import useTableStore from '@/AppBuilder/Widgets/NewTable/_stores/tableStore';
import { exportToCSV, exportToExcel, exportToPDF } from '@/AppBuilder/Widgets/NewTable/_utils/exportData';
import { filterFunctions } from '../_components/Filter/filterUtils';
import { isArray } from 'lodash';

export const useTableExposed = (
  id,
  componentName,
  table,
  pageIndex,
  fireEvent,
  setExposedVariables,
  lastClickedRow
) => {
  const { getTableProperties, clearEditedRows } = useTableStore();
  const { showBulkSelector, clientSidePagination } = getTableProperties(id);

  const {
    selectedRows,
    sorting,
    currentPageData,
    filteredData,
    searchText,
    appliedFilters,
    toggleAllRowsSelected,
    setPageIndex,
    setRowSelection,
    setColumnFilters,
    tableData,
    columns,
  } = {
    selectedRows: table.getFilteredSelectedRowModel()?.rows,
    sorting: table.getState()?.sorting,
    currentPageData: table.getPaginationRowModel()?.rows,
    filteredData: table.getFilteredRowModel()?.rows,
    searchText: table.getState().globalFilter ?? '',
    appliedFilters: table.getState().columnFilters,
    toggleAllRowsSelected: table.toggleAllRowsSelected,
    setPageIndex: table.setPageIndex,
    setRowSelection: table.setRowSelection,
    setColumnFilters: table.setColumnFilters,
    tableData: table.getRowModel().rows,
    columns: table.getAllColumns(),
  };

  const getColumnName = useCallback(
    (columnId) => {
      const column = table.getColumn(columnId);
      return column.columnDef.header;
    },
    [table]
  );

  // Expose selected rows
  useEffect(() => {
    setExposedVariables({
      selectedRows: selectedRows.map((row) => row.original),
      selectedRowsId: selectedRows.map((row) => row.id),
      selectedRow: lastClickedRow,
      selectedRowId: isNaN(lastClickedRow?.id) ? String(lastClickedRow?.id) : lastClickedRow?.id,
    });
    fireEvent('onRowClicked');
  }, [selectedRows, setExposedVariables, fireEvent, lastClickedRow]);

  // Expose page index
  useEffect(() => {
    setExposedVariables({ pageIndex: pageIndex + 1 });
    fireEvent('onPageChanged');
  }, [pageIndex, setExposedVariables, fireEvent]);

  // Expose sort applied
  useEffect(() => {
    if (sorting.length > 0) {
      const sortApplied = [{ column: getColumnName(sorting[0].id), direction: sorting[0].desc ? 'desc' : 'asc' }];
      setExposedVariables({ sortApplied });
      fireEvent('onSort');
    } else {
      setExposedVariables({ sortApplied: undefined });
    }
  }, [sorting, getColumnName, setExposedVariables, fireEvent]);

  //   // Expose current page data
  useEffect(() => {
    setExposedVariables({ currentPageData: currentPageData.map((row) => row.original) });
  }, [currentPageData, setExposedVariables]);

  //   Expose filtered data
  useEffect(() => {
    setExposedVariables({ filteredData: filteredData.map((row) => row.original) });
  }, [filteredData, setExposedVariables, fireEvent]);

  // Expose search text
  useEffect(() => {
    setExposedVariables({ searchText });
    fireEvent('onSearch');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, setExposedVariables, fireEvent]);

  // Expose applied filters
  useEffect(() => {
    setExposedVariables({ filters: appliedFilters.map((filter) => filter.value) });
    fireEvent('onFilterChanged');
  }, [appliedFilters, setExposedVariables, fireEvent]);

  // CSA for select & deselect all rows in table
  useEffect(() => {
    function selectAllRows() {
      if (showBulkSelector) {
        toggleAllRowsSelected(true);
      }
    }
    function deselectAllRows() {
      if (showBulkSelector) {
        toggleAllRowsSelected(false);
      }
    }
    setExposedVariables({
      selectAllRows,
      deselectAllRows,
    });
  }, [setExposedVariables, showBulkSelector, toggleAllRowsSelected]);

  // CSA to set page index
  useEffect(() => {
    function setPage(targetPageIndex) {
      setExposedVariables({ pageIndex: targetPageIndex });
      if (clientSidePagination) setPageIndex(targetPageIndex - 1);
    }
    setExposedVariables({ setPage });
  }, [setPageIndex, setExposedVariables, clientSidePagination]);

  useEffect(() => {
    function selectRow(key, value) {
      const item = tableData.find((item) => item[key] == value);
      if (item) {
        setRowSelection({ [item.id - 1]: true });
      }
    }

    function deselectRow(key, value) {
      const item = tableData.find((item) => item[key] == value);
      if (item) {
        setRowSelection({ [item.id - 1]: false });
      }
    }
    setExposedVariables({ selectRow, deselectRow });
  }, [tableData, setExposedVariables, selectedRows, setRowSelection]);

  // CSA to set & clear filters
  useEffect(() => {
    function setFilters(_filters) {
      if (!isArray(_filters)) return;
      const filterArr = [];
      _filters.forEach((_filter) => {
        const { column = '', value = '', condition = '' } = _filter;
        const columnId = columns.find((col) => col.columnDef?.header === column)?.id;
        if (columnId && filterFunctions[condition]) {
          filterArr.push({ id: columnId, value: { column, condition, value } });
        }
      });
      setColumnFilters(filterArr);
    }
    function clearFilters() {
      setColumnFilters([]);
    }
    setExposedVariables({ clearFilters, setFilters });
  }, [setColumnFilters, setExposedVariables, columns]);

  // CSA to download table data
  useEffect(() => {
    function downloadTableData(format) {
      switch (format) {
        case 'csv':
          exportToCSV(table, componentName);
          break;
        case 'xlsx':
          exportToExcel(table, componentName);
          break;
        case 'pdf':
          exportToPDF(table, componentName);
          break;
      }
    }
    setExposedVariables({ downloadTableData });
  }, [componentName, setExposedVariables, table]);

  const handleChangesSaved = useCallback(() => {
    setExposedVariables({ dataUpdates: [], changeSet: {} });
    clearEditedRows(id);
  }, [setExposedVariables, clearEditedRows, id]);

  const handleChangesDiscarded = useCallback(() => {
    setExposedVariables({ dataUpdates: [], changeSet: {} });
    clearEditedRows(id);
    fireEvent('onCancelChanges');
  }, [setExposedVariables, fireEvent, clearEditedRows, id]);

  return { handleChangesSaved, handleChangesDiscarded };
};
