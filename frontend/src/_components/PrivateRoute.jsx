import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { authenticationService } from '@/_services';
import { appendWorkspaceId, excludeWorkspaceIdFromURL, getPathname, getQueryParams } from '@/_helpers/routes';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import { getWorkspaceId } from '@/_helpers/utils';
import { handleAppAccess } from '@/_helpers/handleAppAccess';
import queryString from 'query-string';

export const PrivateRoute = ({ children }) => {
  const [session, setSession] = React.useState(authenticationService.currentSessionValue);
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [extraProps, setExtraProps] = useState({});
  const [isValidatingUserAccess, setUserValidationStatus] = useState(true);

  const pathname = getPathname(null, true);
  const isEditorOrViewerGoingToRender = pathname.startsWith('/apps/') || pathname.startsWith('/applications/');

  const validateRoutes = async (group_permissions, callback) => {
    /* validate the app access if the route either /apps/ or /application/ and 
      user has a valid session also user isn't switching between pages on editor 
    */
    const isSwitchingPages = location.state?.isSwitchingPage;
    /* replacing the state. otherwise the route will keep isSwitchingPage value `true` */
    navigate(
      { pathname: location.pathname, search: location.search },
      { replace: true, state: Object.assign({}, location?.state || {}, { isSwitchingPage: false }) }
    );
    if (isEditorOrViewerGoingToRender && group_permissions && !isSwitchingPages) {
      const componentType = pathname.startsWith('/apps/') ? 'editor' : 'viewer';
      const { slug, versionId, pageHandle } = params;

      /* Validate the app permissions */
      let accessDetails = await handleAppAccess(componentType, slug, versionId);
      const { versionName, ...restDetails } = accessDetails;
      if (versionName) {
        const restQueryParams = getQueryParams();
        const search = queryString.stringify({
          version: versionName,
          ...restQueryParams,
        });
        /* means. the User is trying to load old preview URL. Let's change these to query params */
        navigate(
          { pathname: `/applications/${slug}${pageHandle ? `/${pageHandle}` : ''}`, search },
          { replace: true, state: location?.state }
        );
      }
      setExtraProps(restDetails);
      callback();
    } else {
      callback();
    }
  };

  useEffect(() => {
    const subject = authenticationService.currentSession.subscribe(async (newSession) => {
      setSession(newSession);
    });

    () => subject.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUserValidationStatus(true);
    /* When route changes (not hard reload). will validate the access */
    validateRoutes(session?.group_permissions, () => {
      setUserValidationStatus(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, session]);

  //get either slug or id from the session and replace
  const { current_organization_slug, current_organization_id } = session;
  if (location.pathname.startsWith('/:workspaceId')) {
    const path = appendWorkspaceId(current_organization_slug || current_organization_id, location.pathname, true);
    (current_organization_slug || current_organization_id) && window.history.replaceState(null, null, path);
  }

  if (
    (session?.group_permissions && !isValidatingUserAccess) ||
    (pathname.startsWith('/applications/') && !isValidatingUserAccess) ||
    (pathname === '/switch-workspace' && session?.current_organization_id)
  ) {
    return isEditorOrViewerGoingToRender ? React.cloneElement(children, extraProps) : children;
  } else {
    if (
      (session?.authentication_status === false || session?.authentication_failed) &&
      !location.pathname.startsWith('/applications/')
    ) {
      // not logged in so redirect to login page with the return url'
      return (
        <Navigate
          to={{
            pathname: `/login${getWorkspaceId() ? `/${getWorkspaceId()}` : ''}`,
            search: `?redirectTo=${excludeWorkspaceIdFromURL(location.pathname)}`,
            state: { from: location },
          }}
          replace
        />
      );
    }

    return <TJLoader />;
  }
};

export const AdminRoute = ({ children }) => {
  const [session, setSession] = React.useState(authenticationService.currentSessionValue);
  const location = useLocation();
  useEffect(() => {
    const subject = authenticationService.currentSession.subscribe((newSession) => {
      setSession(newSession);
    });

    () => subject.unsubscribe();
  }, []);

  // authorised so return component
  if (session?.group_permissions) {
    //check: [Marketplace route]
    if (!session?.admin) {
      return (
        <Navigate
          to={{
            pathname: '/',
            search: `?redirectTo=${location.pathname}`,
            state: { from: location },
          }}
          replace
        />
      );
    }

    return children;
  } else {
    if (session?.authentication_status === false && !location.pathname.startsWith('/applications/')) {
      // not logged in so redirect to login page with the return url'
      return (
        <Navigate
          to={{
            pathname: `/login${getWorkspaceId() ? `/${getWorkspaceId()}` : ''}`,
            search: `?redirectTo=${location.pathname}`,
            state: { from: location },
          }}
          replace
        />
      );
    }

    return <TJLoader />;
  }
};
