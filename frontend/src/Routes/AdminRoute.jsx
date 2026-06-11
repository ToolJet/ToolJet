import React, { useEffect } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';
import { useNavigate } from 'react-router-dom';
export const AdminRoute = ({ children, navigate }) => {
  const { isLoading, isValidSession, session, setLoading } = useSessionManagement({
    disableValidSessionCallback: true,
  });
  const { admin } = session;
  const defaultNavigate = useNavigate();
  const navigateTo = navigate || defaultNavigate;
  useEffect(() => {
    if (isValidSession && admin !== null) {
      if (!admin) {
        return navigateTo(
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
// To Do Later : remove the navigate prop dependency and use navigate in Route itself
