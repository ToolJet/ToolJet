import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authenticationService } from '@/_services';
import { getWorkspaceId } from '@/_helpers/utils';
import { retrieveWhiteLabelFavicon, retrieveWhiteLabelText, setFaviconAndTitle } from '@white-label/whiteLabelling';
import { appendWorkspaceId, excludeWorkspaceIdFromURL } from '@/_helpers/routes';

/*
  REMINDER: Don't put specific route login inside this hook. 
  create new route wrapper for that. See AdminRoute example
  ---------------------------------------------------------
  useSessionManagement HOOK
  - handles basic session check before render a protected page
  - can customise the after behaviour using the disableValidSessionCallback, disableInValidSessionCallback params
*/

const defaultState = {
  disableValidSessionCallback: false,
  disableInValidSessionCallback: false,
};
export const useSessionManagement = (initialState = defaultState) => {
  const [session, setSession] = useState(authenticationService.currentSessionValue);
  const [isLoading, setLoading] = useState(true);
  const [isValidSession, setValidSession] = useState(false);
  const [isInvalidSession, setInvalidSession] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname, search, state } = location;
  const { disableValidSessionCallback, disableInValidSessionCallback } = initialState;

  useEffect(() => {
    /* replacing the state. otherwise the route will keep isSwitchingPage value `true` */
    navigate(
      { pathname, search },
      { replace: true, state: Object.assign({}, state || {}, { isSwitchingPage: false }) }
    );
    const subject = authenticationService.currentSession.subscribe(
      async (newSession) => await handleNewSession(newSession)
    );
    return () => subject.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.all([retrieveWhiteLabelFavicon(), retrieveWhiteLabelText()]).then(([whiteLabelFavicon, whiteLabelText]) => {
      setFaviconAndTitle(whiteLabelFavicon, whiteLabelText, location);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const { current_organization_slug, current_organization_id } = session;
    /* replace the /:workspaceId route to current workspace slug / id */
    if (pathname.startsWith('/:workspaceId')) {
      const path = appendWorkspaceId(current_organization_slug || current_organization_id, pathname, true);
      (current_organization_slug || current_organization_id) && window.history.replaceState(null, null, path);
    }
  }, [session, pathname]);

  const handleNewSession = async (newSession) => {
    const { group_permissions, authentication_status, authentication_failed, isOrgSwitchingFailed } = newSession;
    const isInvalidSession = authentication_status === false || authentication_failed || isOrgSwitchingFailed;
    if (newSession?.noWorkspaceAttachedInTheSession) {
      /* No active workspace for the user show error page */
      navigate('/error/no-active-workspace');
    }
    if (isInvalidSession) {
      setInvalidSession(true);
      !disableInValidSessionCallback && handleInvalidSession();
    }
    if (group_permissions) {
      setValidSession(true);
      !disableValidSessionCallback && setLoading(false);
    }
    setSession(newSession);
  };

  const handleInvalidSession = () => {
    /* REDIRECT TO LOGIN PAGE */
    const redirectTo = `${excludeWorkspaceIdFromURL(pathname)}${location.search}`;
    const workspaceId = getWorkspaceId();
    navigate(
      {
        pathname: `/login${workspaceId ? `/${workspaceId}` : ''}`,
        search: `?redirectTo=${redirectTo}`,
        state: { from: location },
      },
      { replace: true }
    );
  };

  return { session, isLoading, setLoading, isValidSession, isInvalidSession };
};
