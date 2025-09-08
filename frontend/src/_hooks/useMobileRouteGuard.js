import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { isMobileDevice } from '@/_helpers/appUtils';

/**
 * Hook to determine if a route should block mobile access
 * Only blocks mobile access to specific protected routes
 */
export const useMobileRouteGuard = () => {
  const location = useLocation();

  const shouldBlockMobile = useMemo(() => {
    if (!isMobileDevice()) {
      return false; // Desktop users always allowed
    }

    const path = location.pathname;
    console.log('path', path);

    // Block mobile access to editor mode
    if (path.includes('/apps/')) {
      return true; // Editor routes
    }

    // Block mobile access to workspace management
    if (
      path.includes('/workspace-settings') ||
      path.includes('/workspace-constants') ||
      path.includes('/profile-settings')
    ) {
      return true; // Workspace management routes
    }

    // Allow mobile access to all other routes
    return false;
  }, [location.pathname]);

  return {
    shouldBlockMobile,
    isMobile: isMobileDevice(),
  };
};
