import React from 'react';
import { buildURLWithQuery } from '@/_helpers/utils';

export default function GitSSOLoginButton({ configs, text }) {
  const gitLogin = (e) => {
    e.preventDefault();
    window.location.href = buildURLWithQuery(`${configs.host_name || 'https://github.com'}/login/oauth/authorize`, {
      client_id: configs?.client_id,
      scope: 'user:email',
    });
  };
  return (
    <div data-cy="git-tile" className="sso-btn-wrapper">
      <button onClick={gitLogin} className="btn border-0 rounded-2 sso-btn">
        <img src="assets/images/sso-buttons/git.svg" className="h-4" data-cy="git-icon" />
        <span className="px-1" data-cy="git-sign-in-text">
          {text || 'Sign in with GitHub'}
        </span>
      </button>
    </div>
  );
}
