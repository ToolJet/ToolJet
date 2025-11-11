import React, { useEffect } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchEdition } from '@/modules/common/helpers/utils';

/**
 * Access rules:
 * - On EE or Cloud: allow if admin OR builder
 * - On other editions (CE / unknown): deny for everyone
 */
export const BuilderOrAdminRoute = ({ children }) => {
  const { isLoading, isValidSession, session, setLoading } = useSessionManagement({
    disableValidSessionCallback: true,
  });

  const location = useLocation();
  const editionLower = String(fetchEdition() || '').toLowerCase();
  const isEEorCloud = editionLower === 'ee' || editionLower === 'cloud';

  useEffect(() => {
    if (isValidSession && session != null) {
      // session.admin is boolean in your payload; user_permissions.is_builder exists too
      const isAdmin = !!session.admin;
      const isBuilder = !!session.user_permissions?.is_builder;
      const allowed = isEEorCloud && (isAdmin || isBuilder);

      if (!allowed) {
        // not allowed
        return;
      }

      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidSession, session?.admin, session?.user_permissions?.is_builder]);

  // If still loading, show loader; otherwise render children if admin or builder, else redirect
  if (isLoading) {
    return <RouteLoader isLoading={true}>{null}</RouteLoader>;
  }

  const isAdmin = !!session?.admin;
  const isBuilder = !!session?.user_permissions?.is_builder;
  const allowed = isEEorCloud && (isAdmin || isBuilder);

  if (!allowed) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <RouteLoader isLoading={false}>{children}</RouteLoader>;
};

export default BuilderOrAdminRoute;
