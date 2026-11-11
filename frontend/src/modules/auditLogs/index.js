import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';

import { TJLoader } from '@/_ui/TJLoader';
import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';

const eeAuditLogsPage = lazy(() => import('@ee/modules/AuditLogs'));

const AuditLogsPage = pickEditionSpecificComponent({
  ce: () => <Navigate to="/" replace />,
  ee: eeAuditLogsPage,
  cloudSameAsEE: true,
  fallback: <TJLoader />,
});

/* NOTE:
    This file should be the entry point to a module. 
    Anything inside the module shouldn't be accessible outside module folder 
*/
const getAuditLogsRoutes = (props) => [
  <Route exact key="audit-logs" path="/:workspaceId/audit-logs" element={<AuditLogsPage {...props} />} />,
];

export default getAuditLogsRoutes;
