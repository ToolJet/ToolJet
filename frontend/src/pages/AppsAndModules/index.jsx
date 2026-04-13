import React, { useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
// eslint-disable-next-line import/no-unresolved
import { useQueryClient } from '@tanstack/react-query';

import { TJLoader } from '@/_ui/TJLoader/TJLoader';
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

import { canUserPerformAppAction } from './appsAndModulesPermissions';

import AppList from '../shared/components/AppList';
import AppsFooter from '../shared/components/AppsFooter';
import PageHeader from '../shared/components/PageHeader';
import ContentToolbar from '../shared/components/ContentToolbar';
import Dialogs from './components/Dialogs';
import EmptyStates from './components/EmptyStates';
import CreateAppActions from './components/CreateAppActions';
import AppsAndModulesTab from './components/AppsAndModulesTab';
import useHandleAppCreationFromLandingPage from './hooks/useHandleAppCreationFromLandingPage';

const classes = { contentContainer: 'tw-h-dvh tw-flex tw-flex-col', contentBody: 'tw-pt-0' };

export default function AppsAndModules({ darkMode, switchDarkMode, appType = 'front-end' }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const searchQuery = useSearchStore((state) => state.searchQuery);

  const currentPage = useAppsStore((state) => state.currentPage);
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const setCurrentFolderDetails = useAppsStore((state) => state.setCurrentFolderDetails);

  const [searchParams, setSearchParams] = useSearchParams();

  const isWorkspaceBranchLocked = useIsWorkspaceBranchLocked();
  const activeBranchId = useWorkspaceBranchesStore((state) => state.activeBranchId);

  const { showAIOnboardingLoadingScreen, showInsufficentPermissionModalstate, handleClosePermissionDeniedModal } =
    useHandleAppCreationFromLandingPage();

  const {
    data: folders,
    isLoading: isLoadingFolders,
    isFetching: isFetchingFolders,
  } = useFetchFolders({ appType, appSearchQuery: searchQuery });

  const hasFromTemplateSearchParam = searchParams.get('fromtemplate') || '';
  const folderQueryParam = searchParams.get('folder') || '';
  const currentSelectedFolder =
    folders?.find((folder) => folder.label?.toLowerCase() === folderQueryParam?.toLowerCase()) ?? null;
  const selectedFolderId = currentSelectedFolder?.value ?? '';

  const { data: apps, isLoading: isLoadingApps } = useFetchApps(
    { appType, folderId: selectedFolderId, appSearchQuery: searchQuery, pageNo: currentPage },
    { enabled: !isFetchingFolders }
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

  useEffect(() => {
    setCurrentFolderDetails(currentSelectedFolder);
  }, [currentSelectedFolder, setCurrentFolderDetails]);

  useEffect(
    () => () => {
      setCurrentPage(1);
      // Invalidate folders query when page unmounts to ensure folder list is refetched when user comes back to this page. This is required because staleTime for folders query is set to Infinity to avoid unnecessary refetched.
      queryClient.invalidateQueries({ queryKey: ['folders', { appType }] });
    },
    [appType, setCurrentPage, queryClient]
  );

  const setSelectedFolder = (folderId) => {
    if (folderId === 'all') {
      setSearchParams(undefined);
      return;
    }

    const newSelectedFolderLabel = folders?.find((folder) => folder.value === folderId)?.label ?? '';

    setSearchParams({ folder: newSelectedFolderLabel }, { replace: true });
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

  const showLoadingSkeleton = isLoadingFolders || isLoadingApps;

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
          <CreateAppActions
            appType={appType}
            canCreateApp={canCreateApp}
            isCreationDisabled={isCreationDisabled}
            isWorkspaceBranchLocked={isWorkspaceBranchLocked}
            appsLimit={appsLimit}
            featureAccess={featureAccess}
            moduleEnabled={moduleEnabled}
            showLoadingSkeleton={showLoadingSkeleton}
          />
        </PageHeader>

        <div className="tw-flex-1 tw-min-h-0 tw-flex tw-flex-col">
          <ContentToolbar
            folderList={folders ?? []}
            selectedFolder={selectedFolderId || 'all'}
            onChangeSelectedFolder={setSelectedFolder}
            leadingSlot={<AppsAndModulesTab />}
            showLoadingSkeleton={showLoadingSkeleton}
          />

          <div className="tw-flex-1 tw-overflow-y-scroll tw-hide-scrollbar tw-mt-6">
            {(showLoadingSkeleton || Boolean(apps?.apps?.length)) && (
              <AppList
                apps={apps?.apps ?? []}
                appType={appType}
                showLoadingSkeleton={showLoadingSkeleton}
                currentSelectedFolder={currentSelectedFolder}
                checkUserPermissions={checkUserPermissions}
                basicPlan={shouldExcludeEnvParam}
                moduleEnabled={moduleEnabled}
                ownedFolders={ownedFolders}
              />
            )}

            {!showLoadingSkeleton && !apps?.apps?.length && (
              <EmptyStates
                appType={appType}
                searchQuery={searchQuery}
                canCreateApp={canCreateApp}
                moduleEnabled={moduleEnabled}
                selectedFolderId={selectedFolderId}
                appsLength={apps?.apps?.length ?? 0}
                isCreationDisabled={isCreationDisabled}
                isWorkspaceBranchLocked={isWorkspaceBranchLocked}
              />
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
        showLoadingSkeleton={showLoadingSkeleton}
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
