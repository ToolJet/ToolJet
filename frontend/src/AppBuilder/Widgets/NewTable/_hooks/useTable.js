import { useState } from 'react';
import {
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { filterFunctions } from '../_components/Header/_components/Filter/filterUtils';

export function useTable({
  data,
  columns,
  enableSorting,
  showBulkSelector,
  serverSidePagination,
  serverSideSort,
  serverSideFilter,
  pageSize,
  globalFilter,
  setGlobalFilter,
}) {
  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnFilters, setColumnFilters] = useState([]);
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
