import React from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';

export const AdminRoute = ({ children, navigate }) => {
  const { isLoading, session } = useSessionManagement();
  const { admin } = session;

  if (admin === false) {
    return navigate(
      {
        pathname: '/',
        state: { from: location },
      },
      { replace: true }
    );
  }

  return <RouteLoader isLoading={isLoading}>{children}</RouteLoader>;
};
