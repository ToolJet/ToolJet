import React, { useEffect, useState } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';
import { getRedirectURL, pathnameToArray } from '@/_helpers/routes';
import { authenticationService } from '@/_services';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export const AuthRoute = ({ children }) => {
  const { isLoading, session, isValidSession, isInvalidSession, setLoading } = useSessionManagement({
    disableInValidSessionCallback: true,
    disableValidSessionCallback: true,
    stopProcess: true,
  });
  const { id, isUserLoggingIn } = session;
  const [isGettingConfigs, setGettingConfig] = useState(true);
  const instanceDefaultConfigs = {
    form: {
      enable_sign_up: true,
      enabled: true,
    },
  };
  const [configs, setConfigs] = useState(instanceDefaultConfigs);
  const [organizationId, setOrganizationId] = useState();
  const [currentOrganizationName, setOrganizationName] = useState();
  const params = useParams();
  const { organizationId: organizationSlug } = params;
  const location = useLocation();
  const isSignUpRoute = location.pathname.startsWith('/signup');
  const navigate = useNavigate();

  useEffect(
    () => initialize(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.pathname]
  );

  useEffect(
    () => onValidSession(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isGettingConfigs, isValidSession, id]
  );

  useEffect(() => {
    const isComingFromPasswordReset = location?.state?.from === '/reset-password';
    if ((isInvalidSession || isComingFromPasswordReset) && !isGettingConfigs) setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInvalidSession, isGettingConfigs]);

  const initialize = () => {
    const isSuperAdminLogin = location.pathname.startsWith('/login/super-admin');
    const shouldGetConfigs = !isSuperAdminLogin;
    authenticationService.deleteAllAuthCookies();
    if (shouldGetConfigs) {
      fetchOrganizationDetails();
    } else {
      setGettingConfig(false);
    }
  };

  const fetchOrganizationDetails = () => {
    authenticationService.getOrganizationConfigs(organizationSlug).then(
      (configs) => {
        setOrganizationId(configs.id);
        setConfigs(configs);
        setGettingConfig(false);
      },
      async (response) => {
        if (response.data.statusCode !== 404 && response.data.statusCode !== 422) {
          return navigate({
            pathname: '/',
            state: { errorMessage: 'Error while login, please try again' },
          });
        }

        /*
		   If there is no organization found for single organization setup
    	   show form to sign up
           redirected here for self hosted version
		  */
        response.data.statusCode !== 422 && !organizationSlug && navigate('/setup');
        // if wrong workspace id then show workspace-switching page :: Only For Login
        if (!isSignUpRoute) {
          if (response.data.statusCode === 422 || (response.data.statusCode === 404 && organizationSlug)) {
            try {
              const session = await authenticationService.validateSession();
              const { current_organization_id } = session;
              authenticationService.updateCurrentSession({
                current_organization_id,
              });
              navigate('/switch-workspace');
            } catch (error) {
              if (pathnameToArray()[0] !== 'login') navigate('/login');
            }
          }
        }
        setGettingConfig(false);
      }
    );
  };

  const onValidSession = () => {
    if (isValidSession && !isGettingConfigs && !isUserLoggingIn) {
      const {
        current_organization_name,
        current_organization_id,
        authentication_status,
        noWorkspaceAttachedInTheSession,
      } = session;
      if (authentication_status && noWorkspaceAttachedInTheSession) navigate('/error/no-active-workspace');
      if (isValidSession || id) {
        setOrganizationName(current_organization_name);
        const shouldRedirect = !organizationSlug || (!isGettingConfigs && current_organization_id === organizationId);
        if (shouldRedirect || isSignUpRoute) {
          const redirectPath = getRedirectURL('/');
          navigate(redirectPath);
        }
      }
      setLoading(false);
    }
  };

  let clonedElement;
  if (!isLoading) {
    const constructProps = {
      currentOrganizationName,
      configs,
      organizationId,
    };
    clonedElement = React.cloneElement(children, constructProps);
  }
  return <RouteLoader isLoading={isLoading}>{clonedElement}</RouteLoader>;
};
