import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import LicenseBanner from '@/modules/common/components/LicenseBanner';

import { useAppsStore } from '../shared/store';
import { useFetchFolders } from '../shared/hooks/folderServiceHooks';
import { useFetchFeatureAccess } from '../shared/hooks/licenseServiceHooks';
import { useFetchApps, useFetchAppsLimit } from '../shared/hooks/appsServiceHooks';

import AppList from '../shared/AppList';
import EmptyState from '../shared/EmptyState';
import AppsFooter from '../shared/AppsFooter';
import PageHeader from '../shared/PageHeader';
import ContentToolbar from '../shared/ContentToolbar';
import WorkspaceLayout from '../layouts/WorkspaceLayout';
// TODO: Move these components to shared folder
import MoreActionsMenu from '../Workflows/components/MoreActionsMenu';
import WorkflowDialogs from '../Workflows/components/WorkflowDialogs';
import CreateWorkflowBtn from '../Workflows/components/CreateWorkflowBtn';

export default function Apps({ appType = 'front-end' }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const currentPage = useAppsStore((state) => state.currentPage);
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);
  const appSearchQuery = useAppsStore((state) => state.appSearchQuery);

  const [searchParams, setSearchParams] = useSearchParams();

  const { data: folders, isSuccess: isFoldersSuccess } = useFetchFolders({ appType }, {});

  // TODO: Discuss with team that folder search param should have id and not name
  const folderQueryParam = searchParams.get('folder') || '';
  const currentSelectedFolder =
    folders?.find((folder) => folder.label?.toLowerCase() === folderQueryParam?.toLowerCase()) ?? null;
  const selectedFolderId = currentSelectedFolder?.value ?? '';

  const { data: workflows, isSuccess: isWorkflowsFetchedOnce } = useFetchApps(
    { appType, folderId: selectedFolderId, appSearchQuery, pageNo: currentPage },
    { enabled: isFoldersSuccess }
  );
  const { data: featureAccess } = useFetchFeatureAccess();
  useFetchAppsLimit();

  const setSelectedFolder = (folderId) => {
    if (folderId === 'all') {
      setSearchParams(undefined);
      return;
    }

    const newSelectedFolderLabel = folders?.find((folder) => folder.value === folderId)?.label ?? '';

    setSearchParams({ folder: newSelectedFolderLabel }, { replace: true });
  };

  const checkUserPermissions = () => ({
    hasCreatePermission: true,
    hasUpdatePermission: true,
    hasDeletePermission: true,
    hasViewPermission: true,
  });

  const totalAppCount = selectedFolderId ? workflows?.meta?.folder_count : workflows?.meta?.total_count;

  const isCreationDisabled = false;

  const invalidLicense = featureAccess?.licenseStatus?.isExpired || !featureAccess?.licenseStatus?.isLicenseValid;
  // Only exclude env param if license is invalid/expired (basic plan)
  // If license is valid but multi-environment feature is not available, still include env param
  const shouldExcludeEnvParam = invalidLicense;
  const moduleEnabled = featureAccess?.modulesEnabled || false;

  return (
    <WorkspaceLayout>
      <main className="tw-min-h-0 tw-grid tw-grid-rows-[auto_1fr] tw-gap-5 tw-px-20 tw-py-10">
        <PageHeader title="Applications">
          {/* {isWorkflowLimitReached ? (
            <LicenseBanner
              type="apps"
              size="small"
              showNewBanner
              bannerVariant="inline"
              limits={workflowLimitsDetails}
            />
          ) : ( */}
          <div className="tw-flex tw-items-center tw-gap-2">
            <CreateWorkflowBtn
              label={t('homePage.header.createNewApplication', 'Create new app')}
              disabled={isCreationDisabled}
            />

            <MoreActionsMenu disabled={isCreationDisabled} />
          </div>
          {/* )} */}
        </PageHeader>

        <div className="tw-flex-1 tw-min-h-0 tw-flex tw-flex-col">
          <ContentToolbar
            folderList={folders ?? []}
            selectedFolder={selectedFolderId || 'all'}
            onChangeSelectedFolder={setSelectedFolder}
          />

          <div className="tw-flex-1 tw-overflow-y-scroll tw-hide-scrollbar tw-mt-6">
            {isWorkflowsFetchedOnce ? (
              workflows?.apps?.length ? (
                <AppList
                  apps={workflows.apps}
                  appType={appType}
                  currentFolderId={selectedFolderId}
                  checkUserPermissions={checkUserPermissions}
                  basicPlan={shouldExcludeEnvParam}
                  moduleEnabled={moduleEnabled}
                />
              ) : (
                <EmptyState
                  resourceType={appType}
                  title="You don’t have any apps yet"
                  description="You can start building from a blank canvas, use a pre-built template, or generate an app using AI. Choose the option that best fits your workflow"
                />
              )
            ) : (
              <></>
            )}
          </div>
        </div>
      </main>

      <AppsFooter currentPage={currentPage} pageSize={9} totalItems={totalAppCount} onPageChange={setCurrentPage} />

      <WorkflowDialogs
        appType={appType}
        isLimitNearingOrReached={false}
        // workflowLimitsDetails={workflowLimitsDetails}
      />
    </WorkspaceLayout>
  );
}
