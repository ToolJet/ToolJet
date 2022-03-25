import React, { useEffect, useState } from 'react';
import useRouter from '@/_hooks/use-router';
import { authenticationService } from '@/_services';
import { Redirect } from 'react-router-dom';
import Configs from './Configs/Config.json';

export function Authorize() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    authenticationService.clearUser();
    const errorMessage = router.query.error_description || router.query.error;

    if (errorMessage) {
      return setError(errorMessage);
    }

    if (!(router.query.origin && Configs[router.query.origin])) {
      return setError('Login failed');
    }

    const configs = Configs[router.query.origin];
    let authParams = {};

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
      .signInViaOAuth(router.query.configId, authParams)
      .then(() => setSuccess(true))
      .catch((err) => setError(`${configs.name} login failed - ${err?.error ? err?.error : ''}`));
    // Disabled for useEffect not being called for updation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container-tight auth-main px-lg-4">
      <div className="horizontal-line"></div>
      <div className="row">
        <div className="col-4 sso-ico d-flex">
          <div>
            <img
              src={`/assets/images/sso-buttons/${Configs[router.query.origin] ? router.query.origin : 'unknown'}.svg`}
            />
          </div>
        </div>
        <div className="col-4 text-center">
          <svg className="button" expanded="true">
            <circle cx="50%" cy="50%" r="35%" stroke="#8f8f8f" strokeWidth="10%" fill="#ffffff" />
            <circle className="innerCircle" cx="50%" cy="50%" r="25%" fill="#8f8f8f">
              <animate attributeName="r" begin="0s" dur="1s" repeatCount="indefinite" from="5%" to="25%" />
            </circle>
          </svg>
        </div>
        <div className="col-4 text-right">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="#ffffff" />
            <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" />
            <circle cx="12" cy="11" r="1" />
            <line x1="12" y1="12" x2="12" y2="14.5" />
          </svg>
        </div>
      </div>
      {(success || error) && (
        <Redirect
          to={{
            pathname: '/login',
            state: { errorMessage: error && error },
          }}
        />
      )}
    </div>
  );
}
