import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { authenticationService } from '@/_services';
import { replaceWorkspaceIdParam } from '../_helpers/utils';

export const PrivateRoute = ({ component: Component, switchDarkMode, darkMode, isAdminRoute = false, ...rest }) => {
  return (
    <Route
      {...rest}
      render={(props) => {
        const workspaceId =
          props.location.pathname.split('/')[1] !== ':workspaceId' ? props.location.pathname.split('/')[1] : '';

        const path = replaceWorkspaceIdParam(workspaceId, rest.path);

        const currentUser = authenticationService.currentUserValue;
        if (!currentUser && !props.location.pathname.startsWith('/applications/')) {
          // not logged in so redirect to login page with the return url'
          return (
            <Redirect
              to={{
                pathname: '/login',
                search: `?redirectTo=${path}`,
                state: { from: props.location },
              }}
            />
          );
        }

        if (isAdminRoute && !currentUser?.admin) {
          return (
            <Redirect
              to={{
                pathname: '/',
                search: `?redirectTo=${path}`,
                state: { from: props.location },
              }}
            />
          );
        }

        // authorised so return component
        return <Component {...props} switchDarkMode={switchDarkMode} darkMode={darkMode} />;
      }}
    />
  );
};
