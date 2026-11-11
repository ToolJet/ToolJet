import React, { Suspense } from 'react';
import { Outlet, useMatch } from 'react-router-dom';

import { useIsMobileView } from '@/_hooks/useIsMobileView';
import { TJLoader } from '@/_ui/TJLoader';
import Layout from '@/_ui/Layout';

import { PrivateRoute } from './PrivateRoute';
import { MobileEmptyState } from './MobileBlock';

const MobileAppsDashboard = React.lazy(() => import('@/pages/AppsDashboard/MobileView/MobileAppsDashboard'));

interface IAppsDashboardRouteProps {
  darkMode: boolean;
  switchDarkMode: () => void;
}

const classes = { contentContainer: 'tw-h-dvh tw-flex tw-flex-col', contentBody: 'tw-pt-0' };

export default function AppsDashboardRoute({ darkMode, switchDarkMode }: IAppsDashboardRouteProps) {
  const isMobileView = useIsMobileView();

  const isAppsDashboard = useMatch('/:workspaceId');

  return (
    <PrivateRoute>
      {isMobileView ? (
        isAppsDashboard ? (
          <Suspense fallback={<TJLoader />}>
            <MobileAppsDashboard />
          </Suspense>
        ) : (
          <MobileEmptyState darkMode={darkMode} />
        )
      ) : (
        <Layout
          showNewHeader
          classes={classes}
          shouldWrapContentBody={false}
          darkMode={darkMode}
          switchDarkMode={switchDarkMode}
        >
          <Outlet />
        </Layout>
      )}
    </PrivateRoute>
  );
}
