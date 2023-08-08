import { organizationService, authenticationService } from '@/_services';
import {
  appendWorkspaceId,
  getSubpath,
  getWorkspaceIdOrSlugFromURL,
  stripTrailingSlash,
  pathnameWithoutSubpath,
} from '@/_helpers/utils';

export const authorizeWorkspace = () => {
  if (!isThisExistedRoute()) {
    const workspaceIdOrSlug = getWorkspaceIdOrSlugFromURL();

    const isApplicationsPath = window.location.pathname.includes('/applications/');
    const appId = isApplicationsPath ? pathnameWithoutSubpath(window.location.pathname).split('/')[2] : null;
    authenticationService
      .validateSession(appId, workspaceIdOrSlug)
      .then(({ current_organization_id }) => {
        //get organizations list
        if (window.location.pathname !== `${getSubpath() ?? ''}/switch-workspace`) {
          authorizeUserAndHandleErrors(workspaceIdOrSlug, current_organization_id);
        } else {
          updateCurrentSession({
            current_organization_id,
          });
        }
      })
      .catch((error) => {
        if ((error && error?.data?.statusCode == 422) || error?.data?.statusCode == 404) {
          const subpath = getSubpath();
          window.location = subpath ? `${subpath}${'/switch-workspace'}` : '/switch-workspace';
        }
        if (!isThisWorkspaceLoginPage(true) && !isApplicationsPath) {
          updateCurrentSession({
            authentication_status: false,
          });
        } else if (isApplicationsPath) {
          updateCurrentSession({
            authentication_failed: true,
            load_app: true,
          });
        }
      });
  }
};

const isThisExistedRoute = () => {
  const existedPaths = [
    'forgot-password',
    'reset-password',
    'invitations',
    'organization-invitations',
    'setup',
    'confirm',
    'confirm-invite',
  ];

  const subpath = getSubpath();
  const subpathArray = subpath ? subpath.split('/').filter((path) => path != '') : [];
  const pathnames = window.location.pathname.split('/')?.filter((path) => path != '');
  const checkPath = () => existedPaths.find((path) => pathnames[subpath ? subpathArray.length : 0] === path);
  return pathnames?.length > 0 ? (checkPath() ? true : false) : false;
};

const fetchOrganizations = (current_organization_id, callback) => {
  organizationService.getOrganizations().then((response) => {
    const current_organization_name = response.organizations?.find((org) => org.id === current_organization_id)?.name;
    callback({ organizations: response.organizations, current_organization_name });
  });
};

const isThisWorkspaceLoginPage = (justLoginPage = false) => {
  const subpath = window?.public_config?.SUB_PATH ? stripTrailingSlash(window?.public_config?.SUB_PATH) : null;
  const pathname = location.pathname.replace(subpath, '');
  const pathnames = pathname.split('/').filter((path) => path !== '');
  return (justLoginPage && pathnames.includes('login')) || (pathnames.length === 2 && pathnames.includes('login'));
};

const updateCurrentSession = (newSession) => {
  const currentSession = authenticationService.currentSessionValue;
  authenticationService.updateCurrentSession({ ...currentSession, ...newSession });
};

export const authorizeUserAndHandleErrors = (workspace_slug, workspace_id) => {
  const subpath = getSubpath();
  //initial session details
  updateCurrentSession({
    ...(workspace_id && { current_organization_id: workspace_id }),
  });

  authenticationService
    .authorize()
    .then((data) => {
      const { current_organization_id, current_organization_slug } = data;
      fetchOrganizations(current_organization_id, ({ organizations }) => {
        const current_organization_name = organizations?.find((org) => org.id === current_organization_id)?.name;
        /* add the user details like permission and user previlliage details to the subject */
        updateCurrentSession({
          ...data,
          current_organization_name,
          organizations,
          load_app: true,
        });

        // if user is trying to load the workspace login page, then redirect to the dashboard
        if (isThisWorkspaceLoginPage())
          return (window.location = appendWorkspaceId(
            current_organization_slug || current_organization_id,
            '/:workspaceId'
          ));
      });
    })
    .catch((error) => {
      // if the auth token didn't contain workspace-id, try switch workspace fn
      if (error && error?.data?.statusCode === 401) {
        const unauthorized_organization_id = workspace_id;

        //get current session's workspace id
        authenticationService
          .validateSession()
          .then(({ current_organization_id }) => {
            /* change current organization id to valid one [current logged in organization] */
            updateCurrentSession({
              current_organization_id,
            });

            /* CASE-1: If the user didn't login to the perticular workspace yet. first try to switch workspace */
            organizationService
              .switchOrganization(unauthorized_organization_id)
              .then((data) => {
                const { current_organization_slug } = data;
                updateCurrentSession(data);
                if (isThisWorkspaceLoginPage())
                  return (window.location = appendWorkspaceId(current_organization_slug, '/:workspaceId'));
                authorizeUserAndHandleErrors(current_organization_slug);
              })
              .catch(() => {
                /* if CASE-1 failed. then redirect to the workspace login page */
                fetchOrganizations(current_organization_id, ({ current_organization_name }) => {
                  updateCurrentSession({
                    current_organization_name,
                    load_app: true,
                  });

                  if (!isThisWorkspaceLoginPage())
                    return (window.location = `${subpath ?? ''}/login/${workspace_slug}`);
                });
              });
          })
          .catch(() => authenticationService.logout());
      } else if ((error && error?.data?.statusCode == 422) || error?.data?.statusCode == 404) {
        window.location = subpath ? `${subpath}${'/switch-workspace'}` : '/switch-workspace';
      } else {
        if (!isThisWorkspaceLoginPage() && !isThisWorkspaceLoginPage(true))
          updateCurrentSession({
            authentication_status: false,
          });
      }
    });
};
