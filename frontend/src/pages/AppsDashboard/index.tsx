import React from 'react';

import { useFetchAppsLimit } from '@/_services/hooks/appsServiceHooks';
import { useIsWorkspaceBranchLocked } from '@/_hooks/useIsWorkspaceBranchLocked';

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

import { PLACEHOLDER_APPS, PLACEHOLDER_FOLDERS } from './placeholderItems';

import { appTypeToDisplayNameMapping, staticContentMappingByAppType, type TAppType } from './helper';

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
  const isWorkspaceBranchLocked = useIsWorkspaceBranchLocked();
  const { data: appsLimit } = useFetchAppsLimit();

  const hasItems = appType === 'front-end' ? PLACEHOLDER_FOLDERS.length > 0 || PLACEHOLDER_APPS.length > 0 : false;

  return (
    <Layout
      showNewHeader
      classes={classes}
      shouldWrapContentBody={false}
      darkMode={darkMode}
      switchDarkMode={switchDarkMode}
    >
      {appType !== 'workflow' && (
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
                  <AddNewMenu appType={appType} isWorkspaceBranchLocked={isWorkspaceBranchLocked} />
                  <BuildWithAIButton data-cy="page-header-build-with-ai" />
                </>
              )}

              <MoreActionsMenu appType={appType} />
            </>
          }
        />

        {hasItems ? (
          <ViewTabs />
        ) : (
          <>
            <Separator className="tw-mx-[4.375rem] tw-w-auto" />

            <NoAppsExist appType={appType} {...staticContentMappingByAppType[appType].emptyState} />
          </>
        )}
      </div>

      <Dialogs appType={appType} limits={appsLimit?.appsCount ?? {}} />
    </Layout>
  );
}
