import { useState, useMemo, useEffect } from 'react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { applyFilters } from '../_components/Header/_components/Filter/filterUtils';
import { lowerContains, prepareTerm } from '@/AppBuilder/_engines/data/text';
import { useTableView } from './useTableView';

// TanStack holds no data rows: it would build a heavy row object for every row (see _utils/tableView.js).
const NO_ROWS = [];

// The search: `String(value || '').toLowerCase().includes(term.toLowerCase())`, without lower-casing a copy of every
// cell. The term is prepared once per search (resolveFilterValue). searchCandidates relies on it being a "contains".
const searchCell = (row, columnId, term) => lowerContains(row.getValue(columnId), term);
searchCell.resolveFilterValue = prepareTerm;

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

  const meta = useMemo(() => ({ expandedRows }), [expandedRows]);

  const table = useReactTable({
    data: NO_ROWS,
    columns,
    enableSorting: true,
    getCoreRowModel: getCoreRowModel(),
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
    globalFilterFn: searchCell,
    getColumnCanGlobalFilter: (column) => column.getIsVisible(),
    manualPagination: serverSidePagination,
    manualSorting: serverSideSort,
    manualFiltering: serverSideFilter,
  });

  // Filtering, sorting and paging of the data, and the rows on screen (TanStack keeps the state).
  const view = useTableView(table, data);
  // For code that only gets the TanStack table (the select-all header, export).
  table.tjView = view;

  return {
    table,
    view,
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
