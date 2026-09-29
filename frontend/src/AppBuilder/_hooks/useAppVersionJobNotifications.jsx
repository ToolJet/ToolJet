import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { subscribeLiveNotifications } from '@/_stores/notificationsStore';
import useStore from '@/AppBuilder/_stores/store';
import { useVersionManagerStore } from '@/_stores/versionManagerStore';

// Background version creation (large apps) finishes on a worker: refresh the version lists and
// offer a one-click switch. Failures toast via the generic notification pipeline.
export default function useAppVersionJobNotifications(appId) {
  useEffect(() => {
    if (!appId) return;
    return subscribeLiveNotifications((notification) => {
      const meta = notification?.metadata;
      if (meta?.source !== 'app-version' || meta.appId !== appId || notification.type !== 'success') return;
      const { fetchDevelopmentVersions, changeEditorVersionAction, selectedEnvironment } = useStore.getState();
      fetchDevelopmentVersions(appId);
      useVersionManagerStore.getState().refreshVersions(appId, selectedEnvironment?.id);
      toast.success(
        (t) => (
          <span className="notification-toast-row">
            <span className="notification-toast-body">{notification.body}</span>
            <button
              className="notification-toast-view"
              onClick={() => {
                toast.dismiss(t.id);
                changeEditorVersionAction(
                  appId,
                  meta.versionId,
                  () => {},
                  () => toast.error('Failed to switch to the new version')
                );
              }}
            >
              Switch to version
            </button>
          </span>
        ),
        { duration: 10000, style: { maxWidth: '640px' } }
      );
    });
  }, [appId]);
}
