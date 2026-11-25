import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { getWorkspaceId } from '@/_helpers/utils';
import { useHeaderSearchConfig } from '@/_hooks/useHeaderSearchConfig';
import { isWorkflowsFeatureEnabled } from '@/modules/common/helpers/utils';
import { authenticationService } from '@/_services/authentication.service';

import { useAppsStore } from '@/_stores/appsStore';
import { useSearchStore } from '@/_stores/searchStore';
import { useFetchAppsLimit, useFetchWorkflowLimit } from '@/_services/hooks/appsServiceHooks';
import { useIsWorkspaceBranchLocked } from '@/pages/AppsDashboard/hooks/useIsWorkspaceBranchLocked';
import { useRootAppsQuery } from '@/pages/AppsDashboard/hooks/useRootAppsQuery';
import { useAiOnboarding } from '@/pages/AppsDashboard/hooks/useAiOnboarding';

import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import PageHeader from '@/pages/components/PageHeader';
import WorkspaceLockedBanner from '@/_ui/WorkspaceLockedBanner';

import { NoAppsExist } from './components/EmptyStates';
import AddNewMenu from './components/AddNewMenu';
import BuildWithAIButton from './components/BuildWithAIButton';
import MoreActionsMenu from './components/MoreActionsMenu';
import ViewTabs from './components/ViewTabs';
import Dialogs from './components/Dialogs';

import {
  appTypeToDisplayNameMapping,
  canUserPerformWorkflowAction,
  searchPlaceholderByAppType,
  staticContentMappingByAppType,
  type TAppType,
} from './helper';
import { getWorkflowTab, WORKFLOW_TABS } from './workflowTabs';
import { useLicenseStore } from '@/_stores/licenseStore';
import type { ILicenseStore } from '@/_stores/types/licenseStore';

interface IAppsDashboardProps {
  appType: TAppType;
}

export default function AppsDashboard({ appType }: IAppsDashboardProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Approvals/Executions guard their own access (approvers may not see workflows) and show with no workflows.
  const isWorkflowSubTab = appType === 'workflow' && getWorkflowTab(pathname) !== WORKFLOW_TABS.LIST;

  useHeaderSearchConfig({ placeholder: searchPlaceholderByAppType[appType] });

  const { data: appsLimit } = useFetchAppsLimit({ enabled: appType === 'front-end' });

  const { data: workflowInstanceLevelLimit, isSuccess: isInstanceLimitFetchedSuccessfully } = useFetchWorkflowLimit(
    'instance',
    { enabled: appType === 'workflow' }
  );
  const { data: workflowWorkspaceLevelLimit, isSuccess: isWorkspaceLimitFetchedSuccessfully } = useFetchWorkflowLimit(
    'workspace',
    { enabled: appType === 'workflow' }
  );

  const { isBranchLocked } = useIsWorkspaceBranchLocked();

  const { isOnboarding, showPermissionDenied, closePermissionDenied } = useAiOnboarding(appType);

  const checkModuleAccess = useLicenseStore((state: ILicenseStore) => state.actions.checkModuleAccess);

  const searchQuery: string = useSearchStore((state) => state.debouncedSearchQuery);
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);

  const [searchParams, setSearchParams] = useSearchParams();

  const { data: rootApps, isLoading: isRootAppsLoading } = useRootAppsQuery(appType);

  // A new search or app type starts from the first page.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, appType, setCurrentPage]);

  // Deep link (e.g. from Get Started): `?fromtemplate=true` opens the template library once, then drops the param.
  useEffect(() => {
    if (appType !== 'front-end' || !searchParams.get('fromtemplate')) return;

    setAppDialogState({ type: 'choose-from-template', appDetails: null });

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('fromtemplate');
    setSearchParams(nextParams, { replace: true });
  }, [appType, searchParams, setAppDialogState, setSearchParams]);

  const {
    role,
    admin: isAdmin,
    super_admin: isSuperAdmin,
    user_permissions: userPermissions,
  } = authenticationService.currentSessionValue;

  const hasCreatePermission = isSuperAdmin
    ? true
    : appType === 'front-end'
      ? userPermissions?.app_create
      : appType === 'module'
        ? isAdmin || userPermissions?.module_create || role?.name === 'builder'
        : appType === 'workflow'
          ? isAdmin || userPermissions?.workflow_create
          : false;

  useEffect(() => {
    let timeoutId: number;

    const gitSyncToast = sessionStorage.getItem('git_sync_toast');

    if (gitSyncToast) {
      sessionStorage.removeItem('git_sync_toast');
      timeoutId = window.setTimeout(() => toast.error(gitSyncToast), 500);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    checkModuleAccess();
  }, []);

  useEffect(() => {
    const workspaceId = getWorkspaceId();

    if (appType === 'module') {
      role?.name == 'end-user' && navigate(`/${workspaceId}/home`);
    }

    if (appType === 'workflow' && !isWorkflowSubTab) {
      const { hasViewPermission } = canUserPerformWorkflowAction();

      const canView = hasViewPermission && isWorkflowsFeatureEnabled();

      if (!canView) {
        toast.error('You do not have permission to view workflows');

        navigate(`/${workspaceId}/home`);
      }
    }
  }, [appType, navigate, isWorkflowSubTab]);

  // Loading keeps the tabs and skeleton up instead of flashing the empty state; an active search shows "No matches" instead.
  const hasItems = isWorkflowSubTab || isRootAppsLoading || searchQuery.trim() !== '' || (rootApps?.total ?? 0) > 0;

  if (isOnboarding) return <TJLoader />;

  return (
    <>
      <WorkspaceLockedBanner showNewBanner pageContext={`${appTypeToDisplayNameMapping[appType]}s`} />

      <main className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-4 tw-pt-10">
        <PageHeader
          title={staticContentMappingByAppType[appType].title}
          description={staticContentMappingByAppType[appType].description}
          actions={
            <>
              {hasItems && (
                <>
                  <AddNewMenu appType={appType} />
                  <BuildWithAIButton appType={appType} data-cy="page-header-build-with-ai" />
                </>
              )}

              <MoreActionsMenu appType={appType} />
            </>
          }
        />

        {hasItems ? (
          <ViewTabs appType={appType} />
        ) : (
          <>
            <Separator className="tw-mx-[4.375rem] tw-w-auto" />

            <NoAppsExist {...staticContentMappingByAppType[appType].emptyState}>
              <AddNewMenu appType={appType} />
              <BuildWithAIButton appType={appType} data-cy="no-apps-build-with-ai" />
            </NoAppsExist>
          </>
        )}
      </main>

      <Dialogs
        appType={appType}
        isBranchLocked={isBranchLocked}
        limits={appsLimit?.appsCount ?? {}}
        hasCreatePermission={hasCreatePermission}
        showInsufficentPermissionModalstate={showPermissionDenied}
        handleClosePermissionDeniedModal={closePermissionDenied}
      />
    </>
  );
}
