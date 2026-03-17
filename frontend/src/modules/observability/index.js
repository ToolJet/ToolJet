import React from 'react';
import { Route } from 'react-router-dom';
import * as eeModules from '@ee/modules';
import { SuperAdminRoute } from '@/Routes';
import DesktopOnlyRoute from '@/Routes/DesktopOnlyRoute';

const EEObservabilityPage = eeModules?.Observability?.components?.ObservabilityPage?.default;

const getObservabilityRoutes = (props) => {
  if (!EEObservabilityPage) return [];
  return [
    <Route
      exact
      key="observability"
      path="/observability"
      element={
        <DesktopOnlyRoute darkMode={props.darkMode}>
          <SuperAdminRoute {...props}>
            <EEObservabilityPage darkMode={props.darkMode} switchDarkMode={props.switchDarkMode} />
          </SuperAdminRoute>
        </DesktopOnlyRoute>
      }
    />,
  ];
};

export default getObservabilityRoutes;
