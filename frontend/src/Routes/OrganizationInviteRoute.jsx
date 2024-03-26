import React, { useEffect, useState } from 'react';
import { RouteLoader } from './RouteLoader';
import { useLocation, useParams } from 'react-router-dom';
import { authenticationService } from '@/_services';
import { authorizeUserAndHandleErrors, updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { toast } from 'react-hot-toast';
import { LinkExpiredPage } from '@/ConfirmationPage/LinkExpiredPage';

export const OrganizationInviteRoute = ({ children, isOrgazanizationOnlyInvite, navigate }) => {
  /* Needed to pass invite token to signup page if the user doesn't exist */
  const [isLoading, setLoading] = useState(true);
  const [invalidLink, setLinkStatus] = useState(false);
  const params = useParams();
  const location = useLocation();
  const organizationToken = params.organizationToken || (isOrgazanizationOnlyInvite ? params.token : null);
  const accountToken = !isOrgazanizationOnlyInvite ? params.token : null;
  const [extraProps, setExtraProps] = useState({});

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
      } = invitedUserSession;
      /* 
        We should only run the authorization against the session if the user has active workspace 
      */
      setExtraProps({
        invitedOrganizationName,
        email,
        name,
      });
      /* User has active account. but still using the same invite. redirect to the org-invite URL */
      if (organization_invite_url) navigate(organization_invite_url);
      if (!noWorkspaceAttachedInTheSession) {
        authorizeUserAndHandleErrors(current_organization_id, current_organization_slug, () => {
          setLoading(false);
        });
      } else {
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
            toast.error(errorMessage);
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
              /* Wrong invitation URL (invalid tokens) */
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

  if (invalidLink) return <LinkExpiredPage />;

  const clonedElement = React.cloneElement(children || <></>, extraProps);
  return <RouteLoader isLoading={isLoading}>{clonedElement}</RouteLoader>;
};
