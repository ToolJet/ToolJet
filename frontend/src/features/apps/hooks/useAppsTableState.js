import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';

// Headless table state hook with a narrow API surface
export function useAppsTableState({ data, columns, initial = {} }) {
  const [rowSelection, setRowSelection] = useState(initial.rowSelection ?? {});
  const [columnVisibility, setColumnVisibility] = useState(initial.columnVisibility ?? {});
  const [columnFilters, setColumnFilters] = useState(initial.columnFilters ?? []);
  const [sorting, setSorting] = useState(initial.sorting ?? []);
  const [pagination, setPagination] = useState(initial.pagination ?? { pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState(initial.globalFilter ?? '');

  const stableData = useMemo(() => data, [data]);
  const stableColumns = useMemo(() => columns, [columns]);

  const table = useReactTable({
    data: stableData,
    columns: stableColumns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination, globalFilter },
    getRowId: (row) => row.id?.toString?.() ?? String(row.id ?? ''),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return {
    table,
    getSearch: () => globalFilter,
    setSearch: setGlobalFilter,
    state: { pagination, sorting, columnFilters, columnVisibility, rowSelection },
  };
}

export default useAppsTableState;


