import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authenticationService } from '@/_services';

export const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const currentUser = authenticationService.currentUserValue;
  return !currentUser && !location.pathname.startsWith('/applications/') ? (
    <Navigate
      to={{
        pathname: '/login',
        search: `?redirectTo=${location.pathname}`,
        state: { from: location },
      }}
      replace
    />
  ) : (
    children
  );
};

export const AdminRoute = ({ children }) => {
  const location = useLocation();
  const currentUser = authenticationService.currentUserValue;
  return !currentUser && !location.pathname.startsWith('/applications/') ? (
    <Navigate
      to={{
        pathname: '/login',
        search: `?redirectTo=${location.pathname}`,
        state: { from: location },
      }}
      replace
    />
  ) : !currentUser?.admin ? (
    <Navigate
      to={{
        pathname: '/',
        search: `?redirectTo=${location.pathname}`,
        state: { from: location },
      }}
      replace
    />
  ) : (
    children
  );
};
