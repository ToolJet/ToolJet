import { authorizeUserAndHandleErrors, updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { getCookie } from '@/_helpers/cookie';
import { eraseRedirectUrl, getRedirectURL } from '@/_helpers/routes';
import { sessionService } from '@/_services';

export const onInvitedUserSignUpSuccess = (response, navigate) => {
  const { organizationInviteUrl, ...currentUser } = response;
  updateCurrentSession({
    noWorkspaceAttachedInTheSession: currentUser?.current_organization_id ? false : true,
    currentUser,
  });
  if (organizationInviteUrl) {
    navigate(organizationInviteUrl);
  } else {
    // User was directly activated into the workspace (no pending org invite step)
    navigate(currentUser?.current_organization_slug ? `/${currentUser.current_organization_slug}` : '/');
  }
};

export const onLoginSuccess = (userResponse, navigate, redirectTo = null) => {
  const {
    current_organization_id,
    current_organization_slug,
    no_workspace_attached_in_the_session: noWorkspaceAttachedInTheSession,
    is_current_organization_archived: isCurrentOrganizationArchived,
    no_active_workspaces: noActiveWorkspaces,
  } = userResponse;
  /* reset the authentication status and loggingIn status */
  const { email, id, first_name, last_name, organization_id, organization, ...restResponse } = userResponse;
  const current_user = { email, id, first_name, last_name, organization_id, organization };
  const isInviteFlw = userResponse?.redirect_to?.includes(`/organization-invitations/`);

  updateCurrentSession({
    current_user,
    ...restResponse,
    authentication_status: null,
    noWorkspaceAttachedInTheSession,
    isCurrentOrganizationArchived,
    isOrgSwitchingFailed: null,
    isInviteFlw,
  });

  const redirectPath = redirectTo || getCookie('redirectPath');
  const path = getRedirectURL(redirectPath, true);
  const archivedCase = isCurrentOrganizationArchived && !noActiveWorkspaces;

  eraseRedirectUrl();
  switch (true) {
    case archivedCase: {
      navigate('/switch-workspace-archived');
      break;
    }
    case isInviteFlw:
    case noActiveWorkspaces:
    case noWorkspaceAttachedInTheSession: {
      navigate(path);
      break;
    }
    default: {
      sessionService
        .validateSession(null, current_organization_slug || current_organization_id)
        .then(({ ai_cookies }) => {
          // Update AI cookies in the session for cloud
          updateCurrentSession({ ai_cookies });
          authorizeUserAndHandleErrors(
            current_organization_id,
            current_organization_slug,
            () => {
              updateCurrentSession({
                isUserLoggingIn: false,
              });
              navigate(path);
            },
            path
          );
        });
    }
  }
};

export const extractErrorObj = (errorResponse) => {
  const errorDetails = errorResponse?.data?.message;
  const message =
    errorDetails?.message?.message || errorDetails?.error || errorResponse?.error || 'something went wrong';
  return { ...errorDetails, message };
};

export const getPostSignupRedirectPath = ({ redirectTo, organizationSlug }) => {
  const hasRedirect = Boolean(redirectTo);
  const hasSlug = Boolean(organizationSlug);

  const isApplicationRoute = /^\/applications\//.test(redirectTo || '');

  if (hasRedirect) {
    if (isApplicationRoute) {
      return redirectTo;
    }

    // Default: prepend workspace slug
    if (hasSlug) {
      return `/${organizationSlug}${redirectTo.startsWith('/') ? '' : '/'}${redirectTo}`;
    }

    return redirectTo;
  }

  // No redirectTo
  if (hasSlug) {
    return `/${organizationSlug}`;
  }

  return '/home';
};
