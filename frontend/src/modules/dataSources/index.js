import React from 'react';
import { Route } from 'react-router-dom';
import { PrivateRoute } from '@/Routes';
import DesktopOnlyRoute from '@/Routes/DesktopOnlyRoute';

import DataSourceList from '@/pages/DataSourceList';
import DataSourceDetail from '@/pages/DataSourceDetail';
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
      <DesktopOnlyRoute darkMode={props.darkMode}>
        <PrivateRoute>
          <DataSourceList darkMode={props.darkMode} switchDarkMode={props.switchDarkMode} />
        </PrivateRoute>
      </DesktopOnlyRoute>
    }
  />,
  <Route
    exact
    key="data-sources-selected"
    path="/:workspaceId/data-sources/:selectedId"
    element={
      <DesktopOnlyRoute darkMode={props.darkMode}>
        <PrivateRoute>
          <DataSourceDetail darkMode={props.darkMode} switchDarkMode={props.switchDarkMode} />
        </PrivateRoute>
      </DesktopOnlyRoute>
    }
  />,
];

export default getDataSourcesRoutes;
