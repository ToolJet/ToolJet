import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
// eslint-disable-next-line import/no-unresolved
import { useQueryClient } from '@tanstack/react-query';

import { useAppsStore } from '@/_stores/appsStore';
import { useFetchTemplateDependentPlugins } from '@/_services/hooks/libraryAppServiceHooks';
import { WorkspaceSwitchBranchModal } from '@/_ui/WorkspaceBranchDropdown/SwitchBranchModal';
import LicenseBanner from '@/modules/common/components/LicenseBanner';

import PermissionDeniedDialog from './PermissionDeniedDialog';
import ExportAppModal from '../../shared/components/ExportAppModal';
import ChangeIconDialog from '../../shared/components/ChangeIconDialog';
import AppCRUDActionDialog from '../../shared/components/AppCRUDActionDialog';
import FolderActionDialog from '../../shared/components/FolderBreadcrumb/FolderActionsDialog';
import TemplateLibraryModal from '../../../HomePage/TemplateLibraryModal';

export default function Dialogs({
  appType,
  limits,
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
  const resetFolderDialogState = useAppsStore((state) => state.resetFolderDialogState);

  const openSwitchBranchModal = useAppsStore((state) => state.openSwitchBranchModal);
  const setOpenSwitchBranchModal = useAppsStore((state) => state.setOpenSwitchBranchModal);

  const [setSearchParams] = useSearchParams();
  const [templateToCreate, setTemplateToCreate] = useState(null);

  const { data: dependentPluginsInTemplate, error: dependentPluginsInTemplateError } = useFetchTemplateDependentPlugins(
    templateToCreate?.id
  );

  useEffect(() => {
    // TODO: Revisit this logic
    if (!templateToCreate) return;

    if (dependentPluginsInTemplate) {
      setAppDialogState({
        type: 'create-from-template',
        appDetails: {
          name: templateToCreate.name,
          templateId: templateToCreate.id,
          dependentPlugins: dependentPluginsInTemplate.plugins_to_be_installed,
          dependentPluginsDetail: { ...dependentPluginsInTemplate.plugins_detail_by_id },
        },
      });
    }

    if (dependentPluginsInTemplateError) {
      // Continue with template creation without plugins
      setAppDialogState({
        type: 'create-from-template',
        appDetails: {
          name: templateToCreate.name,
          templateId: templateToCreate.id,
        },
      });
    }
  }, [dependentPluginsInTemplate, dependentPluginsInTemplateError, templateToCreate]);

  const openCreateAppFromTemplateModal = (templateToCreate) => {
    setTemplateToCreate(templateToCreate);
  };

  const handleCloseTemplateDialog = () => {
    resetAppDialogState();
    setSearchParams({}, { replace: true });
  };

  const handleCloseSwitchBranchModal = () => setOpenSwitchBranchModal(false);

  const handleOnBranchSwitch = () => {
    handleCloseSwitchBranchModal();
    setCurrentPage(1);
    queryClient.invalidateQueries({ queryKey: ['apps'] });
    setAppDialogState({ type: 'create' });
  };

  const isExportAppDialogOpen = appDialogState.type === 'export';
  const isChangeIconDialogOpen = appDialogState.type === 'change-icon';
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
        <AppCRUDActionDialog
          limits={limits}
          open={isAppCRUDDialogOpen}
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

      {appType === 'front-end' && (
        <TemplateLibraryModal
          darkMode={darkMode}
          show={isChooseFromTemplateDialogOpen}
          appCreationDisabled={isAppCreationDisabled}
          onCloseButtonClick={handleCloseTemplateDialog}
          openCreateAppFromTemplateModal={openCreateAppFromTemplateModal}
        />
      )}

      {showInsufficentPermissionModalstate && (
        <PermissionDeniedDialog open={showInsufficentPermissionModalstate} onClose={handleClosePermissionDeniedModal} />
      )}

      <WorkspaceSwitchBranchModal
        show={openSwitchBranchModal}
        onClose={handleCloseSwitchBranchModal}
        onBranchSwitch={handleOnBranchSwitch}
      />

      {showLimitBanner && (
        <LicenseBanner
          showNewBanner
          size="small"
          bannerVariant="popover"
          limits={limits}
          type={appType === 'front-end' ? 'apps' : appType}
        />
      )}
    </>
  );
}
