import { useEffect, useRef, createElement } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Info } from 'lucide-react';
import { subscribeLiveNotifications, useNotificationsStore } from '@/_stores/notificationsStore';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

/**
 * Hook that listens for auto-sync webhook notifications and shows context-aware
 * toasts + triggers editor freeze when appropriate.
 *
 * Rules:
 * - Branch updated (pulled): show info toast in app builder only (not dashboard)
 * - Version imported: show info toast in app builder only
 * - Branch deletion while on that branch in app builder: freeze + toast
 * - Branch deletion while on that branch on dashboard: toast + refresh branches
 * - Failure notifications: toast only inside app builder
 */
export function useAutoSyncNotifications() {
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    // Ensure the notifications WebSocket is connected — the NotificationCenter component
    // only mounts in the dashboard layout, but this hook also runs inside the app builder
    // via AppsRoute where no NotificationCenter exists.
    useNotificationsStore.getState().actions.connect();

    const unsubscribe = subscribeLiveNotifications((notification) => {
      if (!notification?.metadata?.source || notification.metadata.source !== 'auto-sync') return;

      const { action, branch } = notification.metadata;
      const isError = notification.type === 'error';
      const pathname = locationRef.current.pathname;

      // Detect if user is inside the app builder
      const isInAppBuilder = /\/apps\/[^/]+/.test(pathname);

      // Get current branch name from workspace branches store
      const currentBranch = getCurrentBranchName();

      // Determine if this notification affects the current branch
      const isCurrentBranch = branch && currentBranch && branch === currentBranch;
      const isDefaultBranch = isOnDefaultBranch();
      const affectsDefaultBranch = isDefaultBranch && branch === getDefaultBranchName();

      // ─── Branch Deletion ───
      if (action === 'deleted') {
        if (isCurrentBranch) {
          if (isInAppBuilder) {
            freezeEditor();
            toast('This branch was deleted on GitHub.', { duration: 8000 });
          } else {
            toast('This branch was deleted on GitHub.', { duration: 5000 });
            refreshBranches();
          }
        }
        return;
      }

      // ─── Branch Updated (push or PR merge) — toast only in app builder ───
      if (action === 'pulled') {
        if (isInAppBuilder && (isCurrentBranch || affectsDefaultBranch)) {
          toast(`${branch} branch has been updated from GitHub. Refresh to see changes`, {
            duration: 8000,
            icon: createElement(Info, { size: 16 }),
          });
        }
        return;
      }

      // ─── Version Imported (tag push) ───
      if (action === 'version_imported') {
        if (isInAppBuilder) {
          toast('New version saved from GitHub. Refresh to see changes', {
            duration: 8000,
            icon: createElement(Info, { size: 16 }),
          });
        }
        return;
      }

      // ─── Failure ───
      if (isError) {
        if (isInAppBuilder) {
          toast.error(`Auto-sync failed for branch "${branch || 'unknown'}"`, { duration: 5000 });
        }
        return;
      }
    });

    return unsubscribe;
  }, []);
}

function getCurrentBranchName() {
  const state = useWorkspaceBranchesStore.getState();
  return state?.currentBranch?.name || null;
}

function isOnDefaultBranch() {
  const state = useWorkspaceBranchesStore.getState();
  return state?.currentBranch?.isDefault || state?.currentBranch?.is_default || false;
}

function getDefaultBranchName() {
  const state = useWorkspaceBranchesStore.getState();
  const branches = state?.branches || [];
  const defaultBranch = branches.find((b) => b.isDefault || b.is_default);
  return defaultBranch?.name || 'main';
}

function freezeEditor() {
  try {
    // Dynamic import to avoid circular dependency — app builder store is only available in editor
    const useStore = require('@/AppBuilder/_stores/store').default;
    const state = useStore.getState();
    if (state?.onEditorFreeze) {
      state.onEditorFreeze(true, true);
    }
  } catch {
    // App builder store not available (not in app builder context)
  }
}

function refreshBranches() {
  const state = useWorkspaceBranchesStore.getState();
  if (state?.actions?.fetchBranches) {
    state.actions.fetchBranches();
  }
}
