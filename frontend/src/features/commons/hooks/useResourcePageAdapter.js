import { useMemo, useEffect, useCallback } from 'react';
import { useResourceTableState } from './useResourceTableState';

/**
 * Generic hook that handles resource page adapter logic: transformation, state sync.
 * Works for apps, modules, and other similar resources.
 * Separates business logic from presentation for better testability.
 *
 * @param {Object} params - Grouped props
 * @param {Object} params.data - Data props { items, isLoading, error, meta }
 * @param {Object} params.filters - Filter props { searchKey, currentFolder }
 * @param {Object} params.actions - Action props { pageChanged, onSearch }
 * @param {Array} params.columns - Table columns (will be passed to table)
 * @param {Function} params.transformFn - Optional transformer function (items) => transformedRows
 *
 * @returns {Object} - Transformed data, handlers, table state
 */
export function useResourcePageAdapter({ data = {}, filters = {}, actions = {}, columns = [], transformFn }) {
  // Extract from grouped props
  const { items = [], isLoading = false, error = null, meta = {} } = data;
  const { searchKey = '', currentFolder = {} } = filters;
  const { pageChanged, onSearch } = actions;

  // Data transformation (memoized)
  const rows = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    try {
      // If transformFn provided, use it; otherwise return items as-is
      return transformFn ? transformFn(items) : items;
    } catch (err) {
      console.error('Failed to transform resources:', err);
      return [];
    }
  }, [items, transformFn]);

  // Pagination state (client-side only)
  const tablePagination = useMemo(() => {
    // Fixed client-side pageSize
    const pageSize = 10;
    return {
      pageIndex: 0, // Always start at first page for client-side
      pageSize: pageSize,
    };
  }, []); // No dependencies - fixed for client-side

  // Table state
  const { table, getSearch, setSearch } = useResourceTableState({
    data: rows,
    columns,
    initial: {
      globalFilter: searchKey || '',
      pagination: tablePagination,
    },
    // No onPaginationChange needed - client-side pagination is handled automatically by TanStack Table
  });

  // Sync HomePage state → Table state (critical for reactivity)
  useEffect(() => {
    if (searchKey !== getSearch()) {
      setSearch(searchKey || '');
    }
  }, [searchKey, getSearch, setSearch]);

  // Handler for external pagination changes (if needed)
  const handlePaginationChange = useCallback(
    (updater) => {
      try {
        const currentPagination = table.getState().pagination;
        const newPagination = typeof updater === 'function' ? updater(currentPagination) : updater;
        table.setPagination(newPagination);
      } catch (err) {
        console.error('Failed to handle pagination change:', err);
      }
    },
    [table]
  );

  const handleSearch = useCallback(
    (value) => {
      try {
        setSearch(value);
        if (onSearch) {
          onSearch(value);
        }
      } catch (err) {
        console.error('Failed to handle search:', err);
      }
    },
    [setSearch, onSearch]
  );

  // Empty states
  const hasQuery = !!(searchKey?.trim() || currentFolder?.id);
  const isEmpty = rows.length === 0 && !hasQuery && !isLoading;

  return {
    rows,
    table,
    getSearch,
    handleSearch,
    handlePaginationChange,
    isEmpty,
    error,
    isLoading,
  };
}

export default useResourcePageAdapter;
