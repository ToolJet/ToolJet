import React, { useEffect, useState } from 'react';
import useRouter from '@/_hooks/use-router';
import { aiOnboardingService, appService, authenticationService } from '@/_services';
import { Navigate } from 'react-router-dom';
import Configs from './Configs/Config.json';
import { getCookie } from '@/_helpers';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import { onInvitedUserSignUpSuccess, onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { fetchEdition } from '@/modules/common/helpers/utils';

export function Authorize({ navigate }) {
  const [error, setError] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState();
  const router = useRouter();
  const organizationId = authenticationService.getLoginOrganizationId();
  const organizationSlug = authenticationService.getLoginOrganizationSlug();
  const redirectUrl = getCookie('redirectPath');
  const signupOrganizationSlug = authenticationService.getSignupOrganizationSlug();
  const inviteFlowIdentifier = authenticationService.getInviteFlowIndetifier();

  useEffect(() => {
    const errorMessage = router.query.error_description || router.query.error;

    if (errorMessage) {
      return setError(errorMessage);
    }

    if (!(router.query.origin && Configs[router.query.origin])) {
      return setError('Login failed');
    }

    const configs = Configs[router.query.origin];
    const authParams = {};

    if (configs.responseType === 'hash') {
      if (!window.location.hash) {
        return setError('Login failed');
      }
      const params = new Proxy(new URLSearchParams(window.location.hash.substr(1)), {
        get: (searchParams, prop) => searchParams.get(prop),
      });
      authParams.token = params[configs.params.token];
      authParams.state = params[configs.params.state];
    } else {
      authParams.token = router.query[configs.params.token];
      authParams.state = router.query[configs.params.state];
      authParams.iss = router.query[configs.params.iss];
    }

    /* If the params has SAMLResponse the SAML auth is success */
    if (router.query.saml_response_id) {
      authParams.samlResponseId = router.query.saml_response_id;
    }

    let subsciption;
    if (organizationId) {
      subsciption = authenticationService.currentSession.subscribe((session) => {
        //logged users should send tj-workspace-id when login to unauthorized workspace
        if (session.authentication_status === false || session.current_organization_id) {
          signIn(authParams, configs);
          subsciption.unsubscribe();
        }
      });
    } else {
      signIn(authParams, configs);
    }

    // Disabled for useEffect not being called for updation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = (authParams, configs) => {
    const handleAuthResponse = ({ redirect_url, ...restResponse }) => {
      // const { organization_id, current_organization_id, email } = restResponse;

      // const event = `${redirect_url ? 'signup' : 'signin'}_${
      //   router.query.origin === 'google' ? 'google' : router.query.origin === 'openid' ? 'openid' : 'github'
      // }`;
      // initPosthog(restResponse);
      // posthog.capture(event, {
      //   email,
      //   workspace_id: organization_id || current_organization_id,
      // });

      /* Precaution code to not take any previous values since there are two entry point to the app now (site and tooljet-app) */
      authenticationService.deleteAllSSOCookies();
      if (redirect_url) {
        localStorage.setItem('ph-sso-type', router.query.origin); //for posthog event
        window.location.href = redirect_url;
        return;
      }
      if (restResponse?.organizationInviteUrl) onInvitedUserSignUpSuccess(restResponse, navigate);
      else {
        updateCurrentSession({
          isUserLoggingIn: true,
        });
        onLoginSuccess(restResponse, navigate);
      }
      // initPosthog({ redirect_url, ...restResponse });
      // posthog.capture(event, {
      //   email,
      //   workspace_id: organization_id || current_organization_id,
      // });
    };

    const handleAuthError = (err) => {
      console.log('SSO login error', err);
      const details = err?.data?.message;
      const inviteeEmail = details?.inviteeEmail;
      if (inviteeEmail) setInviteeEmail(inviteeEmail);
      let errorMessage = '';
      if (details?.error && details?.data) {
        errorMessage = `${details.error} ${details.data.join(', ')}`;
      }
      const errMessage = errorMessage || details?.error || details?.message || err?.error || 'something went wrong';
      if (!inviteeEmail && inviteFlowIdentifier) {
        /* Some unexpected error happened from the provider side. Need to retreive email to continue */
        appService
          .getInviteeDetails(inviteFlowIdentifier)
          .then((response) => {
            setInviteeEmail(response.email);
          })
          .catch(() => {
            console.error('Error while fetching invitee details');
          })
          .finally(() => {
            setError(`${configs.name} login failed - ${errMessage}`);
          });
      } else {
        setError(`${configs.name} login failed - ${errMessage}`);
      }
    };

    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    // FIXME: later create different component/login for cloud and ce/ee
    const edition = fetchEdition();
    if (edition === 'cloud') {
      const isAiOnboarding =
        hashParams.get('state')?.includes('tj_api_source=ai_onboarding') ||
        router.query.state?.includes('tj_api_source=ai_onboarding');
      const isNormalFlow = (organizationId || signupOrganizationSlug || inviteFlowIdentifier) && !isAiOnboarding;
      if (isNormalFlow) {
        /* For workspace signup and signin */
        authenticationService
          .signInViaOAuth(router.query.configId, router.query.origin, authParams)
          .then(handleAuthResponse)
          .catch(handleAuthError);
      } else {
        /* For ai onboarding */
        aiOnboardingService
          .signInViaOAuth(router.query.origin, authParams)
          .then(handleAuthResponse)
          .catch(handleAuthError);
      }
      return;
    } else {
      authenticationService
        .signInViaOAuth(router.query.configId, router.query.origin, authParams)
        .then(handleAuthResponse)
        .catch(handleAuthError);
    }
  };

  const baseRoute = signupOrganizationSlug ? '/signup' : '/login';
  const slug = signupOrganizationSlug ? signupOrganizationSlug : organizationSlug;
  const errorURL = `${baseRoute}${error && slug ? `/${slug}` : '/'}${
    !signupOrganizationSlug && redirectUrl ? `?redirectTo=${redirectUrl}` : ''
  }`;
  return (
    <div>
      <TJLoader />
      {error && (
        <Navigate
          replace
          to={errorURL}
          state={{
            errorMessage: error && error,
            ...(inviteFlowIdentifier ? { organizationToken: inviteFlowIdentifier, inviteeEmail } : {}),
          }}
        />
      )}
    </div>
  );
}
