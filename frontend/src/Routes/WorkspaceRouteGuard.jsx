import React from 'react';
import { useMobileRouteGuard } from '@/_hooks/useMobileRouteGuard';
import { MobileEmptyState } from './MobileBlock';

/**
 * Wrapper component for workspace routes that blocks mobile access
 * to workspace management features
 */
const WorkspaceRouteGuard = ({ children, darkMode }) => {
  const { isMobile } = useMobileRouteGuard();

  // Show mobile empty state for workspace management routes
  if (isMobile) {
    return <MobileEmptyState darkMode={darkMode} />;
  }

  return children;
};

export default WorkspaceRouteGuard;
