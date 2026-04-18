import React from 'react';

import { useAppsStore } from '@/_stores/appsStore';

import AppCard, { AppCardSkeleton } from './AppCard';

export default function AppList({
  apps,
  appType,
  showLoadingSkeleton,
  currentSelectedFolder,
  checkUserPermissions,
  basicPlan,
  ownedFolders,
  moduleEnabled = false,
}) {
  return (
    <GridLayoutContainer
      apps={apps}
      appType={appType}
      showLoadingSkeleton={showLoadingSkeleton}
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
  showLoadingSkeleton,
}) {
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const setFolderDialogState = useAppsStore((state) => state.setFolderDialogState);
  const currentFolderDetails = useAppsStore((state) => state.currentFolderDetails ?? null);

  const handleMenuItemClick = (actionType, appDetails) => {
    switch (actionType) {
      case 'add-to-folder':
      case 'remove-app-from-folder':
        setFolderDialogState({
          appDetails,
          type: actionType,
          currentFolderId: currentFolderDetails?.value ?? null,
          initialFolderName: currentFolderDetails?.label ?? '',
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
    <section className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 2xl:tw-grid-cols-4 3xl:tw-grid-cols-6 tw-gap-6">
      {showLoadingSkeleton
        ? Array.from({ length: 4 }).map((_, index) => <AppCardSkeleton key={index} />)
        : apps.map((app) => {
            return (
              <AppCard
                key={app.id}
                appDetails={app}
                appType={appType}
                currentSelectedFolder={currentSelectedFolder}
                onMenuItemClick={handleMenuItemClick}
                isUserNotInAllFolder={Boolean(currentFolderDetails?.value)}
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
