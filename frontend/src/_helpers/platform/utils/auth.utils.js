import { authorizeUserAndHandleErrors, updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { getCookie } from '@/_helpers/cookie';
import { eraseRedirectUrl, getRedirectURL } from '@/_helpers/routes';

export const onInvitedUserSignUpSuccess = (response, navigate) => {
  const { organizationInviteUrl, ...currentUser } = response;
  updateCurrentSession({
    noWorkspaceAttachedInTheSession: currentUser?.current_organization_id ? false : true,
    currentUser,
  });
  navigate(organizationInviteUrl);
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
  const path = getRedirectURL(redirectPath);
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
      authorizeUserAndHandleErrors(current_organization_id, current_organization_slug, () => {
        updateCurrentSession({
          isUserLoggingIn: false,
        });
        navigate(path);
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
