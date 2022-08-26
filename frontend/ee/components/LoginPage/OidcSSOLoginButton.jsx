import config from 'config';
import React from 'react';
import toast from 'react-hot-toast';

export default function OIDCSSOLoginButton({ configId, configs, text }) {
  const doLogin = (e) => {
    e.preventDefault();
    fetch(`${config.apiUrl}/oauth/openid/configs${configId ? `/${configId}` : ''}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.authorizationUrl) {
          return (window.location.href = json.authorizationUrl);
        }
        toast.error('Open ID login failed');
      })
      .catch((reason) => {
        toast.error(reason.error);
      });
  };
  return (
    <div>
      <button onClick={doLogin} className="btn border-0 rounded-2">
        <img src="/assets/images/sso-buttons/openid.svg" className="h-4" />
        <span className="px-1">
          {text} {configs?.name || 'Open ID'}
        </span>
      </button>
    </div>
  );
}
