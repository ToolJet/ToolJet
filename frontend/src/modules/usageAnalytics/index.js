import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';

import { TJLoader } from '@/_ui/TJLoader';
import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';

// Lazy so the page (and its charting library) lands in its own chunk.
const eeUsageAnalyticsPage = lazy(() => import('@ee/modules/UsageAnalytics'));

const UsageAnalyticsPage = pickEditionSpecificComponent({
  ce: () => <Navigate to="/" replace />,
  ee: eeUsageAnalyticsPage,
  cloudSameAsEE: true,
  fallback: <TJLoader />,
});

/* NOTE:
    This file should be the entry point to a module.
    Anything inside the module shouldn't be accessible outside module folder
*/
const getUsageAnalyticsRoutes = (props) => [
  <Route
    exact
    key="usage-analytics"
    path="/:workspaceId/usage-analytics"
    element={<UsageAnalyticsPage {...props} />}
  />,
  <Route
    exact
    key="usage-analytics-app"
    path="/:workspaceId/usage-analytics/apps/:appId"
    element={<UsageAnalyticsPage {...props} />}
  />,
];

export default getUsageAnalyticsRoutes;
