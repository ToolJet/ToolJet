import React from 'react';
import { useMobileRouteGuard } from '@/_hooks/useMobileRouteGuard';
import { MobileEmptyState } from './MobileBlock';

/**
 * Wrapper component that restricts route access on mobile devices
 * and displays an empty state for mobile users
 */
const DesktopOnlyRoute = ({ children, darkMode }) => {
  const { isMobile } = useMobileRouteGuard();

  // Show mobile empty state for desktop-only routes
  if (isMobile) {
    return <MobileEmptyState darkMode={darkMode} />;
  }

  return children;
};

export default DesktopOnlyRoute;
