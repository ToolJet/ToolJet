import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button/Button';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import LicenseBanner from '@/modules/common/components/LicenseBanner';

import { useAppsStore } from '../shared/store';
import { useFetchFolders } from '../shared/hooks/folderServiceHooks';
import { useFetchFeatureAccess } from '../shared/hooks/licenseServiceHooks';
import { useFetchApps, useFetchAppsLimit } from '../shared/hooks/appsServiceHooks';
import { canUserPerformAppAction } from './appsAndModulesPermissions';

import AppList from '../shared/AppList';
import EmptyState from '../shared/EmptyState';
import AppsFooter from '../shared/AppsFooter';
import PageHeader from '../shared/PageHeader';
import ContentToolbar from '../shared/ContentToolbar';
import WorkspaceLayout from '../layouts/WorkspaceLayout';
import MoreAppsActionMenu from '../shared/MoreAppsActionMenu';
import WorkflowDialogs from '../Workflows/components/WorkflowDialogs';
import CreateWorkflowBtn from '../Workflows/components/CreateWorkflowBtn';
import AppsAndModulesTab from './components/AppsAndModulesTab';
import BuildWithAIAssistant from './components/BuildWithAIAssistant';
import PermissionDeniedDialog from './components/PermissionDeniedDialog';
import useHandleAppCreationFromLandingPage from './hooks/useHandleAppCreationFromLandingPage';

export default function Apps({ appType = 'front-end' }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const currentPage = useAppsStore((state) => state.currentPage);
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);
  const appSearchQuery = useAppsStore((state) => state.appSearchQuery);
  const setAppSearchQuery = useAppsStore((state) => state.setAppSearchQuery);
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);

  const [searchParams, setSearchParams] = useSearchParams();

  const { showAIOnboardingLoadingScreen, showInsufficentPermissionModalstate, handleClosePermissionDeniedModal } =
    useHandleAppCreationFromLandingPage();

  const { data: folders, isSuccess: isFoldersSuccess } = useFetchFolders({ appType }, {});

  // TODO: Discuss with team that folder search param should have id and not name
  const hasFromTemplateSearchParam = searchParams.get('fromtemplate') || '';
  const folderQueryParam = searchParams.get('folder') || '';
  const currentSelectedFolder =
    folders?.find((folder) => folder.label?.toLowerCase() === folderQueryParam?.toLowerCase()) ?? null;
  const selectedFolderId = currentSelectedFolder?.value ?? '';

  const { data: apps, isSuccess: isWorkflowsFetchedOnce } = useFetchApps(
    { appType, folderId: selectedFolderId, appSearchQuery, pageNo: currentPage },
    { enabled: isFoldersSuccess }
  );
  const { data: featureAccess } = useFetchFeatureAccess();
  const { data: appsLimit, isSuccess: isAppsLimitFetchedSuccessfully } = useFetchAppsLimit();

  useEffect(() => {
    if (hasFromTemplateSearchParam) {
      setAppDialogState({ type: 'choose-from-template' });
    }
  }, [hasFromTemplateSearchParam]);

  const setSelectedFolder = (folderId) => {
    if (folderId === 'all') {
      setSearchParams(undefined);
      return;
    }

    const newSelectedFolderLabel = folders?.find((folder) => folder.value === folderId)?.label ?? '';

    setSearchParams({ folder: newSelectedFolderLabel }, { replace: true });
  };

  const handleClearSearchTerm = () => {
    setAppSearchQuery('');
  };

  const checkUserPermissions = (app) => canUserPerformAppAction(appType, app);
  const { hasCreatePermission } = useMemo(() => checkUserPermissions(), []);

  const totalAppCount = selectedFolderId ? apps?.meta?.folder_count : apps?.meta?.total_count;

  const isCreationDisabled =
    appType === 'front-end'
      ? !isAppsLimitFetchedSuccessfully || appsLimit?.appsCount?.percentage >= 100
      : !featureAccess?.modulesEnabled;

  const canCreateApp = appType === 'front-end' ? hasCreatePermission : true; // always true for modules

  const invalidLicense = featureAccess?.licenseStatus?.isExpired || !featureAccess?.licenseStatus?.isLicenseValid;
  // Only exclude env param if license is invalid/expired (basic plan)
  // If license is valid but multi-environment feature is not available, still include env param
  const shouldExcludeEnvParam = invalidLicense;
  const moduleEnabled = featureAccess?.modulesEnabled || false;

  if (showAIOnboardingLoadingScreen) {
    return <TJLoader />;
  }

  return (
    <WorkspaceLayout>
      <main className="tw-min-h-0 tw-grid tw-grid-rows-[auto_1fr] tw-gap-5 tw-px-20 tw-py-10">
        <PageHeader title={appType === 'front-end' ? 'Applications' : 'Modules'}>
          {appType === 'front-end' ? (
            <LicenseBanner
              type="apps"
              size="small"
              showNewBanner
              bannerVariant="inline"
              limits={appsLimit?.appsCount ?? {}}
            >
              {canCreateApp && (
                <div className="tw-flex tw-items-center tw-gap-2">
                  <CreateWorkflowBtn
                    label={t('homePage.header.createNewApplication', 'Create new app')}
                    disabled={isCreationDisabled}
                  />

                  <BuildWithAIAssistant isCreationDisabled={isCreationDisabled} />

                  <MoreAppsActionMenu appType={appType} disabled={isCreationDisabled} featureAccess={featureAccess} />
                </div>
              )}
            </LicenseBanner>
          ) : (
            <div className="tw-flex tw-items-center tw-gap-2">
              <CreateWorkflowBtn label={'Create new module'} disabled={isCreationDisabled} />

              <MoreAppsActionMenu appType={appType} disabled={isCreationDisabled} />
            </div>
          )}
        </PageHeader>

        <div className="tw-flex-1 tw-min-h-0 tw-flex tw-flex-col">
          <ContentToolbar
            folderList={folders ?? []}
            selectedFolder={selectedFolderId || 'all'}
            onChangeSelectedFolder={setSelectedFolder}
            leadingSlot={<AppsAndModulesTab />}
            showFolderBreadcrumb={appType === 'front-end'}
          />

          <div className="tw-flex-1 tw-overflow-y-scroll tw-hide-scrollbar tw-mt-6">
            {isWorkflowsFetchedOnce ? (
              apps?.apps?.length ? (
                <AppList
                  apps={apps.apps}
                  appType={appType}
                  currentFolderId={selectedFolderId}
                  checkUserPermissions={checkUserPermissions}
                  basicPlan={shouldExcludeEnvParam}
                  moduleEnabled={moduleEnabled}
                />
              ) : (
                <EmptyState
                  resourceType={appType}
                  title={
                    selectedFolderId && !appSearchQuery?.length
                      ? 'No apps found in this folder'
                      : appSearchQuery?.length
                      ? `No results found for "${appSearchQuery}"`
                      : appType === 'front-end'
                      ? 'You don’t have any apps yet'
                      : 'You don’t have any modules yet'
                  }
                  description={
                    appSearchQuery?.length || selectedFolderId
                      ? ''
                      : appType === 'front-end'
                      ? 'You can start building from a blank canvas, use a pre-built template, or generate an app using AI. Choose the option that best fits your workflow'
                      : 'Create reusable groups of components and queries via modules.'
                  }
                >
                  {Boolean(appSearchQuery?.length) && (
                    <Button size="large" variant="ghost" onClick={handleClearSearchTerm}>
                      Clear search
                    </Button>
                  )}
                </EmptyState>
              )
            ) : (
              <></>
            )}
          </div>
        </div>
      </main>

      <AppsFooter currentPage={currentPage} pageSize={9} totalItems={totalAppCount} onPageChange={setCurrentPage} />

      {showInsufficentPermissionModalstate && (
        <PermissionDeniedDialog open={showInsufficentPermissionModalstate} onClose={handleClosePermissionDeniedModal} />
      )}

      <WorkflowDialogs
        appType={appType}
        limits={appsLimit?.appsCount ?? {}}
        showLimitBanner={appType === 'front-end'}
        isAppCreationDisabled={!canCreateApp || isCreationDisabled}
      />
    </WorkspaceLayout>
  );
}
