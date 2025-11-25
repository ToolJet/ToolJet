import { useMemo, useEffect, useCallback } from 'react';
import { transformAppsToAppRow } from '@/features/apps/adapters/homePageToAppRow';
import { useAppsTableState } from './useAppsTableState';

/**
 * Custom hook that handles adapter logic: transformation, state sync.
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
export function useAppsPageAdapter({ data = {}, filters = {}, actions = {}, columns = [] }) {
  // Extract from grouped props
  const { apps = [], isLoading = false, error = null, meta = {} } = data;
  const { appSearchKey = '', currentFolder = {} } = filters;
  const { pageChanged, onSearch } = actions;

  // Data transformation (memoized)
  const appRows = useMemo(() => {
    if (!apps || !Array.isArray(apps)) return [];
    try {
      return transformAppsToAppRow(apps);
    } catch (err) {
      console.error('Failed to transform apps:', err);
      return [];
    }
  }, [apps]);

  // Pagination state (convert 1-indexed to 0-indexed)
  const tablePagination = useMemo(() => {
    const currentPage = meta?.current_page || 1;
    const pageSize = meta?.per_page || 9;
    return {
      pageIndex: Math.max(0, currentPage - 1), // Ensure non-negative
      pageSize: Math.max(1, pageSize),
    };
  }, [meta?.current_page, meta?.per_page]);

  // Handlers (defined before table creation so we can pass them)
  const handlePaginationChangeForTable = useCallback(
    (newPagination) => {
      try {
        // Convert back to 1-indexed for HomePage
        const newPage = Math.max(1, newPagination.pageIndex + 1);
        const maxPage = meta?.total_pages || 1;
        const clampedPage = Math.min(newPage, maxPage);

        if (clampedPage !== meta?.current_page && pageChanged) {
          pageChanged(clampedPage);
        }
      } catch (err) {
        console.error('Failed to handle pagination change:', err);
      }
    },
    [meta?.current_page, meta?.total_pages, pageChanged]
  );

  // Table state
  const { table, getSearch, setSearch } = useAppsTableState({
    data: appRows,
    columns,
    initial: {
      globalFilter: appSearchKey || '',
      pagination: tablePagination,
    },
    onPaginationChange: handlePaginationChangeForTable,
  });

  // Sync HomePage state → Table state (critical for reactivity)
  useEffect(() => {
    if (appSearchKey !== getSearch()) {
      setSearch(appSearchKey || '');
    }
  }, [appSearchKey, getSearch, setSearch]);

  useEffect(() => {
    const newPageIndex = (meta?.current_page || 1) - 1;
    const currentPageIndex = table.getState().pagination.pageIndex;
    if (currentPageIndex !== newPageIndex) {
      table.setPageIndex(newPageIndex);
    }
  }, [meta?.current_page, table]);

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
  const appsEmpty = appRows.length === 0 && !hasQuery && !isLoading;

  return {
    appRows,
    table,
    getSearch,
    handleSearch,
    handlePaginationChange,
    appsEmpty,
    error,
    isLoading,
  };
}

export default useAppsPageAdapter;
