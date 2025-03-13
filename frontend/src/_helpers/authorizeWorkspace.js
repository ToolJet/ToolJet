import { organizationService, authenticationService, sessionService } from '@/_services';
import {
  pathnameToArray,
  getSubpath,
  getWorkspaceIdOrSlugFromURL,
  getPathname,
  getRedirectToWithParams,
  redirectToErrorPage,
} from './routes';
import { ERROR_TYPES } from './constants';
import useStore from '@/AppBuilder/_stores/store';
import { safelyParseJSON } from './utils';
import { fetchWhiteLabelDetails } from '@/_helpers/white-label/whiteLabelling';
/* [* Be cautious: READ THE CASES BEFORE TOUCHING THE CODE. OTHERWISE YOU MAY SEE ENDLESS REDIRECTIONS (AKA ROUTES-BURMUDA-TRIANGLE) *]
  What is this function?
    - This function is used to authorize the workspace that the user is currently trying to open (for multi-workspace functionality across multiple tabs).

  Cases / Steps
    CASE-1. Process the workspace slug. get workspace-id and basic session details. If the page is app viewer then we will get the workspace from the app-id
    CASE-2. Proceed with authorizing the workspace only if the page isn't `switch-workspace`
    CASE-3. If the user doesn't have valid session then PrivateRoute component will take care the rest [redirect to the login-page]
    CASE-4. If the page is app viewer and there is no valid session. consider the app is public 
*/

export const authorizeWorkspace = () => {
  /* Default APIs */
  const workspaceIdOrSlug = getWorkspaceIdOrSlugFromURL();
  fetchWhiteLabelDetails(workspaceIdOrSlug).finally(() => {
    if (!isThisExistedRoute()) {
      updateCurrentSession({
        triggeredOnce: true,
      });
      const isApplicationsPath = getPathname(null, true).startsWith('/applications/');
      const appId = isApplicationsPath ? getPathname().split('/')[2] : null;
      /* CASE-1 */
      sessionService
        .validateSession(appId, workspaceIdOrSlug)
        .then(
          ({
            current_organization_id,
            current_organization_slug,
            no_workspace_attached_in_the_session: noWorkspaceAttachedInTheSession,
            is_all_workspaces_archived: isAllWorkspacesArchived,
            is_onboarding_completed: isOnboardingCompleted,
            is_first_user_onboarding_completed: isFirstUserOnboardingCompleted,
            consulation_banner_date,
          }) => {
            if (!isFirstUserOnboardingCompleted) {
              const subpath = getSubpath();
              const path = subpath ? `${subpath}/setup` : '/setup';
              window.location.href = path;
            } else if (!isOnboardingCompleted) {
              // const subpath = getSubpath();
              // const path = subpath ? `${subpath}/confirm` : '/confirm';
              // window.location.href
            }

            if (window.location.pathname !== `${getSubpath() ?? ''}/switch-workspace`) {
              if (isAllWorkspacesArchived) {
                /* All workspaces are archived by the super admin. lets logout the user */
                sessionService.logout();
              } else {
                updateCurrentSession({
                  noWorkspaceAttachedInTheSession,
                  authentication_status: true,
                  consulation_banner_date,
                });
                if (noWorkspaceAttachedInTheSession) {
                  /*
                    User just signed up after the invite flow and doesn't have any active workspace.
                    - From useSessionManagement hook we will be redirecting the user to an error page.
                  */
                  return;
                }
                /*CASE-2*/
                authorizeUserAndHandleErrors(current_organization_id, current_organization_slug);
              }
            } else {
              updateCurrentSession({
                current_organization_id,
              });
            }
          }
        )
        .catch((error) => {
          const isDesiredStatusCode =
            (error && error?.data?.statusCode == 422) ||
            error?.data?.statusCode == 404 ||
            error?.data?.statusCode == 400;
          if (isDesiredStatusCode) {
            const isWorkspaceArchived =
              error?.data?.statusCode == 400 && error?.data?.message == ERROR_TYPES.WORKSPACE_ARCHIVED;
            if (isWorkspaceArchived) {
              const subpath = getSubpath();
              let path = subpath ? `${subpath}/switch-workspace` : `/switch-workspace`;
              if (appId) {
                path = 'app-url-archived';
              } else {
                path += '-archived';
              }
              window.location = path;
            } else if (appId) {
              /* If the user is trying to load the app viewer and the app id / slug not found */
              redirectToErrorPage(ERROR_TYPES.INVALID);
            } else if (error?.data?.statusCode == 422) {
              if (isThisWorkspaceLoginPage()) {
                return redirectToErrorPage(ERROR_TYPES.INVALID);
              }
              redirectToErrorPage(ERROR_TYPES.UNKNOWN);
            } else {
              const subpath = getSubpath();
              window.location = subpath ? `${subpath}${'/switch-workspace'}` : '/switch-workspace';
            }
          }
          if (!isApplicationsPath) {
            /* CASE-3 */
            updateCurrentSession({
              authentication_status: false,
            });
          } else if (isApplicationsPath) {
            /* CASE-4 */
            updateCurrentSession({
              authentication_failed: true,
              load_app: true,
            });
          }
        });
    }
  });
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
    'app-url-archived',
    'error',
  ];

  const subpath = getSubpath();
  const subpathArray = subpath ? subpath.split('/').filter((path) => path != '') : [];
  const pathnames = pathnameToArray();
  if (pathnames.includes('login') && pathnames.includes('sso')) {
    return true;
  }
  const checkPath = () => existedPaths.find((path) => pathnames[subpath ? subpathArray.length : 0] === path);
  return pathnames?.length > 0 ? (checkPath() ? true : false) : false;
};

const isThisWorkspaceLoginPage = (justLoginPage = false) => {
  const subpath = getSubpath();
  const pathname = location.pathname.replace(subpath, '');
  const pathnames = pathname.split('/').filter((path) => path !== '');
  return (justLoginPage && pathnames[0] === 'login') || (pathnames.length === 2 && pathnames[0] === 'login');
};

export const updateCurrentSession = (newSession) => {
  const currentSession = authenticationService.currentSessionValue;
  // console.log('currentSession', currentSession);

  authenticationService.updateCurrentSession({ ...currentSession, ...newSession });
};

/*  
  Cases / Steps
    CASE-1: If the user is authorized, they will be directed to the loading page. (Check: If the token is authorized for the specific workspace ID.)
    CASE-2: If not, the function checks if the user is authenticated for a different workspace. If so, it attempts to switch workspaces.
    CASE-3: If CASE-2 fails (indicating the need to log in to the workspace or having an invalid session), the user is directed to the workspace login page.
    CASE-4: During the execution of CASE-2, if the user has a valid session but encounters errors such as an incorrect workspace ID or non-existent workspace, they will be directed to the switch-workspace page.
*/
export const authorizeUserAndHandleErrors = (workspace_id, workspace_slug, callback = null) => {
  const subpath = getSubpath();
  //initial session details
  updateCurrentSession({
    ...(workspace_id && { current_organization_id: workspace_id }),
  });

  authenticationService
    .authorize()
    .then((data) => {
      useStore.getState().setUser({
        email: data.current_user.email,
        firstName: data.current_user.first_name,
        lastName: data.current_user.last_name,
        id: data.current_user.id,
        avatarId: data.current_user.avatar_id,
        groups: data.group_permissions.map((group) => group.group),
      });

      useStore.getState().setOrganization({
        currentOrganizationId: data.current_organization_id,
      });
      /* CASE-1 */
      const { current_organization_name } = data;
      /* add the user details like permission and user previlliage details to the subject */
      updateCurrentSession({
        ...data,
        current_organization_name,
        load_app: true,
        noWorkspaceAttachedInTheSession: false,
      });
      if (callback) callback();
    })
    .catch((error) => {
      const extraErrorData = safelyParseJSON(error?.data?.message);
      if (extraErrorData) {
        const { errorType } = extraErrorData;
        /* 
         if user doesn't have any proper access to the workspace. logging out from the account. user can re-login through the instance login page if there is any active workspace 
        */
        switch (errorType) {
          case 'USER_ARCHIVED_IN_ORGANIZATION':
          case 'USER_INVITED_IN_ORGANIZATION':
            /* logout */
            sessionService.logout();
            return;
          default:
            break;
        }
      } else {
        if (error && error?.data?.statusCode === 401) {
          /* CASE-2 */
          /* if the auth token didn't contain workspace-id, try switch workspace fn */

          const unauthorized_organization_id = workspace_id;
          const unauthorized_organization_slug = workspace_slug;

          /* get current session's workspace id */
          sessionService
            .validateSession()
            .then(({ current_organization_id, ...restSessionData }) => {
              /* change current organization id to valid one [current logged in organization] */
              updateCurrentSession({
                current_organization_id,
              });
              return organizationService
                .switchOrganization(unauthorized_organization_id)
                .then(() => {
                  authorizeUserAndHandleErrors(unauthorized_organization_id);
                })
                .catch((error) => {
                  const { current_organization_name, current_organization_slug } = restSessionData;
                  updateCurrentSession({
                    current_organization_name,
                    current_organization_slug,
                    load_app: true,
                  });

                  if (!isThisWorkspaceLoginPage())
                    return (window.location = `${
                      subpath ?? ''
                    }/login/${unauthorized_organization_slug}?redirectTo=${getRedirectToWithParams()}`);
                  const statusCode = error?.data.statusCode;
                  if (statusCode === 401) {
                    updateCurrentSession({
                      isOrgSwitchingFailed: true,
                    });
                  }
                });
            })
            /* CASE-3 */
            .catch(() => sessionService.logout());
        } else if ((error && error?.data?.statusCode == 422) || error?.data?.statusCode == 404) {
          /* CASE-4 */
          window.location = subpath ? `${subpath}${'/switch-workspace'}` : '/switch-workspace';
        } else {
          /* Any other errors, leave the user on current page [Let the page or private-route component take care] */
          if (!isThisWorkspaceLoginPage() && !isThisWorkspaceLoginPage(true))
            updateCurrentSession({
              authentication_status: false,
            });
        }
      }
    });
};
