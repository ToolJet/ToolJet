import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { authenticationService } from '@/_services';
import { excludeWorkspaceIdFromURL, replaceWorkspaceIdParam } from '../_helpers/utils';

export const PrivateRoute = ({ component: Component, switchDarkMode, darkMode, isAdminRoute = false, ...rest }) => {
  return (
    <Route
      {...rest}
      render={(props) => {
        const workspaceId =
          props.location.pathname.split('/')[1] !== ':workspaceId' ? props.location.pathname.split('/')[1] : '';
        const wid = authenticationService.currentOrgValue?.current_organization_id || workspaceId;
        const path = replaceWorkspaceIdParam(wid, rest.path);
        props.location.pathname === '/:workspaceId' && window.history.replaceState(null, null, path);

        const currentUser = authenticationService.currentUserValue;
        if (!currentUser && !props.location.pathname.startsWith('/applications/')) {
          // not logged in so redirect to login page with the return url'
          const redirectURL = excludeWorkspaceIdFromURL(path);
          return (
            <Redirect
              to={{
                pathname: '/login',
                search: `?redirectTo=${redirectURL ? redirectURL : '/'}`,
                state: { from: props.location },
              }}
            />
          );
        }

        if (isAdminRoute && !currentUser?.admin) {
          const redirectURL = excludeWorkspaceIdFromURL(path);
          return (
            <Redirect
              to={{
                pathname: '/',
                search: `?redirectTo=${redirectURL ? redirectURL : '/'}`,
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
