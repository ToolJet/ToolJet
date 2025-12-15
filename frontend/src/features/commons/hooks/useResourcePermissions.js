import { useMemo, useCallback } from 'react';

/**
 * Hook that computes and provides permission checks for resources.
 *
 * @param {Object} params
 * @param {Function|boolean} params.canCreateResource - Create permission check
 * @param {Function} params.canUpdateResource - Update permission check function
 * @param {Function} params.canDeleteResource - Delete permission check function
 *
 * @returns {Object} Permission functions and flags
 */
export function useResourcePermissions({ canCreateResource, canUpdateResource, canDeleteResource }) {
  // Memoize permission computation
  const permissions = useMemo(() => {
    try {
      const canImport = typeof canCreateResource === 'function' ? canCreateResource() : canCreateResource ?? false;

      const canEdit = (resourceRow) => {
        const originalResource = resourceRow?._originalResource || resourceRow?._originalApp;
        if (!originalResource) return false;
        try {
          return typeof canUpdateResource === 'function' ? canUpdateResource(originalResource) : false;
        } catch (err) {
          console.error('Permission check failed:', err);
          return false;
        }
      };

      const canPlay = (resourceRow) => canEdit(resourceRow); // Can play if can edit

      return { canImport, canEdit, canPlay };
    } catch (err) {
      console.error('Failed to compute permissions:', err);
      return {
        canImport: false,
        canEdit: () => false,
        canPlay: () => false,
      };
    }
  }, [canCreateResource, canUpdateResource]);

  // Memoize delete permission check
  const canDelete = useCallback(
    (resourceRow) => {
      try {
        const originalResource = resourceRow?._originalResource || resourceRow?._originalApp;
        if (!originalResource || !canDeleteResource) return false;
        return typeof canDeleteResource === 'function' ? canDeleteResource(originalResource) : false;
      } catch (err) {
        console.error('Delete permission check failed:', err);
        return false;
      }
    },
    [canDeleteResource]
  );

  return {
    permissions,
    canDelete,
  };
}

export default useResourcePermissions;
