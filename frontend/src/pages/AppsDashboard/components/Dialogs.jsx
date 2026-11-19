import React from 'react';

import { useAppsStore } from '@/_stores/appsStore';
import { WorkspaceSwitchBranchModal } from '@/_ui/WorkspaceBranchDropdown/SwitchBranchModal';

import PermissionDeniedDialog from './PermissionDeniedDialog';
import ImportAppFromGit from './ImportAppFromGit';
import AppCRUDActionDialog from './AppCRUDActionDialog';
import FolderActionsDialog from './FolderActionsDialog';
import TemplateLibraryModal from '@/HomePage/TemplateLibraryModal';
import ChangeIconDialog from './ChangeIconDialog';
import ExportAppDialog from '@/pages/components/ExportAppDialog';

export default function Dialogs({
  appType,
  limits,
  isBranchLocked,
  hasCreatePermission,
  showInsufficentPermissionModalstate,
  handleClosePermissionDeniedModal,
}) {
  const appDialogState = useAppsStore((state) => state.appDialogState);
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const resetAppDialogState = useAppsStore((state) => state.resetAppDialogState);

  const folderDialogState = useAppsStore((state) => state.folderDialogState);

  const switchBranchModal = useAppsStore((state) => state.switchBranchModal);
  const toggleSwitchBranchModal = useAppsStore((state) => state.toggleSwitchBranchModal);

  const handleOpenCreateAppFromTemplateDialog = (templateToCreate) => {
    const payload = { type: 'create-from-template', appDetails: templateToCreate };

    if (isBranchLocked) {
      toggleSwitchBranchModal({
        open: true,
        postSwitchActionDetails: payload,
      });
      return;
    }

    setAppDialogState(payload);
  };

  const handleCloseSwitchBranchModal = () => toggleSwitchBranchModal({ open: false, postSwitchActionDetails: null });

  const handleOnBranchSwitch = () => {
    const postSwitchActionDetails = switchBranchModal.postSwitchActionDetails;

    handleCloseSwitchBranchModal();
    setAppDialogState(postSwitchActionDetails);
  };

  const isExportAppDialogOpen = appDialogState.type === 'export';
  const isChangeIconDialogOpen = appDialogState.type === 'change-icon';
  const isImportFromGitDialogOpen = appDialogState.type === 'import-from-git';
  const isChooseFromTemplateDialogOpen = appDialogState.type === 'choose-from-template';
  const isAppCRUDDialogOpen =
    Boolean(appDialogState.type) &&
    !isChangeIconDialogOpen &&
    !isExportAppDialogOpen &&
    !isChooseFromTemplateDialogOpen;

  const isFolderActionDialogOpen = Boolean(folderDialogState.type);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <>
      {isChangeIconDialogOpen && (
        <ChangeIconDialog
          appType={appType}
          open={isChangeIconDialogOpen}
          onClose={resetAppDialogState}
          appDetails={appDialogState.appDetails}
        />
      )}

      {isAppCRUDDialogOpen && (
        <AppCRUDActionDialog limits={limits} open={isAppCRUDDialogOpen} defaultAppType={appType} />
      )}

      {isExportAppDialogOpen && (
        <ExportAppDialog
          appType={appType}
          open={isExportAppDialogOpen}
          onClose={resetAppDialogState}
          appDetails={appDialogState.appDetails}
        />
      )}

      {isFolderActionDialogOpen && <FolderActionsDialog open={isFolderActionDialogOpen} defaultAppType={appType} />}

      {showInsufficentPermissionModalstate && (
        <PermissionDeniedDialog open={showInsufficentPermissionModalstate} onClose={handleClosePermissionDeniedModal} />
      )}

      <WorkspaceSwitchBranchModal
        show={switchBranchModal?.open ?? false}
        onBranchSwitch={handleOnBranchSwitch}
        onClose={handleCloseSwitchBranchModal}
      />

      {isImportFromGitDialogOpen && (
        <ImportAppFromGit open={isImportFromGitDialogOpen} handleClose={resetAppDialogState} />
      )}

      {isChooseFromTemplateDialogOpen && (
        <TemplateLibraryModal
          darkMode={darkMode}
          show={isChooseFromTemplateDialogOpen}
          onCloseButtonClick={resetAppDialogState}
          openCreateAppFromTemplateModal={handleOpenCreateAppFromTemplateDialog}
          appCreationDisabled={!hasCreatePermission}
        />
      )}
    </>
  );
}
