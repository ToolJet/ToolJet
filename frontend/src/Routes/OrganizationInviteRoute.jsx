import React, { useEffect, useState } from 'react';
import { RouteLoader } from './RouteLoader';
import { useLocation, useParams } from 'react-router-dom';
import { appService, authenticationService } from '@/_services';
import { authorizeUserAndHandleErrors, updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { toast } from 'react-hot-toast';
import { LinkExpiredPage } from '@/ConfirmationPage/LinkExpiredPage';
import { onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';
import { onboarding } from '@/modules/onboarding/services/onboarding.service';
export const OrganizationInviteRoute = ({ children, isOrgazanizationOnlyInvite, navigate }) => {
  /* Needed to pass invite token to signup page if the user doesn't exist */
  const [isLoading, setLoading] = useState(true);
  const [invalidLink, setLinkStatus] = useState(false);
  const params = useParams();
  const location = useLocation();
  const organizationToken = params.organizationToken || (isOrgazanizationOnlyInvite ? params.token : null);
  const accountToken = !isOrgazanizationOnlyInvite ? params.token : null;
  const [extraProps, setExtraProps] = useState({});
  const searchParams = new URLSearchParams(location?.search);
  const redirectTo = searchParams.get('redirectTo');

  useEffect(() => {
    getInvitedUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getInvitedUserSession = async () => {
    try {
      const invitedUserSession = await authenticationService.getInvitedUserSession({ organizationToken, accountToken });
      const {
        current_organization_id,
        current_organization_slug,
        no_workspace_attached_in_the_session: noWorkspaceAttachedInTheSession,
        invited_organization_name: invitedOrganizationName,
        email,
        name,
        organization_invite_url,
        is_workspace_sign_up_invite,
        source,
        organization_user_source,
        no_active_workspaces: noActiveWorkspaces,
      } = invitedUserSession;
      /* 
        We should only run the authorization against the session if the user has active workspace 
      */
      setExtraProps({
        invitedOrganizationName,
        email,
        name,
      });
      if (source === 'workspace_signup' || organization_user_source === 'signup') {
        acceptInvite(accountToken, organizationToken, navigate, source, redirectTo);
        return;
      }
      if (is_workspace_sign_up_invite) {
        setLoading(false);
        return;
      }
      /* User has active account. but still using the same invite. redirect to the org-invite URL */
      if (organization_invite_url) navigate(organization_invite_url);
      const currentSession = authenticationService.currentSessionValue;
      if (!noWorkspaceAttachedInTheSession && !noActiveWorkspaces && !currentSession.isInviteFlw) {
        authorizeUserAndHandleErrors(current_organization_id, current_organization_slug, () => {
          setLoading(false);
        });
      } else {
        /* Reset store */
        updateCurrentSession({
          isInviteFlw: false,
        });
        setLoading(false);
      }
    } catch (errorObj) {
      const errorStatus = errorObj?.data?.statusCode;
      const errorMessage = errorObj?.error?.error || 'Something went wrong';
      switch (errorStatus) {
        case 406: {
          const isAccountNotActivated = errorObj?.error?.isAccountNotActivated;
          const redirectPath = errorObj?.error?.redirectPath;
          if (isAccountNotActivated && redirectPath) {
            const inviteeEmail = errorObj?.error?.inviteeEmail;
            /* Account is not activated yet. Logout and redirect to signup page */
            updateCurrentSession({
              authentication_status: false,
            });
            navigate(redirectPath, {
              state: { organizationToken, inviteeEmail },
            });
          }
          break;
        }
        case 401:
        case 403: {
          /* 
            No valid Session / Wrong user session.
          */
          const isInvitationTokenAndUserMismatch = errorObj?.error?.isInvitationTokenAndUserMismatch;
          if (isInvitationTokenAndUserMismatch) {
            /* logout and redirect to login page */
            navigate('/error/invalid-invite-session');
          } else {
            const invitedOrganizationSlug = errorObj?.error?.invitedOrganizationSlug;
            /* Redirect to the login page. No session at all */
            redirectToLoginPage(invitedOrganizationSlug);
          }
          break;
        }
        case 400: {
          const isInvalidInvitationUrl = errorObj?.error?.isInvalidInvitationUrl;
          const isWorkspaceArchived = errorObj?.error?.isWorkspaceArchived;
          const accountIsNotActivatedYet = errorObj?.error?.accountIsNotActivatedYet;

          switch (true) {
            case accountIsNotActivatedYet: {
              navigate('/error/user-is-not-activated');
              break;
            }
            case isWorkspaceArchived: {
              navigate('/error/invited-workspace-archived');
              break;
            }
            case isInvalidInvitationUrl: {
              /* Wring invitation URL (invalid tokens) */
              setLinkStatus(isInvalidInvitationUrl);
              break;
            }
            default: {
              toast.error(errorMessage);
              break;
            }
          }

          break;
        }
        default: {
          toast.error(errorMessage);
          break;
        }
      }
    }
  };

  const redirectToLoginPage = (invitedOrganizationSlug) => {
    updateCurrentSession({
      authentication_status: false,
    });
    const redirectTo = `${location.pathname}${location.search}`;
    const pathname = `/login${invitedOrganizationSlug ? `/${invitedOrganizationSlug}` : ''}`;
    navigate(
      {
        pathname,
        search: `?redirectTo=${redirectTo}`,
        state: { from: location },
      },
      { replace: true }
    );
  };

  const acceptInvite = (token, organizationToken, navigate, source, redirectTo) => {
    if (token && organizationToken) {
      onboarding({
        token,
        organizationToken,
        source,
      })
        .then((user) => {
          onLoginSuccess(user, navigate, redirectTo);
        })
        .catch((res) => {
          toast.error(res.error || 'Something went wrong', {
            id: 'toast-login-auth-error',
            position: 'top-center',
          });
        });
    } else {
      appService
        .acceptInvite({
          token: organizationToken,
        })
        .then((data) => {
          toast.success(`Added to the workspace successfully.`);
          updateCurrentSession({
            isUserLoggingIn: true,
          });
          onLoginSuccess(data, navigate);
        })
        .catch(() => {
          toast.error('Error while setting up your account.', { position: 'top-center' });
        });
    }
  };

  if (invalidLink) return <LinkExpiredPage />;

  const clonedElement = React.cloneElement(children || <></>, extraProps);
  return <RouteLoader isLoading={isLoading}>{clonedElement}</RouteLoader>;
};
