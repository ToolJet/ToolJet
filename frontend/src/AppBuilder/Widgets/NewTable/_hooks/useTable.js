import { useState, useMemo, useEffect, useRef } from 'react';
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
  enablePagination,
  showBulkSelector,
  serverSidePagination,
  serverSideSort,
  serverSideFilter,
  rowsPerPage,
  globalFilter,
  setGlobalFilter,
  expandedRows,
  defaultColumnFilters = [],
}) {
  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: enablePagination ? rowsPerPage : data.length,
  });

  const [columnVisibility, setColumnVisibility] = useState({});
  // Seeded in the initial state, so applying the builder's default filters is not a filter change.
  const [columnFilters, setColumnFilters] = useState(defaultColumnFilters);
  const defaultsKey = JSON.stringify(defaultColumnFilters);
  const seededDefaultsKey = useRef(defaultsKey);
  // The exact array last seeded: a change to it is not a user filter change
  const seededFilters = useRef(defaultColumnFilters);
  useEffect(() => {
    // The builder edited the defaults (or the columns they point at arrived) after mount
    if (seededDefaultsKey.current === defaultsKey) return;
    seededDefaultsKey.current = defaultsKey;
    seededFilters.current = defaultColumnFilters;
    setColumnFilters(defaultColumnFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultsKey]);
  const [columnOrder, setColumnOrder] = useState(columns.map((column) => column.id));

  const columnPinning = useMemo(() => {
    const pinPositionByColumnId = columns.reduce((acc, column) => {
      const pinPosition = column?.meta?.pinPosition;
      if (pinPosition === 'left' || pinPosition === 'right') {
        acc[column.id] = pinPosition;
      }
      return acc;
    }, {});

    const leftPinned = columnOrder.filter((columnId) => pinPositionByColumnId[columnId] === 'left');
    const rightPinned = columnOrder.filter((columnId) => pinPositionByColumnId[columnId] === 'right');

    // Pin the selection (checkbox) column to the extreme left only when other columns are pinned
    const hasOtherLeftPins = leftPinned.some((id) => id !== 'selection');
    if (hasOtherLeftPins && !leftPinned.includes('selection')) {
      leftPinned.unshift('selection');
    }

    return { left: leftPinned, right: rightPinned };
  }, [columns, columnOrder]);

  useEffect(() => {
    setPagination((prev) => ({
      pageIndex: serverSidePagination ? (prev.pageIndex ?? 0) : 0,
      pageSize: enablePagination ? rowsPerPage : data.length,
    }));
  }, [enablePagination, rowsPerPage, data.length, serverSidePagination]);

  // When the columns change, the data is not getting re-rendered. So, we need to create a new data array
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const newData = useMemo(() => [...data], [data, columns]);

  const meta = useMemo(() => ({ expandedRows }), [expandedRows]);

  const table = useReactTable({
    data: newData,
    columns,
    enableSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnPinning: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    enableRowSelection: true,
    enableMultiRowSelection: showBulkSelector,
    meta,
    state: {
      pagination,
      columnVisibility,
      columnOrder,
      columnPinning,
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
    getColumnCanGlobalFilter: (column) => column.getIsVisible(),
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
    seededFilters,
    columnOrder,
    setColumnOrder,
  };
}
