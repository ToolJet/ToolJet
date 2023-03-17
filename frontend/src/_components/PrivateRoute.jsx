import React, { useEffect } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { authenticationService } from '@/_services';
import { excludeWorkspaceIdFromURL, appendWorkspaceId } from '../_helpers/utils';

export const PrivateRoute = ({ component: Component, switchDarkMode, darkMode, ...rest }) => {
  const [session, setSession] = React.useState(authenticationService.currentSessionValue);
  useEffect(() => {
    const subject = authenticationService.currentSession.subscribe((newSession) => {
      setSession(newSession);
    });

    () => subject.unsubscribe();
  }, []);

  return (
    <Route
      {...rest}
      render={(props) => {
        const wid = session?.current_organization_id;
        const path = appendWorkspaceId(wid, rest.path, true);
        if (props.location.pathname === '/:workspaceId' && wid) window.history.replaceState(null, null, path);

        // authorised so return component
        if (
          session?.group_permissions ||
          props.location.pathname.startsWith('/applications/') ||
          (rest.path === '/switch-workspace' && session?.current_organization_id)
        ) {
          return <Component {...props} switchDarkMode={switchDarkMode} darkMode={darkMode} />;
        } else {
          if (session?.authentication_status === false && !props.location.pathname.startsWith('/applications/')) {
            // not logged in so redirect to login page with the return url'
            return (
              <Redirect
                to={{
                  pathname: '/login',
                  search: `?redirectTo=${excludeWorkspaceIdFromURL(props.location.pathname)}`,
                  state: { from: props.location },
                }}
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
      }}
    />
  );
};

export const AdminRoute = ({ component: Component, switchDarkMode, darkMode, ...rest }) => {
  const [session, setSession] = React.useState(authenticationService.currentSessionValue);
  useEffect(() => {
    const subject = authenticationService.currentSession.subscribe((newSession) => {
      setSession(newSession);
    });

    () => subject.unsubscribe();
  }, []);

  return (
    <Route
      {...rest}
      render={(props) => {
        // authorised so return component
        if (session?.group_permissions) {
          //check: [Marketplace route]
          if (!session?.admin) {
            return (
              <Redirect
                to={{
                  pathname: '/',
                  search: `?redirectTo=${props.location.pathname}`,
                  state: { from: props.location },
                }}
              />
            );
          }

          return <Component {...props} switchDarkMode={switchDarkMode} darkMode={darkMode} />;
        } else {
          if (session?.authentication_status === false && !props.location.pathname.startsWith('/applications/')) {
            // not logged in so redirect to login page with the return url'
            return (
              <Redirect
                to={{
                  pathname: '/login',
                  search: `?redirectTo=${props.location.pathname}`,
                  state: { from: props.location },
                }}
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
      }}
    />
  );
};
