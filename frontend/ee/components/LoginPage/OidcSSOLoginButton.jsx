import config from 'config';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Spinner from '@/_ui/Spinner';

export default function OIDCSSOLoginButton({ configId, configs, text }) {
  const [isLoading, setLoading] = useState(false);

  const doLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    fetch(`${config.apiUrl}/oauth/openid/configs${configId ? `/${configId}` : ''}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((json) => {
        setLoading(false);
        if (json.authorizationUrl) {
          return (window.location.href = json.authorizationUrl);
        }
        toast.error('Open ID login failed');
      })
      .catch((reason) => {
        setLoading(false);
        toast.error(reason.error);
      });
  };
  return (
    <div className=" sso-btn-wrapper">
      <div onClick={doLogin} className={`border-0 sso-button rounded-2 sso-btn`} disabled={isLoading}>
        {isLoading ? (
          <div className="spinner-center">
            <Spinner className="flex" />
          </div>
        ) : (
          <>
            <img src="assets/images/sso-buttons/openid.svg" className="h-4" data-cy="oidc-so-icon" />
            <span className="px-1 sso-info-text" data-cy="oidc-sso-text">
              {text} {configs?.name || 'Open ID'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
