import { useEffect, useRef, createElement } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Info } from 'lucide-react';
import { subscribeLiveNotifications } from '@/_stores/notificationsStore';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { useAppDataStore } from '@/_stores/appDataStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { setActiveBranch } from '@/_helpers/active-branch';
import { Button } from '@/components/ui/Rocket';

const infoIcon = createElement(Info, { size: 18, fill: '#3E63DD', color: 'white' });

const toastStyle = {
  maxWidth: '100vw',
  width: 'fit-content',
  padding: '14px 16px',
  borderRadius: 8,
  background: '#fff',
  border: '1px solid var(--border-default, #E6E8EB)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: 14,
  whiteSpace: 'nowrap',
  color: 'var(--text-default, #11181C)',
};

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
          // Immediately switch storage to default branch so dashboard uses correct branch on navigation
          switchToDefaultBranch();
          if (isInAppBuilder) {
            freezeEditor();
            refreshBranches();
            toast('This branch was deleted on GitHub.', {
              id: `auto-sync-deleted-${branch}`,
              duration: 8000,
              icon: infoIcon,
              style: toastStyle,
            });
          } else {
            toast('This branch was deleted on GitHub.', {
              id: `auto-sync-deleted-${branch}`,
              duration: 5000,
              icon: infoIcon,
              style: toastStyle,
            });
            refreshBranches();
          }
        }
        return;
      }

      // ─── Branch Updated (push or PR merge) ───
      if (action === 'pulled') {
        if (isInAppBuilder && (isCurrentBranch || affectsDefaultBranch)) {
          toast(`${branch} branch has been updated from GitHub. Refresh to see changes`, {
            id: `auto-sync-pulled-${branch}`,
            duration: 8000,
            icon: infoIcon,
            style: toastStyle,
          });
        } else if (!isInAppBuilder) {
          toast(
            (t) =>
              createElement(
                'span',
                { style: { display: 'flex', alignItems: 'center', gap: 12 } },
                `${branch} branch has been updated from GitHub.`,
                createElement(
                  Button,
                  {
                    variant: 'outline',
                    size: 'medium',
                    onClick: () => {
                      toast.dismiss(t.id);
                      window.location.reload();
                    },
                  },
                  'Refresh'
                )
              ),
            {
              id: `auto-sync-pulled-${branch}`,
              duration: 8000,
              icon: infoIcon,
              style: toastStyle,
            }
          );
        }
        return;
      }

      // ─── Version Imported (tag push) ───
      if (action === 'version_imported') {
        if (isInAppBuilder) {
          // Only show the toast if the user is viewing the specific app whose version was saved
          const currentCoRelId = getCurrentAppCoRelationId();
          const notifCoRelId = notification.metadata?.appCoRelationId;
          // Both must be present and must match — if either is missing, skip the toast
          if (!notifCoRelId || !currentCoRelId || notifCoRelId !== currentCoRelId) return;
          toast('New version saved from GitHub. Refresh to see changes', {
            id: 'auto-sync-version-imported',
            duration: 8000,
            icon: infoIcon,
            style: toastStyle,
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

function getCurrentAppCoRelationId() {
  return useAppDataStore.getState().coRelationId || null;
}

function freezeEditor() {
  useAppVersionStore.getState().actions.onEditorFreeze(true, true);
}

function refreshBranches() {
  const state = useWorkspaceBranchesStore.getState();
  if (state?.actions?.fetchBranches) {
    state.actions.fetchBranches();
  }
}

function switchToDefaultBranch() {
  const state = useWorkspaceBranchesStore.getState();
  const branches = state?.branches || [];
  const defaultBranch = branches.find((b) => b.isDefault || b.is_default) || branches[0];
  if (defaultBranch) {
    setActiveBranch(defaultBranch);
    // Update zustand store synchronously so subscription-based refetches trigger on navigation
    useWorkspaceBranchesStore.setState({
      activeBranchId: defaultBranch.id,
      currentBranch: defaultBranch,
    });
  }
}
