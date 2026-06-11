import React, { useEffect } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';

export const SuperAdminRoute = ({ children, navigate }) => {
  const { isLoading, session, isValidSession, setLoading } = useSessionManagement();
  const { super_admin } = session;

  useEffect(() => {
    if (isValidSession && super_admin !== null) {
      if (!super_admin) {
        return navigate(
          {
            pathname: '/',
            state: { from: location },
          },
          { replace: true }
        );
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidSession, super_admin]);

  if (super_admin === false) {
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
