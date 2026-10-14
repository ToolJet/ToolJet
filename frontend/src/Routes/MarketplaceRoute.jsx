import React, { useEffect } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDataStore } from '@/_stores/appDataStore';
import { shallow } from 'zustand/shallow';
import { checkIfToolJetCloud } from '@/_helpers/utils';

export const MarketplaceRoute = ({ children }) => {
  const { isLoading, isValidSession, session, setLoading } = useSessionManagement({
    disableValidSessionCallback: true,
  });

  const location = useLocation();
  const navigate = useNavigate();

  const { tooljetVersion } = useAppDataStore(
    (state) => ({
      tooljetVersion: state?.metadata?.installed_version,
    }),
    shallow
  );

  useEffect(() => {
    if (!isValidSession || session == null) return;
    // Wait for the full session (including permissions) to hydrate before deciding.
    // On first mount, session.user_permissions can still be undefined even for a
    // valid builder session, which would incorrectly evaluate isBuilder as false.
    if (session.admin === null || session.user_permissions === undefined) {
      console.info('[MarketplaceDebug][MarketplaceRoute] session not fully hydrated yet, waiting', {
        pathname: location?.pathname,
        admin: session.admin,
        userPermissions: session.user_permissions,
      });
      return;
    }

    const isAdmin = !!session.admin;
    const isSuperAdmin = !!session.super_admin;
    const isBuilder = !!session.user_permissions?.is_builder;
    const isCloudEdition = tooljetVersion ? checkIfToolJetCloud(tooljetVersion) : false;
    const hasRole = isAdmin || isSuperAdmin || isBuilder;
    const allowed = hasRole && !isCloudEdition;

    console.info('[MarketplaceDebug][MarketplaceRoute] evaluating route access', {
      pathname: location?.pathname,
      isValidSession,
      admin: isAdmin,
      superAdmin: isSuperAdmin,
      isBuilder,
      tooljetVersion,
      isCloudEdition,
      allowed,
    });

    if (!allowed) {
      console.warn('[MarketplaceDebug][MarketplaceRoute] redirecting user to workspace root', {
        pathname: location?.pathname,
        admin: isAdmin,
        superAdmin: isSuperAdmin,
        isBuilder,
        isCloudEdition,
      });
      return navigate(
        {
          pathname: '/',
          state: { from: location },
        },
        { replace: true }
      );
    }

    setLoading(false);
  }, [isValidSession, session?.admin, session?.super_admin, session?.user_permissions?.is_builder, tooljetVersion]);

  return <RouteLoader isLoading={isLoading}>{children}</RouteLoader>;
};

export default MarketplaceRoute;
