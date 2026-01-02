/*
 AppRoute component should handle all editor and preview route related cases.
*/
import React, { useEffect, useState } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { handleAppAccess } from '@/_helpers/handleAppAccess';
import { getQueryParams } from '@/_helpers/routes';
import queryString from 'query-string';
import useStore from '@/AppBuilder/_stores/store';
import { useMobileRouteGuard } from '@/_hooks/useMobileRouteGuard';
import { MobileEmptyState } from './MobileBlock';
import { authenticationService } from '@/_services';
import { getEnvironmentAccessFromPermissions, getSafeEnvironment } from '@/_helpers/environmentAccess';

export const AppsRoute = ({ children, componentType, darkMode }) => {
  const params = useParams();
  const location = useLocation();
  const [extraProps, setExtraProps] = useState({});
  const { isLoading, isValidSession, isInvalidSession, setLoading } = useSessionManagement({
    disableValidSessionCallback: true,
    /* Only for preiview / released apps */
    disableInValidSessionCallback: componentType !== 'editor',
  });
  const clonedElement = React.cloneElement(children, extraProps);
  const navigate = useNavigate();
  const switchPage = useStore((state) => state.switchPage);
  const { shouldBlockMobile } = useMobileRouteGuard();
  /* 
   any extra logic specifc to the route can be done 
   when the session is valid state updates to true.
  */
  useEffect(() => {
    if (isValidSession) {
      onValidSession();
    }

    // handle back and forward navigation
    window.addEventListener('popstate', handleBrowserNavigation);
    return () => window.removeEventListener('popstate', handleBrowserNavigation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidSession]);

  useEffect(() => {
    if (isInvalidSession) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInvalidSession]);

  /* 
   validate the app access if the route either /apps/ or /application/ and 
   user has a valid session also user isn't switching between pages on editor 
*/
  const onValidSession = async () => {
    const isSwitchingPages = location.state?.isSwitchingPage;

    if (!isSwitchingPages) {
      const { slug, versionId, environmentId, pageHandle } = params;
      /* Validate the app permissions */
      let accessDetails = await handleAppAccess(componentType, slug, versionId, environmentId);
      const { versionName, environmentName, id: appId, ...restDetails } = accessDetails;
      if (versionName) {
        const restQueryParams = getQueryParams();
        const envFromUrl = restQueryParams.env;

        // Get user's environment access permissions
        const session = authenticationService.currentSessionValue;
        const perms = session?.app_group_permissions;
        const hasEditPermission =
          perms?.is_all_editable ||
          (appId && Array.isArray(perms?.editable_apps_id) && perms.editable_apps_id.includes(appId));

        // Get environment access for this user - use appId instead of slug
        const environmentAccess = getEnvironmentAccessFromPermissions(perms, appId);

        // For all users (edit and view), validate environment access and use safe environment
        // Even editors need to be restricted if they don't have permission to requested environment
        const requestedEnv = (environmentName || envFromUrl || '').toLowerCase();
        const effectiveEnv = getSafeEnvironment(environmentAccess, requestedEnv, hasEditPermission);

        // Check if license is invalid/expired (basic plan) - from store
        const storeState = useStore.getState();
        const featureAccess = storeState?.license?.featureAccess;
        // Only exclude env if license is explicitly expired or invalid
        // If license status is undefined (not loaded yet), default to including env
        const isBasicPlan =
          featureAccess?.licenseStatus?.isExpired === true ||
          featureAccess?.licenseStatus?.isLicenseValid === false ||
          featureAccess?.plan === 'starter';

        // Don't add env param for free/basic/starter plan, expired or invalid license
        // Also don't add env if it wasn't in the original URL (user didn't request specific env)
        const shouldIncludeEnv = !isBasicPlan && (envFromUrl || environmentName);

        const queryParams = {
          // Keep other params but let env/version below override
          ...Object.fromEntries(Object.entries(restQueryParams).filter(([k]) => k !== 'env' && k !== 'version')),
          version: versionName || restQueryParams.version,
          // Only add env if license is valid AND env was explicitly requested in URL
          ...(shouldIncludeEnv && effectiveEnv ? { env: effectiveEnv } : {}),
        };

        const newSearch = queryString.stringify(queryParams);
        const currentSearch = location.search?.replace('?', '');

        // Only navigate if the search params actually changed to avoid infinite loops
        if (newSearch !== currentSearch) {
          /* means. the User is trying to load old preview URL. Let's change these to query params */
          navigate(
            {
              pathname: `/applications/${slug}${pageHandle ? `/${pageHandle}` : ''}`,
              search: newSearch,
            },
            { replace: true, state: location?.state }
          );
        }
      }
      // Include appId in extraProps so it's available to the app
      setExtraProps({ ...restDetails, id: appId });
      setLoading(false);
    }
  };

  const handleBrowserNavigation = (e) => {
    const { id, handle } = e.state;
    switchPage(id, handle, [], 'canvas', true);
  };

  // Show mobile empty state for protected routes (editor mode)
  if (shouldBlockMobile && componentType === 'editor') {
    return <MobileEmptyState darkMode={darkMode} />;
  }

  return <RouteLoader isLoading={isLoading}>{clonedElement}</RouteLoader>;
};
