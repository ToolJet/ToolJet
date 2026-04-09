import React, { useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
// eslint-disable-next-line import/no-unresolved
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button/Button';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import LicenseBanner from '@/modules/common/components/LicenseBanner';
import { useAppsStore } from '@/_stores/appsStore';
import { useSearchStore } from '@/_stores/searchStore';
import { useFetchFolders } from '@/_services/hooks/foldersServiceHooks';
import { useFetchFeatureAccess } from '@/_services/hooks/licenseServiceHooks';
import { useIsWorkspaceBranchLocked } from '@/_hooks/useIsWorkspaceBranchLocked';
import { useFetchApps, useFetchAppsLimit } from '@/_services/hooks/appsServiceHooks';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { authenticationService } from '@/_services/authentication.service';
import { WorkspaceLockedBanner } from '@/_ui/WorkspaceLockedBanner';
import Layout from '@/_ui/Layout';
import TooltipComp from '@/components/ui/Rocket/Tooltip';
import EmptyFolderIllustration from '@/pages/shared/illustrations/EmptyFolder';
import NoSearchResultIllustration from '@/pages/shared/illustrations/NoSearchResult';

import { canUserPerformAppAction } from './appsAndModulesPermissions';

import AppList from '../shared/components/AppList';
import EmptyState from '../shared/components/EmptyState';
import AppsFooter from '../shared/components/AppsFooter';
import PageHeader from '../shared/components/PageHeader';
import ContentToolbar from '../shared/components/ContentToolbar';
import CreateAppButton from '../shared/components/CreateAppButton';
import MoreAppsActionMenu from '../shared/components/MoreAppsActionMenu';
import AppsEmptyState from './illustrations/AppsEmptyState';
import ModulesEmptyState from './illustrations/ModulesEmptyState';
import Dialogs from './components/Dialogs';
import AppsAndModulesTab from './components/AppsAndModulesTab';
import BuildWithAIAssistant from './components/BuildWithAIAssistant';
import useHandleAppCreationFromLandingPage from './hooks/useHandleAppCreationFromLandingPage';

const classes = { contentContainer: 'tw-h-dvh tw-flex tw-flex-col', contentBody: 'tw-pt-0' };

export default function AppsAndModules({ darkMode, switchDarkMode, appType = 'front-end' }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const searchQuery = useSearchStore((state) => state.searchQuery);
  const setClearSearchQuery = useSearchStore((state) => state.setClearSearchQuery);

  const currentPage = useAppsStore((state) => state.currentPage);
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);

  const [searchParams, setSearchParams] = useSearchParams();

  const isWorkspaceBranchLocked = useIsWorkspaceBranchLocked();
  const activeBranchId = useWorkspaceBranchesStore((state) => state.activeBranchId);

  const { showAIOnboardingLoadingScreen, showInsufficentPermissionModalstate, handleClosePermissionDeniedModal } =
    useHandleAppCreationFromLandingPage();

  const { data: folders, isSuccess: isFoldersSuccess } = useFetchFolders({ appType }, {});

  const hasFromTemplateSearchParam = searchParams.get('fromtemplate') || '';
  const folderQueryParam = searchParams.get('folder') || '';
  const currentSelectedFolder =
    folders?.find((folder) => folder.label?.toLowerCase() === folderQueryParam?.toLowerCase()) ?? null;
  const selectedFolderId = currentSelectedFolder?.value ?? '';

  const { data: apps, isSuccess: isAppsFetchedOnce } = useFetchApps(
    { appType, folderId: selectedFolderId, appSearchQuery: searchQuery, pageNo: currentPage },
    { enabled: isFoldersSuccess }
  );
  const { data: featureAccess } = useFetchFeatureAccess();
  const { data: appsLimit, isSuccess: isAppsLimitFetchedSuccessfully } = useFetchAppsLimit();

  useEffect(() => {
    let timeoutId;

    const gitSyncToast = sessionStorage.getItem('git_sync_toast');

    if (gitSyncToast) {
      sessionStorage.removeItem('git_sync_toast');
      timeoutId = setTimeout(() => toast.error(gitSyncToast), 500);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (activeBranchId) {
      setCurrentPage(1);
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    }
  }, [activeBranchId]);

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
    setClearSearchQuery(true);
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

  const ownedFolders = (folders ?? []).filter(
    (folder) =>
      folder.value !== 'all' && folder.createdBy === authenticationService.currentSessionValue?.current_user?.id
  );

  const showEmptyFolderState = selectedFolderId && apps?.apps?.length === 0;
  const showEmptySearchState = searchQuery?.length > 0 && apps?.apps?.length === 0;

  if (showAIOnboardingLoadingScreen) {
    return <TJLoader />;
  }

  return (
    <Layout
      showNewHeader
      classes={classes}
      darkMode={darkMode}
      shouldWrapContentBody={false}
      switchDarkMode={switchDarkMode}
    >
      {appType === 'front-end' && <WorkspaceLockedBanner pageContext="apps" />}

      <main className="tw-flex-1 tw-min-h-0 tw-grid tw-grid-rows-[auto_1fr] tw-gap-5 tw-px-20 tw-py-10">
        <PageHeader title={appType === 'front-end' ? 'Applications' : 'Modules'}>
          {appType === 'front-end' ? (
            !appsLimit?.appsCount?.canAddUnlimited && appsLimit?.appsCount?.percentage >= 100 ? ( // Show license banner only when app limit is reached and unlimited apps cannot be added
              <LicenseBanner
                type="apps"
                size="small"
                showNewBanner
                bannerVariant="inline"
                limits={appsLimit?.appsCount ?? {}}
              />
            ) : (
              canCreateApp && (
                <div className="tw-flex tw-items-center tw-gap-2">
                  <CreateAppButton
                    label={t('homePage.header.createNewApplication', 'Create new app')}
                    appType={appType}
                    disabled={isCreationDisabled}
                    isWorkspaceBranchLocked={isWorkspaceBranchLocked}
                  />

                  <BuildWithAIAssistant isCreationDisabled={isCreationDisabled} />

                  <MoreAppsActionMenu appType={appType} disabled={isCreationDisabled} featureAccess={featureAccess} />
                </div>
              )
            )
          ) : (
            <div className="tw-flex tw-items-center tw-gap-2">
              <TooltipComp
                content={!moduleEnabled ? 'Modules are not available on your current plan.' : ''}
                isTooltipForInteractiveDisabledElement={isCreationDisabled}
              >
                <CreateAppButton
                  label="Create new module"
                  appType={appType}
                  disabled={isCreationDisabled}
                  isWorkspaceBranchLocked={isWorkspaceBranchLocked}
                />
              </TooltipComp>

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
          />

          <div className="tw-flex-1 tw-overflow-y-scroll tw-hide-scrollbar tw-mt-6">
            {isAppsFetchedOnce ? (
              apps?.apps?.length ? (
                <AppList
                  apps={apps.apps}
                  appType={appType}
                  currentSelectedFolder={currentSelectedFolder}
                  checkUserPermissions={checkUserPermissions}
                  basicPlan={shouldExcludeEnvParam}
                  moduleEnabled={moduleEnabled}
                  ownedFolders={ownedFolders}
                />
              ) : (
                <EmptyState
                  illustrationSlot={
                    showEmptySearchState ? (
                      <NoSearchResultIllustration width="174" height="120" />
                    ) : showEmptyFolderState ? (
                      <EmptyFolderIllustration width="174" height="120" />
                    ) : appType === 'module' ? (
                      <ModulesEmptyState width="174" height="120" />
                    ) : (
                      <AppsEmptyState width="174" height="120" />
                    )
                  }
                  resourceType={appType}
                  title={
                    selectedFolderId && !searchQuery?.length
                      ? `No ${appType === 'front-end' ? 'apps' : 'modules'} found in this folder`
                      : searchQuery?.length
                      ? `No results found for "${searchQuery}"`
                      : appType === 'front-end'
                      ? 'You don’t have any apps yet'
                      : 'You don’t have any modules yet'
                  }
                  description={
                    searchQuery?.length || selectedFolderId
                      ? ''
                      : appType === 'front-end'
                      ? 'You can start building from a blank canvas, use a pre-built template, or generate an app using AI. Choose the option that best fits your workflow'
                      : 'Create reusable groups of components and queries via modules.'
                  }
                >
                  {selectedFolderId && !searchQuery?.length ? (
                    <></>
                  ) : searchQuery?.length ? (
                    <Button size="large" variant="ghost" onClick={handleClearSearchTerm}>
                      Clear search
                    </Button>
                  ) : appType === 'module' ? (
                    <TooltipComp
                      content={!moduleEnabled ? 'Modules are not available on your current plan.' : ''}
                      isTooltipForInteractiveDisabledElement={isCreationDisabled}
                    >
                      <CreateAppButton
                        label="Create new module"
                        appType={appType}
                        disabled={isCreationDisabled}
                        isWorkspaceBranchLocked={isWorkspaceBranchLocked}
                      />
                    </TooltipComp>
                  ) : appType === 'front-end' && canCreateApp ? (
                    <CreateAppButton
                      label={t('homePage.header.createNewApplication', 'Create new app')}
                      appType={appType}
                      disabled={isCreationDisabled}
                      isWorkspaceBranchLocked={isWorkspaceBranchLocked}
                    />
                  ) : (
                    <></>
                  )}
                </EmptyState>
              )
            ) : (
              <></>
            )}
          </div>
        </div>
      </main>

      <AppsFooter
        itemType={appType === 'front-end' ? 'apps' : 'modules'}
        currentPage={currentPage}
        pageSize={9}
        totalItems={totalAppCount}
        onPageChange={setCurrentPage}
      />

      <Dialogs
        appType={appType}
        limits={appsLimit?.appsCount ?? {}}
        showLimitBanner={appType === 'front-end'}
        isAppCreationDisabled={!canCreateApp || isCreationDisabled}
        showInsufficentPermissionModalstate={showInsufficentPermissionModalstate}
        handleClosePermissionDeniedModal={handleClosePermissionDeniedModal}
      />
    </Layout>
  );
}
