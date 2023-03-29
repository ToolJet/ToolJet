import React from 'react';
import { Route, Navigate, useLocation } from 'react-router-dom';
import { authenticationService } from '@/_services';

export const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const currentUser = authenticationService.currentUserValue;
  if (!currentUser && !location.pathname.startsWith('/applications/')) {
    // not logged in so redirect to login page with the return url
    return (
      <Navigate
        to={{
          pathname: '/login',
          search: `?redirectTo=${location.pathname}`,
          state: { from: location },
        }}
        replace
      />
    );
  }

  const superAdminRoutes = ['/all-users', '/instance-settings'];
  if (currentUser && superAdminRoutes.includes(location.pathname) && !currentUser.super_admin) {
    return (
      <Navigate
        to={{
          pathname: '/',
          state: { from: location },
        }}
        replace
      />
    );
  }

  // authorised so return component
  return children;
};

export const AdminRoute = ({ children }) => {
  const location = useLocation();
  const currentUser = authenticationService.currentUserValue;
  if (!currentUser && !location.pathname.startsWith('/applications/')) {
    return (
      <Navigate
        to={{
          pathname: '/login',
          search: `?redirectTo=${location.pathname}`,
          state: { from: location },
        }}
        replace
      />
    );
  }

  if (!currentUser?.admin) {
    return (
      <Navigate
        to={{
          pathname: '/',
          search: `?redirectTo=${location.pathname}`,
          state: { from: location },
        }}
        replace
      />
    );
  }

  return children;
};
