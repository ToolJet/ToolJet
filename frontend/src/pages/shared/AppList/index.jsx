import React from 'react';

import { useAppFilters } from '../hooks/useAppFilters';
import { useWorkflowListStore } from '../../Workflows/store';

import AppCard from './AppCard';

export default function AppList({ apps }) {
  return <GridLayoutContainer apps={apps} />;
}

function GridLayoutContainer({ apps }) {
  const { folderId } = useAppFilters();
  const setFolderDialogState = useWorkflowListStore((state) => state.setFolderDialogState);

  const handleMenuItemClick = (actionType, appDetails) => {
    switch (actionType) {
      case 'add-to-folder':
      case 'remove-app-from-folder':
        setFolderDialogState({ type: actionType, appIdToProcess: appDetails.id, selectedFolderId: folderId });
        break;
      default:
        break;
    }
  };

  return (
    <section className="tw-grid tw-grid-cols-[repeat(auto-fill,minmax(292px,1fr))] tw-gap-6">
      {apps.map((app) => (
        <AppCard
          key={app.id}
          appDetails={app}
          onMenuItemClick={handleMenuItemClick}
          isUserNotInAllFolder={Boolean(folderId)}
        />
      ))}
    </section>
  );
}
