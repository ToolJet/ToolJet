import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authenticationService } from '@/_services';
import { excludeWorkspaceIdFromURL, appendWorkspaceId } from '../_helpers/utils';

export const PrivateRoute = ({ children }) => {
  const [session, setSession] = React.useState(authenticationService.currentSessionValue);
  const location = useLocation();
  useEffect(() => {
    const subject = authenticationService.currentSession.subscribe((newSession) => {
      setSession(newSession);
    });

    () => subject.unsubscribe();
  }, []);

  const wid = session?.current_organization_id;
  const path = appendWorkspaceId(wid, location.pathname, true);
  if (location.pathname === '/:workspaceId' && wid) window.history.replaceState(null, null, path);

  // authorised so return component
  if (
    session?.group_permissions ||
    location.pathname.startsWith('/applications/') ||
    (location.pathname === '/switch-workspace' && session?.current_organization_id)
  ) {
    return children;
  } else {
    if (
      (session?.authentication_status === false || session?.authentication_failed) &&
      !location.pathname.startsWith('/applications/')
    ) {
      // not logged in so redirect to login page with the return url'
      return (
        <Navigate
          to={{
            pathname: '/login',
            search: `?redirectTo=${excludeWorkspaceIdFromURL(location.pathname)}`,
            state: { from: location },
          }}
          replace
        />
      );
    }

    return (
      <div className="spin-loader">
        <div className="load">
          <div className="one"></div>
          <div className="two"></div>
          <div className="three"></div>
        </div>
      </div>
    );
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
            pathname: '/login',
            search: `?redirectTo=${location.pathname}`,
            state: { from: location },
          }}
          replace
        />
      );
    }

    return (
      <div className="spin-loader">
        <div className="load">
          <div className="one"></div>
          <div className="two"></div>
          <div className="three"></div>
        </div>
      </div>
    );
  }
};
