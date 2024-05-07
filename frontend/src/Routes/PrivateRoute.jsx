import React from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';

export const PrivateRoute = ({ children }) => {
  const { isLoading } = useSessionManagement();
  return <RouteLoader isLoading={isLoading}>{children}</RouteLoader>;
};
