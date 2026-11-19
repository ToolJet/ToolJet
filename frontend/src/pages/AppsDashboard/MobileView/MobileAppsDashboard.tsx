import React, { useEffect } from 'react';

import { useCurrentSessionStore } from '@/_stores/currentSessionStore';

import { MobileFolderView } from './MobileFolderView';
import { MobileRootView } from './MobileRootView';
import { useFolderParam } from './hooks/useFolderParam';

// Below 720px the front-end apps dashboard renders this instead of the desktop layout.
export default function MobileAppsDashboard() {
  const { folderId } = useFolderParam();
  const fetchOrganizations = useCurrentSessionStore((state) => state.actions.fetchOrganizations);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return (
    <main className="tw-flex tw-flex-col tw-gap-4 tw-h-dvh tw-bg-background-surface-layer-02 tw-px-4 tw-py-4">
      {folderId ? <MobileFolderView folderId={folderId} /> : <MobileRootView />}
    </main>
  );
}
