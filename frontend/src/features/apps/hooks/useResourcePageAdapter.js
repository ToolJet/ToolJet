import { useMemo, useEffect, useCallback } from 'react';
import { transformAppsToAppRow } from '@/features/apps/adapters/homePageToAppRow';
import { useAppsTableState } from './useAppsTableState';

/**
 * Generic hook that handles resource page adapter logic: transformation, state sync.
 * Works for apps, modules, and other similar resources.
 * Separates business logic from presentation for better testability.
 *
 * @param {Object} params - Grouped props
 * @param {Object} params.data - Data props { apps, isLoading, error, meta }
 * @param {Object} params.filters - Filter props { appSearchKey, currentFolder }
 * @param {Object} params.actions - Action props { pageChanged, onSearch }
 * @param {Array} params.columns - Table columns (will be passed to table)
 *
 * @returns {Object} - Transformed data, handlers, table state
 */
export function useResourcePageAdapter({ data = {}, filters = {}, actions = {}, columns = [] }) {
  // Extract from grouped props
  const { apps = [], isLoading = false, error = null, meta = {} } = data;
  const { appSearchKey = '', currentFolder = {} } = filters;
  const { pageChanged, onSearch } = actions;

  // Data transformation (memoized)
  const rows = useMemo(() => {
    if (!apps || !Array.isArray(apps)) return [];
    try {
      return transformAppsToAppRow(apps);
    } catch (err) {
      console.error('Failed to transform resources:', err);
      return [];
    }
  }, [apps]);

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
  const { table, getSearch, setSearch } = useAppsTableState({
    data: rows,
    columns,
    initial: {
      globalFilter: appSearchKey || '',
      pagination: tablePagination,
    },
    // No onPaginationChange needed - client-side pagination is handled automatically by TanStack Table
  });

  // Sync HomePage state → Table state (critical for reactivity)
  useEffect(() => {
    if (appSearchKey !== getSearch()) {
      setSearch(appSearchKey || '');
    }
  }, [appSearchKey, getSearch, setSearch]);

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
  const hasQuery = !!(appSearchKey?.trim() || currentFolder?.id);
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



