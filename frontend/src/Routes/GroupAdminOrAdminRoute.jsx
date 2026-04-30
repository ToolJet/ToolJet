import React, { useEffect, useState } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';
import { useLocation, useNavigate } from 'react-router-dom';
import { licenseService } from '@/_services';

export const GroupAdminOrAdminRoute = ({ children }) => {
  const { isLoading, isValidSession, session, setLoading } = useSessionManagement({
    disableValidSessionCallback: true,
  });

  // null = not yet fetched; {} = fetch failed (fail open)
  const [featureAccess, setFeatureAccess] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    licenseService
      .getFeatureAccess()
      .then(setFeatureAccess)
      .catch(() => setFeatureAccess({}));
  }, []);

  useEffect(() => {
    if (!isValidSession || session == null) return;

    const isAdmin = !!session.admin;
    const isGroupAdmin = !!session.is_group_admin;
    const canAccessGroups = isAdmin || isGroupAdmin;

    if (canAccessGroups) {
      setLoading(false);
      return;
    }

    //Redirect users with no access
    setLoading(false);
    return navigate({ pathname: '/', state: { from: location } }, { replace: true });
  }, [isValidSession, session?.admin, session?.is_group_admin, featureAccess]);

  return <RouteLoader isLoading={isLoading}>{children}</RouteLoader>;
};

export default GroupAdminOrAdminRoute;
