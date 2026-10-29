import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { getWorkspaceId } from '@/_helpers/utils';
import { isWorkflowsFeatureEnabled } from '@/modules/common/helpers/utils';
import { authenticationService } from '@/_services/authentication.service';

import { useFetchAppsLimit } from '@/_services/hooks/appsServiceHooks';
import { useIsWorkspaceBranchLocked } from '@/pages/AppsDashboard/hooks/useIsWorkspaceBranchLocked';

import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import Layout from '@/_ui/Layout';
import WorkspaceLockedBanner from '@/_ui/WorkspaceLockedBanner';

import { NoAppsExist } from './components/EmptyStates';
import AddNewMenu from './components/AddNewMenu';
import BuildWithAIButton from './components/BuildWithAIButton';
import MoreActionsMenu from './components/MoreActionsMenu';
import PageHeader from './components/PageHeader';
import ViewTabs from './components/ViewTabs';
import Dialogs from './components/Dialogs';

import { dummyApps, dummyFolders } from './dummyData';

import {
  appTypeToDisplayNameMapping,
  canUserPerformWorkflowAction,
  staticContentMappingByAppType,
  type TAppType,
} from './helper';

const classes = { contentContainer: 'tw-h-dvh tw-flex tw-flex-col', contentBody: 'tw-pt-0' };

export default function AppsDashboard({
  appType,
  darkMode,
  switchDarkMode,
}: {
  appType: TAppType;
  darkMode: boolean;
  switchDarkMode: () => void;
}) {
  const navigate = useNavigate();

  const { isBranchLocked, isBranchingEnabledFeature } = useIsWorkspaceBranchLocked(appType);
  const { data: appsLimit } = useFetchAppsLimit();

  const {
    role,
    admin: isAdmin,
    super_admin: isSuperAdmin,
    user_permissions: userPermissions,
  } = authenticationService.currentSessionValue;

  const hasCreatePermission = isSuperAdmin
    ? true
    : appType === 'front-end'
      ? user_permissions?.app_create
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
    const workspaceId = getWorkspaceId();

    if (appType === 'module') {
      role?.name == 'end-user' && navigate(`/${workspaceId}/home`);
    }

    if (appType === 'workflow') {
      const { hasViewPermission } = canUserPerformWorkflowAction();

      const canView = hasViewPermission && isWorkflowsFeatureEnabled();

      if (!canView) {
        toast.error('You do not have permission to view workflows');

        navigate(`/${workspaceId}/home`);
      }
    }
  }, [appType, navigate]);

  const hasItems = appType === 'front-end' ? dummyFolders.length > 0 || dummyApps.length > 0 : false;

  return (
    <Layout
      showNewHeader
      classes={classes}
      shouldWrapContentBody={false}
      darkMode={darkMode}
      switchDarkMode={switchDarkMode}
    >
      {isBranchingEnabledFeature && (
        <WorkspaceLockedBanner showNewBanner pageContext={`${appTypeToDisplayNameMapping[appType]}s`} />
      )}

      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-4 tw-pt-10">
        <PageHeader
          title={staticContentMappingByAppType[appType].title}
          description={staticContentMappingByAppType[appType].description}
          actions={
            <>
              {hasItems && (
                <>
                  <AddNewMenu appType={appType} isBranchLocked={isBranchLocked} />
                  <BuildWithAIButton data-cy="page-header-build-with-ai" />
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

            <NoAppsExist appType={appType} {...staticContentMappingByAppType[appType].emptyState} />
          </>
        )}
      </div>

      <Dialogs
        appType={appType}
        isBranchLocked={isBranchLocked}
        limits={appsLimit?.appsCount ?? {}}
        hasCreatePermission={hasCreatePermission}
      />
    </Layout>
  );
}
