import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';

export const onInvitedUserSignUpSuccess = (response, navigate) => {
  const { organizationInviteUrl, ...currentUser } = response;
  updateCurrentSession({
    noWorkspaceAttachedInTheSession: true,
    currentUser,
  });
  navigate(organizationInviteUrl);
};
