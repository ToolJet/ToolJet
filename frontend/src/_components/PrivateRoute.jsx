import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { authenticationService } from '@/_services';

export const PrivateRoute = ({ component: Component, switchDarkMode, darkMode, ...rest }) => {
  const path = rest.path === '/' ? '/:workspace_id' : `/:workspace_id${rest.path}`;
  return (
    <Route
      {...rest}
      path={path}
      render={(props) => {
        const currentUser = authenticationService.currentUserValue;
        if (!currentUser && !props.location.pathname.startsWith('/applications/')) {
          // not logged in so redirect to login page with the return url
          return (
            <Redirect
              to={{
                pathname: '/login',
                search: `?redirectTo=${props.location.pathname}`,
                state: { from: props.location },
              }}
            />
          );
        }

        replaceWorkspaceIdParam(props, rest.path);

        // authorised so return component
        return <Component {...props} switchDarkMode={switchDarkMode} darkMode={darkMode} />;
      }}
    />
  );
};

export const AdminRoute = ({ component: Component, switchDarkMode, darkMode, ...rest }) => {
  const path = rest.path === '/' ? '/:workspace_id' : `/:workspace_id${rest.path}`;

  return (
    <Route
      {...rest}
      path={path}
      render={(props) => {
        const currentUser = authenticationService.currentUserValue;
        if (!currentUser && !props.location.pathname.startsWith('/applications/')) {
          return (
            <Redirect
              to={{
                pathname: '/login',
                search: `?redirectTo=${props.location.pathname}`,
                state: { from: props.location },
              }}
            />
          );
        }

        if (!currentUser?.admin) {
          return (
            <Redirect
              to={{
                pathname: '/',
                search: `?redirectTo=${props.location.pathname}`,
                state: { from: props.location },
              }}
            />
          );
        }

        replaceWorkspaceIdParam(props, rest.path);

        return <Component {...props} switchDarkMode={switchDarkMode} darkMode={darkMode} />;
      }}
    />
  );
};

// will replace `/` path to `/<workspace-id>`
const replaceWorkspaceIdParam = (props, path) => {
  const organization_id =
    props.location.pathname.split('/')[1] !== ':workspace_id'
      ? props.location.pathname.split('/')[1]
      : authenticationService.currentUserValue.organization_id;

  if (path === '/') {
    window.history.replaceState(null, '', `/${organization_id}`);
  }
};
