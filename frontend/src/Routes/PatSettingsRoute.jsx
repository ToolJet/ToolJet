import React, { useEffect } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';
import { useLocation, useNavigate } from 'react-router-dom';
import { canAccessPatPage } from '@/_helpers/patPermissions';

export const PatSettingsRoute = ({ children }) => {
  const { isLoading, isValidSession, session, setLoading } = useSessionManagement({
    disableValidSessionCallback: true,
  });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isValidSession || session == null) return;

    if (!canAccessPatPage(session)) {
      return navigate({ pathname: '/', state: { from: location } }, { replace: true });
    }
    setLoading(false);
  }, [isValidSession, session?.admin, session?.super_admin, session?.user_permissions]);

  return <RouteLoader isLoading={isLoading}>{children}</RouteLoader>;
};

export default PatSettingsRoute;
