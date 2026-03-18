import { useMemo, useCallback } from 'react';

/**
 * Hook that computes and provides permission checks for resources.
 *
 * @param {Object} params
 * @param {Function|boolean} params.canCreateApp - Create permission check
 * @param {Function} params.canUpdateApp - Update permission check function
 * @param {Function} params.canDeleteApp - Delete permission check function
 *
 * @returns {Object} Permission functions and flags
 */
export function useResourcePermissions({ canCreateApp, canUpdateApp, canDeleteApp }) {
  // Memoize permission computation
  const permissions = useMemo(() => {
    try {
      const canImport = typeof canCreateApp === 'function' ? canCreateApp() : canCreateApp ?? false;

      const canEdit = (appRow) => {
        const originalApp = appRow?._originalApp;
        if (!originalApp) return false;
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
      return {
        canImport: false,
        canEdit: () => false,
        canPlay: () => false,
      };
    }
  }, [canCreateApp, canUpdateApp]);

  // Memoize delete permission check
  const canDelete = useCallback(
    (appRow) => {
      try {
        const originalApp = appRow?._originalApp;
        if (!originalApp || !canDeleteApp) return false;
        return typeof canDeleteApp === 'function' ? canDeleteApp(originalApp) : false;
      } catch (err) {
        console.error('Delete permission check failed:', err);
        return false;
      }
    },
    [canDeleteApp]
  );

  return {
    permissions,
    canDelete,
  };
}

export default useResourcePermissions;
