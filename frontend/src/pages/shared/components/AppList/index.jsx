import React from 'react';

import { useAppsStore } from '@/_stores/appsStore';

import AppCard from './AppCard';

export default function AppList({
  apps,
  appType,
  currentSelectedFolder,
  checkUserPermissions,
  basicPlan,
  moduleEnabled,
  ownedFolders,
}) {
  return (
    <GridLayoutContainer
      apps={apps}
      appType={appType}
      currentSelectedFolder={currentSelectedFolder}
      checkUserPermissions={checkUserPermissions}
      basicPlan={basicPlan}
      moduleEnabled={moduleEnabled}
      ownedFolders={ownedFolders}
    />
  );
}

function GridLayoutContainer({
  apps,
  appType,
  currentSelectedFolder,
  checkUserPermissions,
  basicPlan,
  moduleEnabled,
  ownedFolders,
}) {
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const setFolderDialogState = useAppsStore((state) => state.setFolderDialogState);
  const currentFolderId = useAppsStore((state) => state.currentFolderDetails?.value ?? null);

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
      case 'delete':
      case 'change-icon':
      case 'export':
        setAppDialogState({ type: actionType, appDetails });
        break;
      case 'clone':
        setAppDialogState({
          type: actionType,
          appDetails: { ...appDetails, name: appDetails?.name ? `${appDetails.name.slice(0, 45)}_Copy` : '' },
        });
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
            currentSelectedFolder={currentSelectedFolder}
            onMenuItemClick={handleMenuItemClick}
            isUserNotInAllFolder={Boolean(currentFolderId)}
            checkUserPermissions={checkUserPermissions}
            basicPlan={basicPlan}
            moduleEnabled={moduleEnabled}
            ownedFolders={ownedFolders}
          />
        );
      })}
    </section>
  );
}
