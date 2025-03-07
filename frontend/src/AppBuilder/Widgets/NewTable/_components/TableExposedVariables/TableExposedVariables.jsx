import { useEffect, useCallback, useRef } from 'react';
import useTableStore from '../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { exportToCSV, exportToExcel, exportToPDF } from '@/AppBuilder/Widgets/NewTable/_utils/exportData';
import { filterFunctions } from '../Header/_components/Filter/filterUtils';
import { isArray, debounce } from 'lodash';
import { useMounted } from '@/_hooks/use-mount';
import { usePrevious } from '@dnd-kit/utilities';
// Component to expose variables & fire events from the table
// It might miss some variables which are tightly coupled with the component state
export const TableExposedVariables = ({
  id,
  data,
  setExposedVariables,
  fireEvent,
  table,
  componentName,
  pageIndex,
  lastClickedRow,
}) => {
  const editedRows = useTableStore((state) => state.getAllEditedRows(id), shallow);
  const editedFields = useTableStore((state) => state.getAllEditedFields(id), shallow);
  const addNewRowDetails = useTableStore((state) => state.getAllAddNewRowDetails(id), shallow);
  const allowSelection = useTableStore((state) => state.getTableProperties(id)?.allowSelection, shallow);
  const showBulkSelector = useTableStore((state) => state.getTableProperties(id)?.showBulkSelector, shallow);
  const clientSidePagination = useTableStore((state) => state.getTableProperties(id)?.clientSidePagination, shallow);
  const defaultSelectedRow = useTableStore((state) => state.getTableProperties(id)?.defaultSelectedRow, shallow);
  const columnSizes = useTableStore((state) => state.getTableProperties(id)?.columnSizes, shallow);

  const setComponentProperty = useStore((state) => state.setComponentProperty, shallow);

  const mounted = useMounted();
  const previousLastClickedRow = usePrevious(lastClickedRow);

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
    columnSizing,
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
    columnSizing: table.getState().columnSizing,
  };

  const getColumnName = useCallback(
    (columnId) => {
      const column = table.getColumn(columnId);
      return column.columnDef.header;
    },
    [table]
  );

  useEffect(() => {
    setExposedVariables({
      currentData: data,
    });
  }, [data, setExposedVariables]);

  useEffect(() => {
    let updatedData = [...data];
    editedRows.forEach((value, key) => {
      updatedData[key] = value;
    });

    setExposedVariables({
      changeSet: Object.fromEntries(editedFields),
      dataUpdates: Object.fromEntries(editedRows),
      updatedData: updatedData,
    });
    if (editedRows.size > 0) {
      fireEvent('onCellValueChanged');
    }
  }, [editedRows, editedFields, data, setExposedVariables, fireEvent]);

  useEffect(() => {
    if (addNewRowDetails) {
      setExposedVariables({
        newRows: [...addNewRowDetails.values()],
      });
    }
  }, [addNewRowDetails, setExposedVariables]);

  useEffect(() => {
    if (!allowSelection) {
      return table.toggleAllRowsSelected(false);
    }
    if (allowSelection && !showBulkSelector) {
      return table.toggleAllRowsSelected(false);
    }
  }, [allowSelection, showBulkSelector, table, setExposedVariables]);

  // Expose selected rows
  useEffect(() => {
    if (allowSelection && showBulkSelector) {
      setExposedVariables({
        selectedRows: selectedRows.map((row) => row.original),
        selectedRowsId: selectedRows.map((row) => row.id),
      });
    } else {
      setExposedVariables({
        selectedRows: [],
        selectedRowsId: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRows, allowSelection, setExposedVariables, fireEvent, lastClickedRow, showBulkSelector]); // Didn't add mounted as it's not a dependency

  useEffect(() => {
    if (allowSelection) {
      if (previousLastClickedRow?.id !== lastClickedRow?.id) {
        fireEvent('onRowClicked');
      }
    }
  }, [previousLastClickedRow, lastClickedRow, fireEvent, allowSelection]);

  // Expose page index
  useEffect(() => {
    setExposedVariables({ pageIndex });
    mounted && fireEvent('onPageChanged');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, setExposedVariables, fireEvent]); // Didn't add mounted as it's not a dependency

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
    mounted && fireEvent('onSearch');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, setExposedVariables, fireEvent]); // Didn't add mounted as it's not a dependency

  // Expose applied filters
  useEffect(() => {
    setExposedVariables({ filters: appliedFilters.map((filter) => filter.value) });
    mounted && fireEvent('onFilterChanged');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, setExposedVariables, fireEvent]); // Didn't add mounted as it's not a dependency

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
      const item = data.find((item) => item[key] == value);
      if (item) {
        setRowSelection({ [item.id - 1]: true });
      }
      setExposedVariables({
        selectedRow: item,
        selectedRowId: isNaN(item?.id) ? String(item?.id) : item?.id,
      });
    }
    if (defaultSelectedRow) {
      const key = Object?.keys(defaultSelectedRow)[0] ?? '';
      const value = defaultSelectedRow?.[key] ?? undefined;
      if (key && value) {
        selectRow(key, value);
      }
    } else {
      setExposedVariables({
        selectedRow: {},
        selectedRowId: null,
      });
    }
  }, [data, defaultSelectedRow, setExposedVariables, setRowSelection]);

  useEffect(() => {
    if (lastClickedRow) {
      setExposedVariables({
        selectedRow: lastClickedRow,
        selectedRowId: isNaN(lastClickedRow?.id) ? String(lastClickedRow?.id) : lastClickedRow?.id,
      });
    }
  }, [lastClickedRow, setExposedVariables]);

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
  }, [tableData, setExposedVariables, setRowSelection]);

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

  // Create debounced function using useRef to persist between renders
  const debouncedSetProperty = useRef(
    debounce((sizing) => {
      setComponentProperty(id, 'columnSizes', sizing, 'properties');
    }, 300)
  ).current;

  useEffect(() => {
    if (Object.keys(columnSizing).length > 0) {
      debouncedSetProperty({ ...columnSizes, ...columnSizing });
    }

    // Cleanup debounced function on unmount
    return () => {
      debouncedSetProperty.cancel();
    };
  }, [columnSizing, columnSizes, debouncedSetProperty, id]);

  return null;
};
