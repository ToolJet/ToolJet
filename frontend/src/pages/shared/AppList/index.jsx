import React from 'react';

import { useAppsStore } from '../store';
import { useAppFilters } from '../hooks/useAppFilters';

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

  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const setFolderDialogState = useAppsStore((state) => state.setFolderDialogState);

  const handleMenuItemClick = (actionType, appDetails, currentFolderId) => {
    switch (actionType) {
      case 'add-to-folder':
      case 'remove-app-from-folder':
        setFolderDialogState({
          appDetails,
          type: actionType,
          currentFolderId,
        });
        break;
      case 'rename':
      case 'clone':
      case 'delete':
      case 'change-icon':
      case 'export':
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
