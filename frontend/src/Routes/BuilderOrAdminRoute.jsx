import React, { useEffect } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchEdition } from '@/modules/common/helpers/utils';

export const BuilderOrAdminRoute = ({ children }) => {
  const { isLoading, isValidSession, session, setLoading } = useSessionManagement({
    disableValidSessionCallback: true,
  });

  const location = useLocation();
  const navigate = useNavigate();

  const editionLower = String(fetchEdition() || '').toLowerCase();
  const isEEorCloud = editionLower === 'ee' || editionLower === 'cloud';

  useEffect(() => {
    if (!isValidSession || session == null) return;

    const isAdmin = !!session.admin;
    const isBuilder = !!session.user_permissions?.is_builder;
    const allowed = isEEorCloud && (isAdmin || isBuilder);

    if (!allowed) {
      return navigate(
        {
          pathname: '/',
          state: { from: location },
        },
        { replace: true }
      );
    }

    // allowed
    setLoading(false);
  }, [
    isValidSession,
    session?.admin,
    session?.user_permissions?.is_builder,
    isEEorCloud,
  ]);

  return <RouteLoader isLoading={isLoading}>{children}</RouteLoader>;
};

export default BuilderOrAdminRoute;
