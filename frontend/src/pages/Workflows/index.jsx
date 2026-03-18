import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { getWorkspaceId } from '@/_helpers/utils';
import { fetchAndSetWindowTitle, pageTitles } from '@white-label/whiteLabelling';
import { isWorkflowsFeatureEnabled } from '@/modules/common/helpers/utils';
import LicenseBanner from '@/modules/common/components/LicenseBanner';

import { canUserPerformWorkflowAction } from './workflowPermissions';

import { useWorkflowListStore } from './store';
import { useFetchFolders } from '../shared/hooks/folderServiceHooks';
import { useFetchFeatureAccess } from '../shared/hooks/licenseServiceHooks';
import { useFetchApps, useFetchAppsLimit, useFetchWorkflowLimit } from '../shared/hooks/appsServiceHooks';

import AppList from '../shared/AppList';
import EmptyState from '../shared/EmptyState';
import AppsFooter from '../shared/AppsFooter';
import PageHeader from '../shared/PageHeader';
import ContentToolbar from '../shared/ContentToolbar';
import WorkspaceLayout from '../layouts/WorkspaceLayout';
import CreateWorkflowBtn from './components/CreateWorkflowBtn';
import MoreActionsMenu from './components/MoreActionsMenu';
import WorkflowDialogs from './components/WorkflowDialogs';

export default function Workflows() {
  const navigate = useNavigate();

  const currentPage = useWorkflowListStore((state) => state.currentPage);
  const setCurrentPage = useWorkflowListStore((state) => state.setCurrentPage);
  const appSearchQuery = useWorkflowListStore((state) => state.appSearchQuery);

  const [searchParams, setSearchParams] = useSearchParams();

  const { data: folders, isSuccess: isFoldersSuccess } = useFetchFolders({ appType: 'workflow' }, {});

  // TODO: Discuss with team that folder search param should have id and not name
  const folderQueryParam = searchParams.get('folder') || '';
  const currentSelectedFolder =
    folders?.find((folder) => folder.label?.toLowerCase() === folderQueryParam?.toLowerCase()) ?? null;
  const selectedFolderId = currentSelectedFolder?.value ?? '';

  const { data: workflows, isSuccess: isWorkflowsFetchedOnce } = useFetchApps(
    { appType: 'workflow', folderId: selectedFolderId, appSearchQuery, pageNo: currentPage },
    { enabled: isFoldersSuccess }
  );
  const { data: featureAccess } = useFetchFeatureAccess();
  useFetchAppsLimit();

  const { data: workflowInstanceLevelLimit, isSuccess: isInstanceLimitFetchedSuccessfully } =
    useFetchWorkflowLimit('instance');
  const { data: workflowWorkspaceLevelLimit, isSuccess: isWorkspaceLimitFetchedSuccessfully } =
    useFetchWorkflowLimit('workspace');

  useEffect(() => {
    // fetchAndSetWindowTitle({ page: pageTitles.DASHBOARD }); // Also called in frontend/src/_ui/Layout/index.jsx check if we can skip this call from here

    // TODO: I guess if we do not render route itself we won't need this logic here
    const { hasViewPermission } = canUserPerformWorkflowAction();
    const canView = hasViewPermission && isWorkflowsFeatureEnabled();

    if (!canView) {
      toast.error('You do not have permission to view workflows');

      const workspaceId = getWorkspaceId();
      navigate(`/${workspaceId}/home`);
    }
  }, [navigate]);

  const setSelectedFolder = (folderId) => {
    if (folderId === 'all') {
      setSearchParams(undefined);
      return;
    }

    const newSelectedFolderLabel = folders?.find((folder) => folder.value === folderId)?.label ?? '';

    setSearchParams({ folder: newSelectedFolderLabel }, { replace: true });
  };

  const hasWorkflowLimitReached = () => {
    const instanceLimitReached =
      workflowInstanceLevelLimit?.total === 0 ||
      workflowInstanceLevelLimit?.current >= workflowInstanceLevelLimit?.total;

    const workspaceLimitReached =
      workflowWorkspaceLevelLimit?.total === 0 ||
      workflowWorkspaceLevelLimit?.current >= workflowWorkspaceLevelLimit?.total;

    return instanceLimitReached || workspaceLimitReached;
  };

  const checkIsLimitNearingOrReached = (limit) => limit?.current >= limit?.total || limit?.current === limit?.total - 1;

  const isInstanceLimitNearingOrReached = checkIsLimitNearingOrReached(workflowInstanceLevelLimit);
  const isWorkspaceLimitNearingOrReached = checkIsLimitNearingOrReached(workflowWorkspaceLevelLimit);

  const workflowLimitsDetails = isInstanceLimitNearingOrReached
    ? workflowInstanceLevelLimit
    : workflowWorkspaceLevelLimit;

  const totalAppCount = selectedFolderId ? workflows?.meta?.folder_count : workflows?.meta?.total_count;

  const isWorkflowLimitReached = hasWorkflowLimitReached();
  const isCreationDisabled =
    !isInstanceLimitFetchedSuccessfully || !isWorkspaceLimitFetchedSuccessfully || isWorkflowLimitReached;

  const checkUserPermissions = (app) => canUserPerformWorkflowAction('', app);

  const invalidLicense = featureAccess?.licenseStatus?.isExpired || !featureAccess?.licenseStatus?.isLicenseValid;
  // Only exclude env param if license is invalid/expired (basic plan)
  // If license is valid but multi-environment feature is not available, still include env param
  const shouldExcludeEnvParam = invalidLicense;
  const moduleEnabled = featureAccess?.modulesEnabled || false;

  return (
    <WorkspaceLayout>
      <main className="tw-min-h-0 tw-grid tw-grid-rows-[auto_1fr] tw-gap-5 tw-px-20 tw-py-10">
        <PageHeader title="Workflows">
          {isWorkflowLimitReached ? (
            <LicenseBanner
              type="workflow"
              size="small"
              showNewBanner
              bannerVariant="inline"
              limits={workflowLimitsDetails}
            />
          ) : (
            <div className="tw-flex tw-items-center tw-gap-2">
              <CreateWorkflowBtn disabled={isCreationDisabled} />

              <MoreActionsMenu disabled={isCreationDisabled} />
            </div>
          )}
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
                  appType="workflow"
                  currentFolderId={selectedFolderId}
                  checkUserPermissions={checkUserPermissions}
                  basicPlan={shouldExcludeEnvParam}
                  moduleEnabled={moduleEnabled}
                />
              ) : (
                <EmptyState
                  resourceType="workflows"
                  title="You don’t have any workflows yet"
                  description="Create a workflow to start automating your tasks."
                >
                  <CreateWorkflowBtn disabled={isCreationDisabled} />
                </EmptyState>
              )
            ) : (
              <></>
            )}
          </div>
        </div>
      </main>

      <AppsFooter currentPage={currentPage} pageSize={9} totalItems={totalAppCount} onPageChange={setCurrentPage} />

      <WorkflowDialogs
        workflowLimitsDetails={workflowLimitsDetails}
        isLimitNearingOrReached={isInstanceLimitNearingOrReached || isWorkspaceLimitNearingOrReached}
      />
    </WorkspaceLayout>
  );
}
