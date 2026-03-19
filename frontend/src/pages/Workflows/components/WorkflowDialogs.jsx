import React from 'react';

import { useAppsStore } from '@/pages/shared/store';
import LicenseBanner from '@/modules/common/components/LicenseBanner';

import CRUDActionDialog from '../../shared/CRUDActionDialog';
import ChangeIconDialog from '../../shared/CRUDActionDialog/ChangeIconDialog';
import ExportAppModal from '../../shared/CRUDActionDialog/ExportAppModal';
import FolderActionDialog from '../../shared/FolderBreadcrumb/FolderActionDialog';

export default function WorkflowDialogs({ appType, workflowLimitsDetails, isLimitNearingOrReached }) {
  const appDialogState = useAppsStore((state) => state.appDialogState);
  const resetAppDialogState = useAppsStore((state) => state.resetAppDialogState);

  const folderDialogState = useAppsStore((state) => state.folderDialogState);
  const resetFolderDialogState = useAppsStore((state) => state.resetFolderDialogState);

  const isExportAppDialogOpen = appDialogState.type === 'export';
  const isChangeIconDialogOpen = appDialogState.type === 'change-icon';
  const isCRUDDialogOpen = Boolean(appDialogState.type) && !isChangeIconDialogOpen && !isExportAppDialogOpen;

  const isFolderActionDialogOpen = Boolean(folderDialogState.type);

  return (
    <>
      {isChangeIconDialogOpen && (
        <ChangeIconDialog
          open={isChangeIconDialogOpen}
          onClose={resetAppDialogState}
          appDetails={appDialogState.appDetails}
        />
      )}

      {isCRUDDialogOpen && (
        <CRUDActionDialog
          open={isCRUDDialogOpen}
          onClose={resetAppDialogState}
          actionType={appDialogState.type}
          appDetails={appDialogState.appDetails}
          appType={appDialogState.appDetails?.type ?? appType}
        />
      )}

      {isExportAppDialogOpen && (
        <ExportAppModal
          open={isExportAppDialogOpen}
          onClose={resetAppDialogState}
          appDetails={appDialogState.appDetails}
        />
      )}

      {isFolderActionDialogOpen && (
        <FolderActionDialog
          open={isFolderActionDialogOpen}
          onClose={resetFolderDialogState}
          actionType={folderDialogState.type}
          folderId={folderDialogState.currentFolderId}
          initialFolderName={folderDialogState.initialFolderName}
          appId={folderDialogState.appDetails?.id}
          appType={folderDialogState.appDetails?.type ?? appType}
        />
      )}

      {isLimitNearingOrReached && (
        <LicenseBanner
          type={appType === 'front-end' ? 'apps' : appType}
          size="small"
          showNewBanner
          bannerVariant="popover"
          limits={workflowLimitsDetails}
        />
      )}
    </>
  );
}
