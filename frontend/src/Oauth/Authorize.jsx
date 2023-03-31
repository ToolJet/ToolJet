import React, { useEffect, useState } from 'react';
import useRouter from '@/_hooks/use-router';
import { authenticationService } from '@/_services';
import { Redirect } from 'react-router-dom';
import Configs from './Configs/Config.json';
import { RedirectLoader } from '../_components';
import posthog from 'posthog-js';

export function Authorize() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const organizationId = authenticationService.getLoginOrganizationId();

  useEffect(() => {
    !organizationId && authenticationService.clearUser();
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
    }

    authenticationService
      .signInViaOAuth(router.query.configId, router.query.origin, authParams)
      .then(({ redirect_url, id, organization_id, current_organization_id }) => {
        if (redirect_url) {
          localStorage.setItem('ph-sso-type', router.query.origin); //for posthog event
          window.location.href = redirect_url;
          return;
        }
        const event = `${redirect_url ? 'signup' : 'signin'}_${
          router.query.origin === 'google' ? 'google' : router.query.origin === 'openid' ? 'openid' : 'github'
        }`;
        posthog.capture(event, {
          user_id: id,
          workspace_id: organization_id || current_organization_id,
        });
        setSuccess(true);
      })
      .catch((err) => setError(`${configs.name} login failed - ${err?.error || 'something went wrong'}`));
    // Disabled for useEffect not being called for updation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <RedirectLoader origin={Configs[router.query.origin] ? router.query.origin : 'unknown'} />
      {(success || error) && (
        <Redirect
          to={{
            pathname: `/login${error && organizationId ? `/${organizationId}` : ''}`,
            state: { errorMessage: error && error },
          }}
        />
      )}
    </div>
  );
}
