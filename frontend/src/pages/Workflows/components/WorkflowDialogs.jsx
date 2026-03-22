import React, { useEffect, useState } from 'react';

import { useAppsStore } from '@/pages/shared/store';
import LicenseBanner from '@/modules/common/components/LicenseBanner';

import { useFetchTemplateDependentPlugins } from '../../../_services/hooks/libraryAppServiceHooks';
import CRUDActionDialog from '../../shared/CRUDActionDialog';
import ChangeIconDialog from '../../shared/CRUDActionDialog/ChangeIconDialog';
import ExportAppModal from '../../shared/CRUDActionDialog/ExportAppModal';
import FolderActionDialog from '../../shared/FolderBreadcrumb/FolderActionDialog';
import TemplateLibraryModal from '../../../HomePage/TemplateLibraryModal';

// TODO: Add isAppCreationDisabled permission check in parent and pass as prop

export default function WorkflowDialogs({ appType, isAppCreationDisabled, limits, showLimitBanner }) {
  const appDialogState = useAppsStore((state) => state.appDialogState);
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const resetAppDialogState = useAppsStore((state) => state.resetAppDialogState);

  const folderDialogState = useAppsStore((state) => state.folderDialogState);
  const resetFolderDialogState = useAppsStore((state) => state.resetFolderDialogState);

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

  const isExportAppDialogOpen = appDialogState.type === 'export';
  const isChangeIconDialogOpen = appDialogState.type === 'change-icon';
  const isChooseFromTemplateDialogOpen = appDialogState.type === 'choose-from-template';
  const isCRUDDialogOpen =
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

      {appType === 'front-end' && (
        <TemplateLibraryModal
          darkMode={darkMode}
          show={isChooseFromTemplateDialogOpen}
          onCloseButtonClick={resetAppDialogState}
          openCreateAppFromTemplateModal={openCreateAppFromTemplateModal}
          appCreationDisabled={isAppCreationDisabled}
        />
      )}

      {showLimitBanner && (
        <LicenseBanner
          size="small"
          showNewBanner
          bannerVariant="popover"
          limits={limits}
          type={appType === 'front-end' ? 'apps' : appType}
        />
      )}
    </>
  );
}
