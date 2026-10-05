import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { JOB_KINDS, registerJobSwitcher, versionLink } from '@/_helpers/backgroundJobs';
import { showActionToast } from '@/_components/NotificationCenter/NotificationToast';
import { subscribeLiveNotifications } from '@/_stores/notificationsStore';
import useStore from '@/AppBuilder/_stores/store';
import { useVersionManagerStore } from '@/_stores/versionManagerStore';
import { switchEditorToBranch } from '@/AppBuilder/Header/CreateBranchModal';

// Editor overrides for the "Switch branch" / "Switch to version" toast actions, so a background
// create that finishes after its modal closed switches within this app instead of leaving it.
export default function useBackgroundJobSwitchers(appId) {
  useEffect(() => {
    if (!appId) return;
    const refreshVersionLists = () => {
      const { fetchDevelopmentVersions, selectedEnvironment } = useStore.getState();
      fetchDevelopmentVersions(appId);
      useVersionManagerStore.getState().refreshVersions(appId, selectedEnvironment?.id);
    };
    const unregisterVersion = registerJobSwitcher(JOB_KINDS.VERSION, (metadata) => {
      if (metadata.appId !== appId) return window.location.assign(versionLink(metadata));
      return new Promise((resolve) =>
        useStore.getState().changeEditorVersionAction(
          appId,
          metadata.versionId,
          () => {
            showActionToast({ type: 'success', message: `Switched to ${metadata.versionName}` });
            resolve();
          },
          () => {
            toast.error('Failed to switch to the new version');
            resolve();
          }
        )
      );
    });
    const unregisterBranch = registerJobSwitcher(JOB_KINDS.BRANCH, (metadata) =>
      switchEditorToBranch({ id: metadata.branchId, name: metadata.branchName }, appId).catch(() =>
        toast.error(`Failed to switch to ${metadata.branchName}`)
      )
    );
    // a version finished in the background — keep this app's version lists current
    const unsubscribe = subscribeLiveNotifications((notification) => {
      const metadata = notification?.metadata;
      if (notification.type === 'success' && metadata?.source === 'app-version' && metadata.appId === appId) {
        refreshVersionLists();
      }
    });
    return () => {
      unregisterVersion();
      unregisterBranch();
      unsubscribe();
    };
  }, [appId]);
}
