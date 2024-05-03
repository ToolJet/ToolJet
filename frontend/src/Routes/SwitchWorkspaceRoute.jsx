import React, { useEffect } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';

export const SwitchWorkspaceRoute = ({ children }) => {
  const { isLoading, session, setLoading } = useSessionManagement({
    disableInValidSessionCallback: true,
  });
  const { current_organization_id } = session;

  useEffect(() => {
    if (current_organization_id) setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current_organization_id]);

  return <RouteLoader isLoading={isLoading}>{children}</RouteLoader>;
};
