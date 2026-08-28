import { useState, useMemo, useEffect } from 'react';
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
}) {
  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: enablePagination ? rowsPerPage : data.length,
  });

  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnFilters, setColumnFilters] = useState([]);

  // `columnOrder` is intentionally NOT controlled React state (unlike `sorting`/
  // `columnSizing`, react-table manages it internally) — an end-user's live
  // drag-to-reorder is session-only UX and must survive unrelated re-renders
  // without any hand-written resync logic. See `onColumnOrderChange` (absent
  // below, by design) and TableHeader.jsx's onDragEnd, which calls
  // `table.setColumnOrder(...)` directly on the table instance.
  //
  // Pin-bucket ordering therefore can't read live `columnOrder` (it's computed
  // before the table instance exists, and uncontrolled state only lives inside
  // that instance) — it orders pinned columns by their AUTHORED position in
  // `columns` instead. `pinPosition` is a builder-configured property, so this
  // is also more correct: a pinned group's internal order shouldn't drift with
  // a viewer's transient session reorder.
  const columnPinning = useMemo(() => {
    const leftPinned = [];
    const rightPinned = [];
    columns.forEach((column) => {
      const pinPosition = column?.meta?.pinPosition;
      if (pinPosition === 'left') leftPinned.push(column.id);
      else if (pinPosition === 'right') rightPinned.push(column.id);
    });

    // Pin the selection (checkbox) column to the extreme left only when other columns are pinned
    const hasOtherLeftPins = leftPinned.some((id) => id !== 'selection');
    if (hasOtherLeftPins && !leftPinned.includes('selection')) {
      leftPinned.unshift('selection');
    }

    return { left: leftPinned, right: rightPinned };
  }, [columns]);

  useEffect(() => {
    setPagination((prev) => ({
      pageIndex: serverSidePagination ? prev.pageIndex ?? 0 : 0,
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
      columnPinning,
      globalFilter,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
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
  };
}
