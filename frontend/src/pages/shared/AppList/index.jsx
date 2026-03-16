import React from 'react';

import { useAppFilters } from '../hooks/useAppFilters';
import { useWorkflowListStore } from '../../Workflows/store';

import AppCard from './AppCard';

export default function AppList({ apps, appType, currentFolderId, checkUserPermissions, basicPlan, moduleEnabled }) {
  return (
    <GridLayoutContainer
      apps={apps}
      appType={appType}
      currentFolderId={currentFolderId}
      checkUserPermissions={checkUserPermissions}
      basicPlan={basicPlan}
      moduleEnabled={moduleEnabled}
    />
  );
}

function GridLayoutContainer({ apps, appType, currentFolderId, checkUserPermissions, basicPlan, moduleEnabled }) {
  const { folderId } = useAppFilters();

  const setAppDialogState = useWorkflowListStore((state) => state.setAppDialogState);
  const setFolderDialogState = useWorkflowListStore((state) => state.setFolderDialogState);

  const handleMenuItemClick = (actionType, appDetails) => {
    switch (actionType) {
      case 'add-to-folder':
      case 'remove-app-from-folder':
        setFolderDialogState({ type: actionType, appIdToProcess: appDetails.id, selectedFolderId: folderId });
        break;
      case 'rename':
      case 'clone':
      case 'import':
      case 'delete':
        // case 'change-icon':
        // case 'export':
        setAppDialogState({ type: actionType, appDetails });
        break;
      default:
        break;
    }
  };

  return (
    <section className="tw-grid tw-grid-cols-[repeat(auto-fill,minmax(292px,1fr))] tw-gap-6">
      {apps.map((app) => {
        return (
          <AppCard
            key={app.id}
            appDetails={app}
            appType={appType}
            currentFolderId={currentFolderId}
            onMenuItemClick={handleMenuItemClick}
            isUserNotInAllFolder={Boolean(folderId)}
            checkUserPermissions={checkUserPermissions}
            basicPlan={basicPlan}
            moduleEnabled={moduleEnabled}
          />
        );
      })}
    </section>
  );
}
