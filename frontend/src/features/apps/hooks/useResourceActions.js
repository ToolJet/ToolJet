import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook that provides stable action handlers for resource operations.
 * Handlers are memoized to prevent unnecessary re-renders.
 *
 * @param {Object} params
 * @param {Function} params.navigate - Navigation function (from react-router or prop)
 * @param {string} params.workspaceId - Current workspace ID
 * @param {Object} params.handlers - Action handler functions
 * @param {Function} params.handlers.deleteApp - Delete handler
 * @param {Function} params.handlers.cloneApp - Clone handler
 * @param {Function} params.handlers.exportApp - Export handler
 *
 * @returns {Object} Action handlers
 */
export function useResourceActions({ navigate, workspaceId, handlers = {} }) {
  const routerNavigate = useNavigate();
  const navigateToApp = navigate || routerNavigate;

  const handlePlay = useCallback(
    (appRow) => {
      try {
        const originalApp = appRow?._originalApp;
        if (!originalApp) {
          console.warn('Missing _originalApp in appRow for play action');
          return;
        }
        navigateToApp(`/${workspaceId}/applications/${originalApp.slug}`);
      } catch (err) {
        console.error('Failed to navigate to app (play):', err);
      }
    },
    [navigateToApp, workspaceId]
  );

  const handleEdit = useCallback(
    (appRow) => {
      try {
        const originalApp = appRow?._originalApp;
        if (!originalApp) {
          console.warn('Missing _originalApp in appRow for edit action');
          return;
        }
        navigateToApp(`/${workspaceId}/apps/${originalApp.slug}`);
      } catch (err) {
        console.error('Failed to navigate to app (edit):', err);
      }
    },
    [navigateToApp, workspaceId]
  );

  const handleDelete = useCallback(
    (appRow) => {
      try {
        const originalApp = appRow?._originalApp;
        if (!originalApp || !handlers.deleteApp) {
          console.warn('Missing _originalApp or deleteApp handler');
          return;
        }
        if (window.confirm(`Are you sure you want to delete "${originalApp.name}"?`)) {
          handlers.deleteApp(originalApp);
        }
      } catch (err) {
        console.error('Failed to delete app:', err);
      }
    },
    [handlers]
  );

  const handleClone = useCallback(
    (appRow) => {
      try {
        const originalApp = appRow?._originalApp;
        if (!originalApp || !handlers.cloneApp) {
          console.warn('Missing _originalApp or cloneApp handler');
          return;
        }
        handlers.cloneApp(originalApp.name, originalApp.id);
      } catch (err) {
        console.error('Failed to clone app:', err);
      }
    },
    [handlers]
  );

  const handleExport = useCallback(
    (appRow) => {
      try {
        const originalApp = appRow?._originalApp;
        if (!originalApp || !handlers.exportApp) {
          console.warn('Missing _originalApp or exportApp handler');
          return;
        }
        handlers.exportApp(originalApp);
      } catch (err) {
        console.error('Failed to export app:', err);
      }
    },
    [handlers]
  );

  return {
    handlePlay,
    handleEdit,
    handleDelete,
    handleClone,
    handleExport,
  };
}

export default useResourceActions;
