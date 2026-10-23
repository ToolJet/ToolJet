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

    if (isAdmin) {
      setLoading(false);
      return;
    }
    if (!isGroupAdmin) {
      return navigate({ pathname: '/', state: { from: location } }, { replace: true });
    }

    // Group admin — wait for license fetch to settle before deciding
    if (featureAccess === null) return;

    const hasCustomGroupsLicense =
      featureAccess.customGroups === true && featureAccess.licenseStatus?.isLicenseValid !== false;

    if (!hasCustomGroupsLicense) {
      return navigate({ pathname: '/', state: { from: location } }, { replace: true });
    }

    //Redirect users with no access
    setLoading(false);
  }, [isValidSession, session?.admin, session?.is_group_admin, featureAccess]);

  return <RouteLoader isLoading={isLoading}>{children}</RouteLoader>;
};

export default GroupAdminOrAdminRoute;
