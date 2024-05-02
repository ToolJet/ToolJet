import React, { useEffect } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';

export const AdminRoute = ({ children, navigate }) => {
  const { isLoading, isValidSession, session, setLoading } = useSessionManagement({
    disableValidSessionCallback: true,
  });
  const { admin } = session;

  useEffect(() => {
    if (isValidSession && admin !== null) {
      if (!admin) {
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
  }, [isValidSession, admin]);

  return <RouteLoader isLoading={isLoading}>{children}</RouteLoader>;
};
