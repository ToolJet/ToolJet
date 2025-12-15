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
 * @param {Function} params.handlers.renameApp - Rename handler
 * @param {Function} params.handlers.customizeIcon - Customize icon handler
 * @param {Function} params.handlers.moveToFolder - Move to folder handler
 * @param {Function} params.getPlayPath - Optional: (item) => string for play navigation path
 * @param {Function} params.getEditPath - Optional: (item) => string for edit navigation path
 *
 * @returns {Object} Action handlers
 */
export function useResourceActions({ navigate, workspaceId, handlers = {}, getPlayPath, getEditPath }) {
  const routerNavigate = useNavigate();
  const navigateToApp = navigate || routerNavigate;

  const handlePlay = useCallback(
    (itemRow) => {
      try {
        const originalItem = itemRow?._originalItem || itemRow?._originalApp;
        if (!originalItem) {
          console.warn('Missing _originalItem/_originalApp in itemRow for play action');
          return;
        }
        let path;
        if (getPlayPath) {
          path = getPlayPath(originalItem);
        } else {
          // Default fallback for apps
          path = `/${workspaceId}/applications/${originalItem.slug}`;
        }
        navigateToApp(path);
      } catch (err) {
        console.error('Failed to navigate to item (play):', err);
      }
    },
    [navigateToApp, workspaceId, getPlayPath]
  );

  const handleEdit = useCallback(
    (itemRow) => {
      try {
        const originalItem = itemRow?._originalItem || itemRow?._originalApp;
        if (!originalItem) {
          console.warn('Missing _originalItem/_originalApp in itemRow for edit action');
          return;
        }
        let path;
        if (getEditPath) {
          path = getEditPath(originalItem);
        } else {
          // Default fallback for apps
          path = `/${workspaceId}/apps/${originalItem.slug}`;
        }
        navigateToApp(path);
      } catch (err) {
        console.error('Failed to navigate to item (edit):', err);
      }
    },
    [navigateToApp, workspaceId, getEditPath]
  );

  const handleDelete = useCallback(
    (itemRow) => {
      try {
        const originalItem = itemRow?._originalItem || itemRow?._originalApp;
        if (!originalItem || !handlers.deleteApp) {
          console.warn('Missing _originalItem/_originalApp or deleteApp handler');
          return;
        }
        if (window.confirm(`Are you sure you want to delete "${originalItem.name}"?`)) {
          handlers.deleteApp(originalItem);
        }
      } catch (err) {
        console.error('Failed to delete item:', err);
      }
    },
    [handlers]
  );

  const handleClone = useCallback(
    (itemRow) => {
      try {
        const originalItem = itemRow?._originalItem || itemRow?._originalApp;
        if (!originalItem || !handlers.cloneApp) {
          console.warn('Missing _originalItem/_originalApp or cloneApp handler');
          return;
        }
        handlers.cloneApp(originalItem.name, originalItem.id);
      } catch (err) {
        console.error('Failed to clone item:', err);
      }
    },
    [handlers]
  );

  const handleExport = useCallback(
    (itemRow) => {
      try {
        const originalItem = itemRow?._originalItem || itemRow?._originalApp;
        if (!originalItem || !handlers.exportApp) {
          console.warn('Missing _originalItem/_originalApp or exportApp handler');
          return;
        }
        handlers.exportApp(originalItem);
      } catch (err) {
        console.error('Failed to export item:', err);
      }
    },
    [handlers]
  );

  const handleRename = useCallback(
    (itemRow) => {
      try {
        const originalItem = itemRow?._originalItem || itemRow?._originalApp;
        if (!originalItem || !handlers.renameApp) {
          console.warn('Missing _originalItem/_originalApp or renameApp handler');
          return;
        }
        handlers.renameApp(originalItem);
      } catch (err) {
        console.error('Failed to rename item:', err);
      }
    },
    [handlers]
  );

  const handleCustomizeIcon = useCallback(
    (itemRow) => {
      try {
        const originalItem = itemRow?._originalItem || itemRow?._originalApp;
        if (!originalItem || !handlers.customizeIcon) {
          console.warn('Missing _originalItem/_originalApp or customizeIcon handler');
          return;
        }
        handlers.customizeIcon(originalItem);
      } catch (err) {
        console.error('Failed to customize icon:', err);
      }
    },
    [handlers]
  );

  const handleMoveToFolder = useCallback(
    (itemRow) => {
      try {
        const originalItem = itemRow?._originalItem || itemRow?._originalApp;
        if (!originalItem || !handlers.moveToFolder) {
          console.warn('Missing _originalItem/_originalApp or moveToFolder handler');
          return;
        }
        handlers.moveToFolder(originalItem);
      } catch (err) {
        console.error('Failed to move item to folder:', err);
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
    handleRename,
    handleCustomizeIcon,
    handleMoveToFolder,
  };
}

export default useResourceActions;
