import React from 'react';

import CRUDActionDialog from '../../shared/CRUDActionDialog';
import ChangeIconDialog from '../../shared/CRUDActionDialog/ChangeIconDialog';
import ExportAppModal from '../../shared/CRUDActionDialog/ExportAppModal';
import FolderActionDialog from '../../shared/FolderBreadcrumb/FolderActionDialog';

import { useWorkflowListStore } from '../store';

export default function WorkflowDialogs() {
  const appDialogState = useWorkflowListStore((state) => state.appDialogState);
  const resetAppDialogState = useWorkflowListStore((state) => state.resetAppDialogState);

  const folderDialogState = useWorkflowListStore((state) => state.folderDialogState);
  const resetFolderDialogState = useWorkflowListStore((state) => state.resetFolderDialogState);

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
          appType={appDialogState.appDetails?.type ?? 'workflow'}
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
          appType={folderDialogState.appDetails?.type ?? 'workflow'}
        />
      )}
    </>
  );
}
