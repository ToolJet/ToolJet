import React from 'react';
import { Route } from 'react-router-dom';
import AuditLogsPage from './pages/AuditLogsPage';
import { AdminRoute } from '@/Routes';
/* NOTE:
    This file should be the entry point to a module. 
    Anything inside the module shouldn't be accessible outside module folder 
*/
const getAuditLogsRoutes = (props) => [
  <Route
    exact
    key="audit-logs"
    path="/:workspaceId/audit-logs"
    element={
      <AdminRoute {...props}>
        <AuditLogsPage {...props} />
      </AdminRoute>
    }
  />,
];

export default getAuditLogsRoutes;
