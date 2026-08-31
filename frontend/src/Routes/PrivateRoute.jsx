import React from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';
import { useAutoSyncNotifications } from '@/_hooks/useAutoSyncNotifications';

export const PrivateRoute = ({ children }) => {
  const { isLoading } = useSessionManagement();
  useAutoSyncNotifications();
  return <RouteLoader isLoading={isLoading}>{children}</RouteLoader>;
};
