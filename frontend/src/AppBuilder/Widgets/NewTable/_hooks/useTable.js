import { useState, useMemo } from 'react';
import {
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { applyFilters } from '../_components/Header/_components/Filter/filterUtils';

export function useTable({
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
}) {
  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: rowsPerPage,
  });

  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnOrder, setColumnOrder] = useState(columns.map((column) => column.id));

  // When the columns change, the data is not getting re-rendered. So, we need to create a new data array
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const newData = useMemo(() => [...data], [data, columns]);

  const table = useReactTable({
    data: newData,
    columns,
    enableSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
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
    filterFns: {
      applyFilters: (row, columnId) => {
        const filters = columnFilters.filter((f) => f.id === columnId);
        if (filters.length === 0) return true;
        return applyFilters(row, columnId, filters);
      },
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const value = String(row.getValue(columnId) || '').toLowerCase();
      return value.includes(String(filterValue).toLowerCase());
    },
    manualPagination: serverSidePagination,
    manualSorting: serverSideSort,
    manualFiltering: serverSideFilter,
  });

  return {
    table,
    pagination,
    setPagination,
    columnVisibility,
    setColumnVisibility,
    globalFilter,
    setGlobalFilter,
    columnFilters,
    setColumnFilters,
    columnOrder,
    setColumnOrder,
  };
}
