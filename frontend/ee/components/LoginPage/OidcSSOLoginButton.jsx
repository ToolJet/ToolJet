import config from 'config';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

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
    <div className="oidc-button">
      <button
        onClick={doLogin}
        className={`btn border-0 rounded-2 ${isLoading ? 'btn-loading' : ''}`}
        disabled={isLoading}
      >
        <img src="assets/images/sso-buttons/openid.svg" className="h-4" />
        <span className="px-1">
          {text} {configs?.name || 'Open ID'}
        </span>
      </button>
    </div>
  );
}
