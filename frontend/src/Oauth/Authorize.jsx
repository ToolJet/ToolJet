import React, { useEffect, useState } from 'react';
import useRouter from '@/_hooks/use-router';
import { authenticationService } from '@/_services';
import { Navigate } from 'react-router-dom';
import Configs from './Configs/Config.json';
import { RedirectLoader } from '@/_components';
import { appendWorkspaceId } from '@/_helpers/utils';

export function Authorize() {
  const [error, setError] = useState('');
  const router = useRouter();

  const organizationId = authenticationService.getLoginOrganizationId();

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
    }

    let subsciption;
    if (organizationId) {
      subsciption = authenticationService.currentSession.subscribe((session) => {
        //logged users should send tj-workspace-id when login to unauthorized workspace
        if (session.authentication_status === false || session.current_organization_id) {
          signIn(authParams, configs);
        }
      });
    } else {
      signIn(authParams, configs);
    }

    () => subsciption && subsciption.unsubscribe();
    // Disabled for useEffect not being called for updation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = (authParams, configs) => {
    authenticationService
      .signInViaOAuth(router.query.configId, router.query.origin, authParams)
      .then(({ redirect_url, current_organization_id }) => {
        if (redirect_url) {
          window.location.href = redirect_url;
          return;
        }
        /*for workspace login / normal login response will contain the next organization_id user want to login*/
        if (current_organization_id) {
          window.location = appendWorkspaceId(current_organization_id, '/:workspaceId');
        }
      })
      .catch((err) => setError(`${configs.name} login failed - ${err?.error || 'something went wrong'}`));
  };

  return (
    <div>
      <RedirectLoader origin={Configs[router.query.origin] ? router.query.origin : 'unknown'} />
      {error && (
        <Navigate
          replace
          to={`/login${error && organizationId ? `/${organizationId}` : ''}`}
          state={{ errorMessage: error && error }}
        />
      )}
    </div>
  );
}
