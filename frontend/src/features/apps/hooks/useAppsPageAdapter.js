import { useMemo, useEffect, useCallback } from 'react';
import { transformAppsToAppRow } from '@/features/apps/adapters/homePageToAppRow';
import { useAppsTableState } from './useAppsTableState';

/**
 * Custom hook that handles adapter logic: transformation, permissions, state sync.
 * Separates business logic from presentation for better testability.
 * 
 * @param {Object} params - HomePage state and methods
 * @param {Array} params.apps - HomePage apps array
 * @param {boolean} params.isLoading - Loading state from HomePage
 * @param {Error|null} params.error - Error state from HomePage
 * @param {Object} params.meta - Pagination metadata {current_page, total_pages, total_count, per_page}
 * @param {Object} params.currentFolder - Current folder object {id, name, ...}
 * @param {string} params.appSearchKey - Search query from HomePage
 * @param {string} params.appType - 'front-end' | 'module' | 'workflow'
 * @param {Function|boolean} params.canCreateApp - Permission check function or boolean
 * @param {Function} params.canUpdateApp - Permission check function (app: Object) => boolean
 * @param {Function} params.canDeleteApp - Permission check function (app: Object) => boolean
 * @param {Function} params.pageChanged - Callback (page: number) => void
 * @param {Function} params.onSearch - Callback (searchKey: string) => void
 * @param {Array} params.columns - Table columns (will be passed to table)
 * 
 * @returns {Object} - Transformed data, permissions, handlers, table state
 */
export function useAppsPageAdapter({
  apps = [],
  isLoading = false,
  error = null,
  meta = {},
  currentFolder = {},
  appSearchKey = '',
  appType = 'front-end',
  canCreateApp,
  canUpdateApp,
  canDeleteApp,
  pageChanged,
  onSearch,
  columns = [],
}) {
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

  // Permissions (memoized with error handling)
  const perms = useMemo(() => {
    try {
      const canImport = typeof canCreateApp === 'function' ? canCreateApp() : (canCreateApp ?? false);
      
      const canEdit = (appRow) => {
        const originalApp = appRow?._originalApp;
        if (!originalApp) {
          console.warn('Missing _originalApp in appRow:', appRow);
          return false;
        }
        try {
          return typeof canUpdateApp === 'function' ? canUpdateApp(originalApp) : false;
        } catch (err) {
          console.error('Permission check failed:', err);
          return false;
        }
      };
      
      const canPlay = (appRow) => canEdit(appRow); // Can play if can edit
      
      return { canImport, canEdit, canPlay };
    } catch (err) {
      console.error('Failed to compute permissions:', err);
      return { canImport: false, canEdit: () => false, canPlay: () => false };
    }
  }, [canCreateApp, canUpdateApp]);

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
  const handlePaginationChangeForTable = useCallback((newPagination) => {
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
  }, [meta?.current_page, meta?.total_pages, pageChanged]);

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
  const handlePaginationChange = useCallback((updater) => {
    try {
      const currentPagination = table.getState().pagination;
      const newPagination = typeof updater === 'function' 
        ? updater(currentPagination) 
        : updater;
      table.setPagination(newPagination);
    } catch (err) {
      console.error('Failed to handle pagination change:', err);
    }
  }, [table]);

  const handleSearch = useCallback((value) => {
    try {
      setSearch(value);
      if (onSearch) {
        onSearch(value);
      }
    } catch (err) {
      console.error('Failed to handle search:', err);
    }
  }, [setSearch, onSearch]);

  // Empty states
  const hasQuery = !!(appSearchKey?.trim() || currentFolder?.id);
  const appsEmpty = appRows.length === 0 && !hasQuery && !isLoading;
  const modulesEmpty = appType === 'module' && appsEmpty;

  return {
    appRows,
    perms,
    table,
    getSearch,
    handleSearch,
    handlePaginationChange,
    appsEmpty,
    modulesEmpty,
    error,
    isLoading,
  };
}

export default useAppsPageAdapter;

