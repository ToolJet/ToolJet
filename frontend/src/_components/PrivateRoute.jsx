import React, { useEffect } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { authenticationService } from '@/_services';
import { excludeWorkspaceIdFromURL, appendWorkspaceId } from '../_helpers/utils';

export const PrivateRoute = ({ component: Component, switchDarkMode, darkMode, isAdminRoute = false, ...rest }) => {
  const [orgDetails, setOrgDetails] = React.useState({});
  useEffect(() => {
    const subject = authenticationService.currentOrganization.subscribe((newOrgDetails) => {
      setOrgDetails(newOrgDetails);
    });

    () => subject.unsubscribe();
  }, []);

  return (
    <Route
      {...rest}
      render={(props) => {
        const workspaceId =
          props.location.pathname.split('/')[1] !== ':workspaceId' ? props.location.pathname.split('/')[1] : '';
        const wid = authenticationService.currentOrgValue?.current_organization_id || workspaceId;
        const path = appendWorkspaceId(wid, rest.path, true);
        if (props.location.pathname === '/:workspaceId' && rest.path !== '/switch-workspace')
          window.history.replaceState(null, null, path);

        const currentUser = authenticationService.currentUserValue;
        if (!currentUser && !props.location.pathname.startsWith('/applications/')) {
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

        if (isAdminRoute && !currentUser?.admin) {
          return (
            <Redirect
              to={{
                pathname: '/',
                search: `?redirectTo=${excludeWorkspaceIdFromURL(path)}`,
                state: { from: props.location },
              }}
            />
          );
        }

        // authorised so return component
        if (
          orgDetails.group_permissions ||
          props.location.pathname.startsWith('/applications/') ||
          (rest.path === '/switch-workspace' && orgDetails?.current_organization_id)
        ) {
          return <Component {...props} switchDarkMode={switchDarkMode} darkMode={darkMode} />;
        } else {
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
