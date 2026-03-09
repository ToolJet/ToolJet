import React from 'react';
import { Route } from 'react-router-dom';
import ObservabilityPage from './pages/ObservabilityPage';
import { AdminRoute } from '@/Routes';
import DesktopOnlyRoute from '@/Routes/DesktopOnlyRoute';

/* NOTE:
    This file should be the entry point to a module.
    Anything inside the module shouldn't be accessible outside module folder
*/
const getObservabilityRoutes = (props) => [
  <Route
    exact
    key="observability"
    path="/observability"
    element={
      <DesktopOnlyRoute darkMode={props.darkMode}>
        <AdminRoute {...props}>
          <ObservabilityPage darkMode={props.darkMode} />
        </AdminRoute>
      </DesktopOnlyRoute>
    }
  />,
];

export default getObservabilityRoutes;
