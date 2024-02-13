import React, { useEffect, useState } from 'react';
import { RouteLoader } from './RouteLoader';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { authenticationService } from '@/_services';
import { authorizeUserAndHandleErrors } from '@/_helpers/authorizeWorkspace';
import { toast } from 'react-hot-toast';
import { LinkExpiredPage } from '@/ConfirmationPage/LinkExpiredPage';

export const OrganizationInviteRoute = ({ children, isOrgazanizationOnlyInvite }) => {
  /* Needed to pass invite token to signup page if the user doesn't exist */
  const [isLoading, setLoading] = useState(true);
  const [invalidLink, setLinkStatus] = useState(false);
  const params = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const organizationId = queryParams.get('oid');
  const navigate = useNavigate();
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
      } = invitedUserSession;
      /* 
        We should only run the authorization against the session if the user has active workspace 
      */
      setExtraProps({
        invitedOrganizationName,
        email,
        name,
      });
      if (!noWorkspaceAttachedInTheSession)
        authorizeUserAndHandleErrors(current_organization_id, current_organization_slug);
    } catch (errorObj) {
      const errorStatus = errorObj?.data?.statusCode;
      const errorMessage = errorObj?.error?.error || 'Something went wrong';
      switch (errorStatus) {
        case 406: {
          const isAccountNotActivated = errorObj?.error?.isAccountNotActivated;
          if (isAccountNotActivated) {
            /* Account is not activated yet. Logout and redirect to signup page */
            toast.error(errorMessage);
            navigate(`/signup/${organizationId}`, {
              state: { organizationToken },
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
            toast.error(errorMessage);
            navigate('/error/invalid-invite-session');
          } else {
            /* Redirect to the login page. No session at all */
            redirectToInstanceLoginPage();
          }
          break;
        }
        case 400: {
          const isInvalidInvitationUrl = errorObj?.error?.isInvalidInvitationUrl;
          setLinkStatus(isInvalidInvitationUrl);
          break;
        }
        default: {
          toast.error(errorMessage);
          break;
        }
      }
    }
    setLoading(false);
  };

  const redirectToInstanceLoginPage = () => {
    const redirectTo = `${location.pathname}${location.search}`;
    navigate(
      {
        pathname: `/login`,
        search: `?redirectTo=${redirectTo}`,
        state: { from: location },
      },
      { replace: true }
    );
  };

  if (invalidLink) return <LinkExpiredPage />;

  const clonedElement = React.cloneElement(children, extraProps);
  return <RouteLoader isLoading={isLoading}>{clonedElement}</RouteLoader>;
};
