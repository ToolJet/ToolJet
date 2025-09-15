import React from 'react';
import { Route } from 'react-router-dom';
import { GlobalDataSourcesPage } from './pages/GlobalDataSourcesPage';
import { PrivateRoute } from '@/Routes';
import WorkspaceRouteGuard from '@/Routes/WorkspaceRouteGuard';
/* NOTE:
    This file should be the entry point to a module. 
    Anything inside the module shouldn't be accessible outside module folder 
*/
const getDataSourcesRoutes = (props) => [
  <Route
    exact
    key="data-sources"
    path="/:workspaceId/data-sources"
    element={
      <WorkspaceRouteGuard darkMode={props.darkMode}>
        <PrivateRoute>
          <GlobalDataSourcesPage {...props} />
        </PrivateRoute>
      </WorkspaceRouteGuard>
    }
  />,
];

export default getDataSourcesRoutes;
