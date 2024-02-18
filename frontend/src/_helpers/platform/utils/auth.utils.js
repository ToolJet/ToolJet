import { authorizeUserAndHandleErrors, updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { getCookie } from '@/_helpers/cookie';
import { eraseRedirectUrl } from '@/_helpers/routes';

export const onInvitedUserSignUpSuccess = (response, navigate) => {
  const { organizationInviteUrl, ...currentUser } = response;
  updateCurrentSession({
    noWorkspaceAttachedInTheSession: true,
    currentUser,
  });
  navigate(organizationInviteUrl);
};

export const onLoginSuccess = (userResponse, navigate, redirectTo = null) => {
  const {
    current_organization_id,
    current_organization_slug,
    no_workspace_attached_in_the_session: noWorkspaceAttachedInTheSession,
  } = userResponse;
  /* reset the authentication status and loggingIn status */
  updateCurrentSession({
    ...userResponse,
    authentication_status: null,
    noWorkspaceAttachedInTheSession,
    isUserLoggingIn: true,
  });
  const redirectPath = redirectTo || getCookie('redirectPath');
  eraseRedirectUrl();
  if (!noWorkspaceAttachedInTheSession) {
    authorizeUserAndHandleErrors(current_organization_id, current_organization_slug, () => {
      updateCurrentSession({
        isUserLoggingIn: false,
      });
      navigate(redirectPath);
    });
  } else {
    navigate(redirectPath);
  }
};
