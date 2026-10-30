import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
// eslint-disable-next-line import/no-unresolved
import { useQueryClient } from '@tanstack/react-query';

import { useAppsStore } from '@/_stores/appsStore';
// import { useFetchTemplateDependentPlugins } from '@/_services/hooks/libraryAppServiceHooks';
import { WorkspaceSwitchBranchModal } from '@/_ui/WorkspaceBranchDropdown/SwitchBranchModal';

// import PermissionDeniedDialog from './PermissionDeniedDialog';
// import ExportAppModal from '../../shared/components/ExportAppModal';
// import ChangeIconDialog from '../../shared/components/ChangeIconDialog';
import ImportAppFromGit from './ImportAppFromGit';
import AppCRUDActionDialog from './AppCRUDActionDialog';
import FolderActionsDialog from './FolderActionsDialog';
import TemplateLibraryModal from '@/HomePage/TemplateLibraryModal';
import ChangeIconDialog from './ChangeIconDialog';
import ExportAppModal from './ExportAppDialog';

export default function Dialogs({
  appType,
  limits,
  isBranchLocked,
  hasCreatePermission,
  showLimitBanner,
  isAppCreationDisabled,
  showInsufficentPermissionModalstate,
  handleClosePermissionDeniedModal,
}) {
  const queryClient = useQueryClient();

  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  const appDialogState = useAppsStore((state) => state.appDialogState);
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const resetAppDialogState = useAppsStore((state) => state.resetAppDialogState);

  const folderDialogState = useAppsStore((state) => state.folderDialogState);

  const switchBranchModal = useAppsStore((state) => state.switchBranchModal);
  const toggleSwitchBranchModal = useAppsStore((state) => state.toggleSwitchBranchModal);

  const [, setSearchParams] = useSearchParams();
  const [templateToCreate, setTemplateToCreate] = useState(null);

  // const { data: dependentPluginsInTemplate, error: dependentPluginsInTemplateError } = useFetchTemplateDependentPlugins(
  //   templateToCreate?.id
  // );

  // useEffect(() => {
  //   // TODO: Revisit this logic //
  //   if (!templateToCreate) return;

  //   if (dependentPluginsInTemplate) {
  //     setAppDialogState({
  //       type: 'create-from-template',
  //       appDetails: {
  //         name: templateToCreate.name,
  //         templateId: templateToCreate.id,
  //         dependentPlugins: dependentPluginsInTemplate.plugins_to_be_installed,
  //         dependentPluginsDetail: { ...dependentPluginsInTemplate.plugins_detail_by_id },
  //       },
  //     });
  //   }

  //   if (dependentPluginsInTemplateError) {
  //     // Continue with template creation without plugins
  //     setAppDialogState({
  //       type: 'create-from-template',
  //       appDetails: {
  //         name: templateToCreate.name,
  //         templateId: templateToCreate.id,
  //       },
  //     });
  //   }
  // }, [dependentPluginsInTemplate, dependentPluginsInTemplateError, templateToCreate]);

  const handleOpenCreateAppFromTemplateDialog = (templateToCreate) => {
    setAppDialogState({ type: 'create-from-template', appDetails: templateToCreate });
  };

  const handleCloseTemplateDialog = () => {
    resetAppDialogState();
    setSearchParams({}, { replace: true });
  };

  const handleCloseSwitchBranchModal = () => toggleSwitchBranchModal({ open: false, postSwitchAction: '' });

  const handleOnBranchSwitch = () => {
    const postSwitchAction = switchBranchModal.postSwitchAction;

    handleCloseSwitchBranchModal();
    // setCurrentPage(1);
    // queryClient.invalidateQueries({ queryKey: ['apps'] });
    // setAppDialogState({ type: 'create' });
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
          open={isChangeIconDialogOpen}
          onClose={resetAppDialogState}
          appDetails={appDialogState.appDetails}
        />
      )}

      {isAppCRUDDialogOpen && (
        <AppCRUDActionDialog limits={limits} open={isAppCRUDDialogOpen} defaultAppType={appType} />
      )}

      {isExportAppDialogOpen && (
        <ExportAppModal
          open={isExportAppDialogOpen}
          onClose={resetAppDialogState}
          appDetails={appDialogState.appDetails}
        />
      )}

      {isFolderActionDialogOpen && <FolderActionsDialog open={isFolderActionDialogOpen} defaultAppType={appType} />}

      {/* {showInsufficentPermissionModalstate && (
        <PermissionDeniedDialog open={showInsufficentPermissionModalstate} onClose={handleClosePermissionDeniedModal} />
      )} */}

      <WorkspaceSwitchBranchModal
        show={switchBranchModal?.open ?? false}
        onBranchSwitch={handleOnBranchSwitch}
        onClose={handleCloseSwitchBranchModal}
      />

      <ImportAppFromGit open={isImportFromGitDialogOpen} handleClose={resetAppDialogState} />

      <TemplateLibraryModal
        darkMode={darkMode}
        show={isChooseFromTemplateDialogOpen}
        onCloseButtonClick={resetAppDialogState}
        openCreateAppFromTemplateModal={handleOpenCreateAppFromTemplateDialog}
        appCreationDisabled={!hasCreatePermission}
      />
    </>
  );
}
