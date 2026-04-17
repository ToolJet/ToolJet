import React, { useEffect } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';
import { useLocation, useNavigate } from 'react-router-dom';

export const GroupAdminOrAdminRoute = ({ children }) => {
  const { isLoading, isValidSession, session, setLoading } = useSessionManagement({
    disableValidSessionCallback: true,
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isValidSession || session == null) return;

    const isAdmin = !!session.admin;
    const isGroupAdmin = !!session.is_group_admin;
    const allowed = isAdmin || isGroupAdmin;

    if (!allowed) {
      return navigate(
        {
          pathname: '/',
          state: { from: location },
        },
        { replace: true }
      );
    }

    setLoading(false);
  }, [isValidSession, session?.admin, session?.is_group_admin]);

  return <RouteLoader isLoading={isLoading}>{children}</RouteLoader>;
};

export default GroupAdminOrAdminRoute;
