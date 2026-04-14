import React, { useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
// eslint-disable-next-line import/no-unresolved
import { useQueryClient } from '@tanstack/react-query';

import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import { useAppsStore } from '@/_stores/appsStore';
import { useSearchStore } from '@/_stores/searchStore';
import { useLicenseStore } from '@/_stores/licenseStore';
import { useIsWorkspaceBranchLocked } from '@/_hooks/useIsWorkspaceBranchLocked';
import { useFetchAppsLimit } from '@/_services/hooks/appsServiceHooks';
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

import useFetchFolderAndApps from '../shared/components/hooks/useFetchFolderAndApps';
import useHandleAppCreationFromLandingPage from './hooks/useHandleAppCreationFromLandingPage';

const classes = { contentContainer: 'tw-h-dvh tw-flex tw-flex-col', contentBody: 'tw-pt-0' };

export default function AppsAndModules({ darkMode, switchDarkMode, appType = 'front-end' }) {
  const queryClient = useQueryClient();

  const searchQuery = useSearchStore((state) => state.searchQuery);

  const pageSize = useAppsStore((state) => state.pageSize);
  const currentPage = useAppsStore((state) => state.currentPage);
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);

  // As the fetchFeatureAccess() is being called in the Layout component,
  // the featureAccess state will be updated there and we can directly use it here without needing to fetch it again, this avoids redundant API calls
  const featureAccess = useLicenseStore((state) => state.featureAccess);

  const [searchParams, setSearchParams] = useSearchParams();

  const isWorkspaceBranchLocked = useIsWorkspaceBranchLocked();
  const activeBranchId = useWorkspaceBranchesStore((state) => state.activeBranchId);

  const { showAIOnboardingLoadingScreen, showInsufficentPermissionModalstate, handleClosePermissionDeniedModal } =
    useHandleAppCreationFromLandingPage();

  const { folders, isLoadingFolders, apps, isLoadingApps, currentFolderDetails } = useFetchFolderAndApps({ appType });

  const hasFromTemplateSearchParam = searchParams.get('fromtemplate') || '';

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

  const checkUserPermissions = (app) => canUserPerformAppAction(appType, app);
  const { hasCreatePermission } = useMemo(() => checkUserPermissions(), []);

  const totalAppCount = currentFolderDetails?.value ? apps?.meta?.folder_count : apps?.meta?.total_count;

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
            showLoadingSkeleton={showLoadingSkeleton && !searchQuery?.length}
            // showLoadingSkeleton only when there is no search query, this ensures that when user is searching, the create button and other actions are not replaced by skeleton loaders, providing a better user experience
          />
        </PageHeader>

        <div className="tw-flex-1 tw-min-h-0 tw-flex tw-flex-col">
          <ContentToolbar
            folderList={folders ?? []}
            selectedFolder={currentFolderDetails?.value || 'all'}
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
                currentSelectedFolder={currentFolderDetails}
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
                selectedFolderId={currentFolderDetails?.value}
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
        pageSize={pageSize}
        totalItems={totalAppCount}
        onPageChange={setCurrentPage}
        showLoadingSkeleton={showLoadingSkeleton}
        totalAppsOnCurrentPage={apps?.apps?.length ?? 0}
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
