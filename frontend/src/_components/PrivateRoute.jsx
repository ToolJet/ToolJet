import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { authenticationService } from '@/_services';

export const PrivateRoute = ({ component: Component, switchDarkMode, darkMode, skipAuth = false, ...rest }) => (
  <Route
    {...rest}
    render={(props) => {
      const currentUser = authenticationService.currentUserValue;
      if (!currentUser && !props.location.pathname.startsWith('/applications/') && !skipAuth) {
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

      const superAdminRoutes = ['/all-users', '/instance-settings'];
      if (currentUser && superAdminRoutes.includes(props.location.pathname) && !currentUser.super_admin) {
        return (
          <Redirect
            to={{
              pathname: '/',
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

export const AdminRoute = ({ component: Component, switchDarkMode, darkMode, ...rest }) => (
  <Route
    {...rest}
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

      return <Component {...props} switchDarkMode={switchDarkMode} darkMode={darkMode} />;
    }}
  />
);
